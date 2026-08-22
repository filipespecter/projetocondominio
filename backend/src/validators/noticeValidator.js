import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";

export const NOTICE_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
];

export const NOTICE_AUDIENCES = [
  "ALL",
  "RESIDENTS",
  "DOORMEN",
  "MANAGERS",
  "APARTMENT",
];

export const NOTICE_PRIORITIES = [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
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

const statusSchema = z
  .string()
  .trim()
  .transform((value) =>
    value.toUpperCase()
  )
  .refine(
    (value) =>
      NOTICE_STATUSES.includes(value),
    {
      message:
        "Status de aviso inválido.",
    }
  );

const audienceSchema = z
  .string()
  .trim()
  .transform((value) =>
    value.toUpperCase()
  )
  .refine(
    (value) =>
      NOTICE_AUDIENCES.includes(value),
    {
      message:
        "Público do aviso inválido.",
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
      NOTICE_PRIORITIES.includes(value),
    {
      message:
        "Prioridade do aviso inválida.",
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
      .refine(
        (value) =>
          !Number.isNaN(
            new Date(value).getTime()
          ),
        {
          message:
            "A data informada é inválida.",
        }
      ),
    z.date(),
    z.null(),
    z.literal(""),
  ])
  .transform((value) =>
    value === "" ? null : value
  )
  .optional();

export const createNoticeSchema =
  z
    .object({
      apartmentId:
        uuidSchema
          .optional()
          .nullable(),

      title:
        requiredText(
          3,
          200,
          "O título"
        ),

      message:
        requiredText(
          3,
          5000,
          "A mensagem"
        ),

      category:
        optionalText(
          150,
          "A categoria"
        ),

      priority:
        prioritySchema
          .optional()
          .default("NORMAL"),

      audience:
        audienceSchema
          .optional()
          .default("ALL"),

      status:
        statusSchema
          .optional()
          .default("PUBLISHED"),

      expiresAt:
        optionalDateSchema,
    })
    .strict()
    .superRefine(
      (data, ctx) => {
        if (
          data.audience ===
            "APARTMENT" &&
          !data.apartmentId
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [
              "apartmentId",
            ],
            message:
              "O apartamento é obrigatório quando o público for APARTMENT.",
          });
        }

        if (
          data.audience !==
            "APARTMENT" &&
          data.apartmentId
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [
              "apartmentId",
            ],
            message:
              "O apartamento só pode ser informado quando o público for APARTMENT.",
          });
        }

        if (data.expiresAt) {
          const expiresAt =
            data.expiresAt instanceof Date
              ? data.expiresAt
              : new Date(
                  data.expiresAt
                );

          if (
            expiresAt <= new Date()
          ) {
            ctx.addIssue({
              code:
                z.ZodIssueCode.custom,
              path: [
                "expiresAt",
              ],
              message:
                "A data de expiração deve ser futura.",
            });
          }
        }
      }
    );

export const updateNoticeSchema =
  z
    .object({
      apartmentId:
        uuidSchema
          .optional()
          .nullable(),

      title:
        requiredText(
          3,
          200,
          "O título"
        ).optional(),

      message:
        requiredText(
          3,
          5000,
          "A mensagem"
        ).optional(),

      category:
        optionalText(
          150,
          "A categoria"
        ),

      priority:
        prioritySchema.optional(),

      audience:
        audienceSchema.optional(),

      expiresAt:
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
    )
    .superRefine(
      (data, ctx) => {
        if (
          data.audience ===
            "APARTMENT" &&
          data.apartmentId === null
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [
              "apartmentId",
            ],
            message:
              "O apartamento é obrigatório quando o público for APARTMENT.",
          });
        }

        if (
          data.audience &&
          data.audience !==
            "APARTMENT" &&
          data.apartmentId
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [
              "apartmentId",
            ],
            message:
              "O apartamento só pode ser informado quando o público for APARTMENT.",
          });
        }

        if (data.expiresAt) {
          const expiresAt =
            data.expiresAt instanceof Date
              ? data.expiresAt
              : new Date(
                  data.expiresAt
                );

          if (
            expiresAt <= new Date()
          ) {
            ctx.addIssue({
              code:
                z.ZodIssueCode.custom,
              path: [
                "expiresAt",
              ],
              message:
                "A data de expiração deve ser futura.",
            });
          }
        }
      }
    );

export const noticeIdParamsSchema =
  z
    .object({
      id:
        uuidSchema,
    })
    .strict();

export const noticeListQuerySchema =
  z
    .object({
      status:
        statusSchema.optional(),

      audience:
        audienceSchema.optional(),

      priority:
        prioritySchema.optional(),

      category:
        z
          .string()
          .trim()
          .min(
            1,
            "A categoria informada é inválida."
          )
          .max(
            150,
            "A categoria deve possuir no máximo 150 caracteres."
          )
          .optional(),

      apartmentId:
        uuidSchema.optional(),

      publishedOnly: z
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

export const validateCreateNotice =
  validateBody(
    createNoticeSchema
  );

export const validateUpdateNotice =
  validateBody(
    updateNoticeSchema
  );

export const validateNoticeId =
  validateParams(
    noticeIdParamsSchema
  );

export const validateNoticeListQuery =
  validateQuery(
    noticeListQuerySchema
  );

export default {
  NOTICE_STATUSES,
  NOTICE_AUDIENCES,
  NOTICE_PRIORITIES,
  createNoticeSchema,
  updateNoticeSchema,
  noticeIdParamsSchema,
  noticeListQuerySchema,
  validateCreateNotice,
  validateUpdateNotice,
  validateNoticeId,
  validateNoticeListQuery,
};
