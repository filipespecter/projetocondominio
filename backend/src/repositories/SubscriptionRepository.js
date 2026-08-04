import BaseRepository from "./BaseRepository.js";

class SubscriptionRepository extends BaseRepository {
  constructor() {
    super("subscription");
  }

  /**
   * Relacionamentos retornados nas consultas.
   */
  get defaultInclude() {
    return {
      condominium: true,

      plan: {
        include: {
          planFeatures: {
            include: {
              feature: true,
            },
          },
        },
      },
    };
  }

  /**
   * Busca uma assinatura pelo ID.
   */
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

  /**
   * Lista todas as assinaturas da plataforma.
   *
   * Uso exclusivo da administração da
   * Star Infinity Code.
   */
  async findAll() {
    return this.findMany(
      {},
      {
        include: this.defaultInclude,

        orderBy: {
          createdAt: "desc",
        },
      }
    );
  }

  /**
   * Lista o histórico de assinaturas
   * de determinado condomínio.
   */
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

  /**
   * Busca a assinatura atual de um condomínio.
   *
   * Consideramos atuais os status:
   * TRIAL
   * ACTIVE
   * OVERDUE
   * SUSPENDED
   */
  async findCurrentByCondominium(
    condominiumId
  ) {
    return this.findFirst(
      {
        condominiumId,

        status: {
          in: [
            "TRIAL",
            "ACTIVE",
            "OVERDUE",
            "SUSPENDED",
          ],
        },
      },
      {
        include: this.defaultInclude,

        orderBy: {
          createdAt: "desc",
        },
      }
    );
  }

  /**
   * Lista assinaturas por status.
   */
  async findByStatus(status) {
    return this.findMany(
      {
        status,
      },
      {
        include: this.defaultInclude,

        orderBy: {
          createdAt: "desc",
        },
      }
    );
  }

  /**
   * Lista assinaturas vinculadas a um plano.
   */
  async findByPlan(planId) {
    return this.findMany(
      {
        planId,
      },
      {
        include: this.defaultInclude,

        orderBy: {
          createdAt: "desc",
        },
      }
    );
  }

  /**
   * Lista assinaturas cujo período atual
   * termina dentro do intervalo informado.
   */
  async findEndingBetween(
    startDate,
    endDate
  ) {
    return this.findMany(
      {
        currentPeriodEnd: {
          gte: startDate,
          lte: endDate,
        },

        status: {
          in: [
            "TRIAL",
            "ACTIVE",
            "OVERDUE",
            "SUSPENDED",
          ],
        },
      },
      {
        include: this.defaultInclude,

        orderBy: {
          currentPeriodEnd: "asc",
        },
      }
    );
  }

  /**
   * Lista períodos vencidos que ainda não
   * foram cancelados.
   */
  async findExpiredPeriods(
    referenceDate = new Date()
  ) {
    return this.findMany(
      {
        currentPeriodEnd: {
          lt: referenceDate,
        },

        status: {
          in: [
            "TRIAL",
            "ACTIVE",
            "OVERDUE",
            "SUSPENDED",
          ],
        },
      },
      {
        include: this.defaultInclude,

        orderBy: {
          currentPeriodEnd: "asc",
        },
      }
    );
  }

