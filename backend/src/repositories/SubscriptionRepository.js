import BaseRepository from "./BaseRepository.js";

class SubscriptionRepository extends BaseRepository {
  constructor() {
    super("subscription");
  }

  get defaultInclude() {
    return {
      condominium: true,

      plan: {
        include: {
          planFeatures: {
            include: {
              feature: true,
            },
          },
        },
      },

      charges: {
        orderBy: {
          dueDate: "desc",
        },
        take: 10,
      },
    };
  }

  async findById(id) {
    return this.findUnique(
      { id },
      { include: this.defaultInclude }
    );
  }

  async findAll() {
    return this.findMany(
      {},
      {
        include: this.defaultInclude,
        orderBy: {
          createdAt: "desc",
        },
      }
    );
  }

  async findByCondominium(
    condominiumId
  ) {
    return this.findMany(
      { condominiumId },
      {
        include: this.defaultInclude,
        orderBy: {
          createdAt: "desc",
        },
      }
    );
  }

  async findCurrentByCondominium(
    condominiumId
  ) {
    return this.findFirst(
      {
        condominiumId,
        status: {
          in: [
            "TRIAL",
            "ACTIVE",
            "OVERDUE",
            "SUSPENDED",
          ],
        },
      },
      {
        include: this.defaultInclude,
        orderBy: {
          createdAt: "desc",
        },
      }
    );
  }

  async findByStatus(status) {
    return this.findMany(
      { status },
      {
        include: this.defaultInclude,
        orderBy: {
          createdAt: "desc",
        },
      }
    );
  }

  async findByPlan(planId) {
    return this.findMany(
      { planId },
      {
        include: this.defaultInclude,
        orderBy: {
          createdAt: "desc",
        },
      }
    );
  }

  async findEndingBetween(
    startDate,
    endDate
  ) {
    return this.findMany(
      {
        currentPeriodEnd: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: [
            "TRIAL",
            "ACTIVE",
            "OVERDUE",
            "SUSPENDED",
          ],
        },
      },
      {
        include: this.defaultInclude,
        orderBy: {
          currentPeriodEnd: "asc",
        },
      }
    );
  }

  async findExpiredPeriods(
    referenceDate = new Date()
  ) {
    return this.findMany(
      {
        currentPeriodEnd: {
          lt: referenceDate,
        },
        status: {
          in: [
            "TRIAL",
            "ACTIVE",
            "OVERDUE",
            "SUSPENDED",
          ],
        },
      },
      {
        include: this.defaultInclude,
        orderBy: {
          currentPeriodEnd: "asc",
        },
      }
    );
  }

  async findOverdueAutoSuspend() {
    return this.findMany(
      {
        status: "OVERDUE",
        autoSuspend: true,
      },
      {
        include: this.defaultInclude,
        orderBy: {
          nextDueDate: "asc",
        },
      }
    );
  }

  async registerPayment(
    id,
    paidAt = new Date()
  ) {
    const result =
      await this.updateMany(
        {
          id,
          status: {
            not: "CANCELED",
          },
        },
        {
          lastPaymentAt: paidAt,
        }
      );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  async createSubscription(data) {
    return this.create(
      {
        condominiumId:
          data.condominiumId,
        planId:
          data.planId,
        status:
          data.status ?? "TRIAL",
        billingCycle:
          data.billingCycle,
        priceInCents:
          data.priceInCents,
        billingContactName:
          data.billingContactName ?? null,
        billingEmail:
          data.billingEmail ?? null,
        billingPhone:
          data.billingPhone ?? null,
        dueDay:
          data.dueDay ?? null,
        gracePeriodDays:
          data.gracePeriodDays ?? 30,
        autoSuspend:
          data.autoSuspend ?? true,
        currentPeriodStart:
          data.currentPeriodStart,
        currentPeriodEnd:
          data.currentPeriodEnd,
        nextDueDate:
          data.nextDueDate ?? null,
        lastPaymentAt:
          data.lastPaymentAt ?? null,
        trialEndsAt:
          data.trialEndsAt ?? null,
        suspendedAt:
          data.suspendedAt ?? null,
        canceledAt:
          data.canceledAt ?? null,
        cancellationReason:
          data.cancellationReason ?? null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  async changePlan(id, data) {
    const updateData = {
      planId: data.planId,
      billingCycle:
        data.billingCycle,
      priceInCents:
        data.priceInCents,
    };

    const optionalFields = [
      "currentPeriodStart",
      "currentPeriodEnd",
      "dueDay",
      "nextDueDate",
      "billingContactName",
      "billingEmail",
      "billingPhone",
      "gracePeriodDays",
      "autoSuspend",
    ];

    for (const field of optionalFields) {
      if (
        data[field] !== undefined
      ) {
        updateData[field] =
          data[field];
      }
    }

    const result =
      await this.updateMany(
        {
          id,
          status: {
            not: "CANCELED",
          },
        },
        updateData
      );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  async activate(
    id,
    data = {}
  ) {
    const updateData = {
      status: "ACTIVE",
      suspendedAt: null,
      canceledAt: null,
      cancellationReason: null,
    };

    for (
      const field of [
        "currentPeriodStart",
        "currentPeriodEnd",
        "nextDueDate",
        "trialEndsAt",
      ]
    ) {
      if (
        data[field] !== undefined
      ) {
        updateData[field] =
          data[field];
      }
    }

    const result =
      await this.updateMany(
        {
          id,
          status: {
            in: [
              "TRIAL",
              "OVERDUE",
              "SUSPENDED",
            ],
          },
        },
        updateData
      );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  async markAsOverdue(id) {
    const result =
      await this.updateMany(
        {
          id,
          status: {
            in: [
              "TRIAL",
              "ACTIVE",
            ],
          },
        },
        {
          status: "OVERDUE",
        }
      );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  async suspend(id) {
    const result =
      await this.updateMany(
        {
          id,
          status: {
            in: [
              "TRIAL",
              "ACTIVE",
              "OVERDUE",
            ],
          },
        },
        {
          status: "SUSPENDED",
          suspendedAt:
            new Date(),
        }
      );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  async cancel(
    id,
    cancellationReason = null
  ) {
    const result =
      await this.updateMany(
        {
          id,
          status: {
            not: "CANCELED",
          },
        },
        {
          status: "CANCELED",
          canceledAt:
            new Date(),
          cancellationReason:
            cancellationReason ||
            null,
        }
      );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  async renewPeriod(
    id,
    currentPeriodStart,
    currentPeriodEnd
  ) {
    const result =
      await this.updateMany(
        {
          id,
          status: {
            in: [
              "ACTIVE",
              "OVERDUE",
              "SUSPENDED",
            ],
          },
        },
        {
          status: "ACTIVE",
          currentPeriodStart,
          currentPeriodEnd,
          nextDueDate:
            currentPeriodEnd,
          suspendedAt: null,
          canceledAt: null,
          cancellationReason: null,
        }
      );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  async updateTrial(
    id,
    trialEndsAt,
    currentPeriodEnd
  ) {
    const result =
      await this.updateMany(
        {
          id,
          status: "TRIAL",
        },
        {
          trialEndsAt,
          currentPeriodEnd,
          nextDueDate:
            currentPeriodEnd,
        }
      );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  async countAll() {
    return this.count();
  }

  async countByStatus(status) {
    return this.count({
      status,
    });
  }

  async countByPlan(planId) {
    return this.count({
      planId,
    });
  }

  async countByCondominium(
    condominiumId
  ) {
    return this.count({
      condominiumId,
    });
  }
}

export default new SubscriptionRepository();
