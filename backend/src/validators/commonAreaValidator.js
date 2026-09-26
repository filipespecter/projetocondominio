import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";

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

const capacitySchema = z
  .union([
    z
      .number()
      .int(
        "A capacidade deve ser um número inteiro."
      )
      .positive(
        "A capacidade deve ser maior que zero."
      ),
    z
      .string()
      .trim()
      .regex(
        /^\d+$/,
        "A capacidade deve ser um número inteiro."
      )
      .transform((value) =>
        Number(value)
      )
      .refine(
        (value) => value > 0,
        {
          message:
            "A capacidade deve ser maior que zero.",
        }
      ),
    z.null(),
    z.literal(""),
  ])
  .transform((value) =>
    value === "" ? null : value
  )
  .optional();

const booleanSchema = z
  .union([
    z.boolean(),
    z.literal("true"),
    z.literal("false"),
    z.literal(1),
    z.literal(0),
    z.literal("1"),
    z.literal("0"),
  ])
  .transform((value) => {
    if (
      value === true ||
      value === 1 ||
      value === "1" ||
      value === "true"
    ) {
      return true;
    }

    return false;
  });

export const createCommonAreaSchema =
  z
    .object({
      name:
        nameSchema,

      description:
        optionalText(
          1000,
          "A descrição"
        ),

      capacity:
        capacitySchema,

      openingTime:
        optionalTime,

      closingTime:
        optionalTime,

      reservationRequired:
        booleanSchema
          .optional()
          .default(true),

      active:
        booleanSchema
          .optional()
          .default(true),

      rules:
        optionalText(
          3000,
          "As regras"
        ),
    })
    .strict()
    .superRefine(
      (data, ctx) => {
        if (
          data.openingTime &&
          data.closingTime &&
          data.openingTime >=
            data.closingTime
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [
              "closingTime",
            ],
            message:
              "O horário de fechamento deve ser posterior ao horário de abertura.",
          });
        }
      }
    );

export const updateCommonAreaSchema =
  z
    .object({
      name:
        nameSchema.optional(),

      description:
        optionalText(
          1000,
          "A descrição"
        ),

      capacity:
        capacitySchema,

      openingTime:
        optionalTime,

      closingTime:
        optionalTime,

      reservationRequired:
        booleanSchema.optional(),

      active:
        booleanSchema.optional(),

      rules:
        optionalText(
          3000,
          "As regras"
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
          data.openingTime &&
          data.closingTime &&
          data.openingTime >=
            data.closingTime
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [
              "closingTime",
            ],
            message:
              "O horário de fechamento deve ser posterior ao horário de abertura.",
          });
        }
      }
    );

export const setReservationRequiredSchema =
  z
    .object({
      reservationRequired:
        booleanSchema,
    })
    .strict();

export const commonAreaIdParamsSchema =
  z
    .object({
      id:
        uuidSchema,
    })
    .strict();

export const commonAreaListQuerySchema =
  z
    .object({
      active:
        booleanSchema.optional(),

      reservationRequired:
        booleanSchema.optional(),
    })
    .strict();

export const validateCreateCommonArea =
  validateBody(
    createCommonAreaSchema
  );

export const validateUpdateCommonArea =
  validateBody(
    updateCommonAreaSchema
  );

export const validateSetReservationRequired =
  validateBody(
    setReservationRequiredSchema
  );

export const validateCommonAreaId =
  validateParams(
    commonAreaIdParamsSchema
  );

export const validateCommonAreaListQuery =
  validateQuery(
    commonAreaListQuerySchema
  );

export default {
  createCommonAreaSchema,
  updateCommonAreaSchema,
  setReservationRequiredSchema,
  commonAreaIdParamsSchema,
  commonAreaListQuerySchema,
  validateCreateCommonArea,
  validateUpdateCommonArea,
  validateSetReservationRequired,
  validateCommonAreaId,
  validateCommonAreaListQuery,
};
