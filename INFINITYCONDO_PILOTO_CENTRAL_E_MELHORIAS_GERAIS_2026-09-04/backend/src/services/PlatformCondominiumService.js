import condominiumRepository from "../repositories/CondominiumRepository.js";
import { ApiError } from "../utils/ApiError.js";
import prisma from "../config/prisma.js";

/**
 * =====================================================
 * PLATFORM CONDOMINIUM SERVICE
 * =====================================================
 *
 * Regras de consulta administrativa da Central
 * Star Infinity Code.
 *
 * Este Service não duplica o CRUD normal do condomínio.
 * Ele utiliza o mesmo CondominiumRepository e concentra
 * apenas operações específicas do PLATFORM_ADMIN.
 */
class PlatformCondominiumService {
  normalizeStatus(status) {
    if (!status) {
      return null;
    }

    const normalized =
      String(status)
        .trim()
        .toUpperCase();

    const allowed = [
      "PENDING",
      "TRIAL",
      "ACTIVE",
      "SUSPENDED",
      "CANCELED",
      "REJECTED",
    ];

    if (!allowed.includes(normalized)) {
      throw new ApiError(
        "Status de condomínio inválido.",
        400
      );
    }

    return normalized;
  }

  normalizeDate(
    value,
    endOfDay = false
  ) {
    if (!value) {
      return null;
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      throw new ApiError(
        "Data de filtro inválida.",
        400
      );
    }

    if (endOfDay) {
      date.setHours(
        23,
        59,
        59,
        999
      );
    } else {
      date.setHours(
        0,
        0,
        0,
        0
      );
    }

    return date;
  }

  normalizeFilters(query = {}) {
    const page =
      Math.max(
        Number(query.page) || 1,
        1
      );

    const limit =
      Math.min(
        Math.max(
          Number(query.limit) || 20,
          1
        ),
        100
      );

    return {
      search:
        query.search
          ? String(query.search).trim()
          : "",

      status:
        this.normalizeStatus(
          query.status
        ),

      city:
        query.city
          ? String(query.city).trim()
          : null,

      state:
        query.state
          ? String(query.state)
              .trim()
              .toUpperCase()
          : null,

      createdFrom:
        this.normalizeDate(
          query.createdFrom
        ),

      createdTo:
        this.normalizeDate(
          query.createdTo,
          true
        ),

      page,

      limit,

      sortBy:
        query.sortBy
          ? String(query.sortBy).trim()
          : "createdAt",

      sortOrder:
        String(
          query.sortOrder ?? "desc"
        )
          .trim()
          .toLowerCase() === "asc"
          ? "asc"
          : "desc",
    };
  }

  /**
   * Lista condomínios com filtros e paginação.
   */
  async list(query = {}) {
    const filters =
      this.normalizeFilters(
        query
      );

    const [
      items,
      total,
    ] = await Promise.all([
      condominiumRepository
        .findPlatformPage(
          filters
        ),

      condominiumRepository
        .countPlatform(
          filters
        ),
    ]);

    const totalPages =
      Math.max(
        Math.ceil(
          total /
          filters.limit
        ),
        1
      );

    return {
      items,

      pagination: {
        page:
          filters.page,

        limit:
          filters.limit,

        total,

        totalPages,

        hasPreviousPage:
          filters.page > 1,

        hasNextPage:
          filters.page <
          totalPages,
      },

      filters: {
        search:
          filters.search ||
          null,

        status:
          filters.status,

        city:
          filters.city,

        state:
          filters.state,

        createdFrom:
          filters.createdFrom,

        createdTo:
          filters.createdTo,

        sortBy:
          filters.sortBy,

        sortOrder:
          filters.sortOrder,
      },
    };
  }

  /**
   * Atalho para solicitações pendentes.
   */
  async listPending(
    query = {}
  ) {
    return this.list({
      ...query,
      status:
        "PENDING",
    });
  }

  /**
   * Detalhes administrativos completos.
   */
  async findById(id) {
    if (!id) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    const condominium =
      await condominiumRepository
        .findPlatformDetailsById(
          id
        );

    if (!condominium) {
      throw new ApiError(
        "Condomínio não encontrado.",
        404
      );
    }

    return condominium;
  }

  async listClients(query = {}) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
    const search = String(query.search ?? "").trim();
    const status = query.status ? this.normalizeStatus(query.status) : null;
    const planCode = String(query.planCode ?? "").trim().toUpperCase();

