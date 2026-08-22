import { Router } from "express";

import PlatformDashboardController from "../controllers/PlatformDashboardController.js";

import {
  authMiddleware,
} from "../middlewares/authMiddleware.js";

import platformAdminMiddleware from "../middlewares/platformAdminMiddleware.js";

const platformDashboardRoutes =
  Router();

/**
 * =====================================================
 * PLATFORM DASHBOARD
 * =====================================================
 *
 * Central privada da Star Infinity Code.
 *
 * Segurança:
 *
 * 1. JWT válido;
 * 2. role PLATFORM_ADMIN;
 * 3. condominiumId = null.
 */
platformDashboardRoutes.use(
  authMiddleware,
  platformAdminMiddleware
);

/**
 * GET /api/v1/platform/dashboard
 *
 * Retorna os indicadores globais:
 *
 * - condomínios;
 * - usuários;
 * - assinaturas;
 * - planos;
 * - operação;
 * - cobranças;
 * - comunicações;
 * - jobs;
 * - backups;
 * - eventos do sistema;
 * - atividade recente.
 */
platformDashboardRoutes.get(
  "/",
  (req, res, next) =>
    PlatformDashboardController.index(
      req,
      res,
      next
    )
);

export default platformDashboardRoutes;
