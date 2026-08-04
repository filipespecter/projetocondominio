import BaseRepository from "./BaseRepository.js";

class PackageRepository extends BaseRepository {
  constructor() {
    super("package");
  }

  /**
   * Relacionamentos retornados nas consultas.
   */
  get defaultInclude() {
    return {
      apartment: true,

      expectedByResident: {
        include: {
          user: true,
          apartment: true,
        },
      },

      receivedBy: true,
      deliveredBy: true,
    };
  }

  /**
   * Busca uma encomenda pelo ID.
   */
  async findById(id, condominiumId) {
    return this.findFirst(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Lista todas as encomendas do condomínio.
   */
  async findByCondominium(condominiumId) {
    return this.findMany(
      {
        condominiumId,
        deletedAt: null,
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
   * Lista encomendas de um apartamento.
   */
  async findByApartment(
    apartmentId,
    condominiumId
  ) {
    return this.findMany(
      {
        apartmentId,
        condominiumId,
        deletedAt: null,
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
   * Lista encomendas por status.
   */
  async findByStatus(
    condominiumId,
    status
  ) {
    return this.findMany(
      {
        condominiumId,
        status,
        deletedAt: null,
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
   * Lista encomendas esperadas.
   */
  async findExpected(condominiumId) {
    return this.findByStatus(
      condominiumId,
      "EXPECTED"
    );
  }

  /**
   * Lista encomendas recebidas e ainda
   * aguardando retirada.
   */
  async findPending(condominiumId) {
    return this.findMany(
      {
        condominiumId,
        status: "RECEIVED",
        deletedAt: null,
      },
      {
        include: this.defaultInclude,

        orderBy: {
          receivedAt: "asc",
        },
      }
    );
  }

  /**
   * Lista encomendas esperadas por um morador.
   */
  async findExpectedByResident(
    expectedByResidentId,
    condominiumId
  ) {
    return this.findMany(
      {
        condominiumId,
        expectedByResidentId,
        status: "EXPECTED",
        deletedAt: null,
      },
      {
        include: this.defaultInclude,

        orderBy: {
          expectedAt: "asc",
        },
      }
    );
  }

  /**
   * Busca uma encomenda pelo código de rastreio.
   */
  async findByTrackingCode(
    condominiumId,
    trackingCode
  ) {
    if (!trackingCode) {
      return null;
    }

    return this.findFirst(
      {
        condominiumId,

        trackingCode:
          String(trackingCode).trim(),

        deletedAt: null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Cria uma encomenda esperada pelo morador.
   */
  async createExpected(
    condominiumId,
    data
  ) {
    return this.create(
      {
        condominiumId,
        apartmentId: data.apartmentId,

        expectedByResidentId:
          data.expectedByResidentId,

        type: data.type,

        description:
          data.description ?? null,

        carrier:
          data.carrier ?? null,

        trackingCode:
          data.trackingCode ?? null,

        status: "EXPECTED",

        withdrawnBy: null,

        notes:
          data.notes ?? null,

        expectedAt:
          data.expectedAt ?? null,

        receivedAt: null,
        deliveredAt: null,
        canceledAt: null,

        receivedByUserId: null,
        deliveredByUserId: null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Registra diretamente uma encomenda recebida
   * pelo porteiro.
   */
  async createReceived(
    condominiumId,
    data
  ) {
    return this.create(
      {
        condominiumId,
        apartmentId: data.apartmentId,

        expectedByResidentId:
          data.expectedByResidentId ?? null,

        type: data.type,

        description:
          data.description ?? null,

        carrier:
          data.carrier ?? null,

        trackingCode:
          data.trackingCode ?? null,

        status: "RECEIVED",

        withdrawnBy: null,

        notes:
          data.notes ?? null,

        expectedAt:
          data.expectedAt ?? null,

        receivedAt:
          data.receivedAt ?? new Date(),

        deliveredAt: null,
        canceledAt: null,

        receivedByUserId:
          data.receivedByUserId ?? null,

        deliveredByUserId: null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Mantém compatibilidade com o padrão geral
   * dos Services.
   *
   * O status define qual fluxo será utilizado.
   */
  async createForCondominium(
    condominiumId,
    data
  ) {
    if (data.status === "EXPECTED") {
      return this.createExpected(
        condominiumId,
        data
      );
    }

    return this.createReceived(
      condominiumId,
      data
    );
  }

  /**
   * Registra a chegada de uma encomenda
   * anteriormente marcada como esperada.
   */
  async registerReceived(
    id,
    condominiumId,
    receivedByUserId
  ) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        status: "EXPECTED",
        deletedAt: null,
      },
      {
        status: "RECEIVED",
        receivedAt: new Date(),
        receivedByUserId,
      }
    );

    if (result.count === 0) {
      return null;
    }

    return this.findById(
      id,
      condominiumId
    );
  }

  /**
   * Marca a encomenda como entregue ao morador.
   */
  async deliver(
    id,
    condominiumId,
    deliveredByUserId,
    withdrawnBy = null
  ) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        status: "RECEIVED",
        deletedAt: null,
      },
      {
        status: "DELIVERED",

        deliveredAt:
          new Date(),

        deliveredByUserId,

        withdrawnBy:
          withdrawnBy || null,
      }
    );

    if (result.count === 0) {
      return null;
    }

    return this.findById(
      id,
      condominiumId
    );
  }

  /**
   * Cancela uma encomenda esperada ou recebida.
   */
  async cancel(
    id,
    condominiumId,
    withdrawnBy = null
  ) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,

        status: {
          in: [
            "EXPECTED",
            "RECEIVED",
          ],
        },

        deletedAt: null,
      },
      {
        status: "CANCELED",

        canceledAt:
          new Date(),

        withdrawnBy:
          withdrawnBy || null,
      }
    );

    if (result.count === 0) {
      return null;
    }

    return this.findById(
      id,
      condominiumId
    );
  }

  /**
   * Atualiza os dados editáveis da encomenda.
   *
   * Status e datas operacionais são alterados
   * somente pelos métodos específicos.
   */
  async updateById(
    id,
    condominiumId,
    data
  ) {
    const updateData = {};

    if (data.apartmentId !== undefined) {
      updateData.apartmentId =
        data.apartmentId;
    }

    if (
      data.expectedByResidentId !==
      undefined
    ) {
      updateData.expectedByResidentId =
        data.expectedByResidentId || null;
    }

    if (data.type !== undefined) {
      updateData.type =
        data.type;
    }

    if (data.description !== undefined) {
      updateData.description =
        data.description || null;
    }

    if (data.carrier !== undefined) {
      updateData.carrier =
        data.carrier || null;
    }

    if (data.trackingCode !== undefined) {
      updateData.trackingCode =
        data.trackingCode || null;
    }

    if (data.notes !== undefined) {
      updateData.notes =
        data.notes || null;
    }

    if (data.expectedAt !== undefined) {
      updateData.expectedAt =
        data.expectedAt || null;
    }

    const result = await this.updateMany(
      {
        id,
        condominiumId,

        status: {
          in: [
            "EXPECTED",
            "RECEIVED",
          ],
        },

        deletedAt: null,
      },
      updateData
    );

    if (result.count === 0) {
      return null;
    }

    return this.findById(
      id,
      condominiumId
    );
  }

  /**
   * Exclusão lógica.
   */
  async softDelete(
    id,
    condominiumId
  ) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        deletedAt:
          new Date(),
      }
    );

    return result.count > 0;
  }

  /**
   * Conta encomendas do condomínio.
   */
  async countByCondominium(
    condominiumId
  ) {
    return this.count({
      condominiumId,
      deletedAt: null,
    });
  }

  /**
   * Conta encomendas por status.
   */
  async countByStatus(
    condominiumId,
    status
  ) {
    return this.count({
      condominiumId,
      status,
      deletedAt: null,
    });
  }

  /**
   * Conta encomendas aguardando retirada.
   */
  async countPending(condominiumId) {
    return this.countByStatus(
      condominiumId,
      "RECEIVED"
    );
  }
}

export default new PackageRepository();