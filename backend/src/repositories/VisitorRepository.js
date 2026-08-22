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
