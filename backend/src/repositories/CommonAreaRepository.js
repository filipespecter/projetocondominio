import BaseRepository from "./BaseRepository.js";

class CommonAreaRepository extends BaseRepository {
  constructor() {
    super("commonArea");
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
   *
   * O schema garante que o nome seja único
   * dentro do condomínio.
   */
  async findByName(condominiumId, name) {
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
      name: String(data.name).trim(),
      description:
        data.description ?? null,
      capacity:
        data.capacity !== undefined &&
        data.capacity !== null &&
        data.capacity !== ""
          ? Number(data.capacity)
          : null,
      openingTime:
        data.openingTime ?? null,
      closingTime:
        data.closingTime ?? null,
      reservationRequired:
        data.reservationRequired ?? true,
      active:
        data.active ?? true,
      rules:
        data.rules ?? null,
    });
  }

  /**
   * Atualiza os dados enviados.
   *
   * Campos ausentes não serão alterados.
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

    if (data.description !== undefined) {
      updateData.description =
        data.description || null;
    }

    if (data.capacity !== undefined) {
      updateData.capacity =
        data.capacity === null ||
        data.capacity === ""
          ? null
          : Number(data.capacity);
    }

    if (data.openingTime !== undefined) {
      updateData.openingTime =
        data.openingTime || null;
    }

    if (data.closingTime !== undefined) {
      updateData.closingTime =
        data.closingTime || null;
    }

    if (
      data.reservationRequired !==
      undefined
    ) {
      updateData.reservationRequired =
        Boolean(data.reservationRequired);
    }

    if (data.active !== undefined) {
      updateData.active =
        Boolean(data.active);
    }

    if (data.rules !== undefined) {
      updateData.rules =
        data.rules || null;
    }

    const result = await this.updateMany(
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

  /**
   * Ativa uma área comum.
   */
  async activate(id, condominiumId) {
    const result = await this.updateMany(
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

  /**
   * Desativa uma área comum.
   *
   * A área permanece no banco e mantém
   * o histórico de reservas.
   */
  async deactivate(id, condominiumId) {
    const result = await this.updateMany(
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

  /**
   * Altera se a área exige reserva prévia.
   */
  async setReservationRequired(
    id,
    condominiumId,
    reservationRequired
  ) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        reservationRequired:
          Boolean(reservationRequired),
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

  /**
   * Exclusão lógica.
   */
  async softDelete(id, condominiumId) {
    const result = await this.updateMany(
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

  /**
   * Conta todas as áreas comuns.
   */
  async countByCondominium(
    condominiumId
  ) {
    return this.count({
      condominiumId,
      deletedAt: null,
    });
  }

  /**
   * Conta apenas áreas ativas.
   */
  async countActiveByCondominium(
    condominiumId
  ) {
    return this.count({
      condominiumId,
      active: true,
      deletedAt: null,
    });
  }

  /**
   * Conta áreas que exigem reserva.
   */
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