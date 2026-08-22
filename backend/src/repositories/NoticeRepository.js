import BaseRepository from "./BaseRepository.js";

class NoticeRepository extends BaseRepository {
  constructor() {
    super("notice");
  }

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
      author: {
        select: this.safeUserSelect,
      },
      apartment: true,
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

    return value instanceof Date
      ? new Date(value)
      : new Date(value);
  }

  get visiblePublishedWhere() {
    return {
      status: "PUBLISHED",
      deletedAt: null,
      OR: [
        { expiresAt: null },
        {
          expiresAt: {
            gt: new Date(),
          },
        },
      ],
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

  async findPublished(condominiumId) {
    return this.findMany(
      {
        condominiumId,
        ...this.visiblePublishedWhere,
      },
      {
        include: this.defaultInclude,
        orderBy: {
          publishedAt: "desc",
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

  async findByAudience(
    condominiumId,
    audience
  ) {
    return this.findMany(
      {
        condominiumId,
        audience,
        ...this.visiblePublishedWhere,
      },
      {
        include: this.defaultInclude,
        orderBy: {
          publishedAt: "desc",
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
        ...this.visiblePublishedWhere,
      },
      {
        include: this.defaultInclude,
        orderBy: {
          publishedAt: "desc",
        },
      }
    );
  }

  async findByCategory(
    condominiumId,
    category
  ) {
    return this.findMany(
      {
        condominiumId,
        category:
          String(category).trim(),
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

  async createForCondominium(
    condominiumId,
    authorUserId,
    data
  ) {
    const status =
      String(
        data.status ?? "PUBLISHED"
      )
        .trim()
        .toUpperCase();

    const audience =
      String(
        data.audience ?? "ALL"
      )
        .trim()
        .toUpperCase();

    return this.create(
      {
        condominiumId,
        authorUserId,
        apartmentId:
          audience === "APARTMENT"
            ? data.apartmentId ?? null
            : null,
        title:
          String(data.title).trim(),
        message:
          String(data.message).trim(),
        category:
          this.normalizeOptionalText(
            data.category
          ),
        priority:
          String(
            data.priority ?? "NORMAL"
          )
            .trim()
            .toUpperCase(),
        audience,
        status,
        publishedAt:
          status === "DRAFT"
            ? null
            : this.normalizeOptionalDate(
                data.publishedAt
              ) ?? new Date(),
        expiresAt:
          this.normalizeOptionalDate(
            data.expiresAt
          ),
      },
      {
        include: this.defaultInclude,
      }
    );
  }

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
        data.apartmentId || null;
    }

    if (data.title !== undefined) {
      updateData.title =
        String(data.title).trim();
    }

    if (data.message !== undefined) {
      updateData.message =
        String(data.message).trim();
    }

    if (data.category !== undefined) {
      updateData.category =
        this.normalizeOptionalText(
          data.category
        );
    }

    if (data.priority !== undefined) {
      updateData.priority =
        String(data.priority)
          .trim()
          .toUpperCase();
    }

    if (data.audience !== undefined) {
      updateData.audience =
        String(data.audience)
          .trim()
          .toUpperCase();
    }

    if (data.status !== undefined) {
      const status =
        String(data.status)
          .trim()
          .toUpperCase();

      updateData.status = status;

      if (status === "PUBLISHED") {
        updateData.publishedAt =
          this.normalizeOptionalDate(
            data.publishedAt
          ) ?? new Date();
      }

      if (status === "DRAFT") {
        updateData.publishedAt = null;
      }
    }

    if (data.expiresAt !== undefined) {
      updateData.expiresAt =
        this.normalizeOptionalDate(
          data.expiresAt
        );
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

    if (result.count === 0) {
      return null;
    }

    return this.findById(
      id,
      condominiumId
    );
  }

  async publish(id, condominiumId) {
    const result =
      await this.updateMany(
        {
          id,
          condominiumId,
          status: "DRAFT",
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

  async moveToDraft(
    id,
    condominiumId
  ) {
    const result =
      await this.updateMany(
        {
          id,
          condominiumId,
          status: "PUBLISHED",
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

  async archive(id, condominiumId) {
    const result =
      await this.updateMany(
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
          status: "ARCHIVED",
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

  async countPublished(
    condominiumId
  ) {
    return this.count({
      condominiumId,
      ...this.visiblePublishedWhere,
    });
  }
  /**
   * Lista apenas os avisos que o usuário autenticado
   * realmente pode visualizar.
   *
   * Regras:
   * - somente PUBLISHED;
   * - não expirados;
   * - ALL;
   * - público correspondente ao perfil;
   * - APARTMENT somente para moradores vinculados à unidade.
   */
  async findVisibleForUser({
    condominiumId,
    role,
    apartmentId = null,
  }) {
    const audienceConditions = [
      {
        audience: "ALL",
      },
    ];

    if (role === "RESIDENT") {
      audienceConditions.push({
        audience: "RESIDENTS",
      });

      if (apartmentId) {
        audienceConditions.push({
          audience: "APARTMENT",
          apartmentId,
        });
      }
    }

    if (role === "DOORMAN") {
      audienceConditions.push({
        audience: "DOORMEN",
      });
    }

    return this.findMany(
      {
        condominiumId,
        status: "PUBLISHED",
        deletedAt: null,

        OR: audienceConditions,

        AND: [
          {
            OR: [
              {
                expiresAt: null,
              },
              {
                expiresAt: {
                  gt: new Date(),
                },
              },
            ],
          },
        ],
      },
      {
        include:
          this.defaultInclude,

        orderBy: [
          {
            priority: "desc",
          },
          {
            publishedAt: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
      }
    );
  }

  /**
   * Busca um aviso por ID aplicando as mesmas
   * regras de visibilidade do usuário.
   */
  async findVisibleById({
    id,
    condominiumId,
    role,
    apartmentId = null,
  }) {
    const audienceConditions = [
      {
        audience: "ALL",
      },
    ];

    if (role === "RESIDENT") {
      audienceConditions.push({
        audience: "RESIDENTS",
      });

      if (apartmentId) {
        audienceConditions.push({
          audience: "APARTMENT",
          apartmentId,
        });
      }
    }

    if (role === "DOORMAN") {
      audienceConditions.push({
        audience: "DOORMEN",
      });
    }

    return this.findFirst(
      {
        id,
        condominiumId,
        status: "PUBLISHED",
        deletedAt: null,

        OR: audienceConditions,

        AND: [
          {
            OR: [
              {
                expiresAt: null,
              },
              {
                expiresAt: {
                  gt: new Date(),
                },
              },
            ],
          },
        ],
      },
      {
        include:
          this.defaultInclude,
      }
    );
  }

}

export default new NoticeRepository();
