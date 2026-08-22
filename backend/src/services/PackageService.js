import BaseService from "./BaseService.js";
import AuditLogService from "./AuditLogService.js";
import NotificationService from "./NotificationService.js";
import CommunicationTriggerService from "./CommunicationTriggerService.js";

import packageRepository from "../repositories/PackageRepository.js";
import apartmentRepository from "../repositories/ApartmentRepository.js";
import residentRepository from "../repositories/ResidentRepository.js";

import { ApiError } from "../utils/ApiError.js";
import PickupCredential from "../utils/PickupCredential.js";

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

    const normalizedStatus =
      String(status ?? "")
        .trim()
        .toUpperCase();

    if (
      !allowedStatuses.includes(
        normalizedStatus
      )
    ) {
      throw new ApiError(
        "Status de encomenda inválido.",
        400
      );
    }

    return normalizedStatus;
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
   * Normaliza um texto opcional.
   */
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

    const normalizedStatus =
      this.validateStatus(status);

    return packageRepository.findByStatus(
      condominiumId,
      normalizedStatus
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
   * Lista as encomendas visíveis para o morador autenticado.
   *
   * O frontend NÃO informa residentId/apartmentId.
   * O backend resolve o perfil pelo userId autenticado,
   * respeita canViewPackages e restringe a consulta ao
   * próprio condomínio/apartamento.
   */
  async findMine(
    condominiumId,
    authenticatedUser
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

    return packageRepository.findByApartment(
      resident.apartmentId,
      condominiumId
    );
  }

  async generatePickupCredential(
    id,
    condominiumId,
    authenticatedUser
  ) {
    const packageRecord =
      await this.findById(
        id,
        condominiumId
      );

    if (
      packageRecord.status !==
      "RECEIVED"
    ) {
      throw new ApiError(
        "A credencial só pode ser gerada para encomenda aguardando retirada.",
        409
      );
    }

    const resident =
      await residentRepository
        .findByUserId(
          authenticatedUser.id,
          condominiumId
        );

    if (
      !resident ||
      resident.apartmentId !==
        packageRecord.apartmentId
    ) {
      throw new ApiError(
        "Esta encomenda não pertence ao seu apartamento.",
        403
      );
    }

    let code;
    let codeHash;

    for (
      let attempt = 0;
      attempt < 20;
      attempt += 1
    ) {
      code =
        PickupCredential
          .generateCode();

      codeHash =
        PickupCredential
          .hash(code);

      const collision =
        await packageRepository
          .findByPickupCodeHash(
            condominiumId,
            codeHash
          );

      if (!collision) {
        break;
      }

      code = null;
      codeHash = null;
    }

    if (!code || !codeHash) {
      throw new ApiError(
        "Não foi possível gerar o código de retirada. Tente novamente.",
        500
      );
    }

    const token =
      PickupCredential
        .generateToken();

    const tokenHash =
      PickupCredential
        .hash(token);

    const updated =
      await packageRepository
        .setPickupCredential(
          id,
          condominiumId,
          tokenHash,
          codeHash
        );

    if (!updated) {
      throw new ApiError(
        "Não foi possível gerar a credencial de retirada.",
        409
      );
    }

    return {
      package: updated,
      credential: {
        qrToken: token,
        code,
      },
    };
  }

  async validatePickupCredential(
    condominiumId,
    method,
    value
  ) {
    const normalizedMethod =
      String(method ?? "")
        .trim()
        .toUpperCase();

    let packageRecord;

    if (
      normalizedMethod ===
      "QR"
    ) {
      packageRecord =
        await packageRepository
          .findByPickupTokenHash(
            condominiumId,
            PickupCredential.hash(
              value
            )
          );
    } else if (
      normalizedMethod ===
      "CODE"
    ) {
      const code =
        PickupCredential
          .normalizeCode(
            value
          );

      if (code.length !== 6) {
        throw new ApiError(
          "Código do cliente inválido.",
          422
        );
      }

      packageRecord =
        await packageRepository
          .findByPickupCodeHash(
            condominiumId,
            PickupCredential.hash(
              code
            )
          );
    } else {
      throw new ApiError(
        "Método de retirada inválido.",
        422
      );
    }

    if (!packageRecord) {
      throw new ApiError(
        "QR/código inválido, expirado ou já utilizado.",
        404
      );
    }

    const residents =
      await residentRepository
        .findByApartment(
          packageRecord.apartmentId,
          condominiumId
        );

    const eligibleResidents =
      residents
        .filter(
          (resident) =>
            resident.user?.status ===
            "ACTIVE"
        )
        .map(
          (resident) => ({
            id:
              resident.id,
            name:
              resident.user?.name ??
              "",
            document:
              resident.user?.document ??
              null,
            residentType:
              resident.residentType,
            isPrimary:
              resident.isPrimary,
            apartmentId:
              resident.apartmentId,
          })
        );

    return {
      package:
        packageRecord,
      residents:
        eligibleResidents,
    };
  }

  async confirmPickup(
    id,
    condominiumId,
    data,
    authenticatedUser,
    requestContext = null
  ) {
    const validated =
      await this
        .validatePickupCredential(
          condominiumId,
          data.method,
          data.value
        );

    if (
      validated.package.id !== id
    ) {
      throw new ApiError(
        "A credencial informada não pertence a esta encomenda.",
        409
      );
    }

    let pickupPersonType;
    let pickupResidentId = null;
    let withdrawnBy;
    let withdrawnDocument;
    let withdrawnResidentBlock = null;
    let withdrawnResidentApartment = null;

    if (data.isPrimary) {
      const primary =
        validated.residents.find(
          (resident) =>
            resident.isPrimary
        );

      if (!primary) {
        throw new ApiError(
          "Morador principal não encontrado para este apartamento.",
          409
        );
      }

      pickupPersonType =
        "PRIMARY_RESIDENT";
      pickupResidentId =
        primary.id;
      withdrawnBy =
        primary.name;
      withdrawnDocument =
        primary.document;
    } else if (
      data.pickupResidentId
    ) {
      const dependent =
        validated.residents.find(
          (resident) =>
            resident.id ===
              data.pickupResidentId &&
            !resident.isPrimary
        );

      if (!dependent) {
        throw new ApiError(
          "Dependente não encontrado neste apartamento.",
          422
        );
      }

      pickupPersonType =
        "DEPENDENT_RESIDENT";
      pickupResidentId =
        dependent.id;
      withdrawnBy =
        dependent.name;
      withdrawnDocument =
        dependent.document;
    } else {
      if (
        !data.withdrawnBy ||
        !data.withdrawnDocument ||
        !data.withdrawnResidentBlock ||
        !data.withdrawnResidentApartment
      ) {
        throw new ApiError(
          "Para outra pessoa, informe nome completo, documento, bloco e apartamento onde ela reside.",
          422
        );
      }

      pickupPersonType =
        "OTHER_PERSON";
      withdrawnBy =
        this.normalizeOptionalText(
          data.withdrawnBy
        );
      withdrawnDocument =
        this.normalizeOptionalText(
          data.withdrawnDocument
        );
      withdrawnResidentBlock =
        this.normalizeOptionalText(
          data.withdrawnResidentBlock
        );
      withdrawnResidentApartment =
        this.normalizeOptionalText(
          data.withdrawnResidentApartment
        );
    }

    const before =
      validated.package;

    const updated =
      await packageRepository
        .confirmPickup(
          id,
          condominiumId,
          {
            deliveredByUserId:
              authenticatedUser.id,
            withdrawnBy,
            withdrawnDocument,
            withdrawnResidentBlock,
            withdrawnResidentApartment,
            pickupMethod:
              data.method,
            pickupPersonType,
            pickupResidentId,
          }
        );

    if (!updated) {
      throw new ApiError(
        "A encomenda já foi retirada ou a credencial deixou de ser válida.",
        409
      );
    }

    const recipients =
      await this
        .getApartmentRecipients(
          updated.apartmentId,
          condominiumId
        );

    await Promise.all(
      recipients.map(
        (resident) =>
          NotificationService
            .notifyPackageDelivered({
              condominiumId,
              recipientUserId:
                resident.userId,
              packageId:
                updated.id,
              withdrawnBy,
              deliveredAt:
                updated.deliveredAt,
              apartmentLabel:
                `${updated.apartment.block} - ${updated.apartment.number}`,
            })
      )
    );

    await AuditLogService.logUpdate({
      condominiumId,
      user:
        authenticatedUser,
      module:
        "PACKAGE",
      referenceId:
        updated.id,
      beforeData:
        before,
      afterData:
        updated,
      details:
        `Retirada confirmada via ${data.method}. Retirado por ${withdrawnBy}.`,
      requestContext,
    });

    return updated;
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
      this.normalizeOptionalText(
        trackingCode
      );

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
    requestId = null,
  }) {
    const residents =
      await this.getApartmentRecipients(
        apartment.id,
        condominiumId
      );

    if (residents.length === 0) {
      return {
        count: 0,
        whatsapp: {
          count: 0,
          results: [],
        },
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

    /**
     * O WhatsApp é uma comunicação complementar.
     * CommunicationTriggerService aplica a regra de segurança:
     * eventual falha no provider não desfaz o recebimento da encomenda.
     */
    const whatsapp =
      await CommunicationTriggerService
        .notifyPackageArrival({
          condominiumId,
          apartment,
          packageRecord,
          residents,
          requestId,
        });

    return {
      count: residents.length,
      whatsapp,
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
            this.normalizeOptionalText(
              data.description
            ),

          carrier:
            this.normalizeOptionalText(
              data.carrier
            ),

          trackingCode,

          notes:
            this.normalizeOptionalText(
              data.notes
            ),

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
            this.normalizeOptionalText(
              data.description
            ),

          carrier:
            this.normalizeOptionalText(
              data.carrier
            ),

          trackingCode,

          notes:
            this.normalizeOptionalText(
              data.notes
            ),

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
      requestId:
        requestContext?.requestId ?? null,
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
      requestId:
        requestContext?.requestId ?? null,
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

    const updateData = {
      ...data,
    };

    const targetApartmentId =
      updateData.apartmentId ??
      before.apartmentId;

    if (
      updateData.apartmentId !==
      undefined
    ) {
      await this.validateApartment(
        updateData.apartmentId,
        condominiumId
      );
    }

    const targetResidentId =
      updateData.expectedByResidentId !==
      undefined
        ? updateData.expectedByResidentId
        : before.expectedByResidentId;

    if (targetResidentId) {
      const resident =
        await residentRepository.findById(
          targetResidentId,
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
        targetApartmentId
      ) {
        throw new ApiError(
          "O morador informado não pertence ao apartamento da encomenda.",
          400
        );
      }

      updateData.expectedByResidentId =
        resident.id;
    } else if (
      updateData.expectedByResidentId !==
      undefined
    ) {
      updateData.expectedByResidentId =
        null;
    }

    if (
      updateData.type !== undefined
    ) {
      const normalizedType =
        String(updateData.type).trim();

      if (!normalizedType) {
        throw new ApiError(
          "O tipo da encomenda é obrigatório.",
          400
        );
      }

      updateData.type =
        normalizedType;
    }

    if (
      updateData.trackingCode !==
      undefined
    ) {
      updateData.trackingCode =
        await this.validateUniqueTrackingCode(
          condominiumId,
          updateData.trackingCode,
          id
        );
    }

    if (
      updateData.description !==
      undefined
    ) {
      updateData.description =
        this.normalizeOptionalText(
          updateData.description
        );
    }

    if (
      updateData.carrier !==
      undefined
    ) {
      updateData.carrier =
        this.normalizeOptionalText(
          updateData.carrier
        );
    }

    if (
      updateData.notes !== undefined
    ) {
      updateData.notes =
        this.normalizeOptionalText(
          updateData.notes
        );
    }

    if (
      updateData.expectedAt !==
      undefined
    ) {
      updateData.expectedAt =
        this.normalizeOptionalDate(
          updateData.expectedAt,
          "Data prevista da encomenda"
        );
    }

    delete updateData.status;
    delete updateData.receivedAt;
    delete updateData.deliveredAt;
    delete updateData.canceledAt;
    delete updateData.receivedByUserId;
    delete updateData.deliveredByUserId;
    delete updateData.withdrawnBy;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.deletedAt;
    delete updateData.condominiumId;

    const updated =
      await packageRepository.updateById(
        id,
        condominiumId,
        updateData
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