import BaseService from "./BaseService.js";
import AuditLogService from "./AuditLogService.js";

import commonAreaRepository from "../repositories/CommonAreaRepository.js";

import { ApiError } from "../utils/ApiError.js";

class CommonAreaService extends BaseService {
  constructor() {
    super(commonAreaRepository);
  }

  /**
   * Converte capacidade para número inteiro.
   */
  normalizeCapacity(capacity) {
    if (
      capacity === undefined ||
      capacity === null ||
      capacity === ""
    ) {
      return null;
    }

    const normalizedCapacity = Number(capacity);

    if (
      !Number.isInteger(normalizedCapacity) ||
      normalizedCapacity <= 0
    ) {
      throw new ApiError(
        "A capacidade deve ser um número inteiro maior que zero.",
        400
      );
    }

    return normalizedCapacity;
  }

  /**
   * Valida horário no formato HH:mm.
   */
  validateTime(time, fieldName) {
    if (!time) {
      return null;
    }

    const normalizedTime =
      String(time).trim();

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
   * Valida o intervalo de funcionamento.
   */
  validateOperatingHours(
    openingTime,
    closingTime
  ) {
    const normalizedOpeningTime =
      this.validateTime(
        openingTime,
        "O horário de abertura"
      );

    const normalizedClosingTime =
      this.validateTime(
        closingTime,
        "O horário de fechamento"
      );

    if (
      normalizedOpeningTime &&
      normalizedClosingTime &&
      normalizedOpeningTime >=
        normalizedClosingTime
    ) {
      throw new ApiError(
        "O horário de fechamento deve ser posterior ao horário de abertura.",
        400
      );
    }

    return {
      openingTime:
        normalizedOpeningTime,
      closingTime:
        normalizedClosingTime,
    };
  }

  /**
   * Busca uma área comum pelo ID.
   */
  async findById(id, condominiumId) {
    const commonArea =
      await commonAreaRepository.findById(
        id,
        condominiumId
      );

    if (!commonArea) {
      throw new ApiError(
        "Área comum não encontrada.",
        404
      );
    }

    return commonArea;
  }

  /**
   * Lista todas as áreas comuns.
   */
  async findAll(condominiumId) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    return commonAreaRepository
      .findByCondominium(
        condominiumId
      );
  }

