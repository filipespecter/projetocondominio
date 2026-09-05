import BaseRepository from "./BaseRepository.js";

class PackageRepository extends BaseRepository {
  constructor() {
    super("package");
  }

  /**
   * Campos seguros dos usuários relacionados.
   *
   * Nunca retornar passwordHash, tentativas de login,
   * bloqueios ou outros dados sensíveis.
   */
  get safeUserSelect() {
    return {
      id: true,
      condominiumId: true,
      name: true,
      username: true,
      email: true,
      phone: true,
      document: true,
      role: true,
      status: true,
      mustChangePassword: true,
      lastLoginAt: true,
      lastLogoutAt: true,
      passwordChangedAt: true,
      createdAt: true,
      updatedAt: true,
    };
  }

  /**
   * Relacionamentos retornados nas consultas.
   */
  get defaultInclude() {
    return {
      apartment: true,

      expectedByResident: {
        include: {
          user: {
            select: this.safeUserSelect,
          },
          apartment: true,
        },
      },

      receivedBy: {
        select: this.safeUserSelect,
      },

      deliveredBy: {
        select: this.safeUserSelect,
      },
    };
  }

  /**
   * Normaliza texto opcional.
   */
  normalizeOptionalText(value) {
    if (
      value === undefined ||
      value === null ||
      String(value).trim() === ""
    ) {
      return null;
    }

    return String(value).trim();
  }

