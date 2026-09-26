import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";

export const PROVIDER_ACCESS_STATUSES = [
  "SCHEDULED",
  "INSIDE",
  "EXITED",
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

const statusSchema = z
  .string()
  .trim()
  .transform((value) =>
    value.toUpperCase()
  )
  .refine(
    (value) =>
      PROVIDER_ACCESS_STATUSES.includes(
        value
      ),
    {
      message:
        "Status de acesso do prestador inválido.",
    }
  );

const dateSchema = z
  .string()
  .trim()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "A data deve estar no formato YYYY-MM-DD."
  );

const timeSchema = z
  .string()
  .trim()
  .regex(
    /^([01]\d|2[0-3]):([0-5]\d)$/,
    "O horário deve estar no formato HH:mm."
  );

const optionalText = (
  max,
  label
) =>
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

const optionalDate = z
  .union([
    dateSchema,
    z.null(),
    z.literal(""),
  ])
  .transform((value) =>
    value === "" ? null : value
  )
  .optional();

const optionalTime = z
  .union([
    timeSchema,
    z.null(),
    z.literal(""),
  ])
  .transform((value) =>
    value === "" ? null : value
  )
  .optional();

export const createProviderAccessSchema =
  z
    .object({
      serviceProviderId:
        uuidSchema,

      apartmentId:
        uuidSchema
          .optional()
          .nullable(),

      serviceDescription:
        optionalText(
          500,
          "A descrição do serviço"
        ),

      scheduledDate:
        optionalDate,

      scheduledStartTime:
        optionalTime,

      scheduledEndTime:
        optionalTime,

      notes:
        optionalText(
          1000,
          "As observações"
        ),
    })
    .strict()
    .superRefine(
      (data, ctx) => {
        if (
          data.scheduledStartTime &&
          data.scheduledEndTime &&
          data.scheduledStartTime >=
            data.scheduledEndTime
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [
              "scheduledEndTime",
            ],
            message:
              "O horário final deve ser posterior ao horário inicial.",
          });
        }
      }
    );

export const updateProviderAccessSchema =
  z
    .object({
      serviceProviderId:
        uuidSchema.optional(),

      apartmentId:
        uuidSchema
          .optional()
          .nullable(),

      serviceDescription:
        optionalText(
          500,
          "A descrição do serviço"
        ),

      scheduledDate:
        optionalDate,

      scheduledStartTime:
        optionalTime,

      scheduledEndTime:
        optionalTime,

      notes:
        optionalText(
          1000,
          "As observações"
        ),
    })
    .strict()
    .refine(
      (data) =>
        Object.keys(data).length > 0,
      {
        message:
          "Informe pelo menos um campo para atualização.",
      }
    )
    .superRefine(
      (data, ctx) => {
        if (
          data.scheduledStartTime &&
          data.scheduledEndTime &&
          data.scheduledStartTime >=
            data.scheduledEndTime
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [
              "scheduledEndTime",
            ],
            message:
              "O horário final deve ser posterior ao horário inicial.",
          });
        }
      }
    );

export const providerAccessIdParamsSchema =
  z
    .object({
      id:
        uuidSchema,
    })
    .strict();

export const serviceProviderAccessParamsSchema =
  z
    .object({
      serviceProviderId:
        uuidSchema,
    })
    .strict();

export const apartmentAccessParamsSchema =
  z
    .object({
      apartmentId:
        uuidSchema,
    })
    .strict();

export const providerAccessListQuerySchema =
  z
    .object({
      status:
        statusSchema.optional(),

      serviceProviderId:
        uuidSchema.optional(),

      apartmentId:
        uuidSchema.optional(),

      scheduledDate:
        dateSchema.optional(),
    })
    .strict();

export const validateCreateProviderAccess =
  validateBody(
    createProviderAccessSchema
  );

export const validateUpdateProviderAccess =
  validateBody(
    updateProviderAccessSchema
  );

export const validateProviderAccessId =
  validateParams(
    providerAccessIdParamsSchema
  );

export const validateServiceProviderAccessId =
  validateParams(
    serviceProviderAccessParamsSchema
  );

export const validateApartmentAccessId =
  validateParams(
    apartmentAccessParamsSchema
  );

export const validateProviderAccessListQuery =
  validateQuery(
    providerAccessListQuerySchema
  );

export default {
  PROVIDER_ACCESS_STATUSES,
  createProviderAccessSchema,
  updateProviderAccessSchema,
  providerAccessIdParamsSchema,
  serviceProviderAccessParamsSchema,
  apartmentAccessParamsSchema,
  providerAccessListQuerySchema,
  validateCreateProviderAccess,
  validateUpdateProviderAccess,
  validateProviderAccessId,
  validateServiceProviderAccessId,
  validateApartmentAccessId,
  validateProviderAccessListQuery,
};
