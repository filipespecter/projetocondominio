import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";

/**
 * Valores permitidos pelo schema.prisma.
 */
export const WORK_SHIFTS = [
  "MORNING",
  "AFTERNOON",
  "NIGHT",
  "TWELVE_BY_THIRTY_SIX",
  "OTHER",
];

export const USER_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "BLOCKED",
  "PENDING",
];

/**
 * Padroniza os erros do Zod no formato da API.
 */
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

/**
 * Valida req.body.
 */
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

/**
 * Valida req.params.
 */
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

/**
 * Valida req.query.
 */
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

/**
 * UUID utilizado nos parâmetros.
 */
const uuidSchema = z
  .string()
  .uuid(
    "O identificador informado é inválido."
  );

/**
 * Turno de trabalho.
 */
const shiftSchema = z
  .string()
  .trim()
  .transform((value) =>
    value.toUpperCase()
  )
  .refine(
    (value) =>
      WORK_SHIFTS.includes(value),
    {
      message:
        "Turno de trabalho inválido.",
    }
  );

/**
 * Status do usuário.
 */
const userStatusSchema = z
  .string()
  .trim()
  .transform((value) =>
    value.toUpperCase()
  )
  .refine(
    (value) =>
      USER_STATUSES.includes(value),
    {
      message:
        "Status de usuário inválido.",
    }
  );

/**
 * Campos básicos do usuário.
 */
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

const usernameSchema = z
  .string()
  .trim()
  .min(
    3,
    "O nome de acesso deve possuir pelo menos 3 caracteres."
  )
  .max(
    100,
    "O nome de acesso deve possuir no máximo 100 caracteres."
  )
  .regex(
    /^[a-zA-Z0-9._-]+$/,
    "O nome de acesso pode conter apenas letras, números, ponto, hífen e sublinhado."
  )
  .transform((value) =>
    value.toLowerCase()
  );

const emailSchema = z
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
  );

const phoneSchema = z
  .string()
  .trim()
  .min(
    10,
    "O telefone deve possuir DDD e número."
  )
  .max(
    20,
    "O telefone deve possuir no máximo 20 caracteres."
  );

const passwordSchema = z
  .string()
  .min(
    8,
    "A senha deve possuir pelo menos 8 caracteres."
  )
  .max(
    128,
    "A senha deve possuir no máximo 128 caracteres."
  );

const codeSchema = z
  .string()
  .trim()
  .min(
    1,
    "O código do porteiro é obrigatório."
  )
  .max(
    50,
    "O código do porteiro deve possuir no máximo 50 caracteres."
  )
  .transform((value) =>
    value.toUpperCase()
  );

const customShiftSchema = z
  .string()
  .trim()
  .max(
    100,
    "A descrição do turno deve possuir no máximo 100 caracteres."
  )
  .optional()
  .nullable()
  .transform((value) =>
    value === "" ? null : value
  );

const nullableDateSchema = z
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

/**
 * Cadastro de porteiro.
 */
export const createDoormanSchema = z
  .object({
    name:
      nameSchema,

    username:
      usernameSchema,

    email:
      emailSchema
        .optional()
        .nullable()
        .transform((value) =>
          value === "" ? null : value
        ),

    phone:
      phoneSchema
        .optional()
        .nullable()
        .transform((value) =>
          value === "" ? null : value
        ),

    password:
      passwordSchema,

    code:
      codeSchema,

    shift:
      shiftSchema,

    customShift:
      customShiftSchema,

    lastDutyAt:
      nullableDateSchema,

    status:
      userStatusSchema
        .optional()
        .default("ACTIVE"),

    mustChangePassword: z
      .boolean()
      .optional()
      .default(true),
  })
  .strict()
  .superRefine(
    (data, ctx) => {
      if (
        data.shift === "OTHER" &&
        !data.customShift
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode.custom,
          path: [
            "customShift",
          ],
          message:
            "Informe a descrição do turno personalizado.",
        });
      }

      if (
        data.shift !== "OTHER" &&
        data.customShift
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode.custom,
          path: [
            "customShift",
          ],
          message:
            "O turno personalizado só deve ser informado quando o turno for OTHER.",
        });
      }
    }
  );

