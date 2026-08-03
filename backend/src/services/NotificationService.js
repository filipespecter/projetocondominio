import BaseService from "./BaseService.js";
import notificationRepository from "../repositories/NotificationRepository.js";
import userRepository from "../repositories/UserRepository.js";
import { ApiError } from "../utils/ApiError.js";

class NotificationService extends BaseService {
  constructor() {
    super(notificationRepository);
  }

  /**
   * Prioridades permitidas pelo schema.
   */
  validatePriority(priority) {
    const allowedPriorities = [
      "LOW",
      "NORMAL",
      "HIGH",
      "URGENT",
    ];

    if (!allowedPriorities.includes(priority)) {
      throw new ApiError(
        "Prioridade de notificação inválida.",
        400
      );
    }
  }

  /**
   * Perfis que podem receber notificações gerais.
   */
  validateTargetRole(targetRole) {
    if (!targetRole) {
      return;
    }

    const allowedRoles = [
      "PLATFORM_ADMIN",
      "CONDOMINIUM_ADMIN",
      "MANAGER",
      "DOORMAN",
      "RESIDENT",
    ];

    if (!allowedRoles.includes(targetRole)) {
      throw new ApiError(
        "Perfil destinatário inválido.",
        400
      );
    }
  }

  /**
   * Verifica os campos obrigatórios.
   */
  validateNotificationData(data) {
    if (!data?.title) {
      throw new ApiError(
        "O título da notificação é obrigatório.",
        400
      );
    }

    if (!data?.message) {
      throw new ApiError(
        "A mensagem da notificação é obrigatória.",
        400
      );
    }

    if (!data?.type) {
      throw new ApiError(
        "O tipo da notificação é obrigatório.",
        400
      );
    }

    if (data.priority) {
      this.validatePriority(data.priority);
    }

    if (data.targetRole) {
      this.validateTargetRole(
        data.targetRole
      );
    }
  }

  /**
   * Busca uma notificação pelo ID.
   */
  async findById(id, condominiumId) {
    const notification =
      await notificationRepository.findById(
        id,
        condominiumId
      );

    if (!notification) {
      throw new ApiError(
        "Notificação não encontrada.",
        404
      );
    }

    return notification;
  }

