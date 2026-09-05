import condominiumRepository from "../repositories/CondominiumRepository.js";
import { ApiError } from "../utils/ApiError.js";
import prisma from "../config/prisma.js";
import AuditLogService from "./AuditLogService.js";

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


  /**
   * Troca o plano de um cliente já aprovado sem reiniciar o ciclo de cobrança.
   */
  async changeClientPlan(condominiumId, planId, platformAdmin, requestContext = null) {
    if (!platformAdmin?.id || !["PLATFORM_OWNER", "PLATFORM_ADMIN"].includes(platformAdmin.role)) {
      throw new ApiError("Administrador da plataforma não identificado.", 403);
    }

    if (!condominiumId || !planId) {
      throw new ApiError("Condomínio e plano são obrigatórios.", 400);
    }

    const condominium = await prisma.condominium.findFirst({
      where: { id: condominiumId, deletedAt: null },
    });

    if (!condominium) {
      throw new ApiError("Condomínio não encontrado.", 404);
    }

    if (!["TRIAL", "ACTIVE", "SUSPENDED"].includes(condominium.status)) {
      throw new ApiError("Somente clientes já aprovados e não cancelados podem trocar de plano.", 409);
    }

    const plan = await prisma.plan.findFirst({
      where: { id: planId, active: true, deletedAt: null },
    });

    if (!plan) {
      throw new ApiError("Plano não encontrado ou indisponível.", 400);
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        condominiumId,
        status: { in: ["TRIAL", "ACTIVE", "OVERDUE", "SUSPENDED"] },
      },
      orderBy: { createdAt: "desc" },
      include: { plan: true },
    });

    if (!subscription) {
      throw new ApiError("Cliente não possui assinatura ativa para troca de plano.", 409);
    }

    if (subscription.planId === plan.id) {
      throw new ApiError("O cliente já utiliza este plano.", 409);
    }

    const beforeData = {
      planId: subscription.planId,
      planCode: subscription.plan?.code ?? null,
      planName: subscription.plan?.name ?? null,
      priceInCents: subscription.priceInCents,
      billingCycle: subscription.billingCycle,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      nextDueDate: subscription.nextDueDate,
    };

    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        planId: plan.id,
        priceInCents: plan.monthlyPriceInCents,
        billingCycle: plan.billingCycle,
      },
      include: { plan: true },
    });

    await AuditLogService.logUpdate({
      condominiumId,
      user: platformAdmin,
      module: "SUBSCRIPTION_PLAN",
      referenceId: subscription.id,
      beforeData,
      afterData: {
        planId: updated.planId,
        planCode: updated.plan?.code ?? null,
        planName: updated.plan?.name ?? null,
        priceInCents: updated.priceInCents,
        billingCycle: updated.billingCycle,
        currentPeriodStart: updated.currentPeriodStart,
        currentPeriodEnd: updated.currentPeriodEnd,
        nextDueDate: updated.nextDueDate,
      },
      details: "Plano comercial do cliente alterado pela Central.",
      requestContext,
    });

    return { condominiumId, subscription: updated };
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
