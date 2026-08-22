import { Router } from "express";

import PlatformAuditController from "../controllers/PlatformAuditController.js";

import {
  authMiddleware,
} from "../middlewares/authMiddleware.js";

import platformAdminMiddleware from "../middlewares/platformAdminMiddleware.js";

const platformAuditRoutes =
  Router();

/**
 * =====================================================
 * CENTRAL STAR - AUDITORIA GLOBAL
 * =====================================================
 *
 * Todas as rotas são exclusivas do PLATFORM_ADMIN.
 */
platformAuditRoutes.use(
  authMiddleware,
  platformAdminMiddleware
);

/**
 * Indicadores gerais.
 *
 * Precisa permanecer antes de "/:id".
 */
platformAuditRoutes.get(
  "/statistics",
  (req, res, next) =>
    PlatformAuditController
      .statistics(
        req,
        res,
        next
      )
);

/**
 * Timeline por condomínio.
 */
platformAuditRoutes.get(
  "/condominiums/:condominiumId",
  (req, res, next) =>
    PlatformAuditController
      .condominiumTimeline(
        req,
        res,
        next
      )
);

/**
 * Timeline por usuário.
 */
platformAuditRoutes.get(
  "/users/:userId",
  (req, res, next) =>
    PlatformAuditController
      .userTimeline(
        req,
        res,
        next
      )
);

/**
 * Timeline por sessão de suporte.
 */
platformAuditRoutes.get(
  "/support-sessions/:supportSessionId",
  (req, res, next) =>
    PlatformAuditController
      .supportTimeline(
        req,
        res,
        next
      )
);

/**
 * Correlação por requestId.
 */
platformAuditRoutes.get(
  "/requests/:requestId",
  (req, res, next) =>
    PlatformAuditController
      .requestTimeline(
        req,
        res,
        next
      )
);

/**
 * Listagem global com filtros e paginação.
 *
 * Exemplos:
 * ?condominiumId=UUID
 * ?userId=UUID
 * ?userRole=CONDOMINIUM_ADMIN
 * ?module=AUTH
 * ?action=LOGIN
 * ?requestId=UUID
 * ?supportSessionId=UUID
 * ?startDate=2026-08-01
 * ?endDate=2026-08-31
 * ?search=texto
 * ?page=1
 * ?limit=20
 */
platformAuditRoutes.get(
  "/",
  (req, res, next) =>
    PlatformAuditController
      .index(
        req,
        res,
        next
      )
);

/**
 * Ficha de um log.
 *
 * Deve permanecer por último para não capturar
 * os caminhos administrativos acima.
 */
platformAuditRoutes.get(
  "/:id",
  (req, res, next) =>
    PlatformAuditController
      .show(
        req,
        res,
        next
      )
);

export default platformAuditRoutes;
