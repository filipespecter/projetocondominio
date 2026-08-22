import BaseRepository from "./BaseRepository.js";

class PlanRepository extends BaseRepository {
  constructor() {
    super("plan");
  }

  /**
   * Relacionamentos retornados nas consultas.
   */
  get defaultInclude() {
    return {
      planFeatures: {
        include: {
          feature: true,
        },

        orderBy: {
          feature: {
            name: "asc",
          },
        },
      },

      _count: {
        select: {
          subscriptions: true,
        },
      },
    };
  }

  /**
   * Busca um plano pelo ID.
   */
  async findById(id) {
    return this.findFirst(
      {
        id,
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Lista todos os planos não removidos.
   */
  async findAll() {
    return this.findMany(
      {
        deletedAt: null,
      },
      {
        include: this.defaultInclude,

        orderBy: [
          {
            displayOrder: "asc",
          },

          {
            name: "asc",
          },
        ],
      }
    );
  }

  /**
   * Lista somente os planos ativos.
   */
  async findActive() {
    return this.findMany(
      {
        active: true,
        deletedAt: null,
      },
      {
        include: this.defaultInclude,

        orderBy: [
          {
            displayOrder: "asc",
          },

          {
            name: "asc",
          },
        ],
      }
    );
  }

  /**
   * Lista somente os planos inativos.
   */
  async findInactive() {
    return this.findMany(
      {
        active: false,
        deletedAt: null,
      },
      {
        include: this.defaultInclude,

        orderBy: [
          {
            displayOrder: "asc",
          },

          {
            name: "asc",
          },
        ],
      }
    );
  }

  /**
   * Busca um plano pelo nome.
   */
  async findByName(name) {
    if (!name) {
      return null;
    }

    return this.findFirst(
      {
        name: {
          equals: String(name).trim(),
          mode: "insensitive",
        },

        deletedAt: null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Busca um plano pelo código.
   */
  async findByCode(code) {
    if (!code) {
      return null;
    }

    return this.findFirst(
      {
        code: String(code)
          .trim()
          .toUpperCase(),

        deletedAt: null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Cria um plano.
   *
   * Validações e normalizações permanecem
   * no PlanService.
   */
  async createPlan(data) {
    return this.create(
      {
        name: data.name,

        code: data.code,

        description:
          data.description ?? null,

        monthlyPriceInCents:
          data.monthlyPriceInCents,

        billingCycle:
          data.billingCycle ??
          "MONTHLY",

        active:
          data.active ?? true,

        displayOrder:
          data.displayOrder ?? 0,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Atualiza os campos editáveis do plano.
   */
  async updateById(id, data) {
    const updateData = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.code !== undefined) {
      updateData.code = data.code;
    }

    if (data.description !== undefined) {
      updateData.description =
        data.description;
    }

    if (
      data.monthlyPriceInCents !==
      undefined
    ) {
      updateData.monthlyPriceInCents =
        data.monthlyPriceInCents;
    }

    if (
      data.billingCycle !== undefined
    ) {
      updateData.billingCycle =
        data.billingCycle;
    }

    if (data.displayOrder !== undefined) {
      updateData.displayOrder =
        data.displayOrder;
    }

    const result = await this.updateMany(
      {
        id,
        deletedAt: null,
      },
      updateData
    );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  /**
   * Ativa um plano.
   */
  async activate(id) {
    const result = await this.updateMany(
      {
        id,
        active: false,
        deletedAt: null,
      },
      {
        active: true,
      }
    );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  /**
   * Desativa um plano.
   */
  async deactivate(id) {
    const result = await this.updateMany(
      {
        id,
        active: true,
        deletedAt: null,
      },
      {
        active: false,
      }
    );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  /**
   * Atualiza a ordem de exibição.
   */
  async updateDisplayOrder(
    id,
    displayOrder
  ) {
    const result = await this.updateMany(
      {
        id,
        deletedAt: null,
      },
      {
        displayOrder,
      }
    );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  /**
   * Exclusão lógica.
   *
   * Também desativa o plano para impedir
   * novas assinaturas.
   */
  async softDelete(id) {
    const result = await this.updateMany(
      {
        id,
        deletedAt: null,
      },
      {
        active: false,
        deletedAt: new Date(),
      }
    );

    return result.count > 0;
  }

  /**
   * Conta todos os planos não removidos.
   */
  async countAll() {
    return this.count({
      deletedAt: null,
    });
  }

  /**
   * Conta os planos ativos.
   */
  async countActive() {
    return this.count({
      active: true,
      deletedAt: null,
    });
  }

  /**
   * Conta os planos inativos.
   */
  async countInactive() {
    return this.count({
      active: false,
      deletedAt: null,
    });
  }

  /**
   * Conta assinaturas vinculadas ao plano.
   */
  async countSubscriptions(planId) {
    const plan =
      await this.findFirst(
        {
          id: planId,
          deletedAt: null,
        },
        {
          select: {
            _count: {
              select: {
                subscriptions: true,
              },
            },
          },
        }
      );

    return (
      plan?._count?.subscriptions ?? 0
    );
  }

  /**
   * Verifica se o plano possui assinaturas.
   */
  async hasSubscriptions(planId) {
    const total =
      await this.countSubscriptions(
        planId
      );

    return total > 0;
  }
}

export default new PlanRepository();