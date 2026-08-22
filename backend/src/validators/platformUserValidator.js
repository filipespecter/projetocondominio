import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";

function formatErrors(error) {
  return error.issues.map(
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
  return (
    req,
    res,
    next
  ) => {
    const result =
      schema.safeParse(
        req.body ?? {}
      );

    if (
      !result.success
    ) {
      return next(
        new ApiError(
          "Dados inválidos.",
          422,
          formatErrors(
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

const createPlatformUserSchema =
  z
    .object({
      name:
        z
          .string()
          .trim()
          .min(2)
          .max(150),

      username:
        z
          .string()
          .trim()
          .min(3)
          .max(50)
          .regex(
            /^[a-zA-Z0-9._-]+$/,
            "Username inválido."
          ),

      email:
        z
          .string()
          .trim()
          .email()
          .max(254)
          .nullable()
          .optional(),

      phone:
        z
          .string()
          .trim()
          .regex(/^\+?[0-9]{10,15}$/, "Telefone inválido.")
          .nullable()
          .optional(),

      document:
        z
          .string()
          .trim()
          .regex(/^[0-9]{11,14}$/, "Documento deve conter 11 a 14 dígitos.")
          .nullable()
          .optional(),

      platformEmployeeCode:
        z.string().trim().min(2).max(30).nullable().optional(),

      platformJobTitle:
        z.string().trim().min(2).max(100).nullable().optional(),

      platformDepartment:
        z.string().trim().min(2).max(100).nullable().optional(),

      platformEmploymentType:
        z.enum(["CLT", "PJ", "ESTAGIO", "SOCIO", "OUTRO"]).nullable().optional(),

      platformStartDate:
        z.string().trim().datetime({ offset: true }).nullable().optional(),

      platformNotes:
        z.string().trim().max(2000).nullable().optional(),

      password:
        z
          .string()
          .min(8)
          .max(128),

      role:
        z.enum([
          "PLATFORM_ADMIN",
          "PLATFORM_SUPPORT",
        ]),

      status:
        z
          .enum([
            "ACTIVE",
            "INACTIVE",
            "BLOCKED",
            "PENDING",
          ])
          .optional(),

      mustChangePassword:
        z
          .boolean()
          .optional(),
    })
    .strict();

const updateSchema =
  z
    .object({
      name:
        z
          .string()
          .trim()
          .min(2)
          .max(150)
          .optional(),

      username:
        z
          .string()
          .trim()
          .min(3)
          .max(50)
          .optional(),

      email:
        z
          .string()
          .trim()
          .email()
          .max(254)
          .nullable()
          .optional(),

      phone:
        z
          .string()
          .trim()
          .regex(/^\+?[0-9]{10,15}$/, "Telefone inválido.")
          .nullable()
          .optional(),

      document:
        z.string().trim().regex(/^[0-9]{11,14}$/, "Documento deve conter 11 a 14 dígitos.").nullable().optional(),
      platformEmployeeCode:
        z.string().trim().min(2).max(30).nullable().optional(),
      platformJobTitle:
        z.string().trim().min(2).max(100).nullable().optional(),
      platformDepartment:
        z.string().trim().min(2).max(100).nullable().optional(),
      platformEmploymentType:
        z.enum(["CLT", "PJ", "ESTAGIO", "SOCIO", "OUTRO"]).nullable().optional(),
      platformStartDate:
        z.string().trim().datetime({ offset: true }).nullable().optional(),
      platformNotes:
        z.string().trim().max(2000).nullable().optional(),
      role:
        z.enum(["PLATFORM_ADMIN", "PLATFORM_SUPPORT"]).optional(),
    })
    .strict();

const statusSchema =
  z
    .object({
      status:
        z.enum([
          "ACTIVE",
          "INACTIVE",
          "BLOCKED",
          "PENDING",
        ]),
    })
    .strict();

const resetPasswordSchema =
  z
    .object({
      newPassword:
        z
          .string()
          .min(
            8,
            "A nova senha deve possuir pelo menos 8 caracteres."
          )
          .max(128),
    })
    .strict();

export const validateCreatePlatformUser =
  validateBody(
    createPlatformUserSchema
  );

export const validatePlatformUserUpdate =
  validateBody(
    updateSchema
  );

export const validatePlatformUserStatus =
  validateBody(
    statusSchema
  );

export const validatePlatformUserPasswordReset =
  validateBody(
    resetPasswordSchema
  );

export default {
  validateCreatePlatformUser,
  validatePlatformUserUpdate,
  validatePlatformUserStatus,
  validatePlatformUserPasswordReset,
};
