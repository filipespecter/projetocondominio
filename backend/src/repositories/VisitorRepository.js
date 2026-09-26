import BaseRepository from "./BaseRepository.js";

class VisitorRepository extends BaseRepository {
  constructor() {
    super("visitor");
  }

  /**
   * Campos seguros dos usuários relacionados.
   */
  get safeUserSelect() {
    return {
      id: true,
      condominiumId: true,
      name: true,
      username: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    };
  }

  get defaultInclude() {
    return {
      apartment: true,
      registeredBy: {
        select: this.safeUserSelect,
      },
      authorizedBy: {
        select: this.safeUserSelect,
      },
      invitedBy: {
        include: {
          apartment: true,
          user: {
            select: this.safeUserSelect,
          },
        },
      },
    };
  }

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

  async findByDocument(
    condominiumId,
    document
  ) {
    return this.findFirst(
      {
        condominiumId,
        document:
          String(document)
            .trim(),
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  async createForCondominium(
    condominiumId,
    data
  ) {
    return this.create(
      {
        condominiumId,
        apartmentId:
          data.apartmentId,
        name:
          String(data.name).trim(),
        document:
          data.document
            ? String(data.document).trim()
            : null,
        phone:
          data.phone
            ? String(data.phone).trim()
            : null,
        visitType:
          data.visitType
            ? String(data.visitType).trim()
            : null,
        vehicle:
          data.vehicle
            ? String(data.vehicle).trim()
            : null,
        plate:
          data.plate
            ? String(data.plate)
                .trim()
                .toUpperCase()
            : null,
        notes:
          data.notes
            ? String(data.notes).trim()
            : null,
        expectedAt:
          data.expectedAt ?? null,
        registeredByUserId:
          data.registeredByUserId ?? null,
        status:
          data.status ?? "WAITING",
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  async authorize(
    id,
    condominiumId,
    authorizedByUserId
  ) {
    const result =
      await this.updateMany(
        {
          id,
          condominiumId,
          deletedAt: null,
        },
        {
          status: "AUTHORIZED",
          authorizedAt: new Date(),
          authorizedByUserId,
        }
      );

    if (!result.count) {
      return null;
    }

    return this.findById(
      id,
      condominiumId
    );
  }

  async registerEntry(
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
          status: "INSIDE",
          enteredAt: new Date(),
        }
      );

    if (!result.count) {
      return null;
    }

    return this.findById(
      id,
      condominiumId
    );
  }

  async registerExit(
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
          status: "EXITED",
          exitedAt: new Date(),
        }
      );

    if (!result.count) {
      return null;
    }

    return this.findById(
      id,
      condominiumId
    );
  }

  async deny(
    id,
    condominiumId,
    authorizedByUserId
  ) {
    const result =
      await this.updateMany(
        {
          id,
          condominiumId,
          deletedAt: null,
        },
        {
          status: "DENIED",
          deniedAt: new Date(),
          authorizedByUserId,
        }
      );

    if (!result.count) {
      return null;
    }

    return this.findById(
      id,
      condominiumId
    );
  }

  async cancel(
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
          status: "CANCELED",
        }
      );

    if (!result.count) {
      return null;
    }

    return this.findById(
      id,
      condominiumId
    );
  }

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

    if (data.name !== undefined) {
      updateData.name =
        String(data.name).trim();
    }

    if (data.document !== undefined) {
      updateData.document =
        data.document
          ? String(data.document).trim()
          : null;
    }

    if (data.phone !== undefined) {
      updateData.phone =
        data.phone
          ? String(data.phone).trim()
          : null;
    }

    if (data.visitType !== undefined) {
      updateData.visitType =
        data.visitType
          ? String(data.visitType).trim()
          : null;
    }

    if (data.vehicle !== undefined) {
      updateData.vehicle =
        data.vehicle
          ? String(data.vehicle).trim()
          : null;
    }

    if (data.plate !== undefined) {
      updateData.plate =
        data.plate
          ? String(data.plate)
              .trim()
              .toUpperCase()
          : null;
    }

    if (data.notes !== undefined) {
      updateData.notes =
        data.notes
          ? String(data.notes).trim()
          : null;
    }

