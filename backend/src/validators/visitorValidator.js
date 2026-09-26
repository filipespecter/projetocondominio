import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";

export const VISITOR_STATUSES = [
  "WAITING",
  "AUTHORIZED",
  "INSIDE",
  "EXITED",
  "DENIED",
  "CANCELED",
];

function formatValidationErrors(zodError) {
  return zodError.issues.map((issue) => ({
    field:
      issue.path.length > 0
        ? issue.path.join(".")
        : null,
    message: issue.message,
    code: issue.code,
  }));
}

function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(
      req.body ?? {}
    );

    if (!result.success) {
      return next(
        new ApiError(
          "Dados inválidos.",
          422,
          formatValidationErrors(
            result.error
          )
        )
      );
    }

    req.body = result.data;
    return next();
  };
}

function validateParams(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(
      req.params ?? {}
    );

    if (!result.success) {
      return next(
        new ApiError(
          "Parâmetros inválidos.",
          422,
          formatValidationErrors(
            result.error
          )
        )
      );
    }

    req.params = result.data;
    return next();
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(
      req.query ?? {}
    );

    if (!result.success) {
      return next(
        new ApiError(
          "Filtros inválidos.",
          422,
          formatValidationErrors(
            result.error
          )
        )
      );
    }

    Object.defineProperty(req, "query", {
      value: result.data,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    return next();
  };
}

const uuidSchema = z
  .string()
  .uuid(
    "O identificador informado é inválido."
  );

const visitorStatusSchema = z
  .string()
  .trim()
  .transform((value) =>
    value.toUpperCase()
  )
  .refine(
    (value) =>
      VISITOR_STATUSES.includes(value),
    {
      message:
        "Status de visitante inválido.",
    }
  );

const optionalText = (max, label) =>
  z
    .string()
    .trim()
    .max(
      max,
      `${label} deve possuir no máximo ${max} caracteres.`
    )
    .optional()
    .nullable()
    .transform((value) =>
      value === "" ? null : value
    );

const optionalDateSchema = z
  .union([
    z
      .string()
      .datetime(
        "A data informada é inválida."
      ),
    z.date(),
    z.null(),
    z.literal(""),
  ])
  .transform((value) =>
    value === "" ? null : value
  )
  .optional();

export const createVisitorSchema = z
  .object({
    apartmentId:
      uuidSchema,

    name: z
      .string()
      .trim()
      .min(
        2,
        "O nome deve possuir pelo menos 2 caracteres."
      )
      .max(
        150,
        "O nome deve possuir no máximo 150 caracteres."
      ),

    document:
      optionalText(
        50,
        "O documento"
      ),

    phone:
      optionalText(
        20,
        "O telefone"
      ),

    visitType:
      optionalText(
        100,
        "O tipo de visita"
      ),

    vehicle:
      optionalText(
        100,
        "O veículo"
      ),

    plate:
      optionalText(
        20,
        "A placa"
      ).transform((value) =>
        value
          ? value.toUpperCase()
          : value
      ),

    notes:
      optionalText(
        1000,
        "As observações"
      ),

    expectedAt:
      optionalDateSchema,
  })
  .strict();

export const updateVisitorSchema = z
  .object({
    apartmentId:
      uuidSchema.optional(),

    name: z
      .string()
      .trim()
      .min(
        2,
        "O nome deve possuir pelo menos 2 caracteres."
      )
      .max(
        150,
        "O nome deve possuir no máximo 150 caracteres."
      )
      .optional(),

    document:
      optionalText(
        50,
        "O documento"
      ),

    phone:
      optionalText(
        20,
        "O telefone"
      ),

    visitType:
      optionalText(
        100,
        "O tipo de visita"
      ),

    vehicle:
      optionalText(
        100,
        "O veículo"
      ),

    plate:
      optionalText(
        20,
        "A placa"
      ).transform((value) =>
        value
          ? value.toUpperCase()
          : value
      ),

    notes:
      optionalText(
        1000,
        "As observações"
      ),

    expectedAt:
      optionalDateSchema,
  })
  .strict()
  .refine(
    (data) =>
      Object.keys(data).length > 0,
    {
      message:
        "Informe pelo menos um campo para atualização.",
    }
  );

export const visitorIdParamsSchema =
  z
    .object({
      id:
        uuidSchema,
    })
    .strict();

export const visitorListQuerySchema =
  z
    .object({
      status:
        visitorStatusSchema
          .optional(),

      apartmentId:
        uuidSchema
          .optional(),
    })
    .strict();

export const createVisitorInvitationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "O nome do visitante deve possuir pelo menos 2 caracteres.")
      .max(150, "O nome do visitante deve possuir no máximo 150 caracteres."),
    document: optionalText(50, "O documento"),
    phone: optionalText(20, "O telefone"),
    visitType: optionalText(100, "O tipo de visita"),
    notes: optionalText(1000, "As observações"),
    validFrom: z.string().datetime({ offset: true }, "Informe uma data/hora inicial válida."),
    validUntil: z.string().datetime({ offset: true }, "Informe uma data/hora final válida."),
  })
  .strict()
  .superRefine((data, context) => {
    const from = new Date(data.validFrom);
    const until = new Date(data.validUntil);

    if (until <= from) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["validUntil"],
        message: "A validade final deve ser posterior ao início.",
      });
    }

    if (until.getTime() - from.getTime() > 30 * 24 * 60 * 60 * 1000) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["validUntil"],
        message: "O convite pode ter validade máxima de 30 dias.",
      });
    }
  });

export const visitorInvitationTokenSchema = z
  .object({
    token: z
      .string()
      .trim()
      .min(20, "QR de visitante inválido.")
      .max(200, "QR de visitante inválido."),
  })
  .strict();

export const validateCreateVisitor =
  validateBody(
    createVisitorSchema
  );

export const validateUpdateVisitor =
  validateBody(
    updateVisitorSchema
  );

export const validateVisitorId =
  validateParams(
    visitorIdParamsSchema
  );

export const validateVisitorListQuery =
  validateQuery(
    visitorListQuerySchema
  );

export const validateCreateVisitorInvitation =
  validateBody(createVisitorInvitationSchema);

export const validateVisitorInvitationToken =
  validateBody(visitorInvitationTokenSchema);

export default {
  VISITOR_STATUSES,
  createVisitorSchema,
  updateVisitorSchema,
  visitorIdParamsSchema,
  visitorListQuerySchema,
  createVisitorInvitationSchema,
  visitorInvitationTokenSchema,
  validateCreateVisitor,
  validateUpdateVisitor,
  validateVisitorId,
  validateVisitorListQuery,
  validateCreateVisitorInvitation,
  validateVisitorInvitationToken,
};
