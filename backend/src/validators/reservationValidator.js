import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";

export const RESERVATION_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELED",
  "COMPLETED",
];

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

const uuidSchema = z
  .string()
  .uuid(
    "O identificador informado é inválido."
  );

const reservationStatusSchema = z
  .string()
  .trim()
  .transform((value) =>
    value.toUpperCase()
  )
  .refine(
    (value) =>
      RESERVATION_STATUSES.includes(value),
    {
      message:
        "Status de reserva inválido.",
    }
  );

const timeSchema = z
  .string()
  .trim()
  .regex(
    /^([01]\d|2[0-3]):([0-5]\d)$/,
    "O horário deve estar no formato HH:mm."
  );

const dateSchema = z
  .string()
  .trim()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "A data deve estar no formato YYYY-MM-DD."
  );

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

const guestsCountSchema = z
  .union([
    z
      .number()
      .int(
        "A quantidade de convidados deve ser um número inteiro."
      )
      .min(
        0,
        "A quantidade de convidados deve ser igual ou maior que zero."
      ),
    z
      .string()
      .trim()
      .regex(
        /^\d+$/,
        "A quantidade de convidados deve ser um número inteiro."
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

export const createReservationSchema =
  z
    .object({
      commonAreaId:
        uuidSchema,

      reservationDate:
        dateSchema,

      startTime:
        timeSchema,

      endTime:
        timeSchema,

      guestsCount:
        guestsCountSchema,

      purpose:
        optionalText(
          500,
          "A finalidade"
        ),

      notes:
        optionalText(
          1000,
          "As observações"
        ),
    })
    .strict()
    .superRefine(
      (data, ctx) => {
        if (
          data.startTime >=
          data.endTime
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [
              "endTime",
            ],
            message:
              "O horário final deve ser posterior ao horário inicial.",
          });
        }
      }
    );

export const createAdministrativeReservationSchema =
  createReservationSchema
    .extend({
      requestedByUserId:
        uuidSchema,

      initialStatus:
        z
          .enum([
            "PENDING",
            "APPROVED",
          ])
          .optional()
          .default(
            "PENDING"
          ),
    })
    .strict();

export const updateReservationSchema =
  z
    .object({
      commonAreaId:
        uuidSchema.optional(),

      reservationDate:
        dateSchema.optional(),

      startTime:
        timeSchema.optional(),

      endTime:
        timeSchema.optional(),

      guestsCount:
        guestsCountSchema,

      purpose:
        optionalText(
          500,
          "A finalidade"
        ),

      notes:
        optionalText(
          1000,
          "As observações"
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
    )
    .superRefine(
      (data, ctx) => {
        if (
          data.startTime &&
          data.endTime &&
          data.startTime >=
            data.endTime
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [
              "endTime",
            ],
            message:
              "O horário final deve ser posterior ao horário inicial.",
          });
        }
      }
    );

export const approveReservationSchema =
  z
    .object({
      reviewReason:
        optionalText(
          500,
          "A observação da análise"
        ),
    })
    .strict();

export const rejectReservationSchema =
  z
    .object({
      reviewReason: z
        .string()
        .trim()
        .min(
          2,
          "O motivo da rejeição é obrigatório."
        )
        .max(
          500,
          "O motivo da rejeição deve possuir no máximo 500 caracteres."
        ),
    })
    .strict();

export const reservationIdParamsSchema =
  z
    .object({
      id:
        uuidSchema,
    })
    .strict();

export const reservationApartmentParamsSchema =
  z
    .object({
      apartmentId:
        uuidSchema,
    })
    .strict();

export const reservationUserParamsSchema =
  z
    .object({
      userId:
        uuidSchema,
    })
    .strict();

export const reservationListQuerySchema =
  z
    .object({
      status:
        reservationStatusSchema
          .optional(),

      apartmentId:
        uuidSchema.optional(),

      userId:
        uuidSchema.optional(),
    })
    .strict();

export const validateCreateReservation =
  validateBody(
    createReservationSchema
  );

export const validateCreateAdministrativeReservation =
  validateBody(
    createAdministrativeReservationSchema
  );

export const validateUpdateReservation =
  validateBody(
    updateReservationSchema
  );

export const validateApproveReservation =
  validateBody(
    approveReservationSchema
  );

export const validateRejectReservation =
  validateBody(
    rejectReservationSchema
  );

export const validateReservationId =
  validateParams(
    reservationIdParamsSchema
  );

export const validateReservationApartmentId =
  validateParams(
    reservationApartmentParamsSchema
  );

export const validateReservationUserId =
  validateParams(
    reservationUserParamsSchema
  );

export const validateReservationListQuery =
  validateQuery(
    reservationListQuerySchema
  );

export default {
  RESERVATION_STATUSES,
  createReservationSchema,
  createAdministrativeReservationSchema,
  updateReservationSchema,
  approveReservationSchema,
  rejectReservationSchema,
  reservationIdParamsSchema,
  reservationApartmentParamsSchema,
  reservationUserParamsSchema,
  reservationListQuerySchema,
  validateCreateReservation,
  validateCreateAdministrativeReservation,
  validateUpdateReservation,
  validateApproveReservation,
  validateRejectReservation,
  validateReservationId,
  validateReservationApartmentId,
  validateReservationUserId,
  validateReservationListQuery,
};
