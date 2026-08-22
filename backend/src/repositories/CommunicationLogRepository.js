import BaseRepository from "./BaseRepository.js";

class CommunicationLogRepository extends BaseRepository {
  constructor() {
    super("communicationLog");
  }

  get defaultInclude() {
    return {
      condominium: {
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
        },
      },
      recipientUser: {
        select: {
          id: true,
          condominiumId: true,
          name: true,
          username: true,
          email: true,
          phone: true,
          role: true,
          status: true,
        },
      },
    };
  }

  async findById(id) {
    return this.findUnique(
      {
        id,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  async findByCondominium(
    condominiumId
  ) {
    return this.findMany(
      {
        condominiumId,
      },
      {
        include: this.defaultInclude,
        orderBy: {
          createdAt: "desc",
        },
      }
    );
  }

  async findByRecipientUser(
    recipientUserId
  ) {
    return this.findMany(
      {
        recipientUserId,
      },
      {
        include: this.defaultInclude,
        orderBy: {
          createdAt: "desc",
        },
      }
    );
  }

  async findByStatus(status) {
    return this.findMany(
      {
        status,
      },
      {
        include: this.defaultInclude,
        orderBy: {
          createdAt: "asc",
        },
      }
    );
  }

  /**
   * =====================================================
   * CANDIDATOS A RETRY AUTOMÁTICO
   * =====================================================
   *
   * Busca somente mensagens FAILED:
   *
   * - abaixo do limite de tentativas;
   * - cuja última tentativa já respeitou o delay;
   * - em lote limitado.
   */
  async findRetryCandidates({
    maxAttempts = 3,
    retryBefore = new Date(),
    limit = 50,
  } = {}) {
    const normalizedMaxAttempts =
      Math.max(
        1,
        Number(maxAttempts) || 3
      );

    const normalizedLimit =
      Math.min(
        200,
        Math.max(
          1,
          Number(limit) || 50
        )
      );

    return this.model.findMany({
      where: {
        status:
          "FAILED",

        attemptCount: {
          lt:
            normalizedMaxAttempts,
        },

        OR: [
          {
            lastAttemptAt:
              null,
          },
          {
            lastAttemptAt: {
              lte:
                retryBefore,
            },
          },
        ],
      },

      include:
        this.defaultInclude,

      orderBy: [
        {
          lastAttemptAt:
            "asc",
        },
        {
          createdAt:
            "asc",
        },
      ],

      take:
        normalizedLimit,
    });
  }

  async findByChannel(channel) {
    return this.findMany(
      {
        channel,
      },
      {
        include: this.defaultInclude,
        orderBy: {
          createdAt: "desc",
        },
      }
    );
  }

  async findPending(
    limit = 100
  ) {
    return this.findMany(
      {
        status: "PENDING",
      },
      {
        include: this.defaultInclude,
        orderBy: {
          createdAt: "asc",
        },
        take: limit,
      }
    );
  }

  async findFailed(
    limit = 100
  ) {
    return this.findMany(
      {
        status: "FAILED",
      },
      {
        include: this.defaultInclude,
        orderBy: {
          failedAt: "desc",
        },
        take: limit,
      }
    );
  }

  async findByModuleReference(
    module,
    referenceId
  ) {
    return this.findMany(
      {
        module:
          String(module)
            .trim()
            .toUpperCase(),

        referenceId:
          String(referenceId)
            .trim(),
      },
      {
        include: this.defaultInclude,
        orderBy: {
          createdAt: "desc",
        },
      }
    );
  }

  async findByProviderMessageId(
    provider,
    providerMessageId
  ) {
    return this.findFirst(
      {
        provider,
        providerMessageId,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * =====================================================
   * BUSCA DE COMUNICAÇÃO EQUIVALENTE
   * =====================================================
   *
   * Usada para impedir duplicidade causada por:
   *
   * - webhook repetido;
   * - clique duplo;
   * - retry de requisição HTTP;
   * - execução repetida de job;
   * - reprocessamento do mesmo evento.
   *
   * templateCode funciona como código estável do evento,
   * por exemplo:
   *
   * PACKAGE_RECEIVED
   * RESERVATION_APPROVED
   * VISITOR_AUTHORIZED
   * NOTICE_PUBLISHED
   * CHARGE_CREATED
   * CHARGE_OVERDUE
   * CHARGE_PAID
   * SUBSCRIPTION_SUSPENDED
   * FINANCIAL_RECOVERY
   */
  async findEquivalent({
    condominiumId = null,
    recipientUserId = null,
    channel,
    recipient,
    module = null,
    referenceId = null,
    templateCode = null,
  }) {
    const where = {
      channel,
      recipient,
      status: {
        in: [
          "PENDING",
          "SENT",
          "DELIVERED",
          "FAILED",
        ],
      },
    };

    if (condominiumId) {
      where.condominiumId =
        condominiumId;
    }

    if (recipientUserId) {
      where.recipientUserId =
        recipientUserId;
    }

    if (module) {
      where.module =
        module;
    }

    if (referenceId) {
      where.referenceId =
        referenceId;
    }

    if (templateCode) {
      where.templateCode =
        templateCode;
    }

    return this.findFirst(
      where,
      {
        include: this.defaultInclude,
        orderBy: {
          createdAt: "desc",
        },
      }
    );
  }

  async createLog(data) {
    return this.create(
      {
        condominiumId:
          data.condominiumId ??
          null,

        recipientUserId:
          data.recipientUserId ??
          null,

        channel:
          data.channel,

        status:
          data.status ??
          "PENDING",

        recipient:
          data.recipient,

        subject:
          data.subject ??
          null,

        templateCode:
          data.templateCode ??
          null,

        contentSnapshot:
          data.contentSnapshot ??
          null,

        module:
          data.module ??
          null,

        referenceId:
          data.referenceId ??
          null,

        requestId:
          data.requestId ??
          null,

        provider:
          data.provider ??
          null,

        providerMessageId:
          data.providerMessageId ??
          null,

        attemptCount:
          data.attemptCount ??
          0,

        lastAttemptAt:
          data.lastAttemptAt ??
          null,

        sentAt:
          data.sentAt ??
          null,

        deliveredAt:
          data.deliveredAt ??
          null,

        failedAt:
          data.failedAt ??
          null,

        canceledAt:
          data.canceledAt ??
          null,

        lastError:
          data.lastError ??
          null,

        metadata:
          data.metadata ??
          null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  async markAttempt(id) {
    const result =
      await this.model.updateMany({
        where: {
          id,
          status: {
            in: [
              "PENDING",
              "FAILED",
            ],
          },
        },
        data: {
          attemptCount: {
            increment: 1,
          },
          lastAttemptAt:
            new Date(),
          failedAt:
            null,
          lastError:
            null,
          status:
            "PENDING",
        },
      });

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  async markSent(
    id,
    {
      provider,
      providerMessageId,
      metadata = null,
    } = {}
  ) {
    const result =
      await this.updateMany(
        {
          id,
          status: {
            in: [
              "PENDING",
              "FAILED",
            ],
          },
        },
        {
          status: "SENT",
          provider:
            provider ??
            null,
          providerMessageId:
            providerMessageId ??
            null,
          sentAt:
            new Date(),
          failedAt:
            null,
          lastError:
            null,
          metadata,
        }
      );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  async markDelivered(id) {
    const result =
      await this.updateMany(
        {
          id,
          status: {
            in: [
              "PENDING",
              "SENT",
            ],
          },
        },
        {
          status:
            "DELIVERED",
          deliveredAt:
            new Date(),
          failedAt:
            null,
          lastError:
            null,
        }
      );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  async markFailed(
    id,
    errorMessage,
    metadata = null
  ) {
    const result =
      await this.updateMany(
        {
          id,
          status: {
            not: "CANCELED",
          },
        },
        {
          status:
            "FAILED",
          failedAt:
            new Date(),
          lastError:
            errorMessage ??
            "Falha de comunicação.",
          metadata,
        }
      );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  async cancel(id) {
    const result =
      await this.updateMany(
        {
          id,
          status: {
            in: [
              "PENDING",
              "FAILED",
            ],
          },
        },
        {
          status:
            "CANCELED",
          canceledAt:
            new Date(),
        }
      );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  async countByStatus(status) {
    return this.count({
      status,
    });
  }

  async countByChannel(channel) {
    return this.count({
      channel,
    });
  }
}

export default new CommunicationLogRepository();
