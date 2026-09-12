import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";

/**
 * Status aceitos para apartamentos.
 */
export const APARTMENT_STATUSES = [
  "OCCUPIED",
  "VACANT",
  "MAINTENANCE",
  "INACTIVE",
];

/**
 * Formata os erros do Zod no padrão da API.
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
 * Valida req.body e substitui o conteúdo
 * pelos dados já tratados e normalizados.
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
 * Valida parâmetros da rota.
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
 * Valida query strings.
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
 * Campo de status do apartamento.
 */
const apartmentStatusSchema = z
  .string()
  .trim()
  .transform((value) =>
    value.toUpperCase()
  )
  .refine(
    (value) =>
      APARTMENT_STATUSES.includes(
        value
      ),
    {
      message:
        "Status de apartamento inválido.",
    }
  );

/**
 * Converte andar para número inteiro ou null.
 */
const floorSchema = z
  .union([
    z.number().int(
      "O andar deve ser um número inteiro."
    ),
    z
      .string()
      .trim()
      .regex(
        /^-?\d+$/,
        "O andar deve ser um número inteiro."
      )
      .transform((value) =>
        Number(value)
      ),
    z.null(),
    z.literal(""),
  ])
  .transform((value) =>
    value === "" ? null : value
  )
  .optional();

/**
 * Schema para criação.
 */
export const createApartmentSchema = z
  .object({
    block: z
      .string()
      .trim()
      .min(
        1,
        "O bloco é obrigatório."
      )
      .max(
        50,
        "O bloco deve possuir no máximo 50 caracteres."
      ),

    number: z
      .string()
      .trim()
      .min(
        1,
        "O número do apartamento é obrigatório."
      )
      .max(
        30,
        "O número do apartamento deve possuir no máximo 30 caracteres."
      ),

    floor: floorSchema,

    status:
      apartmentStatusSchema
        .optional(),

    notes: z
      .string()
      .trim()
      .max(
        1000,
        "As observações devem possuir no máximo 1000 caracteres."
      )
      .optional()
      .nullable()
      .transform((value) =>
        value === "" ? null : value
      ),
  })
  .strict();

/**
 * Schema para atualização parcial.
 */
export const updateApartmentSchema = z
  .object({
    block: z
      .string()
      .trim()
      .min(
        1,
        "O bloco não pode ficar vazio."
      )
      .max(
        50,
        "O bloco deve possuir no máximo 50 caracteres."
      )
      .optional(),

    number: z
      .string()
      .trim()
      .min(
        1,
        "O número não pode ficar vazio."
      )
      .max(
        30,
        "O número do apartamento deve possuir no máximo 30 caracteres."
      )
      .optional(),

    floor: floorSchema,

    status:
      apartmentStatusSchema
        .optional(),

    notes: z
      .string()
      .trim()
      .max(
        1000,
        "As observações devem possuir no máximo 1000 caracteres."
      )
      .optional()
      .nullable()
      .transform((value) =>
        value === "" ? null : value
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
  );

/**
 * Schema usado na troca direta de status.
 */
export const changeApartmentStatusSchema =
  z
    .object({
      status:
        apartmentStatusSchema,
    })
    .strict();

/**
 * Validação do ID UUID do apartamento.
 */
export const apartmentIdParamsSchema =
  z
    .object({
      id: z
        .string()
        .uuid(
          "O ID do apartamento é inválido."
        ),
    })
    .strict();

/**
 * Filtro opcional por status.
 */
export const apartmentListQuerySchema =
  z
    .object({
      status:
        apartmentStatusSchema
          .optional(),
    })
    .strict();

/**
 * Middlewares prontos para as rotas.
 */
export const validateCreateApartment =
  validateBody(
    createApartmentSchema
  );

export const validateUpdateApartment =
  validateBody(
    updateApartmentSchema
  );

export const validateChangeApartmentStatus =
  validateBody(
    changeApartmentStatusSchema
  );

export const validateApartmentId =
  validateParams(
    apartmentIdParamsSchema
  );

export const validateApartmentListQuery =
  validateQuery(
    apartmentListQuerySchema
  );

export default {
  APARTMENT_STATUSES,
  createApartmentSchema,
  updateApartmentSchema,
  changeApartmentStatusSchema,
  apartmentIdParamsSchema,
  apartmentListQuerySchema,
  validateCreateApartment,
  validateUpdateApartment,
  validateChangeApartmentStatus,
  validateApartmentId,
  validateApartmentListQuery,
};
