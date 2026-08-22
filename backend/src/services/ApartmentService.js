import BaseService from "./BaseService.js";
import apartmentRepository from "../repositories/ApartmentRepository.js";
import AuditLogService from "./AuditLogService.js";
import { ApiError } from "../utils/ApiError.js";

const ALLOWED_STATUSES = [
  "OCCUPIED",
  "VACANT",
  "MAINTENANCE",
  "INACTIVE",
];

class ApartmentService extends BaseService {
  constructor() {
    super(apartmentRepository);
  }

  /**
   * Garante que o condomínio foi identificado.
   */
  validateCondominiumId(condominiumId) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }
  }

  /**
   * Garante que o usuário autenticado está disponível
   * para os registros de auditoria.
   */
  validateAuthenticatedUser(
    authenticatedUser
  ) {
    if (!authenticatedUser?.id) {
      throw new ApiError(
        "Usuário autenticado não identificado.",
        401
      );
    }
  }

  /**
   * Normaliza e valida um status de apartamento.
   */
  validateStatus(status) {
    const normalizedStatus =
      String(status ?? "")
        .trim()
        .toUpperCase();

    if (
      !ALLOWED_STATUSES.includes(
        normalizedStatus
      )
    ) {
      throw new ApiError(
        "Status de apartamento inválido.",
        400,
        {
          allowedStatuses:
            ALLOWED_STATUSES,
        }
      );
    }

    return normalizedStatus;
  }

  /**
   * Busca apartamento pelo ID.
   */
  async findById(id, condominiumId) {
    this.validateCondominiumId(
      condominiumId
    );

    if (!id) {
      throw new ApiError(
        "Apartamento não identificado.",
        400
      );
    }

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
    this.validateCondominiumId(
      condominiumId
    );

    return apartmentRepository
      .findByCondominium(
        condominiumId
      );
  }

  /**
   * Lista apartamentos por status.
   */
  async findByStatus(
    condominiumId,
    status
  ) {
    this.validateCondominiumId(
      condominiumId
    );

    const normalizedStatus =
      this.validateStatus(status);

    return apartmentRepository
      .findByStatus(
        condominiumId,
        normalizedStatus
      );
  }

  /**
   * Lista apartamentos vagos.
   */
  async findVacant(condominiumId) {
    this.validateCondominiumId(
      condominiumId
    );

    return apartmentRepository
      .findVacant(condominiumId);
  }

  /**
   * Cria apartamento.
   *
   * Quando o status não for informado,
   * o Repository e o banco utilizam VACANT.
   */
  async create(
    condominiumId,
    data,
    authenticatedUser
  ) {
    this.validateCondominiumId(
      condominiumId
    );

    this.validateAuthenticatedUser(
      authenticatedUser
    );

    if (!data?.block) {
      throw new ApiError(
        "Bloco obrigatório.",
        400
      );
    }

    if (!data?.number) {
      throw new ApiError(
        "Número obrigatório.",
        400
      );
    }

    const normalizedData = {
      ...data,
      block:
        String(data.block).trim(),
      number:
        String(data.number).trim(),
    };

    if (!normalizedData.block) {
      throw new ApiError(
        "Bloco obrigatório.",
        400
      );
    }

    if (!normalizedData.number) {
      throw new ApiError(
        "Número obrigatório.",
        400
      );
    }

    if (
      normalizedData.status !==
      undefined
    ) {
      normalizedData.status =
        this.validateStatus(
          normalizedData.status
        );
    }

    const existing =
      await apartmentRepository
        .findByBlockAndNumber(
          condominiumId,
          normalizedData.block,
          normalizedData.number
        );

    if (existing) {
      throw new ApiError(
        "Já existe um apartamento com esse bloco e número.",
        409
      );
    }

    const apartment =
      await apartmentRepository
        .createForCondominium(
          condominiumId,
          normalizedData
        );

    if (!apartment) {
      throw new ApiError(
        "Não foi possível cadastrar o apartamento.",
        500
      );
    }

    await AuditLogService.logCreate({
      condominiumId,
      user: authenticatedUser,
      module: "APARTMENT",
      referenceId: apartment.id,
      afterData: apartment,
      details:
        "Apartamento cadastrado.",
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
    this.validateAuthenticatedUser(
      authenticatedUser
    );

    const before =
      await this.findById(
        id,
        condominiumId
      );

    const normalizedData = {
      ...data,
    };

    if (
      normalizedData.block !==
      undefined
    ) {
      normalizedData.block =
        String(
          normalizedData.block
        ).trim();

      if (!normalizedData.block) {
        throw new ApiError(
          "Bloco não pode ficar vazio.",
          400
        );
      }
    }

    if (
      normalizedData.number !==
      undefined
    ) {
      normalizedData.number =
        String(
          normalizedData.number
        ).trim();

      if (!normalizedData.number) {
        throw new ApiError(
          "Número não pode ficar vazio.",
          400
        );
      }
    }

    if (
      normalizedData.status !==
      undefined
    ) {
      normalizedData.status =
        this.validateStatus(
          normalizedData.status
        );
    }

    if (
      normalizedData.block !==
        undefined ||
      normalizedData.number !==
        undefined
    ) {
      const exists =
        await apartmentRepository
          .findByBlockAndNumber(
            condominiumId,
            normalizedData.block ??
              before.block,
            normalizedData.number ??
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
      await apartmentRepository
        .updateById(
          id,
          condominiumId,
          normalizedData
        );

    if (!updated) {
      throw new ApiError(
        "Apartamento não encontrado ou não pôde ser atualizado.",
        404
      );
    }

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
   * Altera o status do apartamento.
   */
  async changeStatus(
    id,
    condominiumId,
    status,
    authenticatedUser
  ) {
    this.validateAuthenticatedUser(
      authenticatedUser
    );

    const before =
      await this.findById(
        id,
        condominiumId
      );

    const normalizedStatus =
      this.validateStatus(status);

    let apartment;

    switch (normalizedStatus) {
      case "OCCUPIED":
        apartment =
          await apartmentRepository
            .markAsOccupied(
              id,
              condominiumId
            );
        break;

      case "VACANT":
        apartment =
          await apartmentRepository
            .markAsVacant(
              id,
              condominiumId
            );
        break;

      case "MAINTENANCE":
        apartment =
          await apartmentRepository
            .markAsMaintenance(
              id,
              condominiumId
            );
        break;

      case "INACTIVE":
        apartment =
          await apartmentRepository
            .deactivate(
              id,
              condominiumId
            );
        break;

      default:
        throw new ApiError(
          "Status de apartamento inválido.",
          400
        );
    }

    if (!apartment) {
      throw new ApiError(
        "Apartamento não encontrado ou não pôde ter o status alterado.",
        404
      );
    }

    await AuditLogService
      .logStatusChange({
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
   *
   * A exclusão é bloqueada quando existem
   * moradores ativos vinculados.
   */
  async remove(
    id,
    condominiumId,
    authenticatedUser
  ) {
    this.validateAuthenticatedUser(
      authenticatedUser
    );

    const before =
      await this.findById(
        id,
        condominiumId
      );

    const activeResidents =
      await apartmentRepository
        .countActiveResidents(
          id,
          condominiumId
        );

    if (activeResidents > 0) {
      throw new ApiError(
        "Não é possível excluir o apartamento porque existem moradores ativos vinculados.",
        409,
        {
          code:
            "APARTMENT_HAS_ACTIVE_RESIDENTS",
          activeResidents,
          apartmentId:
            before.id,
          apartmentLabel:
            `${before.block} - ${before.number}`,
        }
      );
    }

    const removed =
      await apartmentRepository
        .softDelete(
          id,
          condominiumId
        );

    if (!removed) {
      throw new ApiError(
        "Apartamento não encontrado ou não pôde ser removido.",
        404
      );
    }

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
   * Estatísticas para dashboard.
   */
  async statistics(condominiumId) {
    this.validateCondominiumId(
      condominiumId
    );

    const [
      total,
      occupied,
      vacant,
      maintenance,
      inactive,
    ] = await Promise.all([
      apartmentRepository
        .countByCondominium(
          condominiumId
        ),

      apartmentRepository
        .countByStatus(
          condominiumId,
          "OCCUPIED"
        ),

      apartmentRepository
        .countByStatus(
          condominiumId,
          "VACANT"
        ),

      apartmentRepository
        .countByStatus(
          condominiumId,
          "MAINTENANCE"
        ),

      apartmentRepository
        .countByStatus(
          condominiumId,
          "INACTIVE"
        ),
    ]);

    return {
      total,
      occupied,
      vacant,
      maintenance,
      inactive,
    };
  }
  /**
   * Diretório operacional de unidades.
   * Somente leitura para fluxos da portaria.
   */
  async operationalDirectory(
    condominiumId
  ) {
    this.validateCondominiumId(
      condominiumId
    );

    const apartments =
      await apartmentRepository
        .findByCondominium(
          condominiumId
        );

    return apartments.map(
      (apartment) => ({
        id:
          apartment.id,

        block:
          apartment.block,

        number:
          apartment.number,

        floor:
          apartment.floor,

        status:
          apartment.status,

        residents:
          (
            apartment.residents ??
            []
          )
            .filter(
              (resident) =>
                resident.user
                  ?.status ===
                "ACTIVE"
            )
            .map(
              (resident) => ({
                id:
                  resident.id,

                isPrimary:
                  resident
                    .isPrimary,

                residentType:
                  resident
                    .residentType,

                user: {
                  id:
                    resident.user
                      ?.id ??
                    null,

                  name:
                    resident.user
                      ?.name ??
                    null,

                  phone:
                    resident.user
                      ?.phone ??
                    null,
                },
              })
            ),
      })
    );
  }

}

export default new ApartmentService();
