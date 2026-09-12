import { Router } from "express";

import DoormanController from "../controllers/DoormanController.js";

import {
  authMiddleware,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

import {
  validateDoormanId,
  validateDoormanListQuery,
  validateCreateDoorman,
  validateUpdateDoorman,
  validateChangeDoormanShift,
  validateRegisterDoormanDuty,
  validateResetDoormanPassword,
} from "../validators/doormanValidator.js";

const doormanRoutes = Router();

/**
 * Todas as rotas de porteiros exigem autenticação.
 */
doormanRoutes.use(
  authMiddleware
);

/**
 * Somente a administração do condomínio
 * pode gerenciar porteiros.
 */
const administrativeRoles =
  authorizeRoles(
    "CONDOMINIUM_ADMIN",
    "MANAGER"
  );

/**
 * GET /api/v1/doormen/statistics
 *
 * Estatísticas para dashboard e BI.
 *
 * Esta rota precisa ficar antes de "/:id".
 */
doormanRoutes.get(
  "/statistics",
  administrativeRoles,
  (req, res, next) =>
    DoormanController.statistics(
      req,
      res,
      next
    )
);

/**
 * GET /api/v1/doormen
 *
 * Lista todos os porteiros.
 *
 * Filtro opcional:
 * ?shift=NIGHT
 */
doormanRoutes.get(
  "/",
  administrativeRoles,
  validateDoormanListQuery,
  (req, res, next) =>
    DoormanController.index(
      req,
      res,
      next
    )
);

/**
 * POST /api/v1/doormen
 *
 * Cadastra usuário e perfil de porteiro.
 */
doormanRoutes.post(
  "/",
  administrativeRoles,
  validateCreateDoorman,
  (req, res, next) =>
    DoormanController.create(
      req,
      res,
      next
    )
);

/**
 * GET /api/v1/doormen/:id
 *
 * Busca um porteiro específico.
 */
doormanRoutes.get(
  "/:id/supervision",
  administrativeRoles,
  validateDoormanId,
  (req, res, next) =>
    DoormanController.supervision(req, res, next)
);

doormanRoutes.get(
  "/:id",
  administrativeRoles,
  validateDoormanId,
  (req, res, next) =>
    DoormanController.show(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/doormen/:id
 *
 * Atualiza dados do usuário e do perfil.
 */
doormanRoutes.patch(
  "/:id",
  administrativeRoles,
  validateDoormanId,
  validateUpdateDoorman,
  (req, res, next) =>
    DoormanController.update(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/doormen/:id/shift
 *
 * Altera o turno do porteiro.
 */
doormanRoutes.patch(
  "/:id/shift",
  administrativeRoles,
  validateDoormanId,
  validateChangeDoormanShift,
  (req, res, next) =>
    DoormanController.changeShift(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/doormen/:id/duty
 *
 * Registra o último plantão ou atuação.
 */
doormanRoutes.patch(
  "/:id/duty",
  administrativeRoles,
  validateDoormanId,
  validateRegisterDoormanDuty,
  (req, res, next) =>
    DoormanController.registerDuty(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/doormen/:id/reset-password
 *
 * Redefine administrativamente a senha.
 */
doormanRoutes.patch(
  "/:id/reset-password",
  administrativeRoles,
  validateDoormanId,
  validateResetDoormanPassword,
  (req, res, next) =>
    DoormanController.resetPassword(
      req,
      res,
      next
    )
);

/**
 * DELETE /api/v1/doormen/:id
 *
 * Executa exclusão lógica e desativa o usuário.
 */
doormanRoutes.delete(
  "/:id",
  administrativeRoles,
  validateDoormanId,
  (req, res, next) =>
    DoormanController.remove(
      req,
      res,
      next
    )
);

export default doormanRoutes;
