import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";

export const OCCURRENCE_ORIGINS = [
  "RESIDENT",
  "DOORMAN",
  "MANAGER",
  "SYSTEM",
];

export const OCCURRENCE_TYPES = [
  "OCCURRENCE",
  "COMPLAINT",
  "SUGGESTION",
  "REQUEST",
];

export const OCCURRENCE_PRIORITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
];

export const OCCURRENCE_STATUSES = [
  "NEW",
  "FORWARDED",
  "IN_REVIEW",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
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

const originSchema = z
  .string()
  .trim()
  .transform((value) =>
    value.toUpperCase()
  )
  .refine(
    (value) =>
      OCCURRENCE_ORIGINS.includes(value),
    {
      message:
        "Origem da ocorrência inválida.",
    }
  );

const typeSchema = z
  .string()
  .trim()
  .transform((value) =>
    value.toUpperCase()
  )
  .refine(
    (value) =>
      OCCURRENCE_TYPES.includes(value),
    {
      message:
        "Tipo de ocorrência inválido.",
    }
  );

const prioritySchema = z
  .string()
  .trim()
  .transform((value) =>
    value.toUpperCase()
  )
  .refine(
    (value) =>
      OCCURRENCE_PRIORITIES.includes(value),
    {
      message:
        "Prioridade da ocorrência inválida.",
    }
  );

const statusSchema = z
  .string()
  .trim()
  .transform((value) =>
    value.toUpperCase()
  )
  .refine(
    (value) =>
      OCCURRENCE_STATUSES.includes(value),
    {
      message:
        "Status de ocorrência inválido.",
    }
  );

const requiredText = (
  min,
  max,
  label
) =>
  z
    .string()
    .trim()
    .min(
      min,
      `${label} deve possuir pelo menos ${min} caracteres.`
    )
    .max(
      max,
      `${label} deve possuir no máximo ${max} caracteres.`
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
      .trim()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "A data deve estar no formato YYYY-MM-DD."
      ),
    z.null(),
    z.literal(""),
  ])
  .transform((value) =>
    value === "" ? null : value
  )
  .optional();

export const createOccurrenceSchema =
  z
    .object({
      apartmentId:
        uuidSchema
          .optional()
          .nullable(),

      assignedToUserId:
        uuidSchema
          .optional()
          .nullable(),

      type:
        typeSchema
          .optional()
          .default("OCCURRENCE"),

      category:
        requiredText(
          2,
          150,
          "A categoria"
        ),

      priority:
        prioritySchema
          .optional()
          .default("MEDIUM"),

      title:
        requiredText(
          3,
          200,
          "O título"
        ),

      description:
        requiredText(
          5,
          5000,
          "A descrição"
        ),

      shift:
        optionalText(
          100,
          "O turno"
        ),

      dutyDate:
        optionalDateSchema,
    })
    .strict();

export const updateOccurrenceSchema =
  z
    .object({
      apartmentId:
        uuidSchema
          .optional()
          .nullable(),

      assignedToUserId:
        uuidSchema
          .optional()
          .nullable(),

      type:
        typeSchema.optional(),

      category:
        requiredText(
          2,
          150,
          "A categoria"
        ).optional(),

      priority:
        prioritySchema.optional(),

      title:
        requiredText(
          3,
          200,
          "O título"
        ).optional(),

      description:
        requiredText(
          5,
          5000,
          "A descrição"
        ).optional(),

      shift:
        optionalText(
          100,
          "O turno"
        ),

      dutyDate:
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

export const assignOccurrenceSchema =
  z
    .object({
      assignedToUserId:
        uuidSchema,
    })
    .strict();

export const resolveOccurrenceSchema =
  z
    .object({
      resolution:
        requiredText(
          5,
          5000,
          "A descrição da solução"
        ),
    })
    .strict();

export const changeOccurrenceStatusSchema =
  z
    .object({
      status:
        statusSchema,
    })
    .strict();

export const occurrenceIdParamsSchema =
  z
    .object({
      id:
        uuidSchema,
    })
    .strict();

export const occurrenceListQuerySchema =
  z
    .object({
      status:
        statusSchema.optional(),

      type:
        typeSchema.optional(),

      origin:
        originSchema.optional(),

      priority:
        prioritySchema.optional(),

      apartmentId:
        uuidSchema.optional(),

      assignedToUserId:
        uuidSchema.optional(),

      createdByUserId:
        uuidSchema.optional(),

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

export const validateCreateOccurrence =
  validateBody(
    createOccurrenceSchema
  );

export const validateUpdateOccurrence =
  validateBody(
    updateOccurrenceSchema
  );

export const validateAssignOccurrence =
  validateBody(
    assignOccurrenceSchema
  );

export const validateResolveOccurrence =
  validateBody(
    resolveOccurrenceSchema
  );

export const validateChangeOccurrenceStatus =
  validateBody(
    changeOccurrenceStatusSchema
  );

export const validateOccurrenceId =
  validateParams(
    occurrenceIdParamsSchema
  );

export const validateOccurrenceListQuery =
  validateQuery(
    occurrenceListQuerySchema
  );

export default {
  OCCURRENCE_ORIGINS,
  OCCURRENCE_TYPES,
  OCCURRENCE_PRIORITIES,
  OCCURRENCE_STATUSES,
  createOccurrenceSchema,
  updateOccurrenceSchema,
  assignOccurrenceSchema,
  resolveOccurrenceSchema,
  changeOccurrenceStatusSchema,
  occurrenceIdParamsSchema,
  occurrenceListQuerySchema,
  validateCreateOccurrence,
  validateUpdateOccurrence,
  validateAssignOccurrence,
  validateResolveOccurrence,
  validateChangeOccurrenceStatus,
  validateOccurrenceId,
  validateOccurrenceListQuery,
};
