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
   * Busca pelo código único do condomínio.
   *
   * O código poderá ser usado no login para
   * identificar a organização do usuário.
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
   *
   * Normalmente será o CNPJ, mas o banco utiliza
   * o nome genérico "document".
   */
  async findByDocument(document) {
    if (!document) {
      return null;
    }

    return this.findFirst(
      {
        document: String(document).trim(),
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
   * Uso exclusivo da administração da plataforma.
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
   *
   * Status válidos:
   * TRIAL
   * ACTIVE
   * SUSPENDED
   * CANCELED
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
   * Cria um condomínio.
   */
  async createCondominium(data) {
    return this.create(
      {
        code: String(data.code)
          .trim()
          .toUpperCase(),

        name: String(data.name).trim(),

        legalName:
          data.legalName ?? null,

        document:
          data.document ?? null,

        email: data.email
          ? String(data.email)
              .trim()
              .toLowerCase()
          : null,

        phone:
          data.phone ?? null,

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
          data.status ?? "TRIAL",

        trialEndsAt:
          data.trialEndsAt ?? null,

        activatedAt:
          data.status === "ACTIVE"
            ? data.activatedAt ??
              new Date()
            : data.activatedAt ?? null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Atualiza os dados cadastrais.
   */
  async updateById(id, data) {
    const updateData = {};

    if (data.code !== undefined) {
      updateData.code = String(data.code)
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
      updateData.email = data.email
        ? String(data.email)
            .trim()
            .toLowerCase()
        : null;
    }

    if (data.phone !== undefined) {
      updateData.phone =
        data.phone || null;
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
      updateData.state = data.state
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
   * Altera o status do condomínio.
   */
  async changeStatus(id, status) {
    const updateData = {
      status,
    };

    if (status === "ACTIVE") {
      updateData.activatedAt =
        new Date();
      updateData.suspendedAt = null;
      updateData.canceledAt = null;
    }

    if (status === "SUSPENDED") {
      updateData.suspendedAt =
        new Date();
    }

    if (status === "CANCELED") {
      updateData.canceledAt =
        new Date();
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
   * Ativa o condomínio.
   */
  async activate(id) {
    return this.changeStatus(
      id,
      "ACTIVE"
    );
  }

  /**
   * Suspende o acesso do condomínio.
   */
  async suspend(id) {
    return this.changeStatus(
      id,
      "SUSPENDED"
    );
  }

  /**
   * Cancela o condomínio.
   */
  async cancel(id) {
    return this.changeStatus(
      id,
      "CANCELED"
    );
  }

  /**
   * Retorna o condomínio ao período de teste.
   */
  async setTrial(id, trialEndsAt = null) {
    const result = await this.updateMany(
      {
        id,
        deletedAt: null,
      },
      {
        status: "TRIAL",
        trialEndsAt,
        suspendedAt: null,
        canceledAt: null,
      }
    );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  /**
   * Atualiza configurações personalizadas.
   */
  async updateSettings(id, settings) {
    const result = await this.updateMany(
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

  /**
   * Atualiza o regulamento ou regras.
   */
  async updateRules(id, rules) {
    const result = await this.updateMany(
      {
        id,
        deletedAt: null,
      },
      {
        rules: rules || null,
      }
    );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  /**
   * Exclusão lógica.
   */
  async softDelete(id) {
    const result = await this.updateMany(
      {
        id,
        deletedAt: null,
      },
      {
        status: "CANCELED",
        canceledAt: new Date(),
        deletedAt: new Date(),
      }
    );

    return result.count > 0;
  }

  /**
   * Conta condomínios não excluídos.
   */
  async countAll() {
    return this.count({
      deletedAt: null,
    });
  }

  /**
   * Conta condomínios por status.
   */
  async countByStatus(status) {
    return this.count({
      status,
      deletedAt: null,
    });
  }
}

export default new CondominiumRepository();