  /**
   * Lista somente áreas ativas.
   */
  async findActive(condominiumId) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    return commonAreaRepository
      .findActiveByCondominium(
        condominiumId
      );
  }

  /**
   * Lista áreas que exigem reserva prévia.
   */
  async findReservationRequired(
    condominiumId
  ) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    return commonAreaRepository
      .findReservationRequired(
        condominiumId
      );
  }

  /**
   * Valida se já existe outra área com o mesmo nome.
   */
  async validateUniqueName(
    condominiumId,
    name,
    ignoredCommonAreaId = null
  ) {
    const normalizedName =
      String(name).trim();

    const existingArea =
      await commonAreaRepository.findByName(
        condominiumId,
        normalizedName
      );

    if (
      existingArea &&
      existingArea.id !==
        ignoredCommonAreaId
    ) {
      throw new ApiError(
        "Já existe uma área comum com este nome.",
        409
      );
    }

    return normalizedName;
  }

  /**
   * Cria uma área comum.
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

    if (!data.name) {
      throw new ApiError(
        "O nome da área comum é obrigatório.",
        400
      );
    }

    const name =
      await this.validateUniqueName(
        condominiumId,
        data.name
      );

    const capacity =
      this.normalizeCapacity(
        data.capacity
      );

    const {
      openingTime,
      closingTime,
    } = this.validateOperatingHours(
      data.openingTime,
      data.closingTime
    );

    const commonArea =
      await commonAreaRepository
        .createForCondominium(
          condominiumId,
          {
            name,
            description:
              data.description ?? null,
            capacity,
            openingTime,
            closingTime,
            reservationRequired:
              data.reservationRequired ??
              true,
            active:
              data.active ?? true,
            rules:
              data.rules ?? null,
          }
        );

    await AuditLogService.logCreate({
      condominiumId,
      user: authenticatedUser,
      module: "COMMON_AREA",
      referenceId: commonArea.id,
      afterData: commonArea,
      details:
        "Área comum cadastrada.",
      requestContext,
    });

    return commonArea;
  }

  /**
   * Atualiza uma área comum.
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

    const updateData = {
      ...data,
    };

    if (data.name !== undefined) {
      updateData.name =
        await this.validateUniqueName(
          condominiumId,
          data.name,
          id
        );
    }

    if (data.capacity !== undefined) {
      updateData.capacity =
        this.normalizeCapacity(
          data.capacity
        );
    }

    if (
      data.openingTime !== undefined ||
      data.closingTime !== undefined
    ) {
      const {
        openingTime,
        closingTime,
      } = this.validateOperatingHours(
        data.openingTime !== undefined
          ? data.openingTime
          : before.openingTime,

        data.closingTime !== undefined
          ? data.closingTime
          : before.closingTime
      );

      updateData.openingTime =
        openingTime;

      updateData.closingTime =
        closingTime;
    }

    delete updateData.condominiumId;
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.deletedAt;
    delete updateData.reservations;

    const updated =
      await commonAreaRepository
        .updateById(
          id,
          condominiumId,
          updateData
        );

    if (!updated) {
      throw new ApiError(
        "Área comum não encontrada.",
        404
      );
    }

    await AuditLogService.logUpdate({
      condominiumId,
      user: authenticatedUser,
      module: "COMMON_AREA",
      referenceId: id,
      beforeData: before,
      afterData: updated,
      details:
        "Área comum atualizada.",
      requestContext,
    });

    return updated;
  }

  /**
   * Ativa uma área comum.
   */
  async activate(
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

    if (before.active) {
      throw new ApiError(
        "A área comum já está ativa.",
        400
      );
    }

    const updated =
      await commonAreaRepository.activate(
        id,
        condominiumId
      );

    await AuditLogService.logStatusChange({
      condominiumId,
      user: authenticatedUser,
      module: "COMMON_AREA",
      referenceId: id,
      previousStatus: "INACTIVE",
      newStatus: "ACTIVE",
      details:
        "Área comum ativada.",
      requestContext,
    });

    return updated;
  }

  /**
   * Desativa uma área comum.
   */
  async deactivate(
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

    if (!before.active) {
      throw new ApiError(
        "A área comum já está inativa.",
        400
      );
    }

    const updated =
      await commonAreaRepository
        .deactivate(
          id,
          condominiumId
        );

    await AuditLogService.logStatusChange({
      condominiumId,
      user: authenticatedUser,
      module: "COMMON_AREA",
      referenceId: id,
      previousStatus: "ACTIVE",
      newStatus: "INACTIVE",
      details:
        "Área comum desativada.",
      requestContext,
    });

    return updated;
  }

  /**
   * Define se a área exige reserva prévia.
   */
  async setReservationRequired(
    id,
    condominiumId,
    reservationRequired,
    authenticatedUser,
    requestContext = null
  ) {
    const before =
      await this.findById(
        id,
        condominiumId
      );

    const normalizedValue =
      Boolean(reservationRequired);

    if (
      before.reservationRequired ===
      normalizedValue
    ) {
      throw new ApiError(
        normalizedValue
          ? "Esta área já exige reserva prévia."
          : "Esta área já está liberada sem reserva prévia.",
        400
      );
    }

    const updated =
      await commonAreaRepository
        .setReservationRequired(
          id,
          condominiumId,
          normalizedValue
        );

    await AuditLogService.logUpdate({
      condominiumId,
      user: authenticatedUser,
      module: "COMMON_AREA",
      referenceId: id,
      beforeData: {
        reservationRequired:
          before.reservationRequired,
      },
      afterData: {
        reservationRequired:
          updated.reservationRequired,
      },
      details:
        "Regra de reserva da área comum atualizada.",
      requestContext,
    });

    return updated;
  }

  /**
   * Remove uma área comum logicamente.
   *
   * O histórico de reservas será preservado.
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

    const hasActiveReservations =
      Array.isArray(before.reservations) &&
      before.reservations.some(
        (reservation) =>
          [
            "PENDING",
            "APPROVED",
          ].includes(
            reservation.status
          )
      );

    if (hasActiveReservations) {
      throw new ApiError(
        "Não é possível remover uma área com reservas pendentes ou aprovadas.",
        409
      );
    }

    const deleted =
      await commonAreaRepository.softDelete(
        id,
        condominiumId
      );

    if (!deleted) {
      throw new ApiError(
        "Não foi possível remover a área comum.",
        400
      );
    }

    await AuditLogService.logDelete({
      condominiumId,
      user: authenticatedUser,
      module: "COMMON_AREA",
      referenceId: id,
      beforeData: before,
      details:
        "Área comum removida logicamente.",
      requestContext,
    });

    return {
      message:
        "Área comum removida com sucesso.",
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

    return {
      total:
        await commonAreaRepository
          .countByCondominium(
            condominiumId
          ),

      active:
        await commonAreaRepository
          .countActiveByCondominium(
            condominiumId
          ),

      reservationRequired:
        await commonAreaRepository
          .countReservationRequired(
            condominiumId
          ),
    };
  }
}

export default new CommonAreaService();