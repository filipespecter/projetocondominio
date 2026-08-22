import BaseRepository from "./BaseRepository.js";

class PaymentMethodRepository extends BaseRepository {
  constructor() {
    super("paymentMethod");
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
    };
  }

  async findById(id) {
    return this.findFirst(
      {
        id,
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
        orderBy: [
          {
            priority: "asc",
          },
          {
            createdAt: "desc",
          },
        ],
      }
    );
  }

  async findByPriority(
    condominiumId,
    priority
  ) {
    return this.findFirst(
      {
        condominiumId,
        priority,
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  async findActiveByPriority(
    condominiumId,
    priority
  ) {
    return this.findFirst(
      {
        condominiumId,
        priority,
        status: "ACTIVE",
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  async createPaymentMethod(data) {
    return this.create(
      {
        condominiumId:
          data.condominiumId,

        type:
          data.type,

        priority:
          data.priority,

        status:
          data.status ?? "ACTIVE",

        provider:
          data.provider ?? null,

        providerCustomerId:
          data.providerCustomerId ?? null,

        providerPaymentMethodId:
          data.providerPaymentMethodId ?? null,

        providerReference:
          data.providerReference ?? null,

        cardBrand:
          data.cardBrand ?? null,

        cardLast4:
          data.cardLast4 ?? null,

        cardExpirationMonth:
          data.cardExpirationMonth ?? null,

        cardExpirationYear:
          data.cardExpirationYear ?? null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  async updateById(id, data) {
    const updateData = {};

    const allowedFields = [
      "type",
      "priority",
      "status",
      "provider",
      "providerCustomerId",
      "providerPaymentMethodId",
      "providerReference",
      "cardBrand",
      "cardLast4",
      "cardExpirationMonth",
      "cardExpirationYear",
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] =
          data[field];
      }
    }

    const result =
      await this.updateMany(
        {
          id,
          deletedAt: null,
        },
        updateData
      );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  async changeStatus(id, status) {
    return this.updateById(
      id,
      {
        status,
      }
    );
  }

  async softDelete(id) {
    const result =
      await this.updateMany(
        {
          id,
          deletedAt: null,
        },
        {
          status: "INACTIVE",
          deletedAt: new Date(),
        }
      );

    return result.count > 0;
  }
}

export default new PaymentMethodRepository();
