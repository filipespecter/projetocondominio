import BaseRepository from "./BaseRepository.js";

class SupportSessionRepository extends BaseRepository {
  constructor() {
    super("supportSession");
  }

  get defaultInclude() {
    return {
      platformAdmin: {
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          status: true,
        },
      },

      condominium: {
        select: {
          id: true,
          code: true,
          name: true,
          legalName: true,
          email: true,
          phone: true,
          contactName: true,
          city: true,
          state: true,
          status: true,
        },
      },
    };
  }

  async findById(id) {
    return this.findFirst(
      {
        id,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  async findActiveById(id) {
    return this.findFirst(
      {
        id,
        status: "ACTIVE",
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  async findActiveByPlatformAdmin(
    platformAdminUserId
  ) {
    return this.findFirst(
      {
        platformAdminUserId,
        status: "ACTIVE",
      },
      {
        include: this.defaultInclude,

        orderBy: {
          startedAt: "desc",
        },
      }
    );
  }

  async findActiveForCondominium(
    platformAdminUserId,
    condominiumId
  ) {
    return this.findFirst(
      {
        platformAdminUserId,
        condominiumId,
        status: "ACTIVE",
      },
      {
        include: this.defaultInclude,

        orderBy: {
          startedAt: "desc",
        },
      }
    );
  }

  async listByPlatformAdmin(
    platformAdminUserId
  ) {
    return this.findMany(
      {
        platformAdminUserId,
      },
      {
        include: this.defaultInclude,

        orderBy: {
          startedAt: "desc",
        },
      }
    );
  }

  async listByCondominium(
    condominiumId
  ) {
    return this.findMany(
      {
        condominiumId,
      },
      {
        include: this.defaultInclude,

        orderBy: {
          startedAt: "desc",
        },
      }
    );
  }

  async createSession(data) {
    return this.create(
      {
        platformAdminUserId:
          data.platformAdminUserId,

        condominiumId:
          data.condominiumId,

        status:
          "ACTIVE",

        reason:
          String(data.reason).trim(),

        requestId:
          data.requestId ?? null,

        ipAddress:
          data.ipAddress ?? null,

        userAgent:
          data.userAgent ?? null,

        startedAt:
          data.startedAt ??
          new Date(),

        lastActivityAt:
          new Date(),
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  async touch(id) {
    const result =
      await this.updateMany(
        {
          id,
          status: "ACTIVE",
        },
        {
          lastActivityAt:
            new Date(),
        }
      );

    if (
      result.count === 0
    ) {
      return null;
    }

    return this.findById(id);
  }

  async close(
    id,
    endedAt = new Date()
  ) {
    const result =
      await this.updateMany(
        {
          id,
          status: "ACTIVE",
        },
        {
          status:
            "CLOSED",

          lastActivityAt:
            endedAt,

          endedAt,
        }
      );

    if (
      result.count === 0
    ) {
      return null;
    }

    return this.findById(id);
  }

  async expire(
    id,
    endedAt = new Date()
  ) {
    const result =
      await this.updateMany(
        {
          id,
          status: "ACTIVE",
        },
        {
          status:
            "EXPIRED",

          lastActivityAt:
            endedAt,

          endedAt,
        }
      );

    if (
      result.count === 0
    ) {
      return null;
    }

    return this.findById(id);
  }

  async expireInactiveBefore(
    referenceDate
  ) {
    return this.updateMany(
      {
        status:
          "ACTIVE",

        OR: [
          {
            lastActivityAt: {
              lt:
                referenceDate,
            },
          },
          {
            lastActivityAt:
              null,

            startedAt: {
              lt:
                referenceDate,
            },
          },
        ],
      },
      {
        status:
          "EXPIRED",

        endedAt:
          new Date(),
      }
    );
  }
}

export default new SupportSessionRepository();
