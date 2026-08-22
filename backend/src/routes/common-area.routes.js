import { Router } from "express";

import CommonAreaController from "../controllers/CommonAreaController.js";

import {
  authMiddleware,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

import {
  validateCommonAreaId,
  validateCommonAreaListQuery,
  validateCreateCommonArea,
  validateUpdateCommonArea,
  validateSetReservationRequired,
} from "../validators/commonAreaValidator.js";

const commonAreaRoutes = Router();

/**
 * Todas as rotas de áreas comuns exigem autenticação.
 */
commonAreaRoutes.use(
  authMiddleware
);

/**
 * Administração do condomínio.
 */
const administrativeRoles =
  authorizeRoles(
    "CONDOMINIUM_ADMIN",
    "MANAGER"
  );

/**
 * Perfis que podem consultar áreas disponíveis.
 */
const viewingRoles =
  authorizeRoles(
    "CONDOMINIUM_ADMIN",
    "MANAGER",
    "RESIDENT",
    "DOORMAN"
  );

/**
 * GET /api/v1/common-areas/statistics
 *
 * Estatísticas para Dashboard e BI.
 *
 * Deve ficar antes de "/:id".
 */
commonAreaRoutes.get(
  "/statistics",
  administrativeRoles,
  (req, res, next) =>
    CommonAreaController.statistics(
      req,
      res,
      next
    )
);

/**
 * GET /api/v1/common-areas
 *
 * Lista áreas comuns.
 *
 * Filtros:
 * ?active=true
 * ?reservationRequired=true
 */
commonAreaRoutes.get(
  "/",
  viewingRoles,
  validateCommonAreaListQuery,
  (req, res, next) =>
    CommonAreaController.index(
      req,
      res,
      next
    )
);

/**
 * POST /api/v1/common-areas
 *
 * Cadastra uma área comum.
 */
commonAreaRoutes.post(
  "/",
  administrativeRoles,
  validateCreateCommonArea,
  (req, res, next) =>
    CommonAreaController.create(
      req,
      res,
      next
    )
);

/**
 * GET /api/v1/common-areas/:id
 *
 * Busca uma área comum específica.
 */
commonAreaRoutes.get(
  "/:id",
  viewingRoles,
  validateCommonAreaId,
  (req, res, next) =>
    CommonAreaController.show(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/common-areas/:id
 *
 * Atualiza uma área comum.
 */
commonAreaRoutes.patch(
  "/:id",
  administrativeRoles,
  validateCommonAreaId,
  validateUpdateCommonArea,
  (req, res, next) =>
    CommonAreaController.update(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/common-areas/:id/activate
 *
 * Ativa uma área comum.
 */
commonAreaRoutes.patch(
  "/:id/activate",
  administrativeRoles,
  validateCommonAreaId,
  (req, res, next) =>
    CommonAreaController.activate(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/common-areas/:id/deactivate
 *
 * Desativa uma área comum.
 */
commonAreaRoutes.patch(
  "/:id/deactivate",
  administrativeRoles,
  validateCommonAreaId,
  (req, res, next) =>
    CommonAreaController.deactivate(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/common-areas/:id/reservation-required
 *
 * Define se a área exige reserva prévia.
 */
commonAreaRoutes.patch(
  "/:id/reservation-required",
  administrativeRoles,
  validateCommonAreaId,
  validateSetReservationRequired,
  (req, res, next) =>
    CommonAreaController.setReservationRequired(
      req,
      res,
      next
    )
);

/**
 * DELETE /api/v1/common-areas/:id
 *
 * Executa exclusão lógica.
 *
 * O Service impede exclusão quando existem
 * reservas pendentes ou aprovadas.
 */
commonAreaRoutes.delete(
  "/:id",
  administrativeRoles,
  validateCommonAreaId,
  (req, res, next) =>
    CommonAreaController.remove(
      req,
      res,
      next
    )
);

export default commonAreaRoutes;
