import BaseRepository from "./BaseRepository.js";

class AuditLogRepository extends BaseRepository {
  constructor() {
    super("auditLog");
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
      lastLogoutAt: true,
      createdAt: true,
      updatedAt: true,
    };
  }

  get defaultInclude() {
    return {
      user: {
        select:
          this.safeUserSelect,
      },

      condominium:
        true,

      supportSession: {
        select: {
          id: true,
          platformAdminUserId: true,
          condominiumId: true,
          status: true,
          reason: true,
          startedAt: true,
          lastActivityAt: true,
          endedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    };
  }

  normalizeOptionalText(
    value
  ) {
    if (
      value === undefined ||
      value === null ||
      String(
        value
      ).trim() === ""
    ) {
      return null;
    }

    return String(
      value
    ).trim();
  }

  normalizeUppercaseText(
    value
  ) {
    const normalizedValue =
      this.normalizeOptionalText(
        value
      );

    if (!normalizedValue) {
      return null;
    }

    return normalizedValue
      .toUpperCase();
  }

  async findById(
    id,
    condominiumId = null
  ) {
    const where = {
      id,
    };

    if (
      condominiumId
    ) {
      where.condominiumId =
        condominiumId;
    }

    return this.findFirst(
      where,
      {
        include:
          this.defaultInclude,
      }
    );
  }

  async findByCondominium(
    condominiumId
  ) {
    return this.findMany(
      {
        condominiumId,
      },
      {
        include:
          this.defaultInclude,

        orderBy: {
          createdAt:
            "desc",
        },
      }
    );
  }

  async findPlatformLogs() {
    return this.findMany(
      {
        condominiumId:
          null,
      },
      {
        include:
          this.defaultInclude,

        orderBy: {
          createdAt:
            "desc",
        },
      }
    );
  }

  async findByUser(
    userId,
    condominiumId = null
  ) {
    const where = {
      userId,
    };

    if (
      condominiumId
    ) {
      where.condominiumId =
        condominiumId;
    }

    return this.findMany(
      where,
      {
        include:
          this.defaultInclude,

        orderBy: {
          createdAt:
            "desc",
        },
      }
    );
  }

  async findBySupportSession(
    supportSessionId
  ) {
    return this.findMany(
      {
        supportSessionId,
      },
      {
        include:
          this.defaultInclude,

        orderBy: {
          createdAt:
            "desc",
        },
      }
    );
  }

  async findByModule(
    condominiumId,
    module
  ) {
    return this.findMany(
      {
        condominiumId,

        module:
          String(
            module
          )
            .trim()
            .toUpperCase(),
      },
      {
        include:
          this.defaultInclude,

        orderBy: {
          createdAt:
            "desc",
        },
      }
    );
  }

  async findByAction(
    condominiumId,
    action
  ) {
    return this.findMany(
      {
        condominiumId,

        action:
          String(
            action
          )
            .trim()
            .toUpperCase(),
      },
      {
        include:
          this.defaultInclude,

        orderBy: {
          createdAt:
            "desc",
        },
      }
    );
  }

  async findByReference(
    condominiumId,
    referenceId
  ) {
    return this.findMany(
      {
        condominiumId,

        referenceId:
          String(
            referenceId
          ).trim(),
      },
      {
        include:
          this.defaultInclude,

        orderBy: {
          createdAt:
            "desc",
        },
      }
    );
  }

  async findByPeriod(
    condominiumId,
    startDate,
    endDate
  ) {
    return this.findMany(
      {
        condominiumId,

        createdAt: {
          gte:
            startDate,

          lte:
            endDate,
        },
      },
      {
        include:
          this.defaultInclude,

        orderBy: {
          createdAt:
            "desc",
        },
      }
    );
  }

  async findByUserAndPeriod(
    userId,
    condominiumId,
    startDate,
    endDate
  ) {
    return this.findMany(
      {
        userId,
        condominiumId,

        createdAt: {
          gte:
            startDate,

          lte:
            endDate,
        },
      },
      {
        include:
          this.defaultInclude,

        orderBy: {
          createdAt:
            "desc",
        },
      }
    );
  }

  async createLog(data) {
    return this.create(
      {
        condominiumId:
          data.condominiumId ??
          null,

        userId:
          data.userId ??
          null,

        supportSessionId:
          data.supportSessionId ??
          null,

        userName:
          this.normalizeOptionalText(
            data.userName
          ),

        userRole:
          this.normalizeUppercaseText(
            data.userRole
          ),

        action:
          String(
            data.action
          )
            .trim()
            .toUpperCase(),

        module:
          String(
            data.module
          )
            .trim()
            .toUpperCase(),

        details:
          this.normalizeOptionalText(
            data.details
          ),

        referenceId:
          this.normalizeOptionalText(
            data.referenceId
          ),

        requestId:
          this.normalizeOptionalText(
            data.requestId
          ),

        beforeData:
          data.beforeData ??
          null,

        afterData:
          data.afterData ??
          null,

        ipAddress:
          this.normalizeOptionalText(
            data.ipAddress
          ),

        userAgent:
          this.normalizeOptionalText(
            data.userAgent
          ),
      },
      {
        include:
          this.defaultInclude,
      }
    );
  }

  async countByCondominium(
    condominiumId
  ) {
    return this.count({
      condominiumId,
    });
  }

  async countByModule(
    condominiumId,
    module
  ) {
    return this.count({
      condominiumId,

      module:
        String(
          module
        )
          .trim()
          .toUpperCase(),
    });
  }

  async countByUser(
    userId,
    condominiumId = null
  ) {
    const where = {
      userId,
    };

    if (
      condominiumId
    ) {
      where.condominiumId =
        condominiumId;
    }

    return this.count(
      where
    );
  }

  async countByAction(
    condominiumId,
    action
  ) {
    return this.count({
      condominiumId,

      action:
        String(
          action
        )
          .trim()
          .toUpperCase(),
    });
  }

  async countBySupportSession(
    supportSessionId
  ) {
    return this.count({
      supportSessionId,
    });
  }
}

export default new AuditLogRepository();
