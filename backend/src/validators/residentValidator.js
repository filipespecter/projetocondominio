import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";

/**
 * Valores permitidos pelo schema.prisma.
 */
export const RESIDENT_TYPES = [
  "OWNER",
  "TENANT",
  "DEPENDENT",
  "OTHER",
];

export const USER_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "BLOCKED",
  "PENDING",
];

/**
 * Padroniza os erros do Zod para o formato da API.
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

    req.query = result.data;

    return next();
  };
}

/**
 * UUID utilizado nos parâmetros e vínculos.
 */
const uuidSchema = z
  .string()
  .uuid("O identificador informado é inválido.");

/**
 * Tipo de morador.
 */
const residentTypeSchema = z
  .string()
  .trim()
  .transform((value) =>
    value.toUpperCase()
  )
  .refine(
    (value) =>
      RESIDENT_TYPES.includes(value),
    {
      message:
        "Tipo de morador inválido.",
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

const documentSchema = z
  .string()
  .trim()
  .min(
    5,
    "O documento deve possuir pelo menos 5 caracteres."
  )
  .max(
    30,
    "O documento deve possuir no máximo 30 caracteres."
  )
  .optional()
  .nullable()
  .transform((value) =>
    value === "" ? null : value
  );

/**
 * Senha inicial do morador.
 */
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

/**
 * Criação de morador.
 */
export const createResidentSchema = z
  .object({
    apartmentId:
      uuidSchema,

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

    document:
      documentSchema,

    password:
      passwordSchema,

    residentType:
      residentTypeSchema
        .optional()
        .default("OWNER"),

    isPrimary: z
      .boolean()
      .optional()
      .default(false),

    canReserve: z
      .boolean()
      .optional()
      .default(true),

    canOpenOccurrence: z
      .boolean()
      .optional()
      .default(true),

    canViewPackages: z
      .boolean()
      .optional()
      .default(true),

    status:
      userStatusSchema
        .optional()
        .default("ACTIVE"),

    mustChangePassword: z
      .boolean()
      .optional()
      .default(true),
  })
  .strict();

/**
 * Atualização parcial de morador.
 *
 * A senha não é alterada por esta rota.
 * Existe uma rota específica para redefinição de senha.
 */
export const updateResidentSchema = z
  .object({
    apartmentId:
      uuidSchema.optional(),

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

    document:
      documentSchema,

    residentType:
      residentTypeSchema.optional(),

    isPrimary:
      z.boolean().optional(),

    canReserve:
      z.boolean().optional(),

    canOpenOccurrence:
      z.boolean().optional(),

    canViewPackages:
      z.boolean().optional(),

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
  );

/**
 * Transferência para outro apartamento.
 */
export const changeResidentApartmentSchema =
  z
    .object({
      apartmentId:
        uuidSchema,
    })
    .strict();

/**
 * Atualização das permissões específicas.
 */
export const updateResidentPermissionsSchema =
  z
    .object({
      canReserve:
        z.boolean().optional(),

      canOpenOccurrence:
        z.boolean().optional(),

      canViewPackages:
        z.boolean().optional(),
    })
    .strict()
    .refine(
      (data) =>
        Object.keys(data).length > 0,
      {
        message:
          "Informe pelo menos uma permissão para atualização.",
      }
    );

/**
 * Redefinição administrativa de senha.
 */
export const resetResidentPasswordSchema =
  z
    .object({
      newPassword:
        passwordSchema,
    })
    .strict();

/**
 * ID do morador.
 */
export const residentIdParamsSchema =
  z
    .object({
      id:
        uuidSchema,
    })
    .strict();

/**
 * ID do apartamento para listagem.
 */
export const residentApartmentParamsSchema =
  z
    .object({
      apartmentId:
        uuidSchema,
    })
    .strict();

/**
 * Filtros opcionais para listagem.
 */
export const residentListQuerySchema =
  z
    .object({
      residentType:
        residentTypeSchema
          .optional(),

      apartmentId:
        uuidSchema
          .optional(),

      primary: z
        .enum(["true", "false"])
        .transform((value) =>
          value === "true"
        )
        .optional(),
    })
    .strict();

/**
 * Middlewares prontos para as rotas.
 */
export const validateCreateResident =
  validateBody(
    createResidentSchema
  );

export const validateUpdateResident =
  validateBody(
    updateResidentSchema
  );

export const validateChangeResidentApartment =
  validateBody(
    changeResidentApartmentSchema
  );

export const validateUpdateResidentPermissions =
  validateBody(
    updateResidentPermissionsSchema
  );

export const validateResetResidentPassword =
  validateBody(
    resetResidentPasswordSchema
  );

export const validateResidentId =
  validateParams(
    residentIdParamsSchema
  );

export const validateResidentApartmentId =
  validateParams(
    residentApartmentParamsSchema
  );

export const validateResidentListQuery =
  validateQuery(
    residentListQuerySchema
  );

export default {
  RESIDENT_TYPES,
  USER_STATUSES,
  createResidentSchema,
  updateResidentSchema,
  changeResidentApartmentSchema,
  updateResidentPermissionsSchema,
  resetResidentPasswordSchema,
  residentIdParamsSchema,
  residentApartmentParamsSchema,
  residentListQuerySchema,
  validateCreateResident,
  validateUpdateResident,
  validateChangeResidentApartment,
  validateUpdateResidentPermissions,
  validateResetResidentPassword,
  validateResidentId,
  validateResidentApartmentId,
  validateResidentListQuery,
};
