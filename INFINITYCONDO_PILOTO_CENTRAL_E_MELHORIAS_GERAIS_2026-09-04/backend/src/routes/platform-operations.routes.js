import { Router } from "express";

import PlatformOperationsController from "../controllers/PlatformOperationsController.js";

import {
  authMiddleware,
} from "../middlewares/authMiddleware.js";

import platformAdminMiddleware from "../middlewares/platformAdminMiddleware.js";

import {
  platformManagementMiddleware,
} from "../middlewares/platformAccessMiddleware.js";

const platformOperationsRoutes =
  Router();

/**
 * Todas as rotas abaixo são exclusivas
 * da Central Star Infinity Code.
 */
platformOperationsRoutes.use(
  authMiddleware,
  platformAdminMiddleware
);

/**
 * GET /api/v1/platform/operations/jobs
 *
 * Lista scheduler + jobs registrados.
 */
platformOperationsRoutes.get(
  "/jobs",
  (req, res, next) =>
    PlatformOperationsController
      .jobs(
        req,
        res,
        next
      )
);

/**
 * POST /api/v1/platform/operations/jobs/:name/run
 *
 * Executa um job manualmente.
 */
platformOperationsRoutes.post(
  "/jobs/:name/run",
  platformManagementMiddleware,
  (req, res, next) =>
    PlatformOperationsController
      .executeJob(
        req,
        res,
        next
      )
);

/**
 * PATCH /api/v1/platform/operations/jobs/:name/enable
 */
platformOperationsRoutes.patch(
  "/jobs/:name/enable",
  platformManagementMiddleware,
  (req, res, next) =>
    PlatformOperationsController
      .enableJob(
        req,
        res,
        next
      )
);

/**
 * PATCH /api/v1/platform/operations/jobs/:name/disable
 */
platformOperationsRoutes.patch(
  "/jobs/:name/disable",
  platformManagementMiddleware,
  (req, res, next) =>
    PlatformOperationsController
      .disableJob(
        req,
        res,
        next
      )
);

/**
 * GET /api/v1/platform/operations/backups
 *
 * Lista histórico e estatísticas.
 */
platformOperationsRoutes.get(
  "/backups",
  (req, res, next) =>
    PlatformOperationsController
      .backups(
        req,
        res,
        next
      )
);

/**
 * POST /api/v1/platform/operations/backups
 *
 * Executa backup manual.
 */
platformOperationsRoutes.post(
  "/backups",
  platformManagementMiddleware,
  (req, res, next) =>
    PlatformOperationsController
      .createBackup(
        req,
        res,
        next
      )
);

/**
 * POST /api/v1/platform/operations/backups/cleanup
 *
 * Remove backups vencidos pela política
 * de retenção.
 */
platformOperationsRoutes.post(
  "/backups/cleanup",
  platformManagementMiddleware,
  (req, res, next) =>
    PlatformOperationsController
      .cleanupBackups(
        req,
        res,
        next
      )
);

platformOperationsRoutes.get(
  "/database/overview",
  platformManagementMiddleware,
  (req, res, next) => PlatformOperationsController.databaseOverview(req, res, next)
);

platformOperationsRoutes.post(
  "/database/reset-homologation",
  platformManagementMiddleware,
  (req, res, next) => PlatformOperationsController.resetHomologation(req, res, next)
);

export default platformOperationsRoutes;
