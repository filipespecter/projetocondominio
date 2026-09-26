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

export const NOTICE_TYPES = [
  "NOTICE",
  "ASSEMBLY",
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

const typeSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .refine((value) => NOTICE_TYPES.includes(value), {
    message: "Tipo de aviso inválido.",
  });

const eventDateSchema = z
  .union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "A data da assembleia é inválida."),
    z.null(),
    z.literal(""),
  ])
  .optional()
  .transform((value) => value === "" ? null : value);

const eventTimeSchema = z
  .union([
    z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "O horário da assembleia é inválido."),
    z.null(),
    z.literal(""),
  ])
  .optional()
  .transform((value) => value === "" ? null : value);

const attachmentFileSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  dataUrl: z.string().startsWith("data:", "Anexo inválido.").max(2200 * 1024, "Cada anexo deve possuir no máximo 1,5 MB."),
}).strict();

const attachmentFilesSchema = z
  .array(attachmentFileSchema)
  .max(5, "A assembleia pode possuir no máximo 5 anexos por atualização.")
  .optional();

function validateAssemblyFields(data, ctx, partial = false) {
  const isAssembly = data.type === "ASSEMBLY";
  if (!isAssembly && (partial || data.type !== "ASSEMBLY")) return;

  const required = [
    ["agenda", data.agenda, "A pauta é obrigatória para assembleias."],
    ["eventDate", data.eventDate, "A data é obrigatória para assembleias."],
    ["eventTime", data.eventTime, "O horário é obrigatório para assembleias."],
    ["eventLocation", data.eventLocation, "O local é obrigatório para assembleias."],
  ];

  for (const [path, value, message] of required) {
    if (!value) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
    }
  }
}

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

      type:
        typeSchema
          .optional()
          .default("NOTICE"),

      agenda:
        optionalText(5000, "A pauta"),

      eventDate:
        eventDateSchema,

      eventTime:
        eventTimeSchema,

      eventLocation:
        optionalText(300, "O local"),

      eventModality:
        optionalText(100, "A modalidade"),

      attachmentFiles:
        attachmentFilesSchema,

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
        validateAssemblyFields(data, ctx);

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

      type:
        typeSchema.optional(),

      agenda:
        optionalText(5000, "A pauta"),

      eventDate:
        eventDateSchema,

      eventTime:
        eventTimeSchema,

      eventLocation:
        optionalText(300, "O local"),

      eventModality:
        optionalText(100, "A modalidade"),

      attachmentFiles:
        attachmentFilesSchema,

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

export const noticeAttachmentParamsSchema = z
  .object({
    id: uuidSchema,
    index: z.string().regex(/^\d+$/, "Índice do anexo inválido."),
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

      type:
        typeSchema.optional(),

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

export const validateNoticeAttachmentParams =
  validateParams(noticeAttachmentParamsSchema);

export default {
  NOTICE_STATUSES,
  NOTICE_AUDIENCES,
  NOTICE_PRIORITIES,
  NOTICE_TYPES,
  createNoticeSchema,
  updateNoticeSchema,
  noticeIdParamsSchema,
  noticeListQuerySchema,
  noticeAttachmentParamsSchema,
  validateCreateNotice,
  validateUpdateNotice,
  validateNoticeId,
  validateNoticeListQuery,
  validateNoticeAttachmentParams,
};