  /**
   * Normaliza uma data opcional.
   */
  normalizeOptionalDate(value) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return null;
    }

    return value instanceof Date
      ? value
      : new Date(value);
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
    const normalizedTrackingCode =
      this.normalizeOptionalText(
        trackingCode
      );

    if (!normalizedTrackingCode) {
      return null;
    }

    return this.findFirst(
      {
        condominiumId,
        trackingCode:
          normalizedTrackingCode,
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
        apartmentId:
          data.apartmentId,

        expectedByResidentId:
          data.expectedByResidentId,

        type:
          String(data.type).trim(),

        description:
          this.normalizeOptionalText(
            data.description
          ),

        carrier:
          this.normalizeOptionalText(
            data.carrier
          ),

        trackingCode:
          this.normalizeOptionalText(
            data.trackingCode
          ),

        status: "EXPECTED",

        withdrawnBy: null,

        notes:
          this.normalizeOptionalText(
            data.notes
          ),

        expectedAt:
          this.normalizeOptionalDate(
            data.expectedAt
          ),

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
        apartmentId:
          data.apartmentId,

        expectedByResidentId:
          data.expectedByResidentId ??
          null,

        type:
          String(data.type).trim(),

        description:
          this.normalizeOptionalText(
            data.description
          ),

        carrier:
          this.normalizeOptionalText(
            data.carrier
          ),

        trackingCode:
          this.normalizeOptionalText(
            data.trackingCode
          ),

        status: "RECEIVED",

        withdrawnBy: null,

        notes:
          this.normalizeOptionalText(
            data.notes
          ),

        expectedAt:
          this.normalizeOptionalDate(
            data.expectedAt
          ),

        receivedAt:
          this.normalizeOptionalDate(
            data.receivedAt
          ) ?? new Date(),

        deliveredAt: null,
        canceledAt: null,

        receivedByUserId:
          data.receivedByUserId ?? null,

        deliveredByUserId: null,

        pickupTokenHash: null,
        pickupCodeHash: null,
        pickupGeneratedAt: null,
        pickupUsedAt: null,
        pickupMethod: null,
        pickupPersonType: null,
        pickupResidentId: null,
        withdrawnDocument: null,
        withdrawnResidentBlock: null,
        withdrawnResidentApartment: null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Mantém compatibilidade com o padrão geral
   * dos Services.
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
    const result =
      await this.updateMany(
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
    const result =
      await this.updateMany(
        {
          id,
          condominiumId,
          status: "RECEIVED",
          deletedAt: null,
        },
        {
          status: "DELIVERED",
          deliveredAt: new Date(),
          deliveredByUserId,
          withdrawnBy:
            this.normalizeOptionalText(
              withdrawnBy
            ),
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

  async setPickupCredential(
    id,
    condominiumId,
    tokenHash,
    codeHash
  ) {
    const result =
      await this.updateMany(
        {
          id,
          condominiumId,
          status: "RECEIVED",
          deletedAt: null,
        },
        {
          pickupTokenHash:
            tokenHash,
          pickupCodeHash:
            codeHash,
          pickupGeneratedAt:
            new Date(),
          pickupUsedAt:
            null,
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

  async findByPickupTokenHash(
    condominiumId,
    tokenHash
  ) {
    return this.findFirst(
      {
        condominiumId,
        pickupTokenHash:
          tokenHash,
        status: "RECEIVED",
        pickupUsedAt: null,
        deletedAt: null,
      },
      {
        include:
          this.defaultInclude,
      }
    );
  }

  async findByPickupCodeHash(
    condominiumId,
    codeHash
  ) {
    return this.findFirst(
      {
        condominiumId,
        pickupCodeHash:
          codeHash,
        status: "RECEIVED",
        pickupUsedAt: null,
        deletedAt: null,
      },
      {
        include:
          this.defaultInclude,
      }
    );
  }

  async confirmPickup(
    id,
    condominiumId,
    data
  ) {
    const result =
      await this.updateMany(
        {
          id,
          condominiumId,
          status: "RECEIVED",
          pickupUsedAt: null,
          deletedAt: null,
        },
        {
          status:
            "DELIVERED",
          deliveredAt:
            new Date(),
          deliveredByUserId:
            data.deliveredByUserId,
          withdrawnBy:
            this.normalizeOptionalText(
              data.withdrawnBy
            ),
          withdrawnDocument:
            this.normalizeOptionalText(
              data.withdrawnDocument
            ),
          withdrawnResidentBlock:
            this.normalizeOptionalText(
              data.withdrawnResidentBlock
            ),
          withdrawnResidentApartment:
            this.normalizeOptionalText(
              data.withdrawnResidentApartment
            ),
          pickupMethod:
            data.pickupMethod,
          pickupPersonType:
            data.pickupPersonType,
          pickupResidentId:
            data.pickupResidentId ??
            null,
          pickupUsedAt:
            new Date(),
          pickupTokenHash:
            null,
          pickupCodeHash:
            null,
          deliveryProofFilePath:
            data.deliveryProofFilePath ?? null,
          deliveryProofMimeType:
            data.deliveryProofMimeType ?? null,
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
   *
   * O motivo é preservado no campo notes.
   * withdrawnBy é exclusivo do fluxo de retirada.
   */
  async cancel(
    id,
    condominiumId,
    reason = null
  ) {
    const normalizedReason =
      this.normalizeOptionalText(reason);

    const packageRecord =
      await this.findById(
        id,
        condominiumId
      );

    if (
      !packageRecord ||
      ![
        "EXPECTED",
        "RECEIVED",
      ].includes(packageRecord.status)
    ) {
      return null;
    }

    const cancellationNote =
      normalizedReason
        ? packageRecord.notes
          ? `${packageRecord.notes}\nMotivo do cancelamento: ${normalizedReason}`
          : `Motivo do cancelamento: ${normalizedReason}`
        : packageRecord.notes;

    const result =
      await this.updateMany(
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
          canceledAt: new Date(),
          withdrawnBy: null,
          notes: cancellationNote,
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
   */
  async updateById(
    id,
    condominiumId,
    data
  ) {
    const updateData = {};

    if (
      data.apartmentId !== undefined
    ) {
      updateData.apartmentId =
        data.apartmentId;
    }

    if (
      data.expectedByResidentId !==
      undefined
    ) {
      updateData.expectedByResidentId =
        data.expectedByResidentId ||
        null;
    }

    if (data.type !== undefined) {
      updateData.type =
        String(data.type).trim();
    }

    if (
      data.description !== undefined
    ) {
      updateData.description =
        this.normalizeOptionalText(
          data.description
        );
    }

    if (data.carrier !== undefined) {
      updateData.carrier =
        this.normalizeOptionalText(
          data.carrier
        );
    }

    if (
      data.trackingCode !== undefined
    ) {
      updateData.trackingCode =
        this.normalizeOptionalText(
          data.trackingCode
        );
    }

    if (data.notes !== undefined) {
      updateData.notes =
        this.normalizeOptionalText(
          data.notes
        );
    }

    if (
      data.expectedAt !== undefined
    ) {
      updateData.expectedAt =
        this.normalizeOptionalDate(
          data.expectedAt
        );
    }

    const result =
      await this.updateMany(
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
    const result =
      await this.updateMany(
        {
          id,
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
