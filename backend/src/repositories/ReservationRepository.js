import BaseRepository from "./BaseRepository.js";

class ReservationRepository extends BaseRepository {
  constructor() {
    super("reservation");
  }

  /**
   * Relacionamentos retornados nas consultas.
   */
  get defaultInclude() {
    return {
      commonArea: true,
      apartment: true,
      requestedBy: true,
      reviewedBy: true,
    };
  }

  /**
   * Busca uma reserva pelo ID dentro do condomínio.
   */
  async findById(id, condominiumId) {
    return this.findFirst(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Lista todas as reservas do condomínio.
   */
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
            reservationDate: "desc",
          },
          {
            startTime: "asc",
          },
        ],
      }
    );
  }

  /**
   * Lista reservas de determinado apartamento.
   */
  async findByApartment(
    apartmentId,
    condominiumId
  ) {
    return this.findMany(
      {
        apartmentId,
        condominiumId,
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
        orderBy: [
          {
            reservationDate: "desc",
          },
          {
            startTime: "asc",
          },
        ],
      }
    );
  }

  /**
   * Lista reservas solicitadas por um usuário.
   *
   * O schema vincula a reserva ao User,
   * e não diretamente ao Resident.
   */
  async findByRequestedUser(
    requestedByUserId,
    condominiumId
  ) {
    return this.findMany(
      {
        requestedByUserId,
        condominiumId,
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
        orderBy: [
          {
            reservationDate: "desc",
          },
          {
            startTime: "asc",
          },
        ],
      }
    );
  }

  /**
   * Lista reservas de determinada área comum.
   */
  async findByCommonArea(
    commonAreaId,
    condominiumId
  ) {
    return this.findMany(
      {
        commonAreaId,
        condominiumId,
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
        orderBy: [
          {
            reservationDate: "asc",
          },
          {
            startTime: "asc",
          },
        ],
      }
    );
  }

  /**
   * Lista reservas por status.
   *
   * Status disponíveis:
   * PENDING
   * APPROVED
   * REJECTED
   * CANCELED
   * COMPLETED
   */
  async findByStatus(condominiumId, status) {
    return this.findMany(
      {
        condominiumId,
        status,
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
        orderBy: [
          {
            reservationDate: "asc",
          },
          {
            startTime: "asc",
          },
        ],
      }
    );
  }

  /**
   * Lista reservas pendentes de análise.
   */
  async findPending(condominiumId) {
    return this.findByStatus(
      condominiumId,
      "PENDING"
    );
  }

  /**
   * Lista reservas de uma data específica.
   */
  async findByDate(
    condominiumId,
    reservationDate
  ) {
    return this.findMany(
      {
        condominiumId,
        reservationDate,
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
        orderBy: {
          startTime: "asc",
        },
      }
    );
  }

  /**
   * Procura conflito de horário na mesma área e data.
   *
   * Reservas rejeitadas, canceladas ou concluídas
   * não impedem uma nova reserva.
   *
   * Os horários serão armazenados no padrão HH:mm.
   * Nesse formato, a comparação textual mantém
   * a ordem cronológica.
   */
  async findConflict({
    condominiumId,
    commonAreaId,
    reservationDate,
    startTime,
    endTime,
    ignoredReservationId = null,
  }) {
    const where = {
      condominiumId,
      commonAreaId,
      reservationDate,
      deletedAt: null,
      status: {
        in: [
          "PENDING",
          "APPROVED",
        ],
      },
      startTime: {
        lt: endTime,
      },
      endTime: {
        gt: startTime,
      },
    };

    if (ignoredReservationId) {
      where.id = {
        not: ignoredReservationId,
      };
    }

    return this.findFirst(
      where,
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Verifica se o usuário já possui uma reserva ativa
   * em determinada data.
   *
   * Essa consulta dará suporte à regra atual do frontend:
   * uma reserva ativa por morador por dia.
   */
  async findActiveByUserAndDate(
    requestedByUserId,
    condominiumId,
    reservationDate,
    ignoredReservationId = null
  ) {
    const where = {
      requestedByUserId,
      condominiumId,
      reservationDate,
      deletedAt: null,
      status: {
        in: [
          "PENDING",
          "APPROVED",
        ],
      },
    };

    if (ignoredReservationId) {
      where.id = {
        not: ignoredReservationId,
      };
    }

    return this.findFirst(
      where,
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Cria uma solicitação de reserva.
   */
  async createForCondominium(
    condominiumId,
    data
  ) {
    return this.create(
      {
        condominiumId,
        commonAreaId: data.commonAreaId,
        apartmentId: data.apartmentId,
        requestedByUserId:
          data.requestedByUserId,
        reservationDate:
          data.reservationDate,
        startTime: data.startTime,
        endTime: data.endTime,
        guestsCount:
          data.guestsCount ?? null,
        purpose: data.purpose ?? null,
        notes: data.notes ?? null,
        status: "PENDING",
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Atualiza uma reserva ainda editável.
   *
   * O Service decidirá quais status permitem edição.
   */
  async updateById(
    id,
    condominiumId,
    data
  ) {
    const updateData = {};

    if (data.commonAreaId !== undefined) {
      updateData.commonAreaId =
        data.commonAreaId;
    }

    if (data.apartmentId !== undefined) {
      updateData.apartmentId =
        data.apartmentId;
    }

    if (
      data.reservationDate !== undefined
    ) {
      updateData.reservationDate =
        data.reservationDate;
    }

    if (data.startTime !== undefined) {
      updateData.startTime =
        data.startTime;
    }

    if (data.endTime !== undefined) {
      updateData.endTime =
        data.endTime;
    }

    if (data.guestsCount !== undefined) {
      updateData.guestsCount =
        data.guestsCount === null ||
        data.guestsCount === ""
          ? null
          : Number(data.guestsCount);
    }

    if (data.purpose !== undefined) {
      updateData.purpose =
        data.purpose || null;
    }

    if (data.notes !== undefined) {
      updateData.notes =
        data.notes || null;
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
   * Aprova uma reserva.
   */
  async approve(
    id,
    condominiumId,
    reviewedByUserId,
    reviewReason = null
  ) {
    return this.review(
      id,
      condominiumId,
      {
        status: "APPROVED",
        reviewedByUserId,
        reviewReason,
      }
    );
  }

  /**
   * Rejeita uma reserva.
   */
  async reject(
    id,
    condominiumId,
    reviewedByUserId,
    reviewReason
  ) {
    return this.review(
      id,
      condominiumId,
      {
        status: "REJECTED",
        reviewedByUserId,
        reviewReason,
      }
    );
  }

  /**
   * Método interno de análise de reserva.
   */
  async review(
    id,
    condominiumId,
    {
      status,
      reviewedByUserId,
      reviewReason,
    }
  ) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        status,
        reviewedByUserId,
        reviewReason:
          reviewReason ?? null,
        reviewedAt: new Date(),
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
   * Cancela uma reserva.
   */
  async cancel(id, condominiumId) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        status: "CANCELED",
        canceledAt: new Date(),
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
   * Marca uma reserva como concluída.
   */
  async complete(id, condominiumId) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        status: "COMPLETED",
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
        deletedAt: new Date(),
      }
    );

    return result.count > 0;
  }

  /**
   * Conta reservas do condomínio.
   */
  async countByCondominium(condominiumId) {
    return this.count({
      condominiumId,
      deletedAt: null,
    });
  }

  /**
   * Conta reservas por status.
   */
  async countByStatus(
    condominiumId,
    status
  ) {
    return this.count({
      condominiumId,
      status,
      deletedAt: null,
    });
  }

  /**
   * Conta reservas pendentes.
   */
  async countPending(condominiumId) {
    return this.countByStatus(
      condominiumId,
      "PENDING"
    );
  }
}

export default new ReservationRepository();