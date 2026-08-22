import BaseRepository from "./BaseRepository.js";

class CondominiumRepository extends BaseRepository {
  constructor() {
    super("condominium");
  }

  /**
   * Relacionamentos principais retornados
   * ao consultar um condomínio.
   */
  get defaultInclude() {
    return {
      subscriptions: {
        include: {
          plan: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    };
  }

  /**
   * Relacionamentos utilizados pela Central
   * Star Infinity Code.
   */
  get platformDetailsInclude() {
    return {
      subscriptions: {
        include: {
          plan: true,
          charges: {
            orderBy: {
              dueDate: "desc",
            },
            take: 10,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },

      users: {
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          mustChangePassword: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },

      paymentMethods: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          priority: "asc",
        },
      },

      approvedBy: {
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
        },
      },

      rejectedBy: {
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
        },
      },
    };
  }

  /**
   * Busca um condomínio pelo ID.
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
   * Busca detalhes completos para a Central.
   */
  async findPlatformDetailsById(id) {
    return this.findFirst(
      {
        id,
        deletedAt: null,
      },
      {
        include: this.platformDetailsInclude,
      }
    );
  }

  /**
   * Busca pelo código único do condomínio.
   */
  async findByCode(code) {
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
   * Busca pelo documento cadastrado.
   */
  async findByDocument(document) {
    if (!document) {
      return null;
    }

    return this.findFirst(
      {
        document:
          String(document).trim(),

        deletedAt: null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Lista todos os condomínios não excluídos.
   *
   * Mantido para compatibilidade com serviços existentes.
   */
  async findAll() {
    return this.findMany(
      {
        deletedAt: null,
      },
      {
        include: this.defaultInclude,

        orderBy: {
          name: "asc",
        },
      }
    );
  }

  /**
   * Lista condomínios por status.
   */
  async findByStatus(status) {
    return this.findMany(
      {
        status,
        deletedAt: null,
      },
      {
        include: this.defaultInclude,

        orderBy: {
          name: "asc",
        },
      }
    );
  }

  /**
   * Monta o WHERE utilizado pela Central.
   *
   * Permite pesquisa por:
   * - nome;
   * - razão social;
   * - código;
   * - CNPJ/documento;
   * - responsável;
   * - e-mail;
   * - telefone;
   * - cidade;
   * - UF;
   * - status;
   * - período de cadastro.
   */
  buildPlatformWhere(filters = {}) {
    const where = {
      deletedAt: null,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.state) {
      where.state =
        String(filters.state)
          .trim()
          .toUpperCase();
    }

    if (filters.city) {
      where.city = {
        contains:
          String(filters.city).trim(),

        mode:
          "insensitive",
      };
    }

    if (filters.createdFrom || filters.createdTo) {
      where.createdAt = {};

      if (filters.createdFrom) {
        where.createdAt.gte =
          filters.createdFrom;
      }

      if (filters.createdTo) {
        where.createdAt.lte =
          filters.createdTo;
      }
    }

    const search =
      String(filters.search ?? "")
        .trim();

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          legalName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          code: {
            contains:
              search.toUpperCase(),

            mode: "insensitive",
          },
        },
        {
          document: {
            contains: search,
          },
        },
        {
          contactName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          phone: {
            contains: search,
          },
        },
        {
          city: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          state: {
            contains:
              search.toUpperCase(),

            mode: "insensitive",
          },
        },
      ];
    }

    return where;
  }

  /**
   * Lista paginada para a Central.
   */
  async findPlatformPage(filters = {}) {
    const where =
      this.buildPlatformWhere(filters);

    const page =
      Math.max(
        Number(filters.page) || 1,
        1
      );

    const limit =
      Math.min(
        Math.max(
          Number(filters.limit) || 20,
          1
        ),
        100
      );

    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "name",
      "status",
      "approvedAt",
      "rejectedAt",
    ];

    const sortBy =
      allowedSortFields.includes(
        filters.sortBy
      )
        ? filters.sortBy
        : "createdAt";

    const sortOrder =
      filters.sortOrder === "asc"
        ? "asc"
        : "desc";

    return this.findMany(
      where,
      {
        select: {
          id: true,
          code: true,
          name: true,
          legalName: true,
          document: true,
          email: true,
          phone: true,
          contactName: true,
          city: true,
          state: true,
          status: true,
          trialEndsAt: true,
          activatedAt: true,
          suspendedAt: true,
          canceledAt: true,
          approvedAt: true,
          rejectedAt: true,
          rejectionReason: true,
          createdAt: true,
          updatedAt: true,

          subscriptions: {
            select: {
              id: true,
              status: true,
              billingCycle: true,
              priceInCents: true,
              dueDay: true,
              nextDueDate: true,
              currentPeriodStart: true,
              currentPeriodEnd: true,

              plan: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  monthlyPriceInCents: true,
                  billingCycle: true,
                  active: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },

          _count: {
            select: {
              users: true,
              apartments: true,
              residents: true,
              doormen: true,
              visitors: true,
              packages: true,
              reservations: true,
            },
          },
        },

        orderBy: {
          [sortBy]: sortOrder,
        },

        skip:
          (page - 1) * limit,

        take:
          limit,
      }
    );
  }

  /**
   * Conta resultados da pesquisa da Central.
   */
  async countPlatform(filters = {}) {
    return this.count(
      this.buildPlatformWhere(
        filters
      )
    );
  }

  /**
   * Cria um condomínio.
   *
   * A regra atual do InfinityCondo determina
   * PENDING como estado inicial padrão.
   */
  async createCondominium(data) {
    return this.create(
      {
        code:
          String(data.code)
            .trim()
            .toUpperCase(),

        name:
          String(data.name).trim(),

        legalName:
          data.legalName ?? null,

        document:
          data.document ?? null,

        email:
          data.email
            ? String(data.email)
                .trim()
                .toLowerCase()
            : null,

        phone:
          data.phone ?? null,

        contactName:
          data.contactName ?? null,

        postalCode:
          data.postalCode ?? null,

        addressLine:
          data.addressLine ?? null,

        addressNumber:
          data.addressNumber ?? null,

        addressExtra:
          data.addressExtra ?? null,

        neighborhood:
          data.neighborhood ?? null,

        city:
          data.city ?? null,

        state:
          data.state
            ? String(data.state)
                .trim()
                .toUpperCase()
            : null,

        logoUrl:
          data.logoUrl ?? null,

        timezone:
          data.timezone ??
          "America/Recife",

        rules:
          data.rules ?? null,

        settings:
          data.settings ?? null,

        status:
          data.status ?? "PENDING",

        trialEndsAt:
          data.trialEndsAt ?? null,

        activatedAt:
          data.status === "ACTIVE"
            ? data.activatedAt ??
              new Date()
            : data.activatedAt ??
              null,
      },
      {
        include:
          this.defaultInclude,
      }
    );
  }

  /**
   * Atualiza os dados cadastrais.
   */
  async updateById(id, data) {
    const updateData = {};

    if (data.code !== undefined) {
      updateData.code =
        String(data.code)
          .trim()
          .toUpperCase();
    }

    if (data.name !== undefined) {
      updateData.name =
        String(data.name).trim();
    }

    if (data.legalName !== undefined) {
      updateData.legalName =
        data.legalName || null;
    }

    if (data.document !== undefined) {
      updateData.document =
        data.document || null;
    }

    if (data.email !== undefined) {
      updateData.email =
        data.email
          ? String(data.email)
              .trim()
              .toLowerCase()
          : null;
    }

    if (data.phone !== undefined) {
      updateData.phone =
        data.phone || null;
    }

    if (data.contactName !== undefined) {
      updateData.contactName =
        data.contactName || null;
    }

    if (data.postalCode !== undefined) {
      updateData.postalCode =
        data.postalCode || null;
    }

    if (data.addressLine !== undefined) {
      updateData.addressLine =
        data.addressLine || null;
    }

    if (
      data.addressNumber !== undefined
    ) {
      updateData.addressNumber =
        data.addressNumber || null;
    }

    if (data.addressExtra !== undefined) {
      updateData.addressExtra =
        data.addressExtra || null;
    }

    if (data.neighborhood !== undefined) {
      updateData.neighborhood =
        data.neighborhood || null;
    }

    if (data.city !== undefined) {
      updateData.city =
        data.city || null;
    }

    if (data.state !== undefined) {
      updateData.state =
        data.state
          ? String(data.state)
              .trim()
              .toUpperCase()
          : null;
    }

    if (data.logoUrl !== undefined) {
      updateData.logoUrl =
        data.logoUrl || null;
    }

    if (data.timezone !== undefined) {
      updateData.timezone =
        data.timezone;
    }

    if (data.rules !== undefined) {
      updateData.rules =
        data.rules || null;
    }

    if (data.settings !== undefined) {
      updateData.settings =
        data.settings;
    }

    if (data.platformNotes !== undefined) {
      updateData.platformNotes =
        data.platformNotes || null;
    }

    const result =
      await this.updateMany(
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
   * Altera o status do condomínio.
   */
  async changeStatus(id, status) {
    const updateData = {
      status,
    };

    if (status === "ACTIVE") {
      updateData.activatedAt =
        new Date();

      updateData.suspendedAt =
        null;

      updateData.canceledAt =
        null;
    }

    if (status === "TRIAL") {
      updateData.suspendedAt =
        null;

      updateData.canceledAt =
        null;
    }

    if (status === "SUSPENDED") {
      updateData.suspendedAt =
        new Date();
    }

    if (status === "CANCELED") {
      updateData.canceledAt =
        new Date();
    }

    const result =
      await this.updateMany(
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

  async activate(id) {
    return this.changeStatus(
      id,
      "ACTIVE"
    );
  }

  async suspend(id) {
    return this.changeStatus(
      id,
      "SUSPENDED"
    );
  }

  async cancel(id) {
    return this.changeStatus(
      id,
      "CANCELED"
    );
  }

  async setTrial(
    id,
    trialEndsAt = null
  ) {
    const result =
      await this.updateMany(
        {
          id,
          deletedAt: null,
        },
        {
          status:
            "TRIAL",

          trialEndsAt,

          suspendedAt:
            null,

          canceledAt:
            null,
        }
      );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  async updateSettings(
    id,
    settings
  ) {
    const result =
      await this.updateMany(
        {
          id,
          deletedAt: null,
        },
        {
          settings,
        }
      );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  async updateRules(
    id,
    rules
  ) {
    const result =
      await this.updateMany(
        {
          id,
          deletedAt: null,
        },
        {
          rules:
            rules || null,
        }
      );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  async softDelete(id) {
    const result =
      await this.updateMany(
        {
          id,
          deletedAt: null,
        },
        {
          status:
            "CANCELED",

          canceledAt:
            new Date(),

          deletedAt:
            new Date(),
        }
      );

    return result.count > 0;
  }

  async countAll() {
    return this.count({
      deletedAt: null,
    });
  }

  async countByStatus(status) {
    return this.count({
      status,
      deletedAt: null,
    });
  }
}

export default new CondominiumRepository();
