import { Router } from "express";

import ProviderAccessController from "../controllers/ProviderAccessController.js";

import {
  authMiddleware,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

import {
  validateProviderAccessId,
  validateProviderAccessListQuery,
  validateCreateProviderAccess,
  validateUpdateProviderAccess,
} from "../validators/providerAccessValidator.js";

const providerAccessRoutes = Router();

/**
 * Todas as rotas de acessos de prestadores exigem autenticação.
 */
providerAccessRoutes.use(
  authMiddleware
);

/**
 * Perfis operacionais.
 */
const operationalRoles =
  authorizeRoles(
    "CONDOMINIUM_ADMIN",
    "MANAGER",
    "DOORMAN"
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
 * GET /api/v1/provider-accesses/statistics
 *
 * Estatísticas para Dashboard e BI.
 *
 * Deve ficar antes de "/:id".
 */
providerAccessRoutes.get(
  "/statistics",
  administrativeRoles,
  (req, res, next) =>
    ProviderAccessController.statistics(
      req,
      res,
      next
    )
);

/**
 * GET /api/v1/provider-accesses
 *
 * Lista acessos de prestadores.
 *
 * Filtros:
 * ?status=SCHEDULED
 * ?serviceProviderId=UUID
 * ?apartmentId=UUID
 * ?scheduledDate=YYYY-MM-DD
 */
providerAccessRoutes.get(
  "/",
  operationalRoles,
  validateProviderAccessListQuery,
  (req, res, next) =>
    ProviderAccessController.index(
      req,
      res,
      next
    )
);

/**
 * POST /api/v1/provider-accesses
 *
 * Agenda um acesso de prestador.
 */
providerAccessRoutes.post(
  "/",
  operationalRoles,
  validateCreateProviderAccess,
  (req, res, next) =>
    ProviderAccessController.create(
      req,
      res,
      next
    )
);

/**
 * GET /api/v1/provider-accesses/:id
 *
 * Busca um acesso específico.
 */
providerAccessRoutes.get(
  "/:id",
  operationalRoles,
  validateProviderAccessId,
  (req, res, next) =>
    ProviderAccessController.show(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/provider-accesses/:id
 *
 * Atualiza um acesso ainda agendado.
 */
providerAccessRoutes.patch(
  "/:id",
  operationalRoles,
  validateProviderAccessId,
  validateUpdateProviderAccess,
  (req, res, next) =>
    ProviderAccessController.update(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/provider-accesses/:id/entry
 *
 * Registra a entrada do prestador.
 */
providerAccessRoutes.patch(
  "/:id/entry",
  operationalRoles,
  validateProviderAccessId,
  (req, res, next) =>
    ProviderAccessController.registerEntry(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/provider-accesses/:id/exit
 *
 * Registra a saída do prestador.
 */
providerAccessRoutes.patch(
  "/:id/exit",
  operationalRoles,
  validateProviderAccessId,
  (req, res, next) =>
    ProviderAccessController.registerExit(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/provider-accesses/:id/cancel
 *
 * Cancela um acesso ainda agendado.
 */
providerAccessRoutes.patch(
  "/:id/cancel",
  operationalRoles,
  validateProviderAccessId,
  (req, res, next) =>
    ProviderAccessController.cancel(
      req,
      res,
      next
    )
);

/**
 * DELETE /api/v1/provider-accesses/:id
 *
 * Exclusão lógica administrativa.
 *
 * O Service permite remover somente acessos
 * finalizados ou cancelados.
 */
providerAccessRoutes.delete(
  "/:id",
  administrativeRoles,
  validateProviderAccessId,
  (req, res, next) =>
    ProviderAccessController.remove(
      req,
      res,
      next
    )
);

export default providerAccessRoutes;
