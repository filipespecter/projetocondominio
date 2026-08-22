import { Router } from "express";

import ResidentController from "../controllers/ResidentController.js";

import {
  authMiddleware,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

import {
  validateResidentId,
  validateResidentListQuery,
  validateCreateResident,
  validateUpdateResident,
  validateChangeResidentApartment,
  validateUpdateResidentPermissions,
  validateResetResidentPassword,
} from "../validators/residentValidator.js";

const residentRoutes = Router();

/**
 * Todas as rotas de moradores exigem autenticação.
 */
residentRoutes.use(
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
 * GET /api/v1/residents/statistics
 *
 * Estatísticas para dashboard e BI.
 *
 * Esta rota precisa ficar antes de "/:id".
 */
residentRoutes.get(
  "/statistics",
  administrativeRoles,
  (req, res, next) =>
    ResidentController.statistics(
      req,
      res,
      next
    )
);

/**
 * GET /api/v1/residents/directory
 *
 * Diretório operacional seguro.
 * Deve ficar antes de "/:id".
 */
residentRoutes.get(
  "/directory",
  authorizeRoles(
    "CONDOMINIUM_ADMIN",
    "MANAGER",
    "DOORMAN"
  ),
  (req, res, next) =>
    ResidentController.directory(
      req,
      res,
      next
    )
);

/**
 * GET /api/v1/residents
 *
 * Lista moradores.
 *
 * Filtros opcionais:
 * ?residentType=OWNER
 * ?apartmentId=UUID
 */
residentRoutes.get(
  "/",
  administrativeRoles,
  validateResidentListQuery,
  (req, res, next) =>
    ResidentController.index(
      req,
      res,
      next
    )
);

/**
 * POST /api/v1/residents
 *
 * Cadastra usuário e perfil de morador.
 */
residentRoutes.post(
  "/",
  administrativeRoles,
  validateCreateResident,
  (req, res, next) =>
    ResidentController.create(
      req,
      res,
      next
    )
);

/**
 * GET /api/v1/residents/:id
 *
 * Busca um morador específico.
 */
residentRoutes.get(
  "/:id",
  administrativeRoles,
  validateResidentId,
  (req, res, next) =>
    ResidentController.show(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/residents/:id
 *
 * Atualiza dados do usuário e do perfil de morador.
 */
residentRoutes.patch(
  "/:id",
  administrativeRoles,
  validateResidentId,
  validateUpdateResident,
  (req, res, next) =>
    ResidentController.update(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/residents/:id/apartment
 *
 * Transfere o morador para outro apartamento.
 */
residentRoutes.patch(
  "/:id/apartment",
  administrativeRoles,
  validateResidentId,
  validateChangeResidentApartment,
  (req, res, next) =>
    ResidentController.changeApartment(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/residents/:id/permissions
 *
 * Atualiza permissões específicas do morador.
 */
residentRoutes.patch(
  "/:id/permissions",
  administrativeRoles,
  validateResidentId,
  validateUpdateResidentPermissions,
  (req, res, next) =>
    ResidentController.updatePermissions(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/residents/:id/reset-password
 *
 * Redefine administrativamente a senha do morador.
 */
residentRoutes.patch(
  "/:id/reset-password",
  administrativeRoles,
  validateResidentId,
  validateResetResidentPassword,
  (req, res, next) =>
    ResidentController.resetPassword(
      req,
      res,
      next
    )
);

/**
 * DELETE /api/v1/residents/:id
 *
 * Executa exclusão lógica do perfil e
 * desativa o usuário vinculado.
 */
residentRoutes.delete(
  "/:id",
  administrativeRoles,
  validateResidentId,
  (req, res, next) =>
    ResidentController.remove(
      req,
      res,
      next
    )
);

export default residentRoutes;
