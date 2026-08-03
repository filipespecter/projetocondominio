import BaseRepository from "./BaseRepository.js";

class OccurrenceRepository extends BaseRepository {
  constructor() {
    super("occurrence");
  }

  /**
   * Relacionamentos retornados nas consultas.
   */
  get defaultInclude() {
    return {
      apartment: true,
      createdBy: true,
      assignedTo: true,
      replies: {
        where: {
          deletedAt: null,
        },
        include: {
          author: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    };
  }

  /**
   * Busca uma ocorrência pelo ID dentro do condomínio.
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
   * Lista todas as ocorrências do condomínio.
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
   * Lista ocorrências por status.
   */
  async findByStatus(condominiumId, status) {
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
   * Lista ocorrências por tipo.
   *
   * Tipos disponíveis:
   * OCCURRENCE
   * COMPLAINT
   * SUGGESTION
   * REQUEST
   */
  async findByType(condominiumId, type) {
    return this.findMany(
      {
        condominiumId,
        type,
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
   * Lista ocorrências por origem.
   *
   * Origens disponíveis:
   * RESIDENT
   * DOORMAN
   * MANAGER
   * SYSTEM
   */
  async findByOrigin(condominiumId, origin) {
    return this.findMany(
      {
        condominiumId,
        origin,
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
   * Lista ocorrências por prioridade.
   */
  async findByPriority(
    condominiumId,
    priority
  ) {
    return this.findMany(
      {
        condominiumId,
        priority,
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
   * Lista ocorrências de um apartamento.
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
   * Lista ocorrências criadas por determinado usuário.
   */
  async findByCreatedUser(
    createdByUserId,
    condominiumId
  ) {
    return this.findMany(
      {
        createdByUserId,
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
   * Lista ocorrências atribuídas a determinado usuário.
   */
  async findByAssignedUser(
    assignedToUserId,
    condominiumId
  ) {
    return this.findMany(
      {
        assignedToUserId,
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
   * Lista ocorrências ainda não encerradas.
   */
  async findActive(condominiumId) {
    return this.findMany(
      {
        condominiumId,
        status: {
          in: [
            "NEW",
            "FORWARDED",
            "IN_REVIEW",
            "IN_PROGRESS",
          ],
        },
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
        orderBy: [
          {
            priority: "desc",
          },
          {
            createdAt: "asc",
          },
        ],
      }
    );
  }

  /**
   * Cria uma ocorrência vinculada ao condomínio.
   */
  async createForCondominium(
    condominiumId,
    data
  ) {
    return this.create(
      {
        condominiumId,
        apartmentId:
          data.apartmentId ?? null,
        createdByUserId:
          data.createdByUserId ?? null,
        assignedToUserId:
          data.assignedToUserId ?? null,
        origin: data.origin,
        type:
          data.type ?? "OCCURRENCE",
        category: data.category,
        priority:
          data.priority ?? "MEDIUM",
        title: data.title,
        description: data.description,
        status: data.status ?? "NEW",
        shift: data.shift ?? null,
        dutyDate: data.dutyDate ?? null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Atualiza os dados editáveis da ocorrência.
   */
  async updateById(
    id,
    condominiumId,
    data
  ) {
    const updateData = {};

    if (data.apartmentId !== undefined) {
      updateData.apartmentId =
        data.apartmentId || null;
    }

    if (data.assignedToUserId !== undefined) {
      updateData.assignedToUserId =
        data.assignedToUserId || null;
    }

    if (data.origin !== undefined) {
      updateData.origin = data.origin;
    }

    if (data.type !== undefined) {
      updateData.type = data.type;
    }

    if (data.category !== undefined) {
      updateData.category =
        data.category;
    }

    if (data.priority !== undefined) {
      updateData.priority =
        data.priority;
    }

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.description !== undefined) {
      updateData.description =
        data.description;
    }

    if (data.shift !== undefined) {
      updateData.shift =
        data.shift || null;
    }

    if (data.dutyDate !== undefined) {
      updateData.dutyDate =
        data.dutyDate || null;
    }

    const result = await this.updateMany(
      {
        id,
        condominiumId,
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
   * Atribui a ocorrência a um responsável.
   */
  async assign(
    id,
    condominiumId,
    assignedToUserId
  ) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        assignedToUserId,
        status: "FORWARDED",
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
   * Marca a ocorrência como em análise.
   */
  async markAsInReview(
    id,
    condominiumId
  ) {
    return this.changeStatus(
      id,
      condominiumId,
      "IN_REVIEW"
    );
  }

  /**
   * Marca a ocorrência como em andamento.
   */
  async startProgress(
    id,
    condominiumId
  ) {
    return this.changeStatus(
      id,
      condominiumId,
      "IN_PROGRESS"
    );
  }

  /**
   * Resolve a ocorrência.
   */
  async resolve(
    id,
    condominiumId,
    resolution
  ) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        status: "RESOLVED",
        resolution,
        resolvedAt: new Date(),
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
   * Fecha uma ocorrência já finalizada.
   */
  async close(id, condominiumId) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        status: "CLOSED",
        closedAt: new Date(),
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
   * Cancela uma ocorrência.
   */
  async cancel(id, condominiumId) {
    return this.changeStatus(
      id,
      condominiumId,
      "CANCELED"
    );
  }

  /**
   * Método interno para alteração simples de status.
   */
  async changeStatus(
    id,
    condominiumId,
    status
  ) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        status,
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
   * Marca a ocorrência como lida pelo síndico ou gestor.
   */
  async markAsReadByManager(
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
        readByManagerAt: new Date(),
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
   * Marca a ocorrência como lida pelo porteiro.
   */
  async markAsReadByDoorman(
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
        readByDoormanAt: new Date(),
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
  async softDelete(id, condominiumId) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        status: "CANCELED",
        deletedAt: new Date(),
      }
    );

    return result.count > 0;
  }

  /**
   * Conta ocorrências do condomínio.
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
   * Conta ocorrências por status.
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
   * Conta ocorrências ainda ativas.
   */
  async countActive(condominiumId) {
    return this.count({
      condominiumId,
      status: {
        in: [
          "NEW",
          "FORWARDED",
          "IN_REVIEW",
          "IN_PROGRESS",
        ],
      },
      deletedAt: null,
    });
  }
}

export default new OccurrenceRepository();