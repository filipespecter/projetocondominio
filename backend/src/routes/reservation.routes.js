import { Router } from "express";

import ReservationController from "../controllers/ReservationController.js";

import {
  authMiddleware,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

import {
  validateReservationId,
  validateReservationListQuery,
  validateCreateReservation,
  validateCreateAdministrativeReservation,
  validateUpdateReservation,
  validateApproveReservation,
  validateRejectReservation,
} from "../validators/reservationValidator.js";

const reservationRoutes = Router();

/**
 * Todas as rotas de reservas exigem autenticação.
 */
reservationRoutes.use(
  authMiddleware
);

const administrativeRoles =
  authorizeRoles(
    "CONDOMINIUM_ADMIN",
    "MANAGER"
  );

const residentRole =
  authorizeRoles(
    "RESIDENT"
  );

const reservationUsers =
  authorizeRoles(
    "CONDOMINIUM_ADMIN",
    "MANAGER",
    "RESIDENT"
  );

/**
 * GET /api/v1/reservations/statistics
 *
 * Estatísticas para Dashboard e BI.
 *
 * Deve ficar antes de "/:id".
 */
reservationRoutes.get(
  "/statistics",
  administrativeRoles,
  (req, res, next) =>
    ReservationController.statistics(
      req,
      res,
      next
    )
);

/**
 * GET /api/v1/reservations/my
 *
 * Lista somente as reservas do morador autenticado.
 */
reservationRoutes.get(
  "/my",
  residentRole,
  (req, res, next) =>
    ReservationController.myReservations(
      req,
      res,
      next
    )
);

/**
 * GET /api/v1/reservations
 *
 * Administração lista todas as reservas.
 *
 * Filtros:
 * ?status=PENDING
 * ?apartmentId=UUID
 * ?userId=UUID
 */
reservationRoutes.get(
  "/",
  administrativeRoles,
  validateReservationListQuery,
  (req, res, next) =>
    ReservationController.index(
      req,
      res,
      next
    )
);

/**
 * POST /api/v1/reservations/admin
 *
 * Administração cria reserva em nome de morador.
 * Deve ficar antes de "/:id".
 */
reservationRoutes.post(
  "/admin",
  administrativeRoles,
  validateCreateAdministrativeReservation,
  (req, res, next) =>
    ReservationController
      .createAdministrative(
        req,
        res,
        next
      )
);

/**
 * POST /api/v1/reservations
 *
 * Morador solicita uma reserva.
 */
reservationRoutes.post(
  "/",
  residentRole,
  validateCreateReservation,
  (req, res, next) =>
    ReservationController.create(
      req,
      res,
      next
    )
);

/**
 * GET /api/v1/reservations/:id
 *
 * Busca uma reserva específica.
 *
 * Restrita à administração para não permitir
 * que moradores consultem reservas de terceiros.
 */
reservationRoutes.get(
  "/:id",
  administrativeRoles,
  validateReservationId,
  (req, res, next) =>
    ReservationController.show(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/reservations/:id
 *
 * Morador pode editar apenas a própria reserva pendente.
 * Administração também pode editar.
 *
 * A regra de propriedade é validada pelo Service.
 */
reservationRoutes.patch(
  "/:id",
  reservationUsers,
  validateReservationId,
  validateUpdateReservation,
  (req, res, next) =>
    ReservationController.update(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/reservations/:id/approve
 *
 * Aprovação administrativa.
 */
reservationRoutes.patch(
  "/:id/approve",
  administrativeRoles,
  validateReservationId,
  validateApproveReservation,
  (req, res, next) =>
    ReservationController.approve(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/reservations/:id/reject
 *
 * Rejeição administrativa com motivo obrigatório.
 */
reservationRoutes.patch(
  "/:id/reject",
  administrativeRoles,
  validateReservationId,
  validateRejectReservation,
  (req, res, next) =>
    ReservationController.reject(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/reservations/:id/reopen
 *
 * Administração reabre reserva rejeitada/cancelada.
 */
reservationRoutes.patch(
  "/:id/reopen",
  administrativeRoles,
  validateReservationId,
  (req, res, next) =>
    ReservationController.reopen(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/reservations/:id/cancel
 *
 * Morador cancela apenas a própria reserva.
 * Administração pode cancelar qualquer reserva permitida.
 */
reservationRoutes.patch(
  "/:id/cancel",
  reservationUsers,
  validateReservationId,
  (req, res, next) =>
    ReservationController.cancel(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/reservations/:id/complete
 *
 * Marca uma reserva aprovada como concluída.
 */
reservationRoutes.patch(
  "/:id/complete",
  administrativeRoles,
  validateReservationId,
  (req, res, next) =>
    ReservationController.complete(
      req,
      res,
      next
    )
);

/**
 * DELETE /api/v1/reservations/:id
 *
 * Exclusão lógica administrativa.
 */
reservationRoutes.delete(
  "/:id",
  administrativeRoles,
  validateReservationId,
  (req, res, next) =>
    ReservationController.remove(
      req,
      res,
      next
    )
);

export default reservationRoutes;