  /**
   * Lista todas as notificações do condomínio.
   *
   * Esse método será destinado aos perfis
   * administrativos.
   */
  async findByCondominium(condominiumId) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    return notificationRepository
      .findByCondominium(
        condominiumId
      );
  }

  /**
   * Lista notificações de um usuário.
   */
  async findByUser(
    recipientUserId,
    condominiumId
  ) {
    if (!recipientUserId) {
      throw new ApiError(
        "Usuário destinatário não identificado.",
        400
      );
    }

    return notificationRepository.findByUser(
      recipientUserId,
      condominiumId
    );
  }

  /**
   * Lista notificações não lidas.
   */
  async findUnreadByUser(
    recipientUserId,
    condominiumId
  ) {
    if (!recipientUserId) {
      throw new ApiError(
        "Usuário destinatário não identificado.",
        400
      );
    }

    return notificationRepository
      .findUnreadByUser(
        recipientUserId,
        condominiumId
      );
  }

  /**
   * Lista notificações direcionadas a um perfil.
   */
  async findByTargetRole(
    condominiumId,
    targetRole
  ) {
    this.validateTargetRole(targetRole);

    return notificationRepository
      .findByTargetRole(
        condominiumId,
        targetRole
      );
  }

  /**
   * Lista notificações por tipo.
   */
  async findByType(
    condominiumId,
    type
  ) {
    if (!type) {
      throw new ApiError(
        "O tipo da notificação é obrigatório.",
        400
      );
    }

    return notificationRepository.findByType(
      condominiumId,
      String(type).trim().toUpperCase()
    );
  }

  /**
   * Lista notificações por módulo.
   */
  async findByModule(
    condominiumId,
    module
  ) {
    if (!module) {
      throw new ApiError(
        "O módulo da notificação é obrigatório.",
        400
      );
    }

    return notificationRepository
      .findByModule(
        condominiumId,
        String(module)
          .trim()
          .toUpperCase()
      );
  }

  /**
   * Confere se o usuário destinatário existe
   * e pertence ao condomínio.
   */
  async validateRecipient(
    recipientUserId,
    condominiumId
  ) {
    const user =
      await userRepository.findById(
        recipientUserId,
        condominiumId
      );

    if (!user) {
      throw new ApiError(
        "Usuário destinatário não encontrado.",
        404
      );
    }

    if (user.status !== "ACTIVE") {
      throw new ApiError(
        "O usuário destinatário não está ativo.",
        400
      );
    }

    return user;
  }

  /**
   * Cria uma notificação para um usuário.
   */
  async createForUser(
    condominiumId,
    recipientUserId,
    data
  ) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    await this.validateRecipient(
      recipientUserId,
      condominiumId
    );

    this.validateNotificationData(data);

    return notificationRepository
      .createForUser(
        condominiumId,
        recipientUserId,
        {
          title: String(data.title).trim(),

          message:
            String(data.message).trim(),

          type:
            String(data.type)
              .trim()
              .toUpperCase(),

          origin:
            data.origin
              ? String(data.origin)
                  .trim()
                  .toUpperCase()
              : null,

          targetRole:
            data.targetRole ?? null,

          module:
            data.module
              ? String(data.module)
                  .trim()
                  .toUpperCase()
              : null,

          referenceId:
            data.referenceId ?? null,

          apartmentLabel:
            data.apartmentLabel ?? null,

          priority:
            data.priority ?? "NORMAL",
        }
      );
  }

  /**
   * Cria uma notificação geral para um perfil.
   *
   * Essa notificação não possui destinatário individual.
   */
  async createForRole(
    condominiumId,
    targetRole,
    data
  ) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    this.validateTargetRole(targetRole);

    this.validateNotificationData({
      ...data,
      targetRole,
    });

    return notificationRepository
      .createForRole(
        condominiumId,
        targetRole,
        {
          title: String(data.title).trim(),

          message:
            String(data.message).trim(),

          type:
            String(data.type)
              .trim()
              .toUpperCase(),

          origin:
            data.origin
              ? String(data.origin)
                  .trim()
                  .toUpperCase()
              : null,

          module:
            data.module
              ? String(data.module)
                  .trim()
                  .toUpperCase()
              : null,

          referenceId:
            data.referenceId ?? null,

          apartmentLabel:
            data.apartmentLabel ?? null,

          priority:
            data.priority ?? "NORMAL",
        }
      );
  }

  /**
   * Cria notificações individuais para todos
   * os usuários ativos de determinado perfil.
   *
   * Esse método permite que cada usuário tenha
   * seu próprio controle de leitura.
   */
  async createForActiveRoleUsers(
    condominiumId,
    targetRole,
    data
  ) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    this.validateTargetRole(targetRole);
    this.validateNotificationData(data);

    const users =
      await userRepository.findActiveByRole(
        condominiumId,
        targetRole
      );

    if (users.length === 0) {
      return {
        count: 0,
      };
    }

    const recipientUserIds =
      users.map((user) => user.id);

    return notificationRepository
      .createManyForUsers(
        condominiumId,
        recipientUserIds,
        {
          title: String(data.title).trim(),

          message:
            String(data.message).trim(),

          type:
            String(data.type)
              .trim()
              .toUpperCase(),

          origin:
            data.origin
              ? String(data.origin)
                  .trim()
                  .toUpperCase()
              : null,

          targetRole,

          module:
            data.module
              ? String(data.module)
                  .trim()
                  .toUpperCase()
              : null,

          referenceId:
            data.referenceId ?? null,

          apartmentLabel:
            data.apartmentLabel ?? null,

          priority:
            data.priority ?? "NORMAL",
        }
      );
  }

  /**
   * Cria notificações para uma lista de usuários.
   */
  async createForUsers(
    condominiumId,
    recipientUserIds,
    data
  ) {
    if (!Array.isArray(recipientUserIds)) {
      throw new ApiError(
        "A lista de destinatários é inválida.",
        400
      );
    }

    const uniqueUserIds = [
      ...new Set(
        recipientUserIds.filter(Boolean)
      ),
    ];

    if (uniqueUserIds.length === 0) {
      return {
        count: 0,
      };
    }

    this.validateNotificationData(data);

    /*
     * Validamos todos os destinatários antes
     * de criar as notificações.
     */
    await Promise.all(
      uniqueUserIds.map((userId) =>
        this.validateRecipient(
          userId,
          condominiumId
        )
      )
    );

    return notificationRepository
      .createManyForUsers(
        condominiumId,
        uniqueUserIds,
        {
          title: String(data.title).trim(),

          message:
            String(data.message).trim(),

          type:
            String(data.type)
              .trim()
              .toUpperCase(),

          origin:
            data.origin
              ? String(data.origin)
                  .trim()
                  .toUpperCase()
              : null,

          targetRole:
            data.targetRole ?? null,

          module:
            data.module
              ? String(data.module)
                  .trim()
                  .toUpperCase()
              : null,

          referenceId:
            data.referenceId ?? null,

          apartmentLabel:
            data.apartmentLabel ?? null,

          priority:
            data.priority ?? "NORMAL",
        }
      );
  }

  /**
   * Marca uma notificação como lida.
   */
  async markAsRead(
    id,
    recipientUserId,
    condominiumId
  ) {
    const notification =
      await notificationRepository.markAsRead(
        id,
        recipientUserId,
        condominiumId
      );

    if (!notification) {
      throw new ApiError(
        "Notificação não encontrada ou já lida.",
        404
      );
    }

    return notification;
  }

  /**
   * Marca todas as notificações do usuário como lidas.
   */
  async markAllAsRead(
    recipientUserId,
    condominiumId
  ) {
    const result =
      await notificationRepository
        .markAllAsRead(
          recipientUserId,
          condominiumId
        );

    return {
      message:
        "Notificações marcadas como lidas.",
      updatedCount: result.count,
    };
  }

  /**
   * Faz exclusão lógica de uma notificação.
   */
  async remove(
    id,
    recipientUserId,
    condominiumId
  ) {
    const deleted =
      await notificationRepository.softDelete(
        id,
        recipientUserId,
        condominiumId
      );

    if (!deleted) {
      throw new ApiError(
        "Notificação não encontrada.",
        404
      );
    }

    return {
      message:
        "Notificação removida com sucesso.",
    };
  }

  /**
   * Remove logicamente todas as notificações
   * já lidas pelo usuário.
   */
  async removeReadByUser(
    recipientUserId,
    condominiumId
  ) {
    const result =
      await notificationRepository
        .softDeleteReadByUser(
          recipientUserId,
          condominiumId
        );

    return {
      message:
        "Notificações lidas removidas.",
      removedCount: result.count,
    };
  }

  /**
   * Conta notificações não lidas.
   *
   * Esse valor aparecerá no ícone de sino
   * do frontend.
   */
  async countUnread(
    recipientUserId,
    condominiumId
  ) {
    const total =
      await notificationRepository
        .countUnreadByUser(
          recipientUserId,
          condominiumId
        );

    return {
      unread: total,
    };
  }

  /**
   * Atalho para notificação de encomenda.
   */
  async notifyPackageReceived({
    condominiumId,
    recipientUserId,
    packageId,
    apartmentLabel = null,
  }) {
    return this.createForUser(
      condominiumId,
      recipientUserId,
      {
        title: "Nova encomenda recebida",
        message:
          "Uma encomenda chegou para o seu apartamento.",
        type: "PACKAGE_RECEIVED",
        origin: "DOORMAN",
        module: "PACKAGE",
        referenceId: packageId,
        apartmentLabel,
        priority: "HIGH",
      }
    );
  }

  /**
   * Atalho para atualização de reserva.
   */
  async notifyReservationStatus({
    condominiumId,
    recipientUserId,
    reservationId,
    status,
  }) {
    const messages = {
      APPROVED:
        "Sua solicitação de reserva foi aprovada.",

      REJECTED:
        "Sua solicitação de reserva foi recusada.",

      CANCELED:
        "Sua reserva foi cancelada.",

      COMPLETED:
        "Sua reserva foi concluída.",
    };

    const message =
      messages[status] ??
      "O status da sua reserva foi atualizado.";

    return this.createForUser(
      condominiumId,
      recipientUserId,
      {
        title:
          "Atualização de reserva",
        message,
        type: "RESERVATION_STATUS",
        origin: "MANAGER",
        module: "RESERVATION",
        referenceId: reservationId,
        priority:
          status === "REJECTED"
            ? "HIGH"
            : "NORMAL",
      }
    );
  }

  /**
   * Atalho para autorização de visitante.
   */
  async notifyVisitorStatus({
    condominiumId,
    recipientUserId,
    visitorId,
    status,
  }) {
    const messages = {
      AUTHORIZED:
        "O visitante foi autorizado.",

      INSIDE:
        "O visitante entrou no condomínio.",

      LEFT:
        "O visitante saiu do condomínio.",

      DENIED:
        "A entrada do visitante foi negada.",
    };

    return this.createForUser(
      condominiumId,
      recipientUserId,
      {
        title:
          "Atualização de visitante",

        message:
          messages[status] ??
          "O status do visitante foi atualizado.",

        type: "VISITOR_STATUS",
        origin: "DOORMAN",
        module: "VISITOR",
        referenceId: visitorId,
        priority:
          status === "DENIED"
            ? "HIGH"
            : "NORMAL",
      }
    );
  }
}

export default new NotificationService();