  /**
   * Cria uma assinatura.
   *
   * As datas, preço, ciclo e status devem ser
   * calculados e validados pelo Service.
   */
  async createSubscription(data) {
    return this.create(
      {
        condominiumId:
          data.condominiumId,

        planId:
          data.planId,

        status:
          data.status ?? "TRIAL",

        billingCycle:
          data.billingCycle,

        priceInCents:
          data.priceInCents,

        currentPeriodStart:
          data.currentPeriodStart,

        currentPeriodEnd:
          data.currentPeriodEnd,

        trialEndsAt:
          data.trialEndsAt ?? null,

        suspendedAt:
          data.suspendedAt ?? null,

        canceledAt:
          data.canceledAt ?? null,

        cancellationReason:
          data.cancellationReason ??
          null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Altera o plano e as condições
   * comerciais da assinatura.
   *
   * As regras para troca de plano permanecem
   * no SubscriptionService.
   */
  async changePlan(
    id,
    data
  ) {
    const updateData = {
      planId:
        data.planId,

      billingCycle:
        data.billingCycle,

      priceInCents:
        data.priceInCents,
    };

    if (
      data.currentPeriodStart !==
      undefined
    ) {
      updateData.currentPeriodStart =
        data.currentPeriodStart;
    }

    if (
      data.currentPeriodEnd !==
      undefined
    ) {
      updateData.currentPeriodEnd =
        data.currentPeriodEnd;
    }

    const result = await this.updateMany(
      {
        id,

        status: {
          not: "CANCELED",
        },
      },
      updateData
    );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  /**
   * Ativa uma assinatura.
   */
  async activate(
    id,
    data = {}
  ) {
    const updateData = {
      status: "ACTIVE",
      suspendedAt: null,
      canceledAt: null,
      cancellationReason: null,
    };

    if (
      data.currentPeriodStart !==
      undefined
    ) {
      updateData.currentPeriodStart =
        data.currentPeriodStart;
    }

    if (
      data.currentPeriodEnd !==
      undefined
    ) {
      updateData.currentPeriodEnd =
        data.currentPeriodEnd;
    }

    if (
      data.trialEndsAt !== undefined
    ) {
      updateData.trialEndsAt =
        data.trialEndsAt;
    }

    const result = await this.updateMany(
      {
        id,

        status: {
          in: [
            "TRIAL",
            "OVERDUE",
            "SUSPENDED",
          ],
        },
      },
      updateData
    );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  /**
   * Marca uma assinatura como vencida.
   */
  async markAsOverdue(id) {
    const result = await this.updateMany(
      {
        id,

        status: {
          in: [
            "TRIAL",
            "ACTIVE",
          ],
        },
      },
      {
        status: "OVERDUE",
      }
    );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  /**
   * Suspende uma assinatura.
   */
  async suspend(id) {
    const result = await this.updateMany(
      {
        id,

        status: {
          in: [
            "TRIAL",
            "ACTIVE",
            "OVERDUE",
          ],
        },
      },
      {
        status: "SUSPENDED",
        suspendedAt: new Date(),
      }
    );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  /**
   * Cancela uma assinatura.
   */
  async cancel(
    id,
    cancellationReason = null
  ) {
    const result = await this.updateMany(
      {
        id,

        status: {
          not: "CANCELED",
        },
      },
      {
        status: "CANCELED",

        canceledAt:
          new Date(),

        cancellationReason:
          cancellationReason || null,
      }
    );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  /**
   * Renova o período da assinatura.
   */
  async renewPeriod(
    id,
    currentPeriodStart,
    currentPeriodEnd
  ) {
    const result = await this.updateMany(
      {
        id,

        status: {
          in: [
            "ACTIVE",
            "OVERDUE",
            "SUSPENDED",
          ],
        },
      },
      {
        status: "ACTIVE",

        currentPeriodStart,
        currentPeriodEnd,

        suspendedAt: null,
        canceledAt: null,
        cancellationReason: null,
      }
    );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  /**
   * Atualiza o período de teste.
   */
  async updateTrial(
    id,
    trialEndsAt,
    currentPeriodEnd
  ) {
    const result = await this.updateMany(
      {
        id,

        status: "TRIAL",
      },
      {
        trialEndsAt,
        currentPeriodEnd,
      }
    );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  /**
   * Conta todas as assinaturas.
   */
  async countAll() {
    return this.count();
  }

  /**
   * Conta assinaturas por status.
   */
  async countByStatus(status) {
    return this.count({
      status,
    });
  }

  /**
   * Conta assinaturas de um plano.
   */
  async countByPlan(planId) {
    return this.count({
      planId,
    });
  }

  /**
   * Conta assinaturas do condomínio.
   */
  async countByCondominium(
    condominiumId
  ) {
    return this.count({
      condominiumId,
    });
  }
}

export default new SubscriptionRepository();