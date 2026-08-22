import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";

/**
 * Padroniza os erros de validação do Zod.
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
 * Executa um schema sobre req.body.
 *
 * O conteúdo validado substitui req.body para que
 * os próximos níveis recebam dados normalizados.
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
 * Condomínio:
 * obrigatório para usuários vinculados a condomínio;
 * opcional para PLATFORM_ADMIN.
 *
 * A regra final sobre sua obrigatoriedade permanece
 * no AuthService, pois depende do tipo de usuário.
 */
const condominiumCodeSchema = z
  .string()
  .trim()
  .min(
    2,
    "O código do condomínio deve possuir pelo menos 2 caracteres."
  )
  .max(
    50,
    "O código do condomínio deve possuir no máximo 50 caracteres."
  )
  .transform((value) =>
    value.toUpperCase()
  )
  .optional()
  .or(z.literal(""))
  .transform((value) =>
    value === "" ? undefined : value
  );

/**
 * Validação do login.
 */
export const loginSchema = z
  .object({
    condominiumCode:
      condominiumCodeSchema,

    username: z
      .string({
        error:
          "O nome de acesso é obrigatório.",
      })
      .trim()
      .min(
        1,
        "O nome de acesso é obrigatório."
      )
      .max(
        100,
        "O nome de acesso deve possuir no máximo 100 caracteres."
      )
      .transform((value) =>
        value.toLowerCase()
      ),

    password: z
      .string({
        error:
          "A senha é obrigatória.",
      })
      .min(
        1,
        "A senha é obrigatória."
      )
      .max(
        200,
        "A senha informada é inválida."
      ),
  })
  .strict();

/**
 * Validação da renovação de tokens.
 */
export const refreshSchema = z
  .object({
    refreshToken: z
      .string({
        error:
          "O refresh token é obrigatório.",
      })
      .trim()
      .min(
        1,
        "O refresh token é obrigatório."
      ),
  })
  .strict();

/**
 * Validação da troca de senha realizada
 * pelo próprio usuário autenticado.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({
        error:
          "A senha atual é obrigatória.",
      })
      .min(
        1,
        "A senha atual é obrigatória."
      )
      .max(
        200,
        "A senha atual é inválida."
      ),

    newPassword: z
      .string({
        error:
          "A nova senha é obrigatória.",
      })
      .min(
        8,
        "A nova senha deve possuir pelo menos 8 caracteres."
      )
      .max(
        128,
        "A nova senha deve possuir no máximo 128 caracteres."
      ),

    newPasswordConfirmation: z
      .string({
        error:
          "A confirmação da nova senha é obrigatória.",
      })
      .min(
        1,
        "A confirmação da nova senha é obrigatória."
      ),
  })
  .strict()
  .superRefine((data, context) => {
    if (
      data.newPassword !==
      data.newPasswordConfirmation
    ) {
      context.addIssue({
        code:
          z.ZodIssueCode.custom,

        path: [
          "newPasswordConfirmation",
        ],

        message:
          "A confirmação da nova senha não corresponde.",
      });
    }

    if (
      data.currentPassword ===
      data.newPassword
    ) {
      context.addIssue({
        code:
          z.ZodIssueCode.custom,

        path: ["newPassword"],

        message:
          "A nova senha deve ser diferente da senha atual.",
      });
    }
  });

/**
 * Middlewares utilizados pelas rotas de autenticação.
 */
export const validateLogin =
  validateBody(loginSchema);

export const validateRefresh =
  validateBody(refreshSchema);

export const validateChangePassword =
  validateBody(changePasswordSchema);

export default {
  loginSchema,
  refreshSchema,
  changePasswordSchema,
  validateLogin,
  validateRefresh,
  validateChangePassword,
};
