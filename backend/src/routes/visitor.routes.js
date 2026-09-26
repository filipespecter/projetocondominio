import { Router } from "express";

import VisitorController from "../controllers/VisitorController.js";

import {
  authMiddleware,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

import {
  validateVisitorId,
  validateVisitorListQuery,
  validateCreateVisitor,
  validateUpdateVisitor,
} from "../validators/visitorValidator.js";

const visitorRoutes = Router();

/**
 * Todas as rotas de visitantes exigem autenticação.
 */
visitorRoutes.use(
  authMiddleware
);

/**
 * Perfis que podem acompanhar e operar
 * o fluxo de visitantes.
 */
const operationalRoles =
  authorizeRoles(
    "CONDOMINIUM_ADMIN",
    "MANAGER",
    "DOORMAN"
  );

/**
 * Somente a administração pode editar
 * ou remover registros cadastrais.
 */
const administrativeRoles =
  authorizeRoles(
    "CONDOMINIUM_ADMIN",
    "MANAGER"
  );

/**
 * GET /api/v1/visitors/statistics
 *
 * Estatísticas para dashboard e BI.
 *
 * Deve ficar antes de "/:id".
 */
visitorRoutes.get(
  "/statistics",
  operationalRoles,
  (req, res, next) =>
    VisitorController.statistics(
      req,
      res,
      next
    )
);

/**
 * GET /api/v1/visitors
 *
 * Lista visitantes.
 *
 * Filtros opcionais:
 * ?status=WAITING
 * ?apartmentId=UUID
 */
visitorRoutes.get(
  "/",
  operationalRoles,
  validateVisitorListQuery,
  (req, res, next) =>
    VisitorController.index(
      req,
      res,
      next
    )
);

/**
 * POST /api/v1/visitors
 *
 * Cadastra um visitante.
 */
visitorRoutes.post(
  "/",
  operationalRoles,
  validateCreateVisitor,
  (req, res, next) =>
    VisitorController.create(
      req,
      res,
      next
    )
);

/**
 * GET /api/v1/visitors/:id
 *
 * Busca um visitante específico.
 */
visitorRoutes.get(
  "/:id",
  operationalRoles,
  validateVisitorId,
  (req, res, next) =>
    VisitorController.show(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/visitors/:id
 *
 * Atualiza os dados cadastrais.
 */
visitorRoutes.patch(
  "/:id",
  administrativeRoles,
  validateVisitorId,
  validateUpdateVisitor,
  (req, res, next) =>
    VisitorController.update(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/visitors/:id/authorize
 *
 * Autoriza a entrada.
 */
visitorRoutes.patch(
  "/:id/authorize",
  operationalRoles,
  validateVisitorId,
  (req, res, next) =>
    VisitorController.authorize(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/visitors/:id/deny
 *
 * Nega a entrada.
 */
visitorRoutes.patch(
  "/:id/deny",
  operationalRoles,
  validateVisitorId,
  (req, res, next) =>
    VisitorController.deny(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/visitors/:id/entry
 *
 * Registra a entrada no condomínio.
 */
visitorRoutes.patch(
  "/:id/entry",
  operationalRoles,
  validateVisitorId,
  (req, res, next) =>
    VisitorController.registerEntry(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/visitors/:id/exit
 *
 * Registra a saída do condomínio.
 */
visitorRoutes.patch(
  "/:id/exit",
  operationalRoles,
  validateVisitorId,
  (req, res, next) =>
    VisitorController.registerExit(
      req,
      res,
      next
    )
);

/**
 * DELETE /api/v1/visitors/:id
 *
 * Executa exclusão lógica.
 *
 * O Service impede a remoção de visitante
 * que ainda esteja dentro do condomínio.
 */
visitorRoutes.delete(
  "/:id",
  administrativeRoles,
  validateVisitorId,
  (req, res, next) =>
    VisitorController.remove(
      req,
      res,
      next
    )
);

export default visitorRoutes;
