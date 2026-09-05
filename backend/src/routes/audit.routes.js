import { Router } from "express";

import AuditLogController from "../controllers/AuditLogController.js";

import {
  authMiddleware,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

import {
  validateAuditLogId,
  validateAuditLogListQuery,
} from "../validators/auditLogValidator.js";

const auditRoutes = Router();

/**
 * =====================================================
 * TODAS AS ROTAS DE AUDITORIA EXIGEM AUTENTICAÇÃO
 * =====================================================
 */
auditRoutes.use(
  authMiddleware
);

/**
 * =====================================================
 * PERFIS ADMINISTRATIVOS DO CONDOMÍNIO
 * =====================================================
 *
 * Apenas síndicos/administradores e gestores
 * podem consultar a auditoria do condomínio.
 */
const administrativeRoles =
  authorizeRoles(
    "CONDOMINIUM_ADMIN",
    "MANAGER"
  );

/**
 * =====================================================
 * ADMINISTRADOR GLOBAL DA PLATAFORMA
 * =====================================================
 *
 * Utilizado apenas para consultar logs
 * que não pertencem a um condomínio específico.
 */
const platformAdminOnly =
  authorizeRoles(
    "PLATFORM_ADMIN"
  );

/**
 * =====================================================
 * LOGS GLOBAIS DA PLATAFORMA
 * =====================================================
 *
 * GET /api/v1/audit/platform
 *
 * Retorna ações realizadas no nível global,
 * ou seja, registros sem condominiumId.
 *
 * IMPORTANTE:
 * deve ficar antes da rota "/:id".
 */
auditRoutes.get(
  "/platform",
  platformAdminOnly,
  (req, res, next) =>
    AuditLogController.platformLogs(
      req,
      res,
      next
    )
);

/**
 * =====================================================
 * ESTATÍSTICAS DE AUDITORIA
 * =====================================================
 *
 * GET /api/v1/audit/statistics
 *
 * Retorna contadores básicos:
 *
 * - total;
 * - CREATE;
 * - UPDATE;
 * - DELETE;
 * - LOGIN;
 * - LOGOUT;
 * - STATUS_CHANGE.
 *
 * Deve ficar antes da rota "/:id".
 */
auditRoutes.get(
  "/statistics",
  administrativeRoles,
  (req, res, next) =>
    AuditLogController.statistics(
      req,
      res,
      next
    )
);

/**
 * =====================================================
 * LISTAGEM DE AUDITORIA DO CONDOMÍNIO
 * =====================================================
 *
 * GET /api/v1/audit
 *
 * Filtros disponíveis:
 *
 * ?userId=UUID
 * ?module=PACKAGE
 * ?action=CREATE
 * ?referenceId=UUID-ou-referencia
 * ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * ?userId=UUID&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 *
 * Sem filtros, retorna todo o histórico
 * pertencente ao condomínio autenticado.
 */

auditRoutes.post(
  "/report-export",
  administrativeRoles,
  (req, res, next) => AuditLogController.reportExport(req, res, next)
);

auditRoutes.get(
  "/",
  administrativeRoles,
  validateAuditLogListQuery,
  (req, res, next) =>
    AuditLogController.index(
      req,
      res,
      next
    )
);

/**
 * =====================================================
 * BUSCA DE LOG POR ID
 * =====================================================
 *
 * GET /api/v1/audit/:id
 *
 * O Controller sempre utiliza o condominiumId
 * do usuário autenticado, impedindo que um gestor
 * consulte logs pertencentes a outro condomínio.
 */
auditRoutes.get(
  "/:id",
  administrativeRoles,
  validateAuditLogId,
  (req, res, next) =>
    AuditLogController.show(
      req,
      res,
      next
    )
);

/**
 * =====================================================
 * OBSERVAÇÃO DE SEGURANÇA
 * =====================================================
 *
 * Não existem rotas públicas de:
 *
 * POST
 * PATCH
 * DELETE
 *
 * para registros de auditoria.
 *
 * Os logs são criados automaticamente pelos Services
 * do InfinityCondo e não devem ser alterados ou
 * excluídos manualmente pela interface administrativa.
 *
 * Isso preserva a integridade da trilha de auditoria.
 */

export default auditRoutes;
