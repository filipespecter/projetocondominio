import { Router } from "express";

import ServiceProviderController from "../controllers/ServiceProviderController.js";

import {
  authMiddleware,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

import {
  validateServiceProviderId,
  validateServiceProviderListQuery,
  validateCreateServiceProvider,
  validateUpdateServiceProvider,
  validateChangeServiceProviderStatus,
} from "../validators/serviceProviderValidator.js";

const serviceProviderRoutes = Router();

/**
 * Todas as rotas de prestadores exigem autenticação.
 */
serviceProviderRoutes.use(
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
 * Perfis que podem consultar prestadores ativos.
 */
const viewingRoles =
  authorizeRoles(
    "CONDOMINIUM_ADMIN",
    "MANAGER",
    "DOORMAN"
  );

/**
 * GET /api/v1/service-providers/statistics
 *
 * Estatísticas para Dashboard e BI.
 *
 * Deve ficar antes de "/:id".
 */
serviceProviderRoutes.get(
  "/statistics",
  administrativeRoles,
  (req, res, next) =>
    ServiceProviderController.statistics(
      req,
      res,
      next
    )
);

/**
 * GET /api/v1/service-providers
 *
 * Lista prestadores.
 *
 * Filtros:
 * ?status=ACTIVE
 * ?activeOnly=true
 */
serviceProviderRoutes.get(
  "/",
  viewingRoles,
  validateServiceProviderListQuery,
  (req, res, next) =>
    ServiceProviderController.index(
      req,
      res,
      next
    )
);

/**
 * POST /api/v1/service-providers
 *
 * Cadastra um prestador.
 */
serviceProviderRoutes.post(
  "/",
  administrativeRoles,
  validateCreateServiceProvider,
  (req, res, next) =>
    ServiceProviderController.create(
      req,
      res,
      next
    )
);

/**
 * GET /api/v1/service-providers/:id
 *
 * Busca um prestador específico.
 */
serviceProviderRoutes.get(
  "/:id",
  viewingRoles,
  validateServiceProviderId,
  (req, res, next) =>
    ServiceProviderController.show(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/service-providers/:id
 *
 * Atualiza os dados do prestador.
 */
serviceProviderRoutes.patch(
  "/:id",
  administrativeRoles,
  validateServiceProviderId,
  validateUpdateServiceProvider,
  (req, res, next) =>
    ServiceProviderController.update(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/service-providers/:id/status
 *
 * Altera o status de forma genérica.
 */
serviceProviderRoutes.patch(
  "/:id/status",
  administrativeRoles,
  validateServiceProviderId,
  validateChangeServiceProviderStatus,
  (req, res, next) =>
    ServiceProviderController.changeStatus(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/service-providers/:id/activate
 *
 * Ativa o prestador.
 */
serviceProviderRoutes.patch(
  "/:id/activate",
  administrativeRoles,
  validateServiceProviderId,
  (req, res, next) =>
    ServiceProviderController.activate(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/service-providers/:id/deactivate
 *
 * Desativa o prestador.
 */
serviceProviderRoutes.patch(
  "/:id/deactivate",
  administrativeRoles,
  validateServiceProviderId,
  (req, res, next) =>
    ServiceProviderController.deactivate(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/service-providers/:id/block
 *
 * Bloqueia o prestador.
 */
serviceProviderRoutes.patch(
  "/:id/block",
  administrativeRoles,
  validateServiceProviderId,
  (req, res, next) =>
    ServiceProviderController.block(
      req,
      res,
      next
    )
);

/**
 * DELETE /api/v1/service-providers/:id
 *
 * Executa exclusão lógica.
 *
 * O Service impede exclusão quando existem
 * acessos agendados ou em andamento.
 */
serviceProviderRoutes.delete(
  "/:id",
  administrativeRoles,
  validateServiceProviderId,
  (req, res, next) =>
    ServiceProviderController.remove(
      req,
      res,
      next
    )
);

export default serviceProviderRoutes;
