import BaseService from "./BaseService.js";
import AuditLogService from "./AuditLogService.js";
import NotificationService from "./NotificationService.js";

import packageRepository from "../repositories/PackageRepository.js";
import apartmentRepository from "../repositories/ApartmentRepository.js";
import residentRepository from "../repositories/ResidentRepository.js";

import { ApiError } from "../utils/ApiError.js";

class PackageService extends BaseService {
  constructor() {
    super(packageRepository);
  }

  /**
   * Status existentes no schema.
   */
  validateStatus(status) {
    const allowedStatuses = [
      "EXPECTED",
      "RECEIVED",
      "DELIVERED",
      "CANCELED",
    ];

    if (!allowedStatuses.includes(status)) {
      throw new ApiError(
        "Status de encomenda inválido.",
        400
      );
    }
  }

  /**
   * Normaliza uma data opcional.
   */
  normalizeOptionalDate(value, fieldName) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return null;
    }

    const date =
      value instanceof Date
        ? new Date(value)
        : new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new ApiError(
        `${fieldName} inválida.`,
        400
      );
    }

    return date;
  }

  /**
   * Busca uma encomenda pelo ID.
   */
  async findById(id, condominiumId) {
    const packageRecord =
      await packageRepository.findById(
        id,
        condominiumId
      );

    if (!packageRecord) {
      throw new ApiError(
        "Encomenda não encontrada.",
        404
      );
    }

    return packageRecord;
  }

  /**
   * Lista todas as encomendas do condomínio.
   */
  async findAll(condominiumId) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    return packageRepository
      .findByCondominium(
        condominiumId
      );
  }

  /**
   * Lista encomendas por status.
   */
  async findByStatus(
    condominiumId,
    status
  ) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    this.validateStatus(status);

    return packageRepository.findByStatus(
      condominiumId,
      status
    );
  }

  /**
   * Lista encomendas aguardando retirada.
   */
  async findPending(condominiumId) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    return packageRepository.findPending(
      condominiumId
    );
  }

  /**
   * Lista encomendas de um apartamento.
   */
  async findByApartment(
    apartmentId,
    condominiumId
  ) {
    await this.validateApartment(
      apartmentId,
      condominiumId
    );

    return packageRepository.findByApartment(
      apartmentId,
      condominiumId
    );
  }

  /**
   * Lista encomendas esperadas pelo morador.
   */
  async findExpectedByResident(
    residentId,
    condominiumId
  ) {
    const resident =
      await residentRepository.findById(
        residentId,
        condominiumId
      );

    if (!resident) {
      throw new ApiError(
        "Morador não encontrado.",
        404
      );
    }

    return packageRepository
      .findExpectedByResident(
        residentId,
        condominiumId
      );
  }

  /**
   * Valida o apartamento.
   */
  async validateApartment(
    apartmentId,
    condominiumId
  ) {
    if (!apartmentId) {
      throw new ApiError(
        "O apartamento é obrigatório.",
        400
      );
    }

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

    if (apartment.status === "INACTIVE") {
      throw new ApiError(
        "Não é possível registrar encomenda para um apartamento inativo.",
        400
      );
    }

    return apartment;
  }

  /**
   * Valida os dados essenciais da encomenda.
   */
  validatePackageData(data) {
    if (!data?.type) {
      throw new ApiError(
        "O tipo da encomenda é obrigatório.",
        400
      );
    }
  }

  /**
   * Impede códigos de rastreio duplicados.
   */
  async validateUniqueTrackingCode(
    condominiumId,
    trackingCode,
    ignoredPackageId = null
  ) {
    if (!trackingCode) {
      return null;
    }

    const normalizedTrackingCode =
      String(trackingCode).trim();

    const existing =
      await packageRepository
        .findByTrackingCode(
          condominiumId,
          normalizedTrackingCode
        );

    if (
      existing &&
      existing.id !== ignoredPackageId
    ) {
      throw new ApiError(
        "Já existe uma encomenda com este código de rastreio.",
        409
      );
    }

    return normalizedTrackingCode;
  }

  /**
   * Retorna os moradores ativos que podem
   * visualizar encomendas.
   */
  async getApartmentRecipients(
    apartmentId,
    condominiumId
  ) {
    const residents =
      await residentRepository.findByApartment(
        apartmentId,
        condominiumId
      );

    return residents.filter(
      (resident) =>
        resident.canViewPackages &&
        resident.user &&
        resident.user.status === "ACTIVE"
    );
  }

  /**
   * Notifica os moradores sobre a chegada.
   */
  async notifyPackageArrival({
    condominiumId,
    apartment,
    packageRecord,
  }) {
    const residents =
      await this.getApartmentRecipients(
        apartment.id,
        condominiumId
      );

    if (residents.length === 0) {
      return {
        count: 0,
      };
    }

    await Promise.all(
      residents.map((resident) =>
        NotificationService
          .notifyPackageReceived({
            condominiumId,

            recipientUserId:
              resident.userId,

            packageId:
              packageRecord.id,

            apartmentLabel:
              `${apartment.block} - ${apartment.number}`,
          })
      )
    );

    return {
      count: residents.length,
    };
  }

  /**
   * Morador registra uma encomenda esperada.
   *
   * O residentId não será aceito livremente
   * pelo frontend. Ele será obtido pelo userId
   * autenticado.
   */
  async createExpected(
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

    this.validatePackageData(data);

    const resident =
      await residentRepository.findByUserId(
        authenticatedUser.id,
        condominiumId
      );

    if (!resident) {
      throw new ApiError(
        "Perfil de morador não encontrado.",
        404
      );
    }

    if (!resident.canViewPackages) {
      throw new ApiError(
        "Este morador não possui acesso ao módulo de encomendas.",
        403
      );
    }

    const apartment =
      await this.validateApartment(
        resident.apartmentId,
        condominiumId
      );

    const trackingCode =
      await this.validateUniqueTrackingCode(
        condominiumId,
        data.trackingCode
      );

    const expectedAt =
      this.normalizeOptionalDate(
        data.expectedAt,
        "Data prevista da encomenda"
      );

    const packageRecord =
      await packageRepository.createExpected(
        condominiumId,
        {
          apartmentId:
            apartment.id,

          expectedByResidentId:
            resident.id,

          type:
            String(data.type).trim(),

          description:
            data.description ?? null,

          carrier:
            data.carrier ?? null,

          trackingCode,

          notes:
            data.notes ?? null,

          expectedAt,
        }
      );

    /*
     * Informa aos porteiros que o morador
     * está aguardando uma encomenda.
     */
    await NotificationService
      .createForActiveRoleUsers(
        condominiumId,
        "DOORMAN",
        {
          title:
            "Encomenda esperada",

          message:
            `O apartamento ${apartment.block} - ${apartment.number} está aguardando uma encomenda.`,

          type:
            "PACKAGE_EXPECTED",

          origin:
            "RESIDENT",

          module:
            "PACKAGE",

          referenceId:
            packageRecord.id,

          apartmentLabel:
            `${apartment.block} - ${apartment.number}`,

          priority:
            "NORMAL",
        }
      );

    await AuditLogService.logCreate({
      condominiumId,
      user: authenticatedUser,
      module: "PACKAGE",
      referenceId:
        packageRecord.id,
      afterData:
        packageRecord,
      details:
        "Morador registrou uma encomenda esperada.",
      requestContext,
    });

    return packageRecord;
  }

  /**
   * Porteiro registra uma encomenda que
   * já chegou ao condomínio.
   */
  async createReceived(
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
        "Usuário responsável pelo recebimento não identificado.",
        401
      );
    }

    this.validatePackageData(data);

    const apartment =
      await this.validateApartment(
        data.apartmentId,
        condominiumId
      );

    const trackingCode =
      await this.validateUniqueTrackingCode(
        condominiumId,
        data.trackingCode
      );

    let expectedByResidentId = null;

    if (data.expectedByResidentId) {
      const resident =
        await residentRepository.findById(
          data.expectedByResidentId,
          condominiumId
        );

      if (!resident) {
        throw new ApiError(
          "Morador relacionado à encomenda não encontrado.",
          404
        );
      }

      if (
        resident.apartmentId !==
        apartment.id
      ) {
        throw new ApiError(
          "O morador informado não pertence ao apartamento da encomenda.",
          400
        );
      }

      expectedByResidentId =
        resident.id;
    }

    const packageRecord =
      await packageRepository.createReceived(
        condominiumId,
        {
          apartmentId:
            apartment.id,

          expectedByResidentId,

          type:
            String(data.type).trim(),

          description:
            data.description ?? null,

          carrier:
            data.carrier ?? null,

          trackingCode,

          notes:
            data.notes ?? null,

          expectedAt:
            this.normalizeOptionalDate(
              data.expectedAt,
              "Data prevista da encomenda"
            ),

          receivedAt:
            new Date(),

          receivedByUserId:
            authenticatedUser.id,
        }
      );

    await this.notifyPackageArrival({
      condominiumId,
      apartment,
      packageRecord,
    });

    await AuditLogService.logCreate({
      condominiumId,
      user: authenticatedUser,
      module: "PACKAGE",
      referenceId:
        packageRecord.id,
      afterData:
        packageRecord,
      details:
        "Encomenda recebida e registrada pela portaria.",
      requestContext,
    });

    return packageRecord;
  }

  /**
   * Registra a chegada de uma encomenda
   * anteriormente anunciada pelo morador.
   */
  async registerReceived(
    id,
    condominiumId,
    authenticatedUser,
    requestContext = null
  ) {
    if (!authenticatedUser?.id) {
      throw new ApiError(
        "Usuário responsável pelo recebimento não identificado.",
        401
      );
    }

    const before =
      await this.findById(
        id,
        condominiumId
      );

    if (before.status !== "EXPECTED") {
      throw new ApiError(
        "Somente encomendas esperadas podem ser marcadas como recebidas.",
        409
      );
    }

    const packageRecord =
      await packageRepository
        .registerReceived(
          id,
          condominiumId,
          authenticatedUser.id
        );

    if (!packageRecord) {
      throw new ApiError(
        "Encomenda não encontrada ou já atualizada.",
        404
      );
    }

    await this.notifyPackageArrival({
      condominiumId,
      apartment:
        packageRecord.apartment,
      packageRecord,
    });

    await AuditLogService
      .logStatusChange({
        condominiumId,
        user: authenticatedUser,
        module: "PACKAGE",
        referenceId: id,
        previousStatus:
          before.status,
        newStatus:
          packageRecord.status,
        details:
          "Encomenda esperada foi recebida pela portaria.",
        requestContext,
      });

    return packageRecord;
  }

  /**
   * Marca a encomenda como retirada.
   */
  async deliver(
    id,
    condominiumId,
    withdrawnBy,
    authenticatedUser,
    requestContext = null
  ) {
    if (!authenticatedUser?.id) {
      throw new ApiError(
        "Usuário responsável pela entrega não identificado.",
        401
      );
    }

    const before =
      await this.findById(
        id,
        condominiumId
      );

    if (before.status !== "RECEIVED") {
      throw new ApiError(
        "Somente encomendas recebidas podem ser entregues.",
        409
      );
    }

    if (!withdrawnBy) {
      throw new ApiError(
        "Informe o nome da pessoa que retirou a encomenda.",
        400
      );
    }

    const packageRecord =
      await packageRepository.deliver(
        id,
        condominiumId,
        authenticatedUser.id,
        String(withdrawnBy).trim()
      );

    if (!packageRecord) {
      throw new ApiError(
        "Encomenda não encontrada ou já entregue.",
        404
      );
    }

    await AuditLogService
      .logStatusChange({
        condominiumId,
        user: authenticatedUser,
        module: "PACKAGE",
        referenceId: id,
        previousStatus:
          before.status,
        newStatus:
          packageRecord.status,
        details:
          `Encomenda retirada por ${String(withdrawnBy).trim()}.`,
        requestContext,
      });

    return packageRecord;
  }

  /**
   * Cancela uma encomenda esperada ou recebida.
   */
  async cancel(
    id,
    condominiumId,
    reason,
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
        "EXPECTED",
        "RECEIVED",
      ].includes(before.status)
    ) {
      throw new ApiError(
        "Esta encomenda não pode mais ser cancelada.",
        409
      );
    }

    const packageRecord =
      await packageRepository.cancel(
        id,
        condominiumId,
        reason
          ? String(reason).trim()
          : null
      );

    if (!packageRecord) {
      throw new ApiError(
        "Encomenda não encontrada ou já atualizada.",
        404
      );
    }

    await AuditLogService
      .logStatusChange({
        condominiumId,
        user: authenticatedUser,
        module: "PACKAGE",
        referenceId: id,
        previousStatus:
          before.status,
        newStatus:
          packageRecord.status,
        details:
          reason
            ? `Encomenda cancelada. Motivo: ${String(reason).trim()}`
            : "Encomenda cancelada.",
        requestContext,
      });

    return packageRecord;
  }

  /**
   * Atualiza dados editáveis.
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

    if (
      ![
        "EXPECTED",
        "RECEIVED",
      ].includes(before.status)
    ) {
      throw new ApiError(
        "Somente encomendas esperadas ou recebidas podem ser editadas.",
        409
      );
    }

    if (
      data.apartmentId !== undefined
    ) {
      await this.validateApartment(
        data.apartmentId,
        condominiumId
      );
    }

    if (data.type !== undefined) {
      if (!data.type) {
        throw new ApiError(
          "O tipo da encomenda é obrigatório.",
          400
        );
      }

      data.type =
        String(data.type).trim();
    }

    if (
      data.trackingCode !== undefined
    ) {
      data.trackingCode =
        await this.validateUniqueTrackingCode(
          condominiumId,
          data.trackingCode,
          id
        );
    }

    if (data.expectedAt !== undefined) {
      data.expectedAt =
        this.normalizeOptionalDate(
          data.expectedAt,
          "Data prevista da encomenda"
        );
    }

    delete data.status;
    delete data.receivedAt;
    delete data.deliveredAt;
    delete data.canceledAt;
    delete data.receivedByUserId;
    delete data.deliveredByUserId;
    delete data.withdrawnBy;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.deletedAt;

    const updated =
      await packageRepository.updateById(
        id,
        condominiumId,
        data
      );

    if (!updated) {
      throw new ApiError(
        "Encomenda não encontrada ou não editável.",
        404
      );
    }

    await AuditLogService.logUpdate({
      condominiumId,
      user: authenticatedUser,
      module: "PACKAGE",
      referenceId: id,
      beforeData: before,
      afterData: updated,
      details:
        "Dados da encomenda atualizados.",
      requestContext,
    });

    return updated;
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

    if (before.status === "RECEIVED") {
      throw new ApiError(
        "Uma encomenda aguardando retirada não pode ser removida.",
        409
      );
    }

    const deleted =
      await packageRepository.softDelete(
        id,
        condominiumId
      );

    if (!deleted) {
      throw new ApiError(
        "Não foi possível remover a encomenda.",
        400
      );
    }

    await AuditLogService.logDelete({
      condominiumId,
      user: authenticatedUser,
      module: "PACKAGE",
      referenceId: id,
      beforeData: before,
      details:
        "Encomenda removida logicamente.",
      requestContext,
    });

    return {
      message:
        "Encomenda removida com sucesso.",
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
      expected,
      received,
      delivered,
      canceled,
    ] = await Promise.all([
      packageRepository
        .countByCondominium(
          condominiumId
        ),

      packageRepository.countByStatus(
        condominiumId,
        "EXPECTED"
      ),

      packageRepository.countByStatus(
        condominiumId,
        "RECEIVED"
      ),

      packageRepository.countByStatus(
        condominiumId,
        "DELIVERED"
      ),

      packageRepository.countByStatus(
        condominiumId,
        "CANCELED"
      ),
    ]);

    return {
      total,
      expected,
      received,
      delivered,
      canceled,
      pending: received,
    };
  }
}

export default new PackageService();