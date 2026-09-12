import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";

function issues(error) {
  return error.issues.map((issue) => ({
    field: issue.path.length ? issue.path.join(".") : null,
    message: issue.message,
    code: issue.code,
  }));
}

function wrap(schema, key = "body") {
  return (req, _res, next) => {
    const result = schema.safeParse(req[key] ?? {});
    if (!result.success) {
      return next(new ApiError("Dados da solicitação de serviço inválidos.", 422, issues(result.error)));
    }
    if (key === "query") {
      Object.defineProperty(req, "query", {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } else {
      req[key] = result.data;
    }
    return next();
  };
}

const optionalText = (max) => z.union([
  z.string().trim().max(max),
  z.literal(""),
  z.null(),
]).optional().transform((value) => value === "" ? null : value);

const time = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Informe o horário no formato HH:mm.");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.");

export const createPrivateServiceRequestSchema = z.object({
  providerName: z.string().trim().min(2, "Informe o nome do prestador.").max(180),
  providerDocument: optionalText(30),
  providerPhone: optionalText(30),
  providerCompany: optionalText(180),
  serviceType: z.string().trim().min(2, "Informe o tipo de serviço.").max(180),
  description: z.string().trim().min(5, "Descreva o serviço com pelo menos 5 caracteres.").max(3000),
  scheduledDate: date,
  scheduledStartTime: time,
  scheduledEndTime: z.union([time, z.literal(""), z.null()]).optional().transform((value) => value === "" ? null : value),
  notes: optionalText(2000),
}).strict().superRefine((data, ctx) => {
  if (data.scheduledEndTime && data.scheduledStartTime >= data.scheduledEndTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["scheduledEndTime"],
      message: "O horário final deve ser posterior ao horário inicial.",
    });
  }
});

export const reviewPrivateServiceRequestSchema = z.object({
  reviewNotes: optionalText(1000),
  existingServiceProviderId: z.union([z.string().uuid(), z.literal(""), z.null()]).optional().transform((value) => value === "" ? null : value),
}).strict();

export const rejectPrivateServiceRequestSchema = z.object({
  reviewNotes: z.string().trim().min(3, "Informe o motivo da rejeição.").max(1000),
}).strict();

export const privateServiceRequestIdSchema = z.object({
  id: z.string().uuid(),
}).strict();

export const privateServiceRequestListSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELED"]).optional(),
  apartmentId: z.string().uuid().optional(),
}).strict();

export const validateCreatePrivateServiceRequest = wrap(createPrivateServiceRequestSchema);
export const validateReviewPrivateServiceRequest = wrap(reviewPrivateServiceRequestSchema);
export const validateRejectPrivateServiceRequest = wrap(rejectPrivateServiceRequestSchema);
export const validatePrivateServiceRequestId = wrap(privateServiceRequestIdSchema, "params");
export const validatePrivateServiceRequestList = wrap(privateServiceRequestListSchema, "query");
