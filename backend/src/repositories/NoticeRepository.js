import BaseRepository from "./BaseRepository.js";

class NoticeRepository extends BaseRepository {
  constructor() {
    super("notice");
  }

  get defaultInclude() {
    return {
      author: true,
      apartment: true,
    };
  }

  /**
   * Busca um aviso pelo ID dentro do condomínio.
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
   * Lista todos os avisos do condomínio.
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
   * Lista avisos publicados.
   */
  async findPublished(condominiumId) {
    return this.findMany(
      {
        condominiumId,
        status: "PUBLISHED",
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
        orderBy: {
          publishedAt: "desc",
        },
      }
    );
  }

  /**
   * Lista avisos por status.
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
   * Lista avisos por público.
   */
  async findByAudience(
    condominiumId,
    audience
  ) {
    return this.findMany(
      {
        condominiumId,
        audience,
        status: "PUBLISHED",
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
        orderBy: {
          publishedAt: "desc",
        },
      }
    );
  }

  /**
   * Lista avisos direcionados a um apartamento.
   */
  async findByApartment(
    apartmentId,
    condominiumId
  ) {
    return this.findMany(
      {
        apartmentId,
        condominiumId,
        status: "PUBLISHED",
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
        orderBy: {
          publishedAt: "desc",
        },
      }
    );
  }

  /**
   * Lista avisos por categoria.
   */
  async findByCategory(
    condominiumId,
    category
  ) {
    return this.findMany(
      {
        condominiumId,
        category,
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
   * Cria um aviso.
   */
  async createForCondominium(
    condominiumId,
    authorUserId,
    data
  ) {
    return this.create(
      {
        condominiumId,
        authorUserId,
        apartmentId:
          data.apartmentId ?? null,
        title: data.title,
        message: data.message,
        category:
          data.category ?? null,
        priority:
          data.priority ?? "NORMAL",
        audience:
          data.audience ?? "ALL",
        status:
          data.status ?? "PUBLISHED",
        publishedAt:
          data.status === "DRAFT"
            ? null
            : data.publishedAt ?? new Date(),
        expiresAt:
          data.expiresAt ?? null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Atualiza os campos enviados.
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

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.message !== undefined) {
      updateData.message = data.message;
    }

    if (data.category !== undefined) {
      updateData.category =
        data.category || null;
    }

    if (data.priority !== undefined) {
      updateData.priority =
        data.priority;
    }

    if (data.audience !== undefined) {
      updateData.audience =
        data.audience;
    }

    if (data.status !== undefined) {
      updateData.status = data.status;

      if (data.status === "PUBLISHED") {
        updateData.publishedAt =
          data.publishedAt ?? new Date();
      }

      if (data.status === "DRAFT") {
        updateData.publishedAt = null;
      }
    }

    if (data.expiresAt !== undefined) {
      updateData.expiresAt =
        data.expiresAt || null;
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
   * Publica um aviso.
   */
  async publish(id, condominiumId) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        status: "PUBLISHED",
        publishedAt: new Date(),
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
   * Move um aviso para rascunho.
   */
  async moveToDraft(
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
        status: "DRAFT",
        publishedAt: null,
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
   * Arquiva um aviso.
   */
  async archive(id, condominiumId) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        status: "ARCHIVED",
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
        status: "ARCHIVED",
        deletedAt: new Date(),
      }
    );

    return result.count > 0;
  }

  /**
   * Conta avisos do condomínio.
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
   * Conta avisos por status.
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
   * Conta avisos publicados.
   */
  async countPublished(
    condominiumId
  ) {
    return this.countByStatus(
      condominiumId,
      "PUBLISHED"
    );
  }
}

export default new NoticeRepository();