    if (data.expectedAt !== undefined) {
      updateData.expectedAt =
        data.expectedAt === null ||
        data.expectedAt === ""
          ? null
          : new Date(data.expectedAt);
    }

    const result =
      await this.updateMany(
        {
          id,
          condominiumId,
          deletedAt: null,
        },
        updateData
      );

    if (!result.count) {
      return null;
    }

    return this.findById(
      id,
      condominiumId
    );
  }

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
   * Lista convites antecipados criados por um morador.
   * O filtro do condomínio é obrigatório para preservar o isolamento multi-tenant.
   */
  async findInvitationsForResident(condominiumId, residentId) {
    return this.findMany(
      {
        condominiumId,
        invitedByResidentId: residentId,
        invitationTokenHash: { not: null },
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
        orderBy: {
          invitationValidFrom: "desc",
        },
      }
    );
  }

  async findInvitationByIdForResident(id, condominiumId, residentId) {
    return this.findFirst(
      {
        id,
        condominiumId,
        invitedByResidentId: residentId,
        invitationTokenHash: { not: null },
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Localiza um convite pelo HASH do token e sempre dentro do tenant informado.
   * O token bruto nunca é persistido.
   */
  async findInvitationByTokenHash(condominiumId, invitationTokenHash) {
    return this.findFirst(
      {
        condominiumId,
        invitationTokenHash,
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  async createInvitation(condominiumId, data) {
    return this.create(
      {
        condominiumId,
        apartmentId: data.apartmentId,
        name: String(data.name).trim(),
        document: data.document ? String(data.document).trim() : null,
        phone: data.phone ? String(data.phone).trim() : null,
        visitType: data.visitType ? String(data.visitType).trim() : "Convite antecipado",
        notes: data.notes ? String(data.notes).trim() : null,
        expectedAt: data.invitationValidFrom,
        status: "AUTHORIZED",
        authorizedAt: new Date(),
        registeredByUserId: data.registeredByUserId,
        invitedByResidentId: data.invitedByResidentId,
        invitationTokenHash: data.invitationTokenHash,
        invitationGeneratedAt: new Date(),
        invitationValidFrom: data.invitationValidFrom,
        invitationValidUntil: data.invitationValidUntil,
        invitationStatus: "AUTHORIZED",
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  async markInvitationExpired(id, condominiumId) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        invitationTokenHash: { not: null },
        invitationStatus: { in: ["WAITING", "AUTHORIZED"] },
        invitationUsedAt: null,
        invitationCanceledAt: null,
        deletedAt: null,
      },
      {
        invitationStatus: "EXPIRED",
      }
    );

    if (!result.count) return null;
    return this.findById(id, condominiumId);
  }

  /**
   * Consome o convite de forma atômica. A condição inclui status, janela temporal,
   * hash e tenant para impedir reutilização e corrida entre duas leituras do mesmo QR.
   */
  async consumeInvitation(id, condominiumId, invitationTokenHash, authorizedByUserId, now = new Date()) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        invitationTokenHash,
        invitationStatus: "AUTHORIZED",
        invitationUsedAt: null,
        invitationCanceledAt: null,
        invitationValidFrom: { lte: now },
        invitationValidUntil: { gte: now },
        deletedAt: null,
      },
      {
        invitationStatus: "USED",
        invitationUsedAt: now,
        status: "INSIDE",
        enteredAt: now,
        authorizedAt: now,
        authorizedByUserId,
      }
    );

    if (!result.count) return null;
    return this.findById(id, condominiumId);
  }

  async cancelInvitation(id, condominiumId, residentId) {
    const now = new Date();
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        invitedByResidentId: residentId,
        invitationTokenHash: { not: null },
        invitationStatus: { in: ["WAITING", "AUTHORIZED"] },
        invitationUsedAt: null,
        deletedAt: null,
      },
      {
        invitationStatus: "CANCELED",
        invitationCanceledAt: now,
        status: "CANCELED",
      }
    );

    if (!result.count) return null;
    return this.findById(id, condominiumId);
  }

  async countByCondominium(
    condominiumId
  ) {
    return this.count({
      condominiumId,
      deletedAt: null,
    });
  }

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
}

export default new VisitorRepository();
