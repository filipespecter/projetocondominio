import BaseRepository from "./BaseRepository.js";

class CommonAreaRepository extends BaseRepository {
  constructor() {
    super("commonArea");
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

  normalizeOptionalTime(value) {
    if (
      value === undefined ||
      value === null ||
      String(value).trim() === ""
    ) {
      return null;
    }

    return String(value).trim();
  }

  normalizeBoolean(value) {
    if (typeof value === "boolean") {
      return value;
    }

    if (value === 1 || value === "1") {
      return true;
    }

    if (value === 0 || value === "0") {
      return false;
    }

    if (typeof value === "string") {
      const normalized =
        value.trim().toLowerCase();

      if (normalized === "true") {
        return true;
      }

      if (normalized === "false") {
        return false;
      }
    }

    return Boolean(value);
  }

  /**
   * Busca uma área comum pelo ID dentro do condomínio.
   */
  async findById(id, condominiumId) {
    return this.findFirst(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        include: {
          reservations: {
            where: {
              deletedAt: null,
            },
            orderBy: [
              {
                reservationDate: "desc",
              },
              {
                startTime: "asc",
              },
            ],
          },
        },
      }
    );
  }

  /**
   * Lista todas as áreas comuns do condomínio.
   */
  async findByCondominium(condominiumId) {
    return this.findMany(
      {
        condominiumId,
        deletedAt: null,
      },
      {
        orderBy: {
          name: "asc",
        },
      }
    );
  }

  /**
   * Lista somente áreas comuns ativas.
   */
  async findActiveByCondominium(
    condominiumId
  ) {
    return this.findMany(
      {
        condominiumId,
        active: true,
        deletedAt: null,
      },
      {
        orderBy: {
          name: "asc",
        },
      }
    );
  }

  /**
   * Lista somente áreas que exigem reserva.
   */
  async findReservationRequired(
    condominiumId
  ) {
    return this.findMany(
      {
        condominiumId,
        active: true,
        reservationRequired: true,
        deletedAt: null,
      },
      {
        orderBy: {
          name: "asc",
        },
      }
    );
  }

  /**
   * Busca uma área comum pelo nome.
   */
  async findByName(
    condominiumId,
    name
  ) {
    return this.findFirst({
      condominiumId,
      name: String(name).trim(),
      deletedAt: null,
    });
  }

  /**
   * Cria uma área comum vinculada ao condomínio.
   */
  async createForCondominium(
    condominiumId,
    data
  ) {
    return this.create({
      condominiumId,
      name:
        String(data.name).trim(),

      description:
        this.normalizeOptionalText(
          data.description
        ),

      capacity:
        data.capacity !== undefined &&
        data.capacity !== null &&
        data.capacity !== ""
          ? Number(data.capacity)
          : null,

      openingTime:
        this.normalizeOptionalTime(
          data.openingTime
        ),

      closingTime:
        this.normalizeOptionalTime(
          data.closingTime
        ),

      reservationRequired:
        data.reservationRequired ===
        undefined
          ? true
          : this.normalizeBoolean(
              data.reservationRequired
            ),

      active:
        data.active === undefined
          ? true
          : this.normalizeBoolean(
              data.active
            ),

      rules:
        this.normalizeOptionalText(
          data.rules
        ),
    });
  }

  /**
   * Atualiza os dados enviados.
   */
  async updateById(
    id,
    condominiumId,
    data
  ) {
    const updateData = {};

    if (data.name !== undefined) {
      updateData.name =
        String(data.name).trim();
    }

    if (
      data.description !== undefined
    ) {
      updateData.description =
        this.normalizeOptionalText(
          data.description
        );
    }

    if (data.capacity !== undefined) {
      updateData.capacity =
        data.capacity === null ||
        data.capacity === ""
          ? null
          : Number(data.capacity);
    }

    if (
      data.openingTime !== undefined
    ) {
      updateData.openingTime =
        this.normalizeOptionalTime(
          data.openingTime
        );
    }

    if (
      data.closingTime !== undefined
    ) {
      updateData.closingTime =
        this.normalizeOptionalTime(
          data.closingTime
        );
    }

    if (
      data.reservationRequired !==
      undefined
    ) {
      updateData.reservationRequired =
        this.normalizeBoolean(
          data.reservationRequired
        );
    }

    if (data.active !== undefined) {
      updateData.active =
        this.normalizeBoolean(
          data.active
        );
    }

    if (data.rules !== undefined) {
      updateData.rules =
        this.normalizeOptionalText(
          data.rules
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

  async activate(id, condominiumId) {
    const result =
      await this.updateMany(
        {
          id,
          condominiumId,
          deletedAt: null,
        },
        {
          active: true,
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

  async deactivate(
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
          active: false,
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

  async setReservationRequired(
    id,
    condominiumId,
    reservationRequired
  ) {
    const result =
      await this.updateMany(
        {
          id,
          condominiumId,
          deletedAt: null,
        },
        {
          reservationRequired:
            this.normalizeBoolean(
              reservationRequired
            ),
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
          active: false,
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

  async countActiveByCondominium(
    condominiumId
  ) {
    return this.count({
      condominiumId,
      active: true,
      deletedAt: null,
    });
  }

  async countReservationRequired(
    condominiumId
  ) {
    return this.count({
      condominiumId,
      active: true,
      reservationRequired: true,
      deletedAt: null,
    });
  }
}

export default new CommonAreaRepository();
