import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";

/**
 * =====================================================
 * ONBOARDING VALIDATOR
 * =====================================================
 *
 * Valida a solicitação pública inicial de cadastro
 * de um condomínio no InfinityCondo.
 *
 * REGRA DE NEGÓCIO:
 *
 * - o cliente envia os dados do condomínio;
 * - informa o responsável pelo contato;
 * - NÃO escolhe username;
 * - NÃO escolhe senha;
 * - NÃO cria usuário;
 * - a solicitação seguirá para o backend como PENDING;
 * - posteriormente o PLATFORM_ADMIN da Star Infinity Code
 *   analisará e liberará as credenciais.
 *
 * REGRAS TÉCNICAS:
 *
 * - validar os campos relevantes no backend;
 * - rejeitar propriedades inesperadas;
 * - impedir dados excessivamente grandes;
 * - normalizar entradas antes de chegarem ao Service;
 * - nunca confiar somente no frontend.
 */

/**
 * =====================================================
 * HELPERS
 * =====================================================
 */

function formatValidationErrors(zodError) {
  return zodError.issues.map((issue) => ({
    field:
      issue.path.length > 0
        ? issue.path.join(".")
        : null,

    message:
      issue.message,

    code:
      issue.code,
  }));
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
          "Dados de cadastro inválidos.",
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

function onlyDigits(value) {
  return String(value ?? "")
    .replace(/\D/g, "");
}

/**
 * =====================================================
 * VALIDAÇÃO DE CNPJ
 * =====================================================
 */

function isValidCNPJ(value) {
  const cnpj =
    onlyDigits(value);

  if (cnpj.length !== 14) {
    return false;
  }

  if (
    /^(\d)\1{13}$/.test(cnpj)
  ) {
    return false;
  }

  function calculateDigit(base) {
    let factor =
      base.length - 7;

    let total = 0;

    for (
      let index = 0;
      index < base.length;
      index += 1
    ) {
      total +=
        Number(base[index]) *
        factor;

      factor -= 1;

      if (factor === 1) {
        factor = 9;
      }
    }

    const remainder =
      total % 11;

    return remainder < 2
      ? 0
      : 11 - remainder;
  }

  const firstDigit =
    calculateDigit(
      cnpj.slice(0, 12)
    );

  const secondDigit =
    calculateDigit(
      cnpj.slice(0, 12) +
      firstDigit
    );

  return (
    Number(cnpj[12]) ===
      firstDigit &&
    Number(cnpj[13]) ===
      secondDigit
  );
}

/**
 * =====================================================
 * SCHEMAS REUTILIZÁVEIS
 * =====================================================
 */

function requiredText(
  min,
  max,
  label
) {
  return z
    .string({
      error:
        `${label} é obrigatório.`,
    })
    .trim()
    .min(
      min,
      `${label} deve possuir pelo menos ${min} caracteres.`
    )
    .max(
      max,
      `${label} deve possuir no máximo ${max} caracteres.`
    );
}

function optionalText(
  max,
  label
) {
  return z
    .string()
    .trim()
    .max(
      max,
      `${label} deve possuir no máximo ${max} caracteres.`
    )
    .optional()
    .nullable()
    .transform((value) => {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return null;
      }

      return value;
    });
}

const requiredEmailSchema =
  z
    .string({
      error:
        "O e-mail do responsável é obrigatório.",
    })
    .trim()
    .email(
      "Informe um e-mail válido para o responsável."
    )
    .max(
      254,
      "O e-mail deve possuir no máximo 254 caracteres."
    )
    .transform((value) =>
      value.toLowerCase()
    );

const optionalEmailSchema =
  z
    .preprocess(
      (value) => {
        if (
          value === undefined ||
          value === null ||
          (typeof value === "string" && value.trim() === "")
        ) {
          return undefined;
        }

        return value;
      },
      z
        .string()
        .trim()
        .email(
          "Informe um e-mail válido."
        )
        .max(
          254,
          "O e-mail deve possuir no máximo 254 caracteres."
        )
        .transform((value) =>
          value.toLowerCase()
        )
        .optional()
    )
    .transform((value) =>
      value ?? null
    );

const optionalPhoneSchema =
  z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((value) => {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return null;
      }

      return value;
    })
    .refine(
      (value) => {
        if (!value) {
          return true;
        }

        const digits =
          onlyDigits(value);

        return (
          digits.length >= 10 &&
          digits.length <= 11
        );
      },
      {
        message:
          "Informe um telefone válido com DDD.",
      }
    );

const requiredPhoneSchema =
  z
    .string({
      error:
        "O telefone do responsável é obrigatório.",
    })
    .trim()
    .refine(
      (value) => {
        const digits =
          onlyDigits(value);

        return (
          digits.length >= 10 &&
          digits.length <= 11
        );
      },
      {
        message:
          "Informe um telefone válido com DDD.",
      }
    );

const optionalPostalCodeSchema =
  z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((value) => {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return null;
      }

      return value;
    })
    .refine(
      (value) => {
        if (!value) {
          return true;
        }

        return (
          onlyDigits(value).length ===
          8
        );
      },
      {
        message:
          "Informe um CEP válido com 8 dígitos.",
      }
    );

const brazilianStates = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

const optionalStateSchema =
  z
    .string()
    .trim()
    .transform((value) =>
      value.toUpperCase()
    )
    .optional()
    .nullable()
    .transform((value) => {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return null;
      }

      return value;
    })
    .refine(
      (value) => {
        if (!value) {
          return true;
        }

        return brazilianStates.includes(
          value
        );
      },
      {
        message:
          "Informe uma UF brasileira válida.",
      }
    );

/**
 * =====================================================
 * DADOS DO CONDOMÍNIO
 * =====================================================
 */

const condominiumSchema =
  z
    .object({
      name:
        requiredText(
          2,
          150,
          "O nome do condomínio"
        ),

      legalName:
        optionalText(
          200,
          "A razão social"
        ),

      document:
        z
          .string()
          .trim()
          .optional()
          .nullable()
          .transform((value) => {
            if (
              value === undefined ||
              value === null ||
              value === ""
            ) {
              return null;
            }

            return value;
          })
          .refine(
            (value) => {
              if (!value) {
                return true;
              }

              return isValidCNPJ(
                value
              );
            },
            {
              message:
                "Informe um CNPJ válido.",
            }
          ),

      email:
        optionalEmailSchema,

      phone:
        optionalPhoneSchema,

      postalCode:
        optionalPostalCodeSchema,

      addressLine:
        optionalText(
          200,
          "O endereço"
        ),

      addressNumber:
        optionalText(
          30,
          "O número do endereço"
        ),

      addressExtra:
        optionalText(
          100,
          "O complemento"
        ),

      neighborhood:
        optionalText(
          100,
          "O bairro"
        ),

      city:
        optionalText(
          100,
          "A cidade"
        ),

      state:
        optionalStateSchema,
    })
    .strict();

/**
 * =====================================================
 * RESPONSÁVEL PELA SOLICITAÇÃO
 * =====================================================
 *
 * Este objeto substitui o antigo "administrator".
 *
 * Aqui existem apenas informações de contato.
 * Não existem username, password ou passwordConfirmation.
 */

const contactSchema =
  z
    .object({
      name:
        requiredText(
          2,
          150,
          "O nome do responsável"
        ),

      email:
        requiredEmailSchema,

      phone:
        requiredPhoneSchema,
    })
    .strict();

/**
 * =====================================================
 * SCHEMA PRINCIPAL DO ONBOARDING
 * =====================================================
 */

export const onboardingSchema =
  z
    .object({
      condominium:
        condominiumSchema,

      contact:
        contactSchema,
    })
    .strict();

/**
 * =====================================================
 * MIDDLEWARE
 * =====================================================
 */

export const validateOnboarding =
  validateBody(
    onboardingSchema
  );

/**
 * Exportação agrupada.
 */
export default {
  onboardingSchema,
  validateOnboarding,
};
