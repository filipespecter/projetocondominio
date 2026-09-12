import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";

export const SERVICE_PROVIDER_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "BLOCKED",
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
      SERVICE_PROVIDER_STATUSES.includes(
        value
      ),
    {
      message:
        "Status de prestador inválido.",
    }
  );

const nameSchema = z
  .string()
  .trim()
  .min(
    2,
    "O nome deve possuir pelo menos 2 caracteres."
  )
  .max(
    150,
    "O nome deve possuir no máximo 150 caracteres."
  );

const serviceTypeSchema = z
  .string()
  .trim()
  .min(
    2,
    "O tipo de serviço deve possuir pelo menos 2 caracteres."
  )
  .max(
    150,
    "O tipo de serviço deve possuir no máximo 150 caracteres."
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

const optionalEmailSchema = z
  .union([
    z
      .string()
      .trim()
      .email(
        "O e-mail informado é inválido."
      )
      .max(
        200,
        "O e-mail deve possuir no máximo 200 caracteres."
      )
      .transform((value) =>
        value.toLowerCase()
      ),
    z.null(),
    z.literal(""),
  ])
  .transform((value) =>
    value === "" ? null : value
  )
  .optional();

export const createServiceProviderSchema =
  z
    .object({
      name:
        nameSchema,

      companyName:
        optionalText(
          200,
          "O nome da empresa"
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

      email:
        optionalEmailSchema,

      serviceType:
        serviceTypeSchema,

      notes:
        optionalText(
          1000,
          "As observações"
        ),

      status:
        statusSchema
          .optional()
          .default("ACTIVE"),
    })
    .strict();

export const updateServiceProviderSchema =
  z
    .object({
      name:
        nameSchema.optional(),

      companyName:
        optionalText(
          200,
          "O nome da empresa"
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

      email:
        optionalEmailSchema,

      serviceType:
        serviceTypeSchema.optional(),

      notes:
        optionalText(
          1000,
          "As observações"
        ),

      status:
        statusSchema.optional(),
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

export const changeServiceProviderStatusSchema =
  z
    .object({
      status:
        statusSchema,
    })
    .strict();

export const serviceProviderIdParamsSchema =
  z
    .object({
      id:
        uuidSchema,
    })
    .strict();

export const serviceProviderListQuerySchema =
  z
    .object({
      status:
        statusSchema.optional(),

      activeOnly: z
        .enum([
          "true",
          "false",
        ])
        .transform((value) =>
          value === "true"
        )
        .optional(),
    })
    .strict();

export const validateCreateServiceProvider =
  validateBody(
    createServiceProviderSchema
  );

export const validateUpdateServiceProvider =
  validateBody(
    updateServiceProviderSchema
  );

export const validateChangeServiceProviderStatus =
  validateBody(
    changeServiceProviderStatusSchema
  );

export const validateServiceProviderId =
  validateParams(
    serviceProviderIdParamsSchema
  );

export const validateServiceProviderListQuery =
  validateQuery(
    serviceProviderListQuerySchema
  );

export default {
  SERVICE_PROVIDER_STATUSES,
  createServiceProviderSchema,
  updateServiceProviderSchema,
  changeServiceProviderStatusSchema,
  serviceProviderIdParamsSchema,
  serviceProviderListQuerySchema,
  validateCreateServiceProvider,
  validateUpdateServiceProvider,
  validateChangeServiceProviderStatus,
  validateServiceProviderId,
  validateServiceProviderListQuery,
};
