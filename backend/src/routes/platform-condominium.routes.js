import { Router } from "express";
import resetClientPassword from "../services/ClientPasswordResetService.js";
import { resetLimiter, requireTrustedOrigin } from "../middlewares/securityMiddleware.js";

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
 * Clientes ativos/contratados da plataforma.
 * Mantida antes de /:id.
 */
platformCondominiumRoutes.get(
  "/clients",
  (req, res, next) =>
    PlatformCondominiumController.clients(req, res, next)
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
 * Upgrade/downgrade de cliente já aprovado.
 */
platformCondominiumRoutes.patch(
  "/:id/plan",
  platformManagementMiddleware,
  (req, res, next) =>
    PlatformCondominiumController.changePlan(req, res, next)
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

platformCondominiumRoutes.post(
  "/:id/users/:userId/temporary-password",
  platformManagementMiddleware,
  requireTrustedOrigin,
  resetLimiter,
  async (req, res, next) => {
    res.set("Cache-Control", "no-store");
    try {
      const data = await resetClientPassword({ actor: req.user, condominiumId: req.params.id, userId: req.params.userId, data: req.body, context: { ipAddress: req.ip, userAgent: req.get("user-agent") } });
      res.json({ success: true, message: "Senha temporária definida. Oriente o cliente a alterá-la no próximo acesso.", data });
    } catch (error) { next(error); }
  }
);

export default platformCondominiumRoutes;
