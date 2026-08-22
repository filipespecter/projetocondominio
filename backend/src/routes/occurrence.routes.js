import { Router } from "express";

import OccurrenceController from "../controllers/OccurrenceController.js";

import {
  authMiddleware,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

import {
  validateOccurrenceId,
  validateOccurrenceListQuery,
  validateCreateOccurrence,
  validateUpdateOccurrence,
  validateAssignOccurrence,
  validateResolveOccurrence,
} from "../validators/occurrenceValidator.js";

const occurrenceRoutes = Router();

/**
 * Todas as rotas de ocorrências exigem autenticação.
 */
occurrenceRoutes.use(
  authMiddleware
);

/**
 * Perfis que podem abrir e acompanhar ocorrências.
 */
const occurrenceUsers =
  authorizeRoles(
    "CONDOMINIUM_ADMIN",
    "MANAGER",
    "DOORMAN",
    "RESIDENT"
  );

/**
 * Administração e portaria.
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
 * GET /api/v1/occurrences/statistics
 *
 * Estatísticas para Dashboard e BI.
 *
 * Deve ficar antes de "/:id".
 */
occurrenceRoutes.get(
  "/statistics",
  administrativeRoles,
  (req, res, next) =>
    OccurrenceController.statistics(
      req,
      res,
      next
    )
);

/**
 * GET /api/v1/occurrences/my
 *
 * Lista somente as ocorrências criadas
 * pelo usuário autenticado.
 */
occurrenceRoutes.get(
  "/my",
  occurrenceUsers,
  (req, res, next) =>
    OccurrenceController.myOccurrences(
      req,
      res,
      next
    )
);

/**
 * GET /api/v1/occurrences
 *
 * Lista ocorrências.
 *
 * Filtros:
 * ?status=NEW
 * ?type=COMPLAINT
 * ?priority=URGENT
 * ?apartmentId=UUID
 * ?createdByUserId=UUID
 * ?activeOnly=true
 */
occurrenceRoutes.get(
  "/",
  operationalRoles,
  validateOccurrenceListQuery,
  (req, res, next) =>
    OccurrenceController.index(
      req,
      res,
      next
    )
);

/**
 * POST /api/v1/occurrences
 *
 * Cria uma ocorrência, reclamação,
 * sugestão ou solicitação.
 */
occurrenceRoutes.post(
  "/",
  occurrenceUsers,
  validateCreateOccurrence,
  (req, res, next) =>
    OccurrenceController.create(
      req,
      res,
      next
    )
);

/**
 * GET /api/v1/occurrences/:id
 *
 * Busca uma ocorrência específica.
 */
occurrenceRoutes.get(
  "/:id",
  operationalRoles,
  validateOccurrenceId,
  (req, res, next) =>
    OccurrenceController.show(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/occurrences/:id
 *
 * Atualiza dados editáveis.
 *
 * O Service impede o morador de alterar
 * ocorrências de outros usuários.
 */
occurrenceRoutes.patch(
  "/:id",
  occurrenceUsers,
  validateOccurrenceId,
  validateUpdateOccurrence,
  (req, res, next) =>
    OccurrenceController.update(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/occurrences/:id/assign
 *
 * Atribui um responsável.
 */
occurrenceRoutes.patch(
  "/:id/assign",
  administrativeRoles,
  validateOccurrenceId,
  validateAssignOccurrence,
  (req, res, next) =>
    OccurrenceController.assign(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/occurrences/:id/in-review
 *
 * Coloca a ocorrência em análise.
 */
occurrenceRoutes.patch(
  "/:id/in-review",
  operationalRoles,
  validateOccurrenceId,
  (req, res, next) =>
    OccurrenceController.markAsInReview(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/occurrences/:id/start
 *
 * Inicia o atendimento.
 */
occurrenceRoutes.patch(
  "/:id/start",
  operationalRoles,
  validateOccurrenceId,
  (req, res, next) =>
    OccurrenceController.startProgress(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/occurrences/:id/resolve
 *
 * Resolve a ocorrência.
 */
occurrenceRoutes.patch(
  "/:id/resolve",
  operationalRoles,
  validateOccurrenceId,
  validateResolveOccurrence,
  (req, res, next) =>
    OccurrenceController.resolve(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/occurrences/:id/close
 *
 * Fecha uma ocorrência resolvida.
 */
occurrenceRoutes.patch(
  "/:id/close",
  administrativeRoles,
  validateOccurrenceId,
  (req, res, next) =>
    OccurrenceController.close(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/occurrences/:id/cancel
 *
 * Cancela uma ocorrência.
 *
 * O Service valida a propriedade quando
 * a ação é realizada por morador.
 */
occurrenceRoutes.patch(
  "/:id/cancel",
  occurrenceUsers,
  validateOccurrenceId,
  (req, res, next) =>
    OccurrenceController.cancel(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/occurrences/:id/read-manager
 *
 * Marca como lida pela administração.
 */
occurrenceRoutes.patch(
  "/:id/read-manager",
  administrativeRoles,
  validateOccurrenceId,
  (req, res, next) =>
    OccurrenceController.markAsReadByManager(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/occurrences/:id/read-doorman
 *
 * Marca como lida pela portaria.
 */
occurrenceRoutes.patch(
  "/:id/read-doorman",
  authorizeRoles(
    "CONDOMINIUM_ADMIN",
    "MANAGER",
    "DOORMAN"
  ),
  validateOccurrenceId,
  (req, res, next) =>
    OccurrenceController.markAsReadByDoorman(
      req,
      res,
      next
    )
);

/**
 * DELETE /api/v1/occurrences/:id
 *
 * Exclusão lógica administrativa.
 *
 * O Service permite remover somente
 * ocorrências canceladas ou fechadas.
 */
occurrenceRoutes.delete(
  "/:id",
  administrativeRoles,
  validateOccurrenceId,
  (req, res, next) =>
    OccurrenceController.remove(
      req,
      res,
      next
    )
);

export default occurrenceRoutes;
