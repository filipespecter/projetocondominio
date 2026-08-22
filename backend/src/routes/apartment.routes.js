import { Router } from "express";

import ApartmentController from "../controllers/ApartmentController.js";

import {
  authMiddleware,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

import {
  validateApartmentId,
  validateApartmentListQuery,
  validateCreateApartment,
  validateUpdateApartment,
  validateChangeApartmentStatus,
} from "../validators/apartmentValidator.js";

const apartmentRoutes = Router();

/**
 * Todas as rotas de apartamentos exigem autenticação.
 */
apartmentRoutes.use(
  authMiddleware
);

/**
 * Perfis administrativos.
 */
const administrativeRoles =
  authorizeRoles(
    "CONDOMINIUM_ADMIN",
    "MANAGER"
  );

/**
 * Leitura operacional segura.
 */
const operationalReadRoles =
  authorizeRoles(
    "CONDOMINIUM_ADMIN",
    "MANAGER",
    "DOORMAN"
  );

/**
 * GET /api/v1/apartments/statistics
 *
 * Retorna totais por status para o dashboard.
 *
 * Esta rota precisa ficar antes de "/:id"
 * para que "statistics" não seja interpretado como ID.
 */
apartmentRoutes.get(
  "/statistics",
  administrativeRoles,
  (req, res, next) =>
    ApartmentController.statistics(
      req,
      res,
      next
    )
);

/**
 * GET /api/v1/apartments
 *
 * Lista todos os apartamentos.
 * Aceita filtro opcional:
 *
 * ?status=VACANT
 */
apartmentRoutes.get(
  "/",
  administrativeRoles,
  validateApartmentListQuery,
  (req, res, next) =>
    ApartmentController.index(
      req,
      res,
      next
    )
);

/**
 * POST /api/v1/apartments
 *
 * Cadastra um novo apartamento.
 */
apartmentRoutes.post(
  "/",
  administrativeRoles,
  validateCreateApartment,
  (req, res, next) =>
    ApartmentController.create(
      req,
      res,
      next
    )
);

/**
 * GET /api/v1/apartments/directory
 *
 * Diretório operacional de unidades.
 * Deve ficar antes de "/:id".
 */
apartmentRoutes.get(
  "/directory",
  operationalReadRoles,
  (req, res, next) =>
    ApartmentController.directory(
      req,
      res,
      next
    )
);

/**
 * GET /api/v1/apartments/:id
 *
 * Busca um apartamento específico.
 */
apartmentRoutes.get(
  "/:id",
  administrativeRoles,
  validateApartmentId,
  (req, res, next) =>
    ApartmentController.show(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/apartments/:id
 *
 * Atualiza parcialmente um apartamento.
 */
apartmentRoutes.patch(
  "/:id",
  administrativeRoles,
  validateApartmentId,
  validateUpdateApartment,
  (req, res, next) =>
    ApartmentController.update(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/apartments/:id/status
 *
 * Altera somente o status do apartamento.
 */
apartmentRoutes.patch(
  "/:id/status",
  administrativeRoles,
  validateApartmentId,
  validateChangeApartmentStatus,
  (req, res, next) =>
    ApartmentController.changeStatus(
      req,
      res,
      next
    )
);

/**
 * DELETE /api/v1/apartments/:id
 *
 * Executa exclusão lógica.
 *
 * O Service bloqueia a exclusão quando
 * existem moradores ativos vinculados.
 */
apartmentRoutes.delete(
  "/:id",
  administrativeRoles,
  validateApartmentId,
  (req, res, next) =>
    ApartmentController.remove(
      req,
      res,
      next
    )
);

export default apartmentRoutes;
