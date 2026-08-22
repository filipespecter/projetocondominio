import { Router } from "express";

import NotificationController from "../controllers/NotificationController.js";

import {
  authMiddleware,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

import {
  validateNotificationId,
  validateNotificationListQuery,
  validateCreateNotification,
} from "../validators/notificationValidator.js";

const notificationRoutes = Router();

/**
 * =====================================================
 * TODAS AS ROTAS DE NOTIFICAÇÕES EXIGEM AUTENTICAÇÃO
 * =====================================================
 */
notificationRoutes.use(
  authMiddleware
);

/**
 * =====================================================
 * PERFIS ADMINISTRATIVOS
 * =====================================================
 *
 * Podem consultar notificações de todo o condomínio
 * e criar notificações manuais.
 */
const administrativeRoles =
  authorizeRoles(
    "CONDOMINIUM_ADMIN",
    "MANAGER"
  );

/**
 * =====================================================
 * TODOS OS PERFIS OPERACIONAIS
 * =====================================================
 *
 * Podem consultar e gerenciar apenas as próprias
 * notificações.
 */
const notificationUsers =
  authorizeRoles(
    "CONDOMINIUM_ADMIN",
    "MANAGER",
    "DOORMAN",
    "RESIDENT"
  );

/**
 * =====================================================
 * CONTADOR DE NÃO LIDAS
 * =====================================================
 *
 * GET /api/v1/notifications/unread-count
 *
 * Retorna a quantidade de notificações não lidas
 * do usuário autenticado.
 *
 * Essa rota alimentará o ícone de sino do frontend.
 *
 * Deve ficar antes da rota "/:id".
 */
notificationRoutes.get(
  "/unread-count",
  notificationUsers,
  (req, res, next) =>
    NotificationController.unreadCount(
      req,
      res,
      next
    )
);

/**
 * =====================================================
 * MINHAS NOTIFICAÇÕES NÃO LIDAS
 * =====================================================
 *
 * GET /api/v1/notifications/my/unread
 */
notificationRoutes.get(
  "/my/unread",
  notificationUsers,
  (req, res, next) =>
    NotificationController.myUnread(
      req,
      res,
      next
    )
);

/**
 * =====================================================
 * MINHAS NOTIFICAÇÕES
 * =====================================================
 *
 * GET /api/v1/notifications/my
 *
 * Retorna somente as notificações destinadas
 * ao usuário autenticado.
 */
notificationRoutes.get(
  "/my",
  notificationUsers,
  (req, res, next) =>
    NotificationController.myNotifications(
      req,
      res,
      next
    )
);

/**
 * =====================================================
 * MARCAR TODAS COMO LIDAS
 * =====================================================
 *
 * PATCH /api/v1/notifications/read-all
 *
 * Afeta somente as notificações do usuário autenticado.
 */
notificationRoutes.patch(
  "/read-all",
  notificationUsers,
  (req, res, next) =>
    NotificationController.markAllAsRead(
      req,
      res,
      next
    )
);

/**
 * =====================================================
 * LIMPAR NOTIFICAÇÕES JÁ LIDAS
 * =====================================================
 *
 * DELETE /api/v1/notifications/read
 *
 * Executa exclusão lógica em todas as notificações
 * lidas do usuário autenticado.
 */
notificationRoutes.delete(
  "/read",
  notificationUsers,
  (req, res, next) =>
    NotificationController.removeRead(
      req,
      res,
      next
    )
);

/**
 * =====================================================
 * LISTAGEM ADMINISTRATIVA
 * =====================================================
 *
 * GET /api/v1/notifications
 *
 * Filtros disponíveis:
 *
 * ?recipientUserId=UUID
 * ?targetRole=RESIDENT
 * ?type=PACKAGE_RECEIVED
 * ?module=PACKAGE
 * ?unreadOnly=true&recipientUserId=UUID
 */
notificationRoutes.get(
  "/",
  administrativeRoles,
  validateNotificationListQuery,
  (req, res, next) =>
    NotificationController.index(
      req,
      res,
      next
    )
);

/**
 * =====================================================
 * CRIAÇÃO MANUAL
 * =====================================================
 *
 * POST /api/v1/notifications
 *
 * Permite criar:
 *
 * 1. Notificação individual
 *    recipientUserId
 *
 * ou
 *
 * 2. Notificação direcionada a um perfil
 *    targetRole
 *
 * Não é permitido enviar os dois simultaneamente.
 */
notificationRoutes.post(
  "/",
  administrativeRoles,
  validateCreateNotification,
  (req, res, next) =>
    NotificationController.create(
      req,
      res,
      next
    )
);

/**
 * =====================================================
 * BUSCA ADMINISTRATIVA POR ID
 * =====================================================
 *
 * GET /api/v1/notifications/:id
 *
 * Uso administrativo.
 */
notificationRoutes.get(
  "/:id",
  administrativeRoles,
  validateNotificationId,
  (req, res, next) =>
    NotificationController.show(
      req,
      res,
      next
    )
);

/**
 * =====================================================
 * MARCAR UMA NOTIFICAÇÃO COMO LIDA
 * =====================================================
 *
 * PATCH /api/v1/notifications/:id/read
 *
 * O Controller utiliza o ID do usuário autenticado,
 * portanto um usuário não consegue marcar como lida
 * a notificação de outro usuário.
 */
notificationRoutes.patch(
  "/:id/read",
  notificationUsers,
  validateNotificationId,
  (req, res, next) =>
    NotificationController.markAsRead(
      req,
      res,
      next
    )
);

/**
 * =====================================================
 * EXCLUSÃO LÓGICA
 * =====================================================
 *
 * DELETE /api/v1/notifications/:id
 *
 * Somente a própria notificação do usuário autenticado
 * poderá ser removida.
 */
notificationRoutes.delete(
  "/:id",
  notificationUsers,
  validateNotificationId,
  (req, res, next) =>
    NotificationController.remove(
      req,
      res,
      next
    )
);

export default notificationRoutes;
