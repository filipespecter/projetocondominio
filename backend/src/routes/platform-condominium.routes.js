import { Router } from "express";

import PlatformCondominiumController from "../controllers/PlatformCondominiumController.js";

import {
  authMiddleware,
} from "../middlewares/authMiddleware.js";

import platformAdminMiddleware from "../middlewares/platformAdminMiddleware.js";

import {
  platformManagementMiddleware,
} from "../middlewares/platformAccessMiddleware.js";

import {
  validatePlatformApproval,
  validatePlatformRejection,
} from "../validators/platformCondominiumApprovalValidator.js";

const platformCondominiumRoutes =
  Router();

/**
 * =====================================================
 * CENTRAL STAR - CONDOMÍNIOS
 * =====================================================
 *
 * TODAS as rotas abaixo são exclusivas do
 * PLATFORM_ADMIN.
 *
 * Ordem de segurança:
 *
 * JWT válido
 *      ↓
 * PLATFORM_ADMIN
 *      ↓
 * operação administrativa
 */

platformCondominiumRoutes.use(
  authMiddleware,
  platformAdminMiddleware
);

/**
 * Lista geral.
 *
 * Exemplos:
 *
 * ?status=PENDING
 * ?search=residencial
 * ?state=PE
 * ?city=Recife
 * ?page=1
 * ?limit=20
 */
platformCondominiumRoutes.get(
  "/",
  (req, res, next) =>
    PlatformCondominiumController.index(
      req,
      res,
      next
    )
);

/**
 * Solicitações aguardando aprovação.
 *
 * IMPORTANTE:
 * precisa ficar antes de /:id.
 */
platformCondominiumRoutes.get(
  "/pending",
  (req, res, next) =>
    PlatformCondominiumController.pending(
      req,
      res,
      next
    )
);

/**
 * Estatísticas.
 *
 * Também precisa ficar antes de /:id.
 */
platformCondominiumRoutes.get(
  "/statistics",
  (req, res, next) =>
    PlatformCondominiumController.statistics(
      req,
      res,
      next
    )
);

/**
 * Aprovação comercial.
 *
 * Somente PLATFORM_ADMIN autenticado.
 */
platformCondominiumRoutes.post(
  "/:id/approve",
  platformManagementMiddleware,
  validatePlatformApproval,
  (req, res, next) =>
    PlatformCondominiumController.approve(
      req,
      res,
      next
    )
);

/**
 * Rejeição da solicitação.
 *
 * Somente PLATFORM_ADMIN autenticado.
 */
platformCondominiumRoutes.post(
  "/:id/reject",
  platformManagementMiddleware,
  validatePlatformRejection,
  (req, res, next) =>
    PlatformCondominiumController.reject(
      req,
      res,
      next
    )
);

/**
 * Ficha completa.
 *
 * Mantida por último para evitar que rotas
 * específicas sejam interpretadas como :id.
 */
platformCondominiumRoutes.get(
  "/:id",
  (req, res, next) =>
    PlatformCondominiumController.show(
      req,
      res,
      next
    )
);

export default platformCondominiumRoutes;
