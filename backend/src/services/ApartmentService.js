import BaseService from "./BaseService.js";
import apartmentRepository from "../repositories/ApartmentRepository.js";
import AuditLogService from "./AuditLogService.js";
import { ApiError } from "../utils/ApiError.js";

class ApartmentService extends BaseService {
  constructor() {
    super(apartmentRepository);
  }

  /**
   * Busca apartamento pelo ID.
   */
  async findById(id, condominiumId) {
    const apartment =
      await apartmentRepository.findById(
        id,
        condominiumId
      );

    if (!apartment) {
      throw new ApiError(
        "Apartamento não encontrado.",
        404
      );
    }

    return apartment;
  }

  /**
   * Lista apartamentos do condomínio.
   */
  async findAll(condominiumId) {
    return apartmentRepository.findByCondominium(
      condominiumId
    );
  }

  /**
   * Lista por status.
   */
  async findByStatus(
    condominiumId,
    status
  ) {
    return apartmentRepository.findByStatus(
      condominiumId,
      status
    );
  }

  /**
   * Cria apartamento.
   */
  async create(
    condominiumId,
    data,
    authenticatedUser
  ) {
    if (!data.block) {
      throw new ApiError(
        "Bloco obrigatório.",
        400
      );
    }

    if (!data.number) {
      throw new ApiError(
        "Número obrigatório.",
        400
      );
    }

    const existing =
      await apartmentRepository.findByBlockAndNumber(
        condominiumId,
        data.block,
        data.number
      );

    if (existing) {
      throw new ApiError(
        "Já existe um apartamento com esse bloco e número.",
        409
      );
    }

    const apartment =
      await apartmentRepository.createForCondominium(
        condominiumId,
        data
      );

    await AuditLogService.logCreate({
      condominiumId,
      user: authenticatedUser,
      module: "APARTMENT",
      referenceId: apartment.id,
      afterData: apartment,
      details: "Apartamento cadastrado.",
    });

    return apartment;
  }

  /**
   * Atualiza apartamento.
   */
  async update(
    id,
    condominiumId,
    data,
    authenticatedUser
  ) {
    const before =
      await this.findById(
        id,
        condominiumId
      );

    if (
      data.block !== undefined ||
      data.number !== undefined
    ) {
      const exists =
        await apartmentRepository.findByBlockAndNumber(
          condominiumId,
          data.block ??
            before.block,
          data.number ??
            before.number
        );

      if (
        exists &&
        exists.id !== id
      ) {
        throw new ApiError(
          "Já existe outro apartamento com esse bloco e número.",
          409
        );
      }
    }

    const updated =
      await apartmentRepository.updateById(
        id,
        condominiumId,
        data
      );

    await AuditLogService.logUpdate({
      condominiumId,
      user: authenticatedUser,
      module: "APARTMENT",
      referenceId: id,
      beforeData: before,
      afterData: updated,
      details:
        "Apartamento atualizado.",
    });

    return updated;
  }

  /**
   * Altera status.
   */
  async changeStatus(
    id,
    condominiumId,
    status,
    authenticatedUser
  ) {
    const before =
      await this.findById(
        id,
        condominiumId
      );

    let apartment;

    switch (status) {
      case "OCCUPIED":
        apartment =
          await apartmentRepository.markAsOccupied(
            id,
            condominiumId
          );
        break;

      case "VACANT":
        apartment =
          await apartmentRepository.markAsVacant(
            id,
            condominiumId
          );
        break;

      case "MAINTENANCE":
        apartment =
          await apartmentRepository.markAsMaintenance(
            id,
            condominiumId
          );
        break;

      case "INACTIVE":
        apartment =
          await apartmentRepository.deactivate(
            id,
            condominiumId
          );
        break;

      default:
        throw new ApiError(
          "Status inválido.",
          400
        );
    }

    await AuditLogService.logStatusChange({
      condominiumId,
      user: authenticatedUser,
      module: "APARTMENT",
      referenceId: id,
      previousStatus:
        before.status,
      newStatus:
        apartment.status,
    });

    return apartment;
  }

  /**
   * Remove logicamente.
   */
  async remove(
    id,
    condominiumId,
    authenticatedUser
  ) {
    const before =
      await this.findById(
        id,
        condominiumId
      );

    await apartmentRepository.softDelete(
      id,
      condominiumId
    );

    await AuditLogService.logDelete({
      condominiumId,
      user: authenticatedUser,
      module: "APARTMENT",
      referenceId: id,
      beforeData: before,
      details:
        "Apartamento removido.",
    });

    return {
      message:
        "Apartamento removido com sucesso.",
    };
  }

  /**
   * Dashboard.
   */
  async statistics(
    condominiumId
  ) {
    return {
      total:
        await apartmentRepository.countByCondominium(
          condominiumId
        ),

      occupied:
        await apartmentRepository.countByStatus(
          condominiumId,
          "OCCUPIED"
        ),

      vacant:
        await apartmentRepository.countByStatus(
          condominiumId,
          "VACANT"
        ),

      maintenance:
        await apartmentRepository.countByStatus(
          condominiumId,
          "MAINTENANCE"
        ),

      inactive:
        await apartmentRepository.countByStatus(
          condominiumId,
          "INACTIVE"
        ),
    };
  }
}

export default new ApartmentService();