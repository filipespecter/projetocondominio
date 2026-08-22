import BaseRepository from "./BaseRepository.js";

class ProviderAccessRepository extends BaseRepository {
  constructor() {
    super("providerAccess");
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

  /**
   * Relacionamentos retornados nas consultas.
   */
  get defaultInclude() {
    return {
      serviceProvider: true,
      apartment: true,

      entryRegisteredBy: {
        select: this.safeUserSelect,
      },

      exitRegisteredBy: {
        select: this.safeUserSelect,
      },
    };
  }

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

  normalizeOptionalDate(value) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return null;
    }

    const date =
      value instanceof Date
        ? new Date(value)
        : new Date(`${value}T00:00:00`);

    date.setHours(0, 0, 0, 0);

    return date;
  }

  normalizeOptionalTime(value) {
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
   * Busca um acesso pelo ID.
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
   * Lista todos os acessos do condomínio.
   */
  async findByCondominium(condominiumId) {
    return this.findMany(
      {
        condominiumId,
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
        orderBy: [
          {
            scheduledDate: "desc",
          },
          {
            scheduledStartTime: "asc",
          },
          {
            createdAt: "desc",
          },
        ],
      }
    );
  }

  /**
   * Lista acessos por status.
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
        orderBy: [
          {
            scheduledDate: "asc",
          },
          {
            scheduledStartTime: "asc",
          },
        ],
      }
    );
  }

  /**
   * Lista acessos agendados.
   */
  async findScheduled(condominiumId) {
    return this.findByStatus(
      condominiumId,
      "SCHEDULED"
    );
  }

  /**
   * Lista prestadores atualmente dentro do condomínio.
   */
  async findInside(condominiumId) {
    return this.findByStatus(
      condominiumId,
      "INSIDE"
    );
  }

  /**
   * Lista acessos de um prestador.
   */
  async findByServiceProvider(
    serviceProviderId,
    condominiumId
  ) {
    return this.findMany(
      {
        serviceProviderId,
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
   * Lista acessos vinculados a um apartamento.
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
   * Lista acessos de uma data específica.
   */
  async findByDate(
    condominiumId,
    scheduledDate
  ) {
    return this.findMany(
      {
        condominiumId,
        scheduledDate:
          this.normalizeOptionalDate(
            scheduledDate
          ),
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
        orderBy: {
          scheduledStartTime: "asc",
        },
      }
    );
  }

  /**
   * Cria um acesso agendado.
   */
  async createForCondominium(
    condominiumId,
    data
  ) {
    return this.create(
      {
        condominiumId,

        serviceProviderId:
          data.serviceProviderId,

        apartmentId:
          data.apartmentId ?? null,

        serviceDescription:
          this.normalizeOptionalText(
            data.serviceDescription
          ),

        scheduledDate:
          this.normalizeOptionalDate(
            data.scheduledDate
          ),

        scheduledStartTime:
          this.normalizeOptionalTime(
            data.scheduledStartTime
          ),

        scheduledEndTime:
          this.normalizeOptionalTime(
            data.scheduledEndTime
          ),

        status:
          data.status ?? "SCHEDULED",

        enteredAt:
          data.enteredAt ?? null,

        exitedAt:
          data.exitedAt ?? null,

        entryRegisteredByUserId:
          data.entryRegisteredByUserId ??
          null,

        exitRegisteredByUserId:
          data.exitRegisteredByUserId ??
          null,

        notes:
          this.normalizeOptionalText(
            data.notes
          ),
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Atualiza os campos editáveis.
   */
  async updateById(
    id,
    condominiumId,
    data
  ) {
    const updateData = {};

    if (
      data.serviceProviderId !==
      undefined
    ) {
      updateData.serviceProviderId =
        data.serviceProviderId;
    }

    if (
      data.apartmentId !== undefined
    ) {
      updateData.apartmentId =
        data.apartmentId || null;
    }

    if (
      data.serviceDescription !==
      undefined
    ) {
      updateData.serviceDescription =
        this.normalizeOptionalText(
          data.serviceDescription
        );
    }

    if (
      data.scheduledDate !== undefined
    ) {
      updateData.scheduledDate =
        this.normalizeOptionalDate(
          data.scheduledDate
        );
    }

    if (
      data.scheduledStartTime !==
      undefined
    ) {
      updateData.scheduledStartTime =
        this.normalizeOptionalTime(
          data.scheduledStartTime
        );
    }

    if (
      data.scheduledEndTime !==
      undefined
    ) {
      updateData.scheduledEndTime =
        this.normalizeOptionalTime(
          data.scheduledEndTime
        );
    }

    if (data.notes !== undefined) {
      updateData.notes =
        this.normalizeOptionalText(
          data.notes
        );
    }

    const result =
      await this.updateMany(
        {
          id,
          condominiumId,
          status: "SCHEDULED",
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
   * Registra a entrada.
   */
  async registerEntry(
    id,
    condominiumId,
    entryRegisteredByUserId
  ) {
    const result =
      await this.updateMany(
        {
          id,
          condominiumId,
          status: "SCHEDULED",
          deletedAt: null,
        },
        {
          status: "INSIDE",
          enteredAt: new Date(),
          entryRegisteredByUserId,
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
   * Registra a saída.
   */
  async registerExit(
    id,
    condominiumId,
    exitRegisteredByUserId
  ) {
    const result =
      await this.updateMany(
        {
          id,
          condominiumId,
          status: "INSIDE",
          deletedAt: null,
        },
        {
          status: "EXITED",
          exitedAt: new Date(),
          exitRegisteredByUserId,
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
   * Cancela um acesso ainda agendado.
   */
  async cancel(
    id,
    condominiumId
  ) {
    const result =
      await this.updateMany(
        {
          id,
          condominiumId,
          status: "SCHEDULED",
          deletedAt: null,
        },
        {
          status: "CANCELED",
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
   * Conta todos os acessos.
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
   * Conta acessos por status.
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
}

export default new ProviderAccessRepository();
