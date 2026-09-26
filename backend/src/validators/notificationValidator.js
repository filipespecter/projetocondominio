import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";

/**
 * =====================================================
 * CONSTANTES DE VALIDAÇÃO
 * =====================================================
 */

/**
 * Prioridades suportadas pelo módulo de notificações.
 */
export const NOTIFICATION_PRIORITIES = [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
];

/**
 * Perfis que podem ser utilizados como público-alvo.
 */
export const NOTIFICATION_TARGET_ROLES = [
  "PLATFORM_ADMIN",
  "CONDOMINIUM_ADMIN",
  "MANAGER",
  "DOORMAN",
  "RESIDENT",
];

/**
 * =====================================================
 * HELPERS DE VALIDAÇÃO
 * =====================================================
 */

/**
 * Converte os erros do Zod para o padrão utilizado
 * pelo backend do InfinityCondo.
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
 * Middleware genérico para validação de body.
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
 * Middleware genérico para validação de parâmetros.
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
 * Middleware genérico para validação de query string.
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
 * UUID utilizado em IDs do sistema.
 */
const uuidSchema = z
  .string()
  .uuid(
    "O identificador informado é inválido."
  );

/**
 * Prioridade normalizada para caixa alta.
 */
const prioritySchema = z
  .string()
  .trim()
  .transform((value) =>
    value.toUpperCase()
  )
  .refine(
    (value) =>
      NOTIFICATION_PRIORITIES.includes(
        value
      ),
    {
      message:
        "Prioridade de notificação inválida.",
    }
  );

/**
 * Perfil destinatário normalizado para caixa alta.
 */
const targetRoleSchema = z
  .string()
  .trim()
  .transform((value) =>
    value.toUpperCase()
  )
  .refine(
    (value) =>
      NOTIFICATION_TARGET_ROLES.includes(
        value
      ),
    {
      message:
        "Perfil destinatário inválido.",
    }
  );

/**
 * Texto obrigatório reutilizado nos campos principais.
 */
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

/**
 * Texto opcional.
 *
 * String vazia é convertida para null.
 */
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

/**
 * Texto opcional que segue padrão interno em caixa alta.
 */
const optionalUppercaseText = (
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
    .transform((value) =>
      value.toUpperCase()
    )
    .optional()
    .nullable()
    .transform((value) =>
      value === "" ? null : value
    );

/**
 * =====================================================
 * SCHEMAS
 * =====================================================
 */

/**
 * Criação manual de notificação.
 *
 * Esse schema pode ser usado futuramente por uma rota
 * administrativa, caso o condomínio precise disparar
 * notificações diretamente pelo painel.
 */
export const createNotificationSchema =
  z
    .object({
      recipientUserId:
        uuidSchema
          .optional()
          .nullable(),

      targetRole:
        targetRoleSchema
          .optional()
          .nullable(),

      title:
        requiredText(
          2,
          200,
          "O título"
        ),

      message:
        requiredText(
          2,
          5000,
          "A mensagem"
        ),

      type:
        requiredText(
          2,
          100,
          "O tipo"
        )
          .transform((value) =>
            value.toUpperCase()
          ),

      origin:
        optionalUppercaseText(
          100,
          "A origem"
        ),

      module:
        optionalUppercaseText(
          100,
          "O módulo"
        ),

      referenceId:
        optionalText(
          150,
          "A referência"
        ),

      apartmentLabel:
        optionalText(
          150,
          "A identificação do apartamento"
        ),

      priority:
        prioritySchema
          .optional()
          .default("NORMAL"),
    })
    .strict()
    .superRefine(
      (data, ctx) => {
        if (
          !data.recipientUserId &&
          !data.targetRole
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [
              "recipientUserId",
            ],
            message:
              "Informe um usuário destinatário ou um perfil destinatário.",
          });
        }

        if (
          data.recipientUserId &&
          data.targetRole
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [
              "targetRole",
            ],
            message:
              "Informe apenas um usuário destinatário ou um perfil destinatário.",
          });
        }
      }
    );

/**
 * Parâmetro padrão de uma notificação.
 */
export const notificationIdParamsSchema =
  z
    .object({
      id:
        uuidSchema,
    })
    .strict();

/**
 * Filtros administrativos disponíveis.
 */
export const notificationListQuerySchema =
  z
    .object({
      recipientUserId:
        uuidSchema.optional(),

      targetRole:
        targetRoleSchema.optional(),

      type:
        z
          .string()
          .trim()
          .min(
            1,
            "O tipo informado é inválido."
          )
          .max(
            100,
            "O tipo deve possuir no máximo 100 caracteres."
          )
          .transform((value) =>
            value.toUpperCase()
          )
          .optional(),

      module:
        z
          .string()
          .trim()
          .min(
            1,
            "O módulo informado é inválido."
          )
          .max(
            100,
            "O módulo deve possuir no máximo 100 caracteres."
          )
          .transform((value) =>
            value.toUpperCase()
          )
          .optional(),

      unreadOnly: z
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

/**
 * =====================================================
 * MIDDLEWARES EXPORTADOS
 * =====================================================
 */

/**
 * Valida criação manual de notificação.
 */
export const validateCreateNotification =
  validateBody(
    createNotificationSchema
  );

/**
 * Valida o ID da notificação.
 */
export const validateNotificationId =
  validateParams(
    notificationIdParamsSchema
  );

/**
 * Valida filtros de listagem.
 */
export const validateNotificationListQuery =
  validateQuery(
    notificationListQuerySchema
  );

/**
 * Exportação agrupada para facilitar testes
 * e reutilização futura.
 */
export default {
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_TARGET_ROLES,
  createNotificationSchema,
  notificationIdParamsSchema,
  notificationListQuerySchema,
  validateCreateNotification,
  validateNotificationId,
  validateNotificationListQuery,
};