/**
 * Atualização parcial.
 *
 * A senha não é atualizada nesta rota.
 */
export const updateDoormanSchema = z
  .object({
    name:
      nameSchema.optional(),

    username:
      usernameSchema.optional(),

    email:
      emailSchema
        .optional()
        .nullable()
        .transform((value) =>
          value === "" ? null : value
        ),

    phone:
      phoneSchema
        .optional()
        .nullable()
        .transform((value) =>
          value === "" ? null : value
        ),

    code:
      codeSchema.optional(),

    shift:
      shiftSchema.optional(),

    customShift:
      customShiftSchema,

    lastDutyAt:
      nullableDateSchema,

    status:
      userStatusSchema.optional(),
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
        data.shift === "OTHER" &&
        !data.customShift
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode.custom,
          path: [
            "customShift",
          ],
          message:
            "Informe a descrição do turno personalizado.",
        });
      }

      if (
        data.shift &&
        data.shift !== "OTHER" &&
        data.customShift
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode.custom,
          path: [
            "customShift",
          ],
          message:
            "O turno personalizado só deve ser informado quando o turno for OTHER.",
        });
      }
    }
  );

/**
 * Alteração específica de turno.
 */
export const changeDoormanShiftSchema =
  z
    .object({
      shift:
        shiftSchema,

      customShift:
        customShiftSchema,
    })
    .strict()
    .superRefine(
      (data, ctx) => {
        if (
          data.shift === "OTHER" &&
          !data.customShift
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [
              "customShift",
            ],
            message:
              "Informe a descrição do turno personalizado.",
          });
        }

        if (
          data.shift !== "OTHER" &&
          data.customShift
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [
              "customShift",
            ],
            message:
              "O turno personalizado só deve ser informado quando o turno for OTHER.",
          });
        }
      }
    );

/**
 * Registro do último plantão.
 */
export const registerDoormanDutySchema =
  z
    .object({
      dutyDate: z
        .union([
          z
            .string()
            .datetime(
              "A data do plantão é inválida."
            ),
          z.date(),
        ])
        .optional(),
    })
    .strict();

/**
 * Redefinição administrativa de senha.
 */
export const resetDoormanPasswordSchema =
  z
    .object({
      newPassword:
        passwordSchema,
    })
    .strict();

/**
 * ID do porteiro.
 */
export const doormanIdParamsSchema =
  z
    .object({
      id:
        uuidSchema,
    })
    .strict();

/**
 * Filtros opcionais da listagem.
 */
export const doormanListQuerySchema =
  z
    .object({
      shift:
        shiftSchema.optional(),

      status:
        userStatusSchema.optional(),
    })
    .strict();

/**
 * Middlewares prontos para as rotas.
 */
export const validateCreateDoorman =
  validateBody(
    createDoormanSchema
  );

export const validateUpdateDoorman =
  validateBody(
    updateDoormanSchema
  );

export const validateChangeDoormanShift =
  validateBody(
    changeDoormanShiftSchema
  );

export const validateRegisterDoormanDuty =
  validateBody(
    registerDoormanDutySchema
  );

export const validateResetDoormanPassword =
  validateBody(
    resetDoormanPasswordSchema
  );

export const validateDoormanId =
  validateParams(
    doormanIdParamsSchema
  );

export const validateDoormanListQuery =
  validateQuery(
    doormanListQuerySchema
  );

export default {
  WORK_SHIFTS,
  USER_STATUSES,
  createDoormanSchema,
  updateDoormanSchema,
  changeDoormanShiftSchema,
  registerDoormanDutySchema,
  resetDoormanPasswordSchema,
  doormanIdParamsSchema,
  doormanListQuerySchema,
  validateCreateDoorman,
  validateUpdateDoorman,
  validateChangeDoormanShift,
  validateRegisterDoormanDuty,
  validateResetDoormanPassword,
  validateDoormanId,
  validateDoormanListQuery,
};
