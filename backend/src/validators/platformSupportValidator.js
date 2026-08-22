import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";

function formatErrors(
  error
) {
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

function validateBody(
  schema
) {
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

const startSchema =
  z
    .object({
      condominiumId:
        z
          .string()
          .uuid(
            "Condomínio inválido."
          ),

      reason:
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

export const validateSupportSessionStart =
  validateBody(
    startSchema
  );

export default {
  validateSupportSessionStart,
};
