import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";

export const PACKAGE_STATUSES = [
  "EXPECTED",
  "RECEIVED",
  "DELIVERED",
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

    req.query = result.data;
    return next();
  };
}

const uuidSchema = z
  .string()
  .uuid(
    "O identificador informado é inválido."
  );

const packageStatusSchema = z
  .string()
  .trim()
  .transform((value) =>
    value.toUpperCase()
  )
  .refine(
    (value) =>
      PACKAGE_STATUSES.includes(value),
    {
      message:
        "Status de encomenda inválido.",
    }
  );

const requiredTypeSchema = z
  .string()
  .trim()
  .min(
    1,
    "O tipo da encomenda é obrigatório."
  )
  .max(
    100,
    "O tipo da encomenda deve possuir no máximo 100 caracteres."
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

export const createExpectedPackageSchema =
  z
    .object({
      type:
        requiredTypeSchema,

      description:
        optionalText(
          500,
          "A descrição"
        ),

      carrier:
        optionalText(
          150,
          "A transportadora"
        ),

      trackingCode:
        optionalText(
          150,
          "O código de rastreio"
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

export const createReceivedPackageSchema =
  z
    .object({
      apartmentId:
        uuidSchema,

      expectedByResidentId:
        uuidSchema
          .optional()
          .nullable(),

      type:
        requiredTypeSchema,

      description:
        optionalText(
          500,
          "A descrição"
        ),

      carrier:
        optionalText(
          150,
          "A transportadora"
        ),

      trackingCode:
        optionalText(
          150,
          "O código de rastreio"
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

export const updatePackageSchema =
  z
    .object({
      apartmentId:
        uuidSchema.optional(),

      expectedByResidentId:
        uuidSchema
          .optional()
          .nullable(),

      type:
        requiredTypeSchema.optional(),

      description:
        optionalText(
          500,
          "A descrição"
        ),

      carrier:
        optionalText(
          150,
          "A transportadora"
        ),

      trackingCode:
        optionalText(
          150,
          "O código de rastreio"
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

export const deliverPackageSchema =
  z
    .object({
      withdrawnBy: z
        .string()
        .trim()
        .min(
          2,
          "Informe o nome de quem retirou a encomenda."
        )
        .max(
          150,
          "O nome de quem retirou deve possuir no máximo 150 caracteres."
        ),
    })
    .strict();

export const pickupCredentialSchema =
  z
    .object({})
    .strict();

export const validatePickupSchema =
  z
    .object({
      method: z.enum([
        "QR",
        "CODE",
      ]),

      value: z
        .string()
        .trim()
        .min(
          6,
          "Informe a credencial de retirada."
        )
        .max(
          200,
          "Credencial de retirada inválida."
        ),
    })
    .strict();

export const confirmPickupSchema =
  z
    .object({
      method: z.enum([
        "QR",
        "CODE",
      ]),

      value: z
        .string()
        .trim()
        .min(
          6,
          "Informe a credencial de retirada."
        )
        .max(
          200,
          "Credencial de retirada inválida."
        ),

      isPrimary:
        z.boolean(),

      pickupResidentId:
        uuidSchema
          .optional()
          .nullable(),

      withdrawnBy:
        optionalText(
          150,
          "O nome de quem retirou"
        ),

      withdrawnDocument:
        optionalText(
          30,
          "O documento"
        ),

      withdrawnResidentBlock:
        optionalText(
          50,
          "O bloco"
        ),

      withdrawnResidentApartment:
        optionalText(
          50,
          "O apartamento"
        ),
    })
    .strict();

export const cancelPackageSchema =
  z
    .object({
      reason:
        optionalText(
          500,
          "O motivo"
        ),
    })
    .strict();

export const packageIdParamsSchema =
  z
    .object({
      id:
        uuidSchema,
    })
    .strict();

export const packageResidentParamsSchema =
  z
    .object({
      residentId:
        uuidSchema,
    })
    .strict();

export const packageListQuerySchema =
  z
    .object({
      status:
        packageStatusSchema
          .optional(),

      apartmentId:
        uuidSchema.optional(),

      pending: z
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

export const validateCreateExpectedPackage =
  validateBody(
    createExpectedPackageSchema
  );

export const validateCreateReceivedPackage =
  validateBody(
    createReceivedPackageSchema
  );

export const validateUpdatePackage =
  validateBody(
    updatePackageSchema
  );

export const validateDeliverPackage =
  validateBody(
    deliverPackageSchema
  );

export const validatePickupCredentialRequest =
  validateBody(
    pickupCredentialSchema
  );

export const validatePickup =
  validateBody(
    validatePickupSchema
  );

export const validateConfirmPickup =
  validateBody(
    confirmPickupSchema
  );

export const validateCancelPackage =
  validateBody(
    cancelPackageSchema
  );

export const validatePackageId =
  validateParams(
    packageIdParamsSchema
  );

export const validatePackageResidentId =
  validateParams(
    packageResidentParamsSchema
  );

export const validatePackageListQuery =
  validateQuery(
    packageListQuerySchema
  );

export default {
  PACKAGE_STATUSES,
  createExpectedPackageSchema,
  createReceivedPackageSchema,
  updatePackageSchema,
  deliverPackageSchema,
  pickupCredentialSchema,
  validatePickupSchema,
  confirmPickupSchema,
  cancelPackageSchema,
  packageIdParamsSchema,
  packageResidentParamsSchema,
  packageListQuerySchema,
  validateCreateExpectedPackage,
  validateCreateReceivedPackage,
  validateUpdatePackage,
  validateDeliverPackage,
  validatePickupCredentialRequest,
  validatePickup,
  validateConfirmPickup,
  validateCancelPackage,
  validatePackageId,
  validatePackageResidentId,
  validatePackageListQuery,
};
