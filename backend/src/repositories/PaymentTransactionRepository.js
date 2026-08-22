import BaseRepository from "./BaseRepository.js";

class PaymentTransactionRepository extends BaseRepository {
  constructor() {
    super("paymentTransaction");
  }

  get defaultInclude() {
    return {
      charge: {
        include: {
          condominium: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          subscription: {
            include: {
              plan: true,
            },
          },
          paymentMethod: true,
        },
      },
    };
  }

  async findById(id) {
    return this.findUnique(
      {
        id,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  async findByCharge(chargeId) {
    return this.findMany(
      {
        chargeId,
      },
      {
        include: this.defaultInclude,
        orderBy: {
          createdAt: "desc",
        },
      }
    );
  }

  async findByProviderPaymentId(
    provider,
    providerPaymentId
  ) {
    return this.findFirst(
      {
        provider,
        providerPaymentId,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  async createTransaction(data) {
    return this.create(
      {
        chargeId:
          data.chargeId,
        status:
          data.status ?? "PENDING",
        amountInCents:
          data.amountInCents,
        provider:
          data.provider ?? null,
        providerPaymentId:
          data.providerPaymentId ?? null,
        requestId:
          data.requestId ?? null,
        failureReason:
          data.failureReason ?? null,
        metadata:
          data.metadata ?? null,
        processedAt:
          data.processedAt ?? null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  async updateStatus(
    id,
    status,
    data = {}
  ) {
    const result =
      await this.updateMany(
        {
          id,
        },
        {
          status,
          provider:
            data.provider,
          providerPaymentId:
            data.providerPaymentId,
          failureReason:
            data.failureReason,
          metadata:
            data.metadata,
          processedAt:
            data.processedAt ??
            new Date(),
        }
      );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }
}

export default new PaymentTransactionRepository();
