import BaseRepository from "./BaseRepository.js";

class NotificationRepository extends BaseRepository {
  constructor() {
    super("notification");
  }

  /**
   * Busca uma notificação pelo ID dentro do condomínio.
   */
  async findById(id, condominiumId) {
    return this.findFirst(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        include: {
          recipient: true,
        },
      }
    );
  }

  /**
   * Lista todas as notificações ativas do condomínio.
   */
  async findByCondominium(condominiumId) {
    return this.findMany(
      {
        condominiumId,
        deletedAt: null,
      },
      {
        include: {
          recipient: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }
    );
  }

  /**
   * Lista as notificações destinadas a um usuário.
   */
  async findByUser(recipientUserId, condominiumId) {
    return this.findMany(
      {
        recipientUserId,
        condominiumId,
        deletedAt: null,
      },
      {
        orderBy: {
          createdAt: "desc",
        },
      }
    );
  }

  /**
   * Lista notificações não lidas de um usuário.
   *
   * No schema, uma notificação é considerada não lida
   * quando readAt está com valor null.
   */
  async findUnreadByUser(recipientUserId, condominiumId) {
    return this.findMany(
      {
        recipientUserId,
        condominiumId,
        readAt: null,
        deletedAt: null,
      },
      {
        orderBy: {
          createdAt: "desc",
        },
      }
    );
  }

  /**
   * Lista notificações destinadas a determinado perfil.
   *
   * Exemplos:
   * CONDOMINIUM_ADMIN
   * MANAGER
   * DOORMAN
   * RESIDENT
   */
  async findByTargetRole(condominiumId, targetRole) {
    return this.findMany(
      {
        condominiumId,
        targetRole,
        deletedAt: null,
      },
      {
        orderBy: {
          createdAt: "desc",
        },
      }
    );
  }

  /**
   * Lista notificações por tipo.
   */
  async findByType(condominiumId, type) {
    return this.findMany(
      {
        condominiumId,
        type,
        deletedAt: null,
      },
      {
        orderBy: {
          createdAt: "desc",
        },
      }
    );
  }

  /**
   * Lista notificações relacionadas a um módulo.
   *
   * Exemplos:
   * PACKAGE
   * VISITOR
   * RESERVATION
   * NOTICE
   */
  async findByModule(condominiumId, module) {
    return this.findMany(
      {
        condominiumId,
        module,
        deletedAt: null,
      },
      {
        orderBy: {
          createdAt: "desc",
        },
      }
    );
  }

  /**
   * Cria uma notificação para um usuário específico.
   */
  async createForUser(condominiumId, recipientUserId, data) {
    return this.create({
      condominiumId,
      recipientUserId,
      title: data.title,
      message: data.message,
      type: data.type,
      origin: data.origin ?? null,
      targetRole: data.targetRole ?? null,
      module: data.module ?? null,
      referenceId: data.referenceId ?? null,
      apartmentLabel: data.apartmentLabel ?? null,
      priority: data.priority ?? "NORMAL",
    });
  }

  /**
   * Cria uma notificação direcionada a um perfil.
   *
   * Ela não precisa ter recipientUserId quando for uma
   * mensagem geral destinada a um grupo de usuários.
   */
  async createForRole(condominiumId, targetRole, data) {
    return this.create({
      condominiumId,
      recipientUserId: null,
      title: data.title,
      message: data.message,
      type: data.type,
      origin: data.origin ?? null,
      targetRole,
      module: data.module ?? null,
      referenceId: data.referenceId ?? null,
      apartmentLabel: data.apartmentLabel ?? null,
      priority: data.priority ?? "NORMAL",
    });
  }

  /**
   * Cria notificações para vários usuários.
   */
  async createManyForUsers(condominiumId, recipientUserIds, data) {
    if (
      !Array.isArray(recipientUserIds) ||
      recipientUserIds.length === 0
    ) {
      return {
        count: 0,
      };
    }

    return this.model.createMany({
      data: recipientUserIds.map((recipientUserId) => ({
        condominiumId,
        recipientUserId,
        title: data.title,
        message: data.message,
        type: data.type,
        origin: data.origin ?? null,
        targetRole: data.targetRole ?? null,
        module: data.module ?? null,
        referenceId: data.referenceId ?? null,
        apartmentLabel: data.apartmentLabel ?? null,
        priority: data.priority ?? "NORMAL",
      })),
    });
  }

  /**
   * Marca uma notificação como lida.
   *
   * O recipientUserId impede que um usuário marque
   * como lida a notificação de outra pessoa.
   */
  async markAsRead(
    id,
    recipientUserId,
    condominiumId
  ) {
    const result = await this.updateMany(
      {
        id,
        recipientUserId,
        condominiumId,
        readAt: null,
        deletedAt: null,
      },
      {
        readAt: new Date(),
      }
    );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id, condominiumId);
  }

  /**
   * Marca todas as notificações do usuário como lidas.
   */
  async markAllAsRead(recipientUserId, condominiumId) {
    return this.updateMany(
      {
        recipientUserId,
        condominiumId,
        readAt: null,
        deletedAt: null,
      },
      {
        readAt: new Date(),
      }
    );
  }

  /**
   * Faz exclusão lógica da notificação.
   *
   * O registro continua no banco, mas deixa de aparecer
   * nas consultas normais.
   */
  async softDelete(
    id,
    recipientUserId,
    condominiumId
  ) {
    const result = await this.updateMany(
      {
        id,
        recipientUserId,
        condominiumId,
        deletedAt: null,
      },
      {
        deletedAt: new Date(),
      }
    );

    return result.count > 0;
  }

  /**
   * Faz exclusão lógica de todas as notificações
   * já lidas pelo usuário.
   */
  async softDeleteReadByUser(
    recipientUserId,
    condominiumId
  ) {
    return this.updateMany(
      {
        recipientUserId,
        condominiumId,
        readAt: {
          not: null,
        },
        deletedAt: null,
      },
      {
        deletedAt: new Date(),
      }
    );
  }

  /**
   * Conta notificações não lidas do usuário.
   */
  async countUnreadByUser(
    recipientUserId,
    condominiumId
  ) {
    return this.count({
      recipientUserId,
      condominiumId,
      readAt: null,
      deletedAt: null,
    });
  }
}

export default new NotificationRepository();