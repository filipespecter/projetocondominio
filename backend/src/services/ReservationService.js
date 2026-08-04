import BaseService from "./BaseService.js";
import AuditLogService from "./AuditLogService.js";
import NotificationService from "./NotificationService.js";

import reservationRepository from "../repositories/ReservationRepository.js";
import commonAreaRepository from "../repositories/CommonAreaRepository.js";
import residentRepository from "../repositories/ResidentRepository.js";
import apartmentRepository from "../repositories/ApartmentRepository.js";

import { ApiError } from "../utils/ApiError.js";

class ReservationService extends BaseService {
  constructor() {
    super(reservationRepository);
  }

  /**
   * Status reconhecidos pelo schema.
   */
  validateStatus(status) {
    const allowedStatuses = [
      "PENDING",
      "APPROVED",
      "REJECTED",
      "CANCELED",
      "COMPLETED",
    ];

    if (!allowedStatuses.includes(status)) {
      throw new ApiError(
        "Status de reserva inválido.",
        400
      );
    }
  }

  /**
   * Valida um horário no formato HH:mm.
   */
  validateTime(time, fieldName) {
    if (!time) {
      throw new ApiError(
        `${fieldName} é obrigatório.`,
        400
      );
    }

    const normalizedTime = String(time).trim();

    const timePattern =
      /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (!timePattern.test(normalizedTime)) {
      throw new ApiError(
        `${fieldName} deve estar no formato HH:mm.`,
        400
      );
    }

    return normalizedTime;
  }

  /**
   * Valida o intervalo de horário.
   */
  validateTimeRange(startTime, endTime) {
    const normalizedStartTime =
      this.validateTime(
        startTime,
        "O horário inicial"
      );

    const normalizedEndTime =
      this.validateTime(
        endTime,
        "O horário final"
      );

    if (
      normalizedStartTime >=
      normalizedEndTime
    ) {
      throw new ApiError(
        "O horário final deve ser posterior ao horário inicial.",
        400
      );
    }

    return {
      startTime: normalizedStartTime,
      endTime: normalizedEndTime,
    };
  }

  /**
   * Converte a data informada para o padrão
   * utilizado pelo campo Date do Prisma.
   */
  normalizeReservationDate(value) {
    if (!value) {
      throw new ApiError(
        "A data da reserva é obrigatória.",
        400
      );
    }

    const reservationDate =
      value instanceof Date
        ? new Date(value)
        : new Date(`${value}T00:00:00`);

    if (
      Number.isNaN(
        reservationDate.getTime()
      )
    ) {
      throw new ApiError(
        "Data da reserva inválida.",
        400
      );
    }

    reservationDate.setHours(
      0,
      0,
      0,
      0
    );

    return reservationDate;
  }

  /**
   * Valida a quantidade de convidados.
   */
  normalizeGuestsCount(guestsCount) {
    if (
      guestsCount === undefined ||
      guestsCount === null ||
      guestsCount === ""
    ) {
      return null;
    }

    const normalizedGuestsCount =
      Number(guestsCount);

    if (
      !Number.isInteger(
        normalizedGuestsCount
      ) ||
      normalizedGuestsCount < 0
    ) {
      throw new ApiError(
        "A quantidade de convidados deve ser um número inteiro igual ou maior que zero.",
        400
      );
    }

    return normalizedGuestsCount;
  }

  /**
   * Busca uma reserva pelo ID.
   */
  async findById(id, condominiumId) {
    const reservation =
      await reservationRepository.findById(
        id,
        condominiumId
      );

    if (!reservation) {
      throw new ApiError(
        "Reserva não encontrada.",
        404
      );
    }

    return reservation;
  }

  /**
   * Lista todas as reservas do condomínio.
   */
  async findAll(condominiumId) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    return reservationRepository
      .findByCondominium(
        condominiumId
      );
  }

  /**
   * Lista reservas por status.
   */
  async findByStatus(
    condominiumId,
    status
  ) {
    this.validateStatus(status);

    return reservationRepository
      .findByStatus(
        condominiumId,
        status
      );
  }

  /**
   * Lista reservas de um apartamento.
   */
  async findByApartment(
    apartmentId,
    condominiumId
  ) {
    const apartment =
      await apartmentRepository.findById(
        apartmentId,
        condominiumId
      );

    if (!apartment) {
      throw new ApiError(
        "Apartamento não encontrado.",
        404
      );
    }

    return reservationRepository
      .findByApartment(
        apartmentId,
        condominiumId
      );
  }

  /**
   * Lista as reservas solicitadas por um usuário.
   */
  async findByUser(
    requestedByUserId,
    condominiumId
  ) {
    if (!requestedByUserId) {
      throw new ApiError(
        "Usuário não identificado.",
        400
      );
    }

    return reservationRepository
      .findByRequestedUser(
        requestedByUserId,
        condominiumId
      );
  }

  /**
   * Confere se a área comum existe, está ativa
   * e pertence ao condomínio.
   */
  async validateCommonArea(
    commonAreaId,
    condominiumId
  ) {
    if (!commonAreaId) {
      throw new ApiError(
        "A área comum é obrigatória.",
        400
      );
    }

    const commonArea =
      await commonAreaRepository.findById(
        commonAreaId,
        condominiumId
      );

    if (!commonArea) {
      throw new ApiError(
        "Área comum não encontrada.",
        404
      );
    }

    if (!commonArea.active) {
      throw new ApiError(
        "Esta área comum está desativada.",
        400
      );
    }

    return commonArea;
  }

  /**
   * Confere o perfil de morador do usuário.
   */
  async validateResident(
    requestedByUserId,
    condominiumId
  ) {
    const resident =
      await residentRepository.findByUserId(
        requestedByUserId,
        condominiumId
      );

    if (!resident) {
      throw new ApiError(
        "Perfil de morador não encontrado.",
        404
      );
    }

    if (!resident.canReserve) {
      throw new ApiError(
        "Este morador não possui permissão para realizar reservas.",
        403
      );
    }

    return resident;
  }

  /**
   * Confere se o horário solicitado está dentro
   * do funcionamento da área comum.
   */
  validateCommonAreaHours(
    commonArea,
    startTime,
    endTime
  ) {
    if (
      commonArea.openingTime &&
      startTime < commonArea.openingTime
    ) {
      throw new ApiError(
        `A área comum abre às ${commonArea.openingTime}.`,
        400
      );
    }

    if (
      commonArea.closingTime &&
      endTime > commonArea.closingTime
    ) {
      throw new ApiError(
        `A área comum fecha às ${commonArea.closingTime}.`,
        400
      );
    }
  }

  /**
   * Confere a capacidade da área comum.
   */
  validateCapacity(
    commonArea,
    guestsCount
  ) {
    if (
      commonArea.capacity !== null &&
      commonArea.capacity !== undefined &&
      guestsCount !== null &&
      guestsCount > commonArea.capacity
    ) {
      throw new ApiError(
        `A quantidade de convidados ultrapassa a capacidade máxima de ${commonArea.capacity} pessoa(s).`,
        400
      );
    }
  }

  /**
   * Confere conflito de horário.
   */
  async validateConflict({
    condominiumId,
    commonAreaId,
    reservationDate,
    startTime,
    endTime,
    ignoredReservationId = null,
  }) {
    const conflict =
      await reservationRepository.findConflict({
        condominiumId,
        commonAreaId,
        reservationDate,
        startTime,
        endTime,
        ignoredReservationId,
      });

    if (conflict) {
      throw new ApiError(
        "Já existe uma reserva pendente ou aprovada para esta área neste horário.",
        409
      );
    }
  }

  /**
   * Confere a regra atual do InfinityCondo:
   * uma reserva ativa por usuário por dia.
   */
  async validateDailyLimit({
    requestedByUserId,
    condominiumId,
    reservationDate,
    ignoredReservationId = null,
  }) {
    const existingReservation =
      await reservationRepository
        .findActiveByUserAndDate(
          requestedByUserId,
          condominiumId,
          reservationDate,
          ignoredReservationId
        );

    if (existingReservation) {
      throw new ApiError(
        "O morador já possui uma reserva pendente ou aprovada nesta data.",
        409
      );
    }
  }

  /**
   * Cria uma solicitação de reserva.
   *
   * O requestedByUserId deve vir do usuário
   * autenticado, e não livremente do frontend.
   */
  async create(
    condominiumId,
    data,
    authenticatedUser,
    requestContext = null
  ) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    if (!authenticatedUser?.id) {
      throw new ApiError(
        "Usuário autenticado não identificado.",
        401
      );
    }

    const commonArea =
      await this.validateCommonArea(
        data.commonAreaId,
        condominiumId
      );

    const resident =
      await this.validateResident(
        authenticatedUser.id,
        condominiumId
      );

    const reservationDate =
      this.normalizeReservationDate(
        data.reservationDate
      );

    const {
      startTime,
      endTime,
    } = this.validateTimeRange(
      data.startTime,
      data.endTime
    );

    const guestsCount =
      this.normalizeGuestsCount(
        data.guestsCount
      );

    this.validateCommonAreaHours(
      commonArea,
      startTime,
      endTime
    );

    this.validateCapacity(
      commonArea,
      guestsCount
    );

    await this.validateDailyLimit({
      requestedByUserId:
        authenticatedUser.id,
      condominiumId,
      reservationDate,
    });

    await this.validateConflict({
      condominiumId,
      commonAreaId:
        commonArea.id,
      reservationDate,
      startTime,
      endTime,
    });

    const reservation =
      await reservationRepository
        .createForCondominium(
          condominiumId,
          {
            commonAreaId:
              commonArea.id,

            apartmentId:
              resident.apartmentId,

            requestedByUserId:
              authenticatedUser.id,

            reservationDate,
            startTime,
            endTime,
            guestsCount,

            purpose:
              data.purpose ?? null,

            notes:
              data.notes ?? null,
          }
        );

    await AuditLogService.logCreate({
      condominiumId,
      user: authenticatedUser,
      module: "RESERVATION",
      referenceId: reservation.id,
      afterData: reservation,
      details:
        "Solicitação de reserva criada.",
      requestContext,
    });

    return reservation;
  }

  /**
   * Atualiza uma reserva pendente.
   */
  async update(
    id,
    condominiumId,
    data,
    authenticatedUser,
    requestContext = null
  ) {
    const before =
      await this.findById(
        id,
        condominiumId
      );

    if (before.status !== "PENDING") {
      throw new ApiError(
        "Somente reservas pendentes podem ser editadas.",
        409
      );
    }

    if (
      authenticatedUser?.role ===
        "RESIDENT" &&
      before.requestedByUserId !==
        authenticatedUser.id
    ) {
      throw new ApiError(
        "Você não possui permissão para alterar esta reserva.",
        403
      );
    }

    const commonAreaId =
      data.commonAreaId ??
      before.commonAreaId;

    const commonArea =
      await this.validateCommonArea(
        commonAreaId,
        condominiumId
      );

    const reservationDate =
      data.reservationDate !== undefined
        ? this.normalizeReservationDate(
            data.reservationDate
          )
        : before.reservationDate;

    const {
      startTime,
      endTime,
    } = this.validateTimeRange(
      data.startTime ??
        before.startTime,
      data.endTime ??
        before.endTime
    );

    const guestsCount =
      data.guestsCount !== undefined
        ? this.normalizeGuestsCount(
            data.guestsCount
          )
        : before.guestsCount;

    this.validateCommonAreaHours(
      commonArea,
      startTime,
      endTime
    );

    this.validateCapacity(
      commonArea,
      guestsCount
    );

    await this.validateDailyLimit({
      requestedByUserId:
        before.requestedByUserId,
      condominiumId,
      reservationDate,
      ignoredReservationId: id,
    });

    await this.validateConflict({
      condominiumId,
      commonAreaId,
      reservationDate,
      startTime,
      endTime,
      ignoredReservationId: id,
    });

    const updated =
      await reservationRepository
        .updateById(
          id,
          condominiumId,
          {
            commonAreaId,
            apartmentId:
              before.apartmentId,
            reservationDate,
            startTime,
            endTime,
            guestsCount,
            purpose:
              data.purpose !== undefined
                ? data.purpose
                : before.purpose,
            notes:
              data.notes !== undefined
                ? data.notes
                : before.notes,
          }
        );

    if (!updated) {
      throw new ApiError(
        "Reserva não encontrada.",
        404
      );
    }

    await AuditLogService.logUpdate({
      condominiumId,
      user: authenticatedUser,
      module: "RESERVATION",
      referenceId: id,
      beforeData: before,
      afterData: updated,
      details:
        "Solicitação de reserva atualizada.",
      requestContext,
    });

    return updated;
  }

  /**
   * Aprova uma reserva.
   */
  async approve(
    id,
    condominiumId,
    authenticatedUser,
    reviewReason = null,
    requestContext = null
  ) {
    const before =
      await this.findById(
        id,
        condominiumId
      );

    if (before.status !== "PENDING") {
      throw new ApiError(
        "Somente reservas pendentes podem ser aprovadas.",
        409
      );
    }

    await this.validateConflict({
      condominiumId,
      commonAreaId:
        before.commonAreaId,
      reservationDate:
        before.reservationDate,
      startTime:
        before.startTime,
      endTime:
        before.endTime,
      ignoredReservationId: id,
    });

    const reservation =
      await reservationRepository.approve(
        id,
        condominiumId,
        authenticatedUser.id,
        reviewReason
      );

    if (!reservation) {
      throw new ApiError(
        "Reserva não encontrada.",
        404
      );
    }

    await NotificationService
      .notifyReservationStatus({
        condominiumId,
        recipientUserId:
          before.requestedByUserId,
        reservationId: id,
        status: "APPROVED",
      });

    await AuditLogService
      .logStatusChange({
        condominiumId,
        user: authenticatedUser,
        module: "RESERVATION",
        referenceId: id,
        previousStatus:
          before.status,
        newStatus:
          reservation.status,
        details:
          "Reserva aprovada.",
        requestContext,
      });

    return reservation;
  }

  /**
   * Rejeita uma reserva.
   */
  async reject(
    id,
    condominiumId,
    reviewReason,
    authenticatedUser,
    requestContext = null
  ) {
    const before =
      await this.findById(
        id,
        condominiumId
      );

    if (before.status !== "PENDING") {
      throw new ApiError(
        "Somente reservas pendentes podem ser rejeitadas.",
        409
      );
    }

    if (!reviewReason) {
      throw new ApiError(
        "O motivo da rejeição é obrigatório.",
        400
      );
    }

    const reservation =
      await reservationRepository.reject(
        id,
        condominiumId,
        authenticatedUser.id,
        String(reviewReason).trim()
      );

    if (!reservation) {
      throw new ApiError(
        "Reserva não encontrada.",
        404
      );
    }

    await NotificationService
      .notifyReservationStatus({
        condominiumId,
        recipientUserId:
          before.requestedByUserId,
        reservationId: id,
        status: "REJECTED",
      });

    await AuditLogService
      .logStatusChange({
        condominiumId,
        user: authenticatedUser,
        module: "RESERVATION",
        referenceId: id,
        previousStatus:
          before.status,
        newStatus:
          reservation.status,
        details:
          "Reserva rejeitada.",
        requestContext,
      });

    return reservation;
  }

  /**
   * Cancela uma reserva.
   */
  async cancel(
    id,
    condominiumId,
    authenticatedUser,
    requestContext = null
  ) {
    const before =
      await this.findById(
        id,
        condominiumId
      );

    if (
      ![
        "PENDING",
        "APPROVED",
      ].includes(before.status)
    ) {
      throw new ApiError(
        "Esta reserva não pode mais ser cancelada.",
        409
      );
    }

    if (
      authenticatedUser?.role ===
        "RESIDENT" &&
      before.requestedByUserId !==
        authenticatedUser.id
    ) {
      throw new ApiError(
        "Você não possui permissão para cancelar esta reserva.",
        403
      );
    }

    const reservation =
      await reservationRepository.cancel(
        id,
        condominiumId
      );

    if (!reservation) {
      throw new ApiError(
        "Reserva não encontrada.",
        404
      );
    }

    await NotificationService
      .notifyReservationStatus({
        condominiumId,
        recipientUserId:
          before.requestedByUserId,
        reservationId: id,
        status: "CANCELED",
      });

    await AuditLogService
      .logStatusChange({
        condominiumId,
        user: authenticatedUser,
        module: "RESERVATION",
        referenceId: id,
        previousStatus:
          before.status,
        newStatus:
          reservation.status,
        details:
          "Reserva cancelada.",
        requestContext,
      });

    return reservation;
  }

  /**
   * Marca uma reserva aprovada como concluída.
   */
  async complete(
    id,
    condominiumId,
    authenticatedUser,
    requestContext = null
  ) {
    const before =
      await this.findById(
        id,
        condominiumId
      );

    if (before.status !== "APPROVED") {
      throw new ApiError(
        "Somente reservas aprovadas podem ser concluídas.",
        409
      );
    }

    const reservation =
      await reservationRepository.complete(
        id,
        condominiumId
      );

    if (!reservation) {
      throw new ApiError(
        "Reserva não encontrada.",
        404
      );
    }

    await NotificationService
      .notifyReservationStatus({
        condominiumId,
        recipientUserId:
          before.requestedByUserId,
        reservationId: id,
        status: "COMPLETED",
      });

    await AuditLogService
      .logStatusChange({
        condominiumId,
        user: authenticatedUser,
        module: "RESERVATION",
        referenceId: id,
        previousStatus:
          before.status,
        newStatus:
          reservation.status,
        details:
          "Reserva concluída.",
        requestContext,
      });

    return reservation;
  }

  /**
   * Exclusão lógica.
   */
  async remove(
    id,
    condominiumId,
    authenticatedUser,
    requestContext = null
  ) {
    const before =
      await this.findById(
        id,
        condominiumId
      );

    if (
      ![
        "REJECTED",
        "CANCELED",
        "COMPLETED",
      ].includes(before.status)
    ) {
      throw new ApiError(
        "Somente reservas rejeitadas, canceladas ou concluídas podem ser removidas.",
        409
      );
    }

    const deleted =
      await reservationRepository.softDelete(
        id,
        condominiumId
      );

    if (!deleted) {
      throw new ApiError(
        "Não foi possível remover a reserva.",
        400
      );
    }

    await AuditLogService.logDelete({
      condominiumId,
      user: authenticatedUser,
      module: "RESERVATION",
      referenceId: id,
      beforeData: before,
      details:
        "Reserva removida logicamente.",
      requestContext,
    });

    return {
      message:
        "Reserva removida com sucesso.",
    };
  }

  /**
   * Estatísticas para dashboard e BI.
   */
  async statistics(condominiumId) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    const [
      total,
      pending,
      approved,
      rejected,
      canceled,
      completed,
    ] = await Promise.all([
      reservationRepository
        .countByCondominium(
          condominiumId
        ),

      reservationRepository
        .countByStatus(
          condominiumId,
          "PENDING"
        ),

      reservationRepository
        .countByStatus(
          condominiumId,
          "APPROVED"
        ),

      reservationRepository
        .countByStatus(
          condominiumId,
          "REJECTED"
        ),

      reservationRepository
        .countByStatus(
          condominiumId,
          "CANCELED"
        ),

      reservationRepository
        .countByStatus(
          condominiumId,
          "COMPLETED"
        ),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
      canceled,
      completed,
    };
  }
}

export default new ReservationService();