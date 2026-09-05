import BaseRepository from "./BaseRepository.js";

class ChargeRepository extends BaseRepository {
  constructor() {
    super("charge");
  }

  get defaultInclude() {
    return {
      condominium: {
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
        },
      },
      subscription: {
        include: {
          plan: true,
        },
      },
      paymentMethod: true,
      transactions: {
        orderBy: {
          createdAt: "desc",
        },
      },
    };
  }

  async findById(id) {
    return this.findUnique(
      { id },
      { include: this.defaultInclude }
    );
  }

  async findByProviderChargeId(
    provider,
    providerChargeId
  ) {
    return this.findFirst(
      {
        provider,
        providerChargeId,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  async findAllPlatform(filters = {}) {
    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.startDate || filters.endDate) {
      where.dueDate = {};
      if (filters.startDate) where.dueDate.gte = filters.startDate;
      if (filters.endDate) where.dueDate.lte = filters.endDate;
    }
    return this.findMany(where, { include: this.defaultInclude, orderBy: [{ dueDate: "desc" }, { createdAt: "desc" }], take: 1000 });
  }

  async findByCondominium(
    condominiumId
  ) {
    return this.findMany(
      { condominiumId },
      {
        include: this.defaultInclude,
        orderBy: {
          dueDate: "desc",
        },
      }
    );
  }

  async findBySubscription(
    subscriptionId
  ) {
    return this.findMany(
      { subscriptionId },
      {
        include: this.defaultInclude,
        orderBy: {
          dueDate: "desc",
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
          dueDate: "asc",
        },
      }
    );
  }

  async findDueBetween(
    startDate,
    endDate
  ) {
    return this.findMany(
      {
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: [
            "PENDING",
            "OVERDUE",
          ],
        },
      },
      {
        include: this.defaultInclude,
        orderBy: {
          dueDate: "asc",
        },
      }
    );
  }

  async findPendingPastDue(
    referenceDate = new Date()
  ) {
    return this.findMany(
      {
        status: "PENDING",
        dueDate: {
          lt: referenceDate,
        },
      },
      {
        include: this.defaultInclude,
        orderBy: {
          dueDate: "asc",
        },
      }
    );
  }

  async findOpenOverdue() {
    return this.findMany(
      {
        status: "OVERDUE",
      },
      {
        include: this.defaultInclude,
        orderBy: {
          dueDate: "asc",
        },
      }
    );
  }

  async countOpenBySubscription(
    subscriptionId
  ) {
    return this.count({
      subscriptionId,
      status: {
        in: [
          "PENDING",
          "OVERDUE",
          "FAILED",
        ],
      },
    });
  }

  async findOldestOpenBySubscription(
    subscriptionId
  ) {
    return this.findFirst(
      {
        subscriptionId,
        status: {
          in: [
            "PENDING",
            "OVERDUE",
            "FAILED",
          ],
        },
      },
      {
        include: this.defaultInclude,
        orderBy: {
          dueDate: "asc",
        },
      }
    );
  }

  async createCharge(data) {
    return this.create(
      {
        condominiumId:
          data.condominiumId,
        subscriptionId:
          data.subscriptionId,
        paymentMethodId:
          data.paymentMethodId ?? null,
        status:
          data.status ?? "PENDING",
        amountInCents:
          data.amountInCents,
        dueDate:
          data.dueDate,
        provider:
          data.provider ?? null,
        providerChargeId:
          data.providerChargeId ?? null,
        requestId:
          data.requestId ?? null,
        paymentUrl:
          data.paymentUrl ?? null,
        boletoBarcode:
          data.boletoBarcode ?? null,
        pixCopyPaste:
          data.pixCopyPaste ?? null,
        expiresAt:
          data.expiresAt ?? null,
        metadata:
          data.metadata ?? null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  async updateProviderData(
    id,
    data
  ) {
    const result =
      await this.updateMany(
        { id },
        {
          provider:
            data.provider,
          providerChargeId:
            data.providerChargeId,
          paymentMethodId:
            data.paymentMethodId,
          paymentUrl:
            data.paymentUrl,
          boletoBarcode:
            data.boletoBarcode,
          pixCopyPaste:
            data.pixCopyPaste,
          expiresAt:
            data.expiresAt,
          metadata:
            data.metadata,
        }
      );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  async markPaid(
    id,
    paidAt = new Date()
  ) {
    const result =
      await this.updateMany(
        {
          id,
          status: {
            in: [
              "PENDING",
              "OVERDUE",
              "FAILED",
            ],
          },
        },
        {
          status: "PAID",
          paidAt,
          failedAt: null,
          failureReason: null,
        }
      );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  async markOverdue(
    id,
    overdueAt = new Date()
  ) {
    const result =
      await this.updateMany(
        {
          id,
          status: "PENDING",
        },
        {
          status: "OVERDUE",
          overdueAt,
        }
      );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  async markFailed(
    id,
    failureReason = null
  ) {
    const result =
      await this.updateMany(
        {
          id,
          status: {
            in: [
              "PENDING",
              "OVERDUE",
            ],
          },
        },
        {
          status: "FAILED",
          failedAt: new Date(),
          failureReason,
        }
      );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  async cancel(id) {
    const result =
      await this.updateMany(
        {
          id,
          status: {
            in: [
              "PENDING",
              "OVERDUE",
              "FAILED",
            ],
          },
        },
        {
          status: "CANCELED",
          canceledAt: new Date(),
        }
      );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  async markRefunded(id) {
    const result =
      await this.updateMany(
        {
          id,
          status: "PAID",
        },
        {
          status: "REFUNDED",
          refundedAt: new Date(),
        }
      );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  async countByStatus(status) {
    return this.count({
      status,
    });
  }
}

export default new ChargeRepository();
