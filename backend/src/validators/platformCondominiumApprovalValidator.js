import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";

function formatValidationErrors(
  zodError
) {
  return zodError.issues.map(
    (issue) => ({
      field:
        issue.path.length > 0
          ? issue.path.join(".")
          : null,

      message:
        issue.message,

      code:
        issue.code,
    })
  );
}

function validateBody(schema) {
  return (req, res, next) => {
    const result =
      schema.safeParse(
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

    req.body =
      result.data;

    return next();
  };
}

const approvalSchema =
  z
    .object({
      username:
        z
          .string()
          .trim()
          .min(
            3,
            "O nome de usuário deve possuir pelo menos 3 caracteres."
          )
          .max(
            50,
            "O nome de usuário deve possuir no máximo 50 caracteres."
          ),

      password:
        z
          .string()
          .min(
            8,
            "A senha temporária deve possuir pelo menos 8 caracteres."
          )
          .max(
            128,
            "A senha temporária deve possuir no máximo 128 caracteres."
          ),

      passwordConfirmation:
        z
          .string()
          .min(
            8,
            "A confirmação da senha é obrigatória."
          ),

      planId:
        z
          .string()
          .uuid(
            "Informe um plano válido."
          ),

      priceInCents:
        z
          .number()
          .int()
          .nonnegative()
          .optional(),

      gracePeriodDays:
        z
          .number()
          .int()
          .min(0)
          .max(30)
          .optional(),

      initialStatus:
        z
          .enum([
            "ACTIVE",
            "TRIAL",
          ])
          .optional(),

      billingCycle:
        z
          .enum([
            "MONTHLY",
            "QUARTERLY",
            "SEMIANNUAL",
            "ANNUAL",
          ])
          .optional(),

      trialEndsAt:
        z
          .string()
          .datetime()
          .optional()
          .nullable(),

      adminName:
        z
          .string()
          .trim()
          .min(2)
          .max(150)
          .optional(),

      adminEmail:
        z
          .string()
          .trim()
          .email()
          .max(254)
          .optional()
          .nullable(),

      adminPhone:
        z
          .string()
          .trim()
          .max(30)
          .optional()
          .nullable(),

      billingContactName:
        z
          .string()
          .trim()
          .min(2)
          .max(150)
          .optional(),

      billingEmail:
        z
          .string()
          .trim()
          .email()
          .max(254)
          .optional(),

      billingPhone:
        z
          .string()
          .trim()
          .max(30)
          .optional(),
    })
    .strict()
    .refine(
      (data) =>
        data.password ===
        data.passwordConfirmation,
      {
        message:
          "A confirmação da senha não corresponde.",
        path: [
          "passwordConfirmation",
        ],
      }
    );

const rejectionSchema =
  z
    .object({
      rejectionReason:
        z
          .string()
          .trim()
          .min(
            5,
            "O motivo deve possuir pelo menos 5 caracteres."
          )
          .max(
            1000,
            "O motivo deve possuir no máximo 1000 caracteres."
          ),
    })
    .strict();

export const validatePlatformApproval =
  validateBody(
    approvalSchema
  );

export const validatePlatformRejection =
  validateBody(
    rejectionSchema
  );

export default {
  validatePlatformApproval,
  validatePlatformRejection,
};
