import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";

/**
 * =====================================================
 * CONSTANTES
 * =====================================================
 */

/**
 * Ações mais comuns de auditoria.
 *
 * A lista não impede novos tipos no futuro,
 * mas serve para validar os filtros principais.
 */
export const AUDIT_ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "STATUS_CHANGE",
  "APPROVE",
  "DENY",
  "CANCEL",
];

/**
 * =====================================================
 * HELPERS
 * =====================================================
 */

/**
 * Formata erros do Zod para o padrão do backend.
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
 * Middleware genérico para validar parâmetros de rota.
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
 * Middleware genérico para validar query string.
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
 * UUID utilizado nos IDs do sistema.
 */
const uuidSchema = z
  .string()
  .uuid(
    "O identificador informado é inválido."
  );

/**
 * Data de filtro no formato YYYY-MM-DD.
 */
const dateSchema = z
  .string()
  .trim()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "A data deve estar no formato YYYY-MM-DD."
  );

/**
 * Texto interno normalizado para caixa alta.
 */
const uppercaseTextSchema = (
  max,
  label
) =>
  z
    .string()
    .trim()
    .min(
      1,
      `${label} é obrigatório.`
    )
    .max(
      max,
      `${label} deve possuir no máximo ${max} caracteres.`
    )
    .transform((value) =>
      value.toUpperCase()
    );

/**
 * =====================================================
 * SCHEMAS
 * =====================================================
 */

/**
 * Parâmetro de ID de um registro de auditoria.
 */
export const auditLogIdParamsSchema =
  z
    .object({
      id:
        uuidSchema,
    })
    .strict();

/**
 * Filtros disponíveis para consultas administrativas.
 */
export const auditLogListQuerySchema =
  z
    .object({
      userId:
        uuidSchema.optional(),

      module:
        uppercaseTextSchema(
          100,
          "O módulo"
        ).optional(),

      action:
        uppercaseTextSchema(
          100,
          "A ação"
        ).optional(),

      referenceId:
        z
          .string()
          .trim()
          .min(
            1,
            "A referência informada é inválida."
          )
          .max(
            150,
            "A referência deve possuir no máximo 150 caracteres."
          )
          .optional(),

      startDate:
        dateSchema.optional(),

      endDate:
        dateSchema.optional(),
    })
    .strict()
    .superRefine(
      (data, ctx) => {
        /**
         * Para filtro por período, as duas datas
         * devem ser informadas.
         */
        if (
          (data.startDate &&
            !data.endDate) ||
          (!data.startDate &&
            data.endDate)
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [
              "startDate",
            ],
            message:
              "Informe a data inicial e a data final.",
          });
        }

        /**
         * A data inicial não pode ser posterior
         * à data final.
         */
        if (
          data.startDate &&
          data.endDate &&
          new Date(data.startDate) >
            new Date(data.endDate)
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [
              "startDate",
            ],
            message:
              "A data inicial não pode ser posterior à data final.",
          });
        }
      }
    );

/**
 * =====================================================
 * MIDDLEWARES EXPORTADOS
 * =====================================================
 */

/**
 * Valida o ID do log.
 */
export const validateAuditLogId =
  validateParams(
    auditLogIdParamsSchema
  );

/**
 * Valida filtros da auditoria.
 */
export const validateAuditLogListQuery =
  validateQuery(
    auditLogListQuerySchema
  );

/**
 * Exportação agrupada.
 */
export default {
  AUDIT_ACTIONS,
  auditLogIdParamsSchema,
  auditLogListQuerySchema,
  validateAuditLogId,
  validateAuditLogListQuery,
};
