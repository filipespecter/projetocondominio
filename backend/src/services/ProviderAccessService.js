import BaseService from "./BaseService.js";
import AuditLogService from "./AuditLogService.js";

import providerAccessRepository from "../repositories/ProviderAccessRepository.js";
import serviceProviderRepository from "../repositories/ServiceProviderRepository.js";
import apartmentRepository from "../repositories/ApartmentRepository.js";

import { ApiError } from "../utils/ApiError.js";

class ProviderAccessService extends BaseService {
  constructor() {
    super(providerAccessRepository);
  }

  /**
   * Status reconhecidos pelo schema.
   */
  validateStatus(status) {
    const allowedStatuses = [
      "SCHEDULED",
      "INSIDE",
      "EXITED",
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
        "Status de acesso do prestador inválido.",
        400
      );
    }

    return normalizedStatus;
  }

  /**
   * Normaliza texto opcional.
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
   * Normaliza data no padrão usado pelo Prisma.
   */
  normalizeScheduledDate(value) {
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
        : new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      throw new ApiError(
        "A data do acesso é inválida.",
        400
      );
    }

    date.setHours(0, 0, 0, 0);

    return date;
  }

  /**
   * Valida horário no formato HH:mm.
   */
  validateTime(time, fieldName) {
    if (
      time === undefined ||
      time === null ||
      time === ""
    ) {
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
   * Valida o intervalo agendado.
   */
  validateTimeRange(
    startTime,
    endTime
  ) {
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
      normalizedStartTime &&
      normalizedEndTime &&
      normalizedStartTime >=
        normalizedEndTime
    ) {
      throw new ApiError(
        "O horário final deve ser posterior ao horário inicial.",
        400
      );
    }

    return {
      scheduledStartTime:
        normalizedStartTime,
      scheduledEndTime:
        normalizedEndTime,
    };
  }

  /**
   * Confere o usuário responsável pela ação.
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
   * Busca um acesso pelo ID.
   */
  async findById(
    id,
    condominiumId
  ) {
    const access =
      await providerAccessRepository
        .findById(
          id,
          condominiumId
        );

    if (!access) {
      throw new ApiError(
        "Acesso de prestador não encontrado.",
        404
      );
    }

    return access;
  }

  /**
   * Lista todos os acessos.
   */
  async findAll(condominiumId) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    return providerAccessRepository
      .findByCondominium(
        condominiumId
      );
  }

  /**
   * Lista acessos por status.
   */
  async findByStatus(
    condominiumId,
    status
  ) {
    const normalizedStatus =
      this.validateStatus(status);

    return providerAccessRepository
      .findByStatus(
        condominiumId,
        normalizedStatus
      );
  }

  /**
   * Lista acessos de um prestador.
   */
  async findByServiceProvider(
    serviceProviderId,
    condominiumId
  ) {
    await this.validateServiceProvider(
      serviceProviderId,
      condominiumId
    );

    return providerAccessRepository
      .findByServiceProvider(
        serviceProviderId,
        condominiumId
      );
  }

  /**
   * Lista acessos por apartamento.
   */
  async findByApartment(
    apartmentId,
    condominiumId
  ) {
    await this.validateApartment(
      apartmentId,
      condominiumId
    );

    return providerAccessRepository
      .findByApartment(
        apartmentId,
        condominiumId
      );
  }

  /**
   * Lista acessos de uma data.
   */
  async findByDate(
    condominiumId,
    scheduledDate
  ) {
    const normalizedDate =
      this.normalizeScheduledDate(
        scheduledDate
      );

    if (!normalizedDate) {
      throw new ApiError(
        "A data do acesso é obrigatória.",
        400
      );
    }

    return providerAccessRepository
      .findByDate(
        condominiumId,
        normalizedDate
      );
  }

  /**
   * Confere o prestador.
   */
  async validateServiceProvider(
    serviceProviderId,
    condominiumId
  ) {
    if (!serviceProviderId) {
      throw new ApiError(
        "O prestador é obrigatório.",
        400
      );
    }

    const provider =
      await serviceProviderRepository
        .findById(
          serviceProviderId,
          condominiumId
        );

    if (!provider) {
      throw new ApiError(
        "Prestador não encontrado.",
        404
      );
    }

    if (provider.status === "INACTIVE") {
      throw new ApiError(
        "Este prestador está inativo.",
        409
      );
    }

    if (provider.status === "BLOCKED") {
      throw new ApiError(
        "Este prestador está bloqueado.",
        403
      );
    }

    return provider;
  }

  /**
   * Confere o apartamento, quando informado.
   */
  async validateApartment(
    apartmentId,
    condominiumId
  ) {
    if (!apartmentId) {
      return null;
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

    if (
      apartment.status ===
      "INACTIVE"
    ) {
      throw new ApiError(
        "O apartamento informado está inativo.",
        409
      );
    }

    return apartment;
  }

  /**
   * Cria um agendamento de acesso.
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

    this.validateAuthenticatedUser(
      authenticatedUser
    );

    const provider =
      await this.validateServiceProvider(
        data.serviceProviderId,
        condominiumId
      );

    const apartment =
      await this.validateApartment(
        data.apartmentId,
        condominiumId
      );

    const scheduledDate =
      this.normalizeScheduledDate(
        data.scheduledDate
      );

    const {
      scheduledStartTime,
      scheduledEndTime,
    } = this.validateTimeRange(
      data.scheduledStartTime,
      data.scheduledEndTime
    );

    const access =
      await providerAccessRepository
        .createForCondominium(
          condominiumId,
          {
            serviceProviderId:
              provider.id,

            apartmentId:
              apartment?.id ?? null,

            serviceDescription:
              this.normalizeOptionalText(
                data.serviceDescription
              ),

            scheduledDate,

            scheduledStartTime,

            scheduledEndTime,

            notes:
              this.normalizeOptionalText(
                data.notes
              ),

            status: "SCHEDULED",

            enteredAt: null,

            exitedAt: null,

            entryRegisteredByUserId:
              null,

            exitRegisteredByUserId:
              null,
          }
        );

    await AuditLogService.logCreate({
      condominiumId,
      user: authenticatedUser,
      module: "PROVIDER_ACCESS",
      referenceId: access.id,
      afterData: access,
      details:
        "Acesso de prestador agendado.",
      requestContext,
    });

    return access;
  }

  /**
   * Atualiza um acesso ainda agendado.
   */
  async update(
    id,
    condominiumId,
    data,
    authenticatedUser,
    requestContext = null
  ) {
    this.validateAuthenticatedUser(
      authenticatedUser
    );

    const before =
      await this.findById(
        id,
        condominiumId
      );

    if (
      before.status !==
      "SCHEDULED"
    ) {
      throw new ApiError(
        "Somente acessos agendados podem ser editados.",
        409
      );
    }

    const updateData = {
      ...data,
    };

    const serviceProviderId =
      updateData.serviceProviderId ??
      before.serviceProviderId;

    const provider =
      await this.validateServiceProvider(
        serviceProviderId,
        condominiumId
      );

    const apartmentId =
      updateData.apartmentId !==
      undefined
        ? updateData.apartmentId
        : before.apartmentId;

    const apartment =
      await this.validateApartment(
        apartmentId,
        condominiumId
      );

    const scheduledDate =
      updateData.scheduledDate !==
      undefined
        ? this.normalizeScheduledDate(
            updateData.scheduledDate
          )
        : before.scheduledDate;

    const {
      scheduledStartTime,
      scheduledEndTime,
    } = this.validateTimeRange(
      updateData.scheduledStartTime !==
      undefined
        ? updateData.scheduledStartTime
        : before.scheduledStartTime,

      updateData.scheduledEndTime !==
      undefined
        ? updateData.scheduledEndTime
        : before.scheduledEndTime
    );

    delete updateData.id;
    delete updateData.condominiumId;
    delete updateData.status;
    delete updateData.enteredAt;
    delete updateData.exitedAt;
    delete updateData.entryRegisteredByUserId;
    delete updateData.exitRegisteredByUserId;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.deletedAt;
    delete updateData.serviceProvider;
    delete updateData.apartment;
    delete updateData.entryRegisteredBy;
    delete updateData.exitRegisteredBy;

    const updated =
      await providerAccessRepository
        .updateById(
          id,
          condominiumId,
          {
            serviceProviderId:
              provider.id,

            apartmentId:
              apartment?.id ?? null,

            serviceDescription:
              updateData
                .serviceDescription !==
              undefined
                ? this.normalizeOptionalText(
                    updateData
                      .serviceDescription
                  )
                : before
                    .serviceDescription,

            scheduledDate,

            scheduledStartTime,

            scheduledEndTime,

            notes:
              updateData.notes !==
              undefined
                ? this.normalizeOptionalText(
                    updateData.notes
                  )
                : before.notes,
          }
        );

    if (!updated) {
      throw new ApiError(
        "Acesso de prestador não encontrado ou não editável.",
        404
      );
    }

    await AuditLogService.logUpdate({
      condominiumId,
      user: authenticatedUser,
      module: "PROVIDER_ACCESS",
      referenceId: id,
      beforeData: before,
      afterData: updated,
      details:
        "Agendamento de prestador atualizado.",
      requestContext,
    });

    return updated;
  }

  /**
   * Registra a entrada.
   */
  async registerEntry(
    id,
    condominiumId,
    authenticatedUser,
    requestContext = null
  ) {
    this.validateAuthenticatedUser(
      authenticatedUser
    );

    const before =
      await this.findById(
        id,
        condominiumId
      );

    if (
      before.status !==
      "SCHEDULED"
    ) {
      throw new ApiError(
        "Somente acessos agendados podem registrar entrada.",
        409
      );
    }

    await this.validateServiceProvider(
      before.serviceProviderId,
      condominiumId
    );

    const updated =
      await providerAccessRepository
        .registerEntry(
          id,
          condominiumId,
          authenticatedUser.id
        );

    if (!updated) {
      throw new ApiError(
        "Não foi possível registrar a entrada.",
        400
      );
    }

    await AuditLogService
      .logStatusChange({
        condominiumId,
        user: authenticatedUser,
        module: "PROVIDER_ACCESS",
        referenceId: id,
        previousStatus:
          before.status,
        newStatus:
          updated.status,
        details:
          "Entrada do prestador registrada.",
        requestContext,
      });

    return updated;
  }

  /**
   * Registra a saída.
   */
  async registerExit(
    id,
    condominiumId,
    authenticatedUser,
    requestContext = null
  ) {
    this.validateAuthenticatedUser(
      authenticatedUser
    );

    const before =
      await this.findById(
        id,
        condominiumId
      );

    if (
      before.status !==
      "INSIDE"
    ) {
      throw new ApiError(
        "Somente prestadores dentro do condomínio podem registrar saída.",
        409
      );
    }

    const updated =
      await providerAccessRepository
        .registerExit(
          id,
          condominiumId,
          authenticatedUser.id
        );

    if (!updated) {
      throw new ApiError(
        "Não foi possível registrar a saída.",
        400
      );
    }

    await AuditLogService
      .logStatusChange({
        condominiumId,
        user: authenticatedUser,
        module: "PROVIDER_ACCESS",
        referenceId: id,
        previousStatus:
          before.status,
        newStatus:
          updated.status,
        details:
          "Saída do prestador registrada.",
        requestContext,
      });

    return updated;
  }

  /**
   * Cancela um acesso agendado.
   */
  async cancel(
    id,
    condominiumId,
    authenticatedUser,
    requestContext = null
  ) {
    this.validateAuthenticatedUser(
      authenticatedUser
    );

    const before =
      await this.findById(
        id,
        condominiumId
      );

    if (
      before.status !==
      "SCHEDULED"
    ) {
      throw new ApiError(
        "Somente acessos agendados podem ser cancelados.",
        409
      );
    }

    const updated =
      await providerAccessRepository
        .cancel(
          id,
          condominiumId
        );

    if (!updated) {
      throw new ApiError(
        "Não foi possível cancelar o acesso.",
        400
      );
    }

    await AuditLogService
      .logStatusChange({
        condominiumId,
        user: authenticatedUser,
        module: "PROVIDER_ACCESS",
        referenceId: id,
        previousStatus:
          before.status,
        newStatus:
          updated.status,
        details:
          "Acesso de prestador cancelado.",
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
    this.validateAuthenticatedUser(
      authenticatedUser
    );

    const before =
      await this.findById(
        id,
        condominiumId
      );

    if (
      ![
        "EXITED",
        "CANCELED",
      ].includes(before.status)
    ) {
      throw new ApiError(
        "Somente acessos finalizados ou cancelados podem ser removidos.",
        409
      );
    }

    const deleted =
      await providerAccessRepository
        .softDelete(
          id,
          condominiumId
        );

    if (!deleted) {
      throw new ApiError(
        "Não foi possível remover o acesso.",
        400
      );
    }

    await AuditLogService.logDelete({
      condominiumId,
      user: authenticatedUser,
      module: "PROVIDER_ACCESS",
      referenceId: id,
      beforeData: before,
      details:
        "Acesso de prestador removido logicamente.",
      requestContext,
    });

    return {
      message:
        "Acesso de prestador removido com sucesso.",
    };
  }

  /**
   * Estatísticas para Dashboard e BI.
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
      scheduled,
      inside,
      exited,
      canceled,
    ] = await Promise.all([
      providerAccessRepository
        .countByCondominium(
          condominiumId
        ),

      providerAccessRepository
        .countByStatus(
          condominiumId,
          "SCHEDULED"
        ),

      providerAccessRepository
        .countByStatus(
          condominiumId,
          "INSIDE"
        ),

      providerAccessRepository
        .countByStatus(
          condominiumId,
          "EXITED"
        ),

      providerAccessRepository
        .countByStatus(
          condominiumId,
          "CANCELED"
        ),
    ]);

    return {
      total,
      scheduled,
      inside,
      exited,
      canceled,
    };
  }
}

export default new ProviderAccessService();
