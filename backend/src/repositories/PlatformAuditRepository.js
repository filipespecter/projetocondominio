import prisma from "../config/prisma.js";

class PlatformAuditRepository {
  get safeUserSelect() {
    return {
      id: true,
      condominiumId: true,
      name: true,
      username: true,
      email: true,
      role: true,
      status: true,
    };
  }

  get include() {
    return {
      condominium: {
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
        },
      },
      user: {
        select: this.safeUserSelect,
      },
      supportSession: {
        select: {
          id: true,
          platformAdminUserId: true,
          condominiumId: true,
          status: true,
          reason: true,
          requestId: true,
          startedAt: true,
          lastActivityAt: true,
          endedAt: true,
        },
      },
    };
  }

  buildWhere(filters = {}) {
    const where = {};

    if (!filters.includeDeleted) { where.deletedAt = null; }

    if (filters.condominiumId) {
      where.condominiumId = filters.condominiumId;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.userRole) {
      where.userRole = String(filters.userRole)
        .trim()
        .toUpperCase();
    }

    if (filters.module) {
      where.module = String(filters.module)
        .trim()
        .toUpperCase();
    }

    if (filters.action) {
      where.action = String(filters.action)
        .trim()
        .toUpperCase();
    }

    if (filters.referenceId) {
      where.referenceId = String(filters.referenceId).trim();
    }

    if (filters.requestId) {
      where.requestId = String(filters.requestId).trim();
    }

    if (filters.supportSessionId) {
      where.supportSessionId =
        String(filters.supportSessionId).trim();
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};

      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }

      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    if (filters.search) {
      const search = String(filters.search).trim();

      if (search) {
        where.OR = [
          {
            userName: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            details: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            module: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            action: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            referenceId: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            requestId: {
              contains: search,
              mode: "insensitive",
            },
          },
        ];
      }
    }

    return where;
  }

  async findPaginated(filters, page, limit) {
    const where = this.buildWhere(filters);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: this.include,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({
        where,
      }),
    ]);

    return {
      items,
      total,
    };
  }

  async findById(id) {
    return prisma.auditLog.findUnique({
      where: {
        id,
      },
      include: this.include,
    });
  }

  async findByRequestId(requestId) {
    return prisma.auditLog.findMany({
      where: {
        requestId,
      },
      include: this.include,
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  async softDelete(id, deletedByUserId, deletionReason = null) {
    return prisma.auditLog.update({ where:{id}, data:{deletedAt:new Date(),deletedByUserId,deletionReason}, include:this.include });
  }

  async statistics() {
    const [
      total,
      today,
      platformLevel,
      supportActions,
      activeSupportSessions,
      unresolvedEvents,
      criticalUnresolvedEvents,
    ] = await Promise.all([
      prisma.auditLog.count({where:{deletedAt:null}}),

      prisma.auditLog.count({
        where: {
          deletedAt: null,
          createdAt: {
            gte: new Date(
              new Date().setHours(0, 0, 0, 0)
            ),
          },
        },
      }),

      prisma.auditLog.count({
        where: {
          condominiumId: null,
        },
      }),

      prisma.auditLog.count({
        where: {
          supportSessionId: {
            not: null,
          },
        },
      }),

      prisma.supportSession.count({
        where: {
          status: "ACTIVE",
        },
      }),

      prisma.systemEvent.count({
        where: {
          resolvedAt: null,
        },
      }),

      prisma.systemEvent.count({
        where: {
          severity: "CRITICAL",
          resolvedAt: null,
        },
      }),
    ]);

    return {
      total,
      today,
      platformLevel,
      supportActions,
      activeSupportSessions,
      unresolvedEvents,
      criticalUnresolvedEvents,
    };
  }
}

export default new PlatformAuditRepository();