    const where = {
      deletedAt: null,
      status: status || { in: ["TRIAL", "ACTIVE", "SUSPENDED", "CANCELED"] },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { legalName: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { addressLine: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    if (planCode) {
      where.subscriptions = {
        some: {
          plan: { code: planCode },
          status: { in: ["TRIAL", "ACTIVE", "OVERDUE", "SUSPENDED"] },
        },
      };
    }

    const [rows, total] = await Promise.all([
      prisma.condominium.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ activatedAt: "desc" }, { createdAt: "desc" }],
        include: {
          subscriptions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { plan: true },
          },
          users: {
            where: { deletedAt: null },
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              phone: true,
              role: true,
              status: true,
              lastLoginAt: true,
            },
          },
        },
      }),
      prisma.condominium.count({ where }),
    ]);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [activeClients, basicClients, completeClients, newThisMonth, recurring] = await Promise.all([
      prisma.condominium.count({ where: { deletedAt: null, status: { in: ["TRIAL", "ACTIVE"] } } }),
      prisma.subscription.count({ where: { status: { in: ["TRIAL", "ACTIVE"] }, plan: { code: "BASICO" } } }),
      prisma.subscription.count({ where: { status: { in: ["TRIAL", "ACTIVE"] }, plan: { code: "COMPLETO" } } }),
      prisma.condominium.count({ where: { deletedAt: null, activatedAt: { gte: startOfMonth } } }),
      prisma.subscription.aggregate({
        where: { status: { in: ["TRIAL", "ACTIVE"] } },
        _sum: { priceInCents: true },
      }),
    ]);

    const items = rows.map((condominium) => {
      const subscription = condominium.subscriptions[0] ?? null;
      const administrator = condominium.users.find((user) =>
        ["CONDOMINIUM_ADMIN", "MANAGER"].includes(user.role)
      ) ?? null;
      const activeSince = condominium.activatedAt ?? condominium.approvedAt ?? subscription?.currentPeriodStart ?? condominium.createdAt;
      const activeMs = Math.max(0, now.getTime() - new Date(activeSince).getTime());
      const activeDays = Math.floor(activeMs / 86400000);

      let billingStatus = "SEM_ASSINATURA";
      if (subscription) {
        if (subscription.status === "CANCELED") billingStatus = "CANCELADO";
        else if (subscription.status === "SUSPENDED") billingStatus = "SUSPENSO";
        else if (subscription.nextDueDate && new Date(subscription.nextDueDate) < now) billingStatus = "ATRASADO";
        else billingStatus = "EM_DIA";
      }

      return {
        id: condominium.id,
        code: condominium.code,
        name: condominium.name,
        legalName: condominium.legalName,
        document: condominium.document,
        status: condominium.status,
        email: condominium.email,
        phone: condominium.phone,
        contactName: condominium.contactName,
        address: {
          postalCode: condominium.postalCode,
          addressLine: condominium.addressLine,
          addressNumber: condominium.addressNumber,
          addressExtra: condominium.addressExtra,
          neighborhood: condominium.neighborhood,
          city: condominium.city,
          state: condominium.state,
        },
        activatedAt: condominium.activatedAt,
        approvedAt: condominium.approvedAt,
        clientSince: activeSince,
        activeDays,
        usersCount: condominium.users.length,
        administrator,
        lastLoginAt: condominium.users.reduce((latest, user) => {
          if (!user.lastLoginAt) return latest;
          if (!latest || new Date(user.lastLoginAt) > new Date(latest)) return user.lastLoginAt;
          return latest;
        }, null),
        subscription: subscription ? {
          id: subscription.id,
          status: subscription.status,
          billingStatus,
          priceInCents: subscription.priceInCents,
          billingCycle: subscription.billingCycle,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          nextDueDate: subscription.nextDueDate,
          gracePeriodDays: subscription.gracePeriodDays,
          billingContactName: subscription.billingContactName,
          billingEmail: subscription.billingEmail,
          billingPhone: subscription.billingPhone,
          plan: subscription.plan ? { id: subscription.plan.id, code: subscription.plan.code, name: subscription.plan.name } : null,
        } : null,
      };
    });

    return {
      items,
      summary: {
        activeClients,
        basicClients,
        completeClients,
        newThisMonth,
        estimatedMonthlyRevenueInCents: recurring._sum.priceInCents ?? 0,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    };
  }


  async getManageableSubscription(condominiumId) {
    return prisma.subscription.findFirst({
      where: { condominiumId, status: { in: ["TRIAL", "ACTIVE", "OVERDUE", "SUSPENDED"] } },
      orderBy: { createdAt: "desc" },
      include: { plan: true },
    });
  }

  async changeClientPlan(condominiumId, data, user, requestContext = null) {
    const condominium = await this.findById(condominiumId);
    if (["PENDING", "REJECTED", "CANCELED"].includes(condominium.status)) {
      throw new ApiError("O plano só pode ser alterado para um cliente ativo ou suspenso.", 409);
    }
    const plan = await prisma.plan.findFirst({ where: { id: data.planId, active: true, deletedAt: null }, include: { planFeatures: { include: { feature: true } } } });
    if (!plan) throw new ApiError("Plano comercial não encontrado ou inativo.", 404);
    const subscription = await this.getManageableSubscription(condominiumId);
    if (!subscription) throw new ApiError("Assinatura ativa não encontrada.", 404);
    if (subscription.planId === plan.id) return { condominium, subscription };

    const before = { planId: subscription.planId, plan: subscription.plan, priceInCents: subscription.priceInCents };
    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { planId: plan.id, priceInCents: data.priceInCents == null ? plan.monthlyPriceInCents : Number(data.priceInCents) },
      include: { plan: { include: { planFeatures: { include: { feature: true } } } } },
    });
    const { default: AuditLogService } = await import("./AuditLogService.js");
    await AuditLogService.logUpdate({
      condominiumId, user, module: "SUBSCRIPTION_PLAN", referenceId: subscription.id,
      beforeData: before, afterData: updated,
      details: `Plano alterado de ${before.plan?.name ?? "anterior"} para ${plan.name}. Dados de recursos premium foram preservados.`, requestContext,
    });
    return { condominiumId, subscription: updated };
  }

  async changeClientStatus(condominiumId, data, user, requestContext = null) {
    const action = String(data.action ?? "").trim().toUpperCase();
    const allowed = new Set(["SUSPEND", "REACTIVATE", "CANCEL"]);
    if (!allowed.has(action)) throw new ApiError("Ação de cliente inválida.", 400);
    const condominium = await this.findById(condominiumId);
    const subscription = await this.getManageableSubscription(condominiumId);
    const now = new Date();
    const reason = String(data.reason ?? "").trim() || null;

    if (action === "CANCEL" && condominium.status === "CANCELED") return condominium;
    if (action === "REACTIVATE" && condominium.status === "REJECTED") throw new ApiError("Solicitação rejeitada não pode ser reativada como cliente.", 409);

    const result = await prisma.$transaction(async (tx) => {
      let condoData;
      let subData = null;
      if (action === "SUSPEND") {
        condoData = { status: "SUSPENDED", suspendedAt: now };
        if (subscription) subData = { status: "SUSPENDED", suspendedAt: now };
      } else if (action === "REACTIVATE") {
        condoData = { status: "ACTIVE", suspendedAt: null, canceledAt: null };
        if (subscription) subData = { status: "ACTIVE", suspendedAt: null, canceledAt: null, cancellationReason: null };
      } else {
        condoData = { status: "CANCELED", canceledAt: now };
        if (subscription) subData = { status: "CANCELED", canceledAt: now, cancellationReason: reason || "Cancelamento administrativo." };
      }
      const updatedCondo = await tx.condominium.update({ where: { id: condominiumId }, data: condoData });
      const updatedSub = subscription && subData ? await tx.subscription.update({ where: { id: subscription.id }, data: subData }) : null;
      return { condominium: updatedCondo, subscription: updatedSub };
    });

    const { default: AuditLogService } = await import("./AuditLogService.js");
    await AuditLogService.logUpdate({
      condominiumId, user, module: "CLIENT_LIFECYCLE", referenceId: condominiumId,
      beforeData: { condominiumStatus: condominium.status, subscriptionStatus: subscription?.status ?? null },
      afterData: { action, condominiumStatus: result.condominium.status, subscriptionStatus: result.subscription?.status ?? null, reason },
      details: `Ciclo do cliente alterado: ${action}.`, requestContext,
    });
    return result;
  }

  /**
   * Estatísticas rápidas para a Central.
   */
  async statistics() {
    const [
      total,
      pending,
      trial,
      active,
      suspended,
      canceled,
      rejected,
    ] = await Promise.all([
      condominiumRepository.countAll(),

      condominiumRepository
        .countByStatus(
          "PENDING"
        ),

      condominiumRepository
        .countByStatus(
          "TRIAL"
        ),

      condominiumRepository
        .countByStatus(
          "ACTIVE"
        ),

      condominiumRepository
        .countByStatus(
          "SUSPENDED"
        ),

      condominiumRepository
        .countByStatus(
          "CANCELED"
        ),

      condominiumRepository
        .countByStatus(
          "REJECTED"
        ),
    ]);

    return {
      total,
      pending,
      trial,
      active,
      suspended,
      canceled,
      rejected,
    };
  }
}

export default new PlatformCondominiumService();
