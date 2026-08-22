import BaseService from "./BaseService.js";
import AuditLogService from "./AuditLogService.js";

import serviceProviderRepository from "../repositories/ServiceProviderRepository.js";

import { ApiError } from "../utils/ApiError.js";

class ServiceProviderService extends BaseService {
  constructor() {
    super(serviceProviderRepository);
  }

  /**
   * Status permitidos pelo schema.
   */
  validateStatus(status) {
    const allowedStatuses = [
      "ACTIVE",
      "INACTIVE",
      "BLOCKED",
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
        "Status de prestador inválido.",
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
   * Normaliza e-mail opcional.
   */
  normalizeOptionalEmail(value) {
    const normalizedValue =
      this.normalizeOptionalText(value);

    if (!normalizedValue) {
      return null;
    }

    return normalizedValue.toLowerCase();
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
   * Busca um prestador pelo ID.
   */
  async findById(
    id,
    condominiumId
  ) {
    const provider =
      await serviceProviderRepository
        .findById(
          id,
          condominiumId
        );

    if (!provider) {
      throw new ApiError(
        "Prestador não encontrado.",
        404
      );
    }

    return provider;
  }

  /**
   * Lista todos os prestadores.
   */
  async findAll(condominiumId) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    return serviceProviderRepository
      .findByCondominium(
        condominiumId
      );
  }

  /**
   * Lista prestadores por status.
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

    return serviceProviderRepository
      .findByStatus(
        condominiumId,
        normalizedStatus
      );
  }

  /**
   * Lista apenas prestadores ativos.
   */
  async findActive(condominiumId) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    return serviceProviderRepository
      .findActive(
        condominiumId
      );
  }

  /**
   * Impede documento duplicado no mesmo condomínio.
   */
  async validateUniqueDocument(
    condominiumId,
    document,
    ignoredProviderId = null
  ) {
    const normalizedDocument =
      this.normalizeOptionalText(
        document
      );

    if (!normalizedDocument) {
      return null;
    }

    const existing =
      await serviceProviderRepository
        .findByDocument(
          condominiumId,
          normalizedDocument
        );

    if (
      existing &&
      existing.id !==
        ignoredProviderId
    ) {
      throw new ApiError(
        "Já existe um prestador com este documento.",
        409
      );
    }

    return normalizedDocument;
  }

  /**
   * Impede e-mail duplicado no mesmo condomínio.
   */
  async validateUniqueEmail(
    condominiumId,
    email,
    ignoredProviderId = null
  ) {
    const normalizedEmail =
      this.normalizeOptionalEmail(
        email
      );

    if (!normalizedEmail) {
      return null;
    }

    const existing =
      await serviceProviderRepository
        .findByEmail(
          condominiumId,
          normalizedEmail
        );

    if (
      existing &&
      existing.id !==
        ignoredProviderId
    ) {
      throw new ApiError(
        "Já existe um prestador com este e-mail.",
        409
      );
    }

    return normalizedEmail;
  }

  /**
   * Cria um prestador.
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

    const name =
      String(data?.name ?? "")
        .trim();

    if (!name) {
      throw new ApiError(
        "O nome do prestador é obrigatório.",
        400
      );
    }

    const serviceType =
      String(
        data?.serviceType ?? ""
      ).trim();

    if (!serviceType) {
      throw new ApiError(
        "O tipo de serviço é obrigatório.",
        400
      );
    }

    const document =
      await this.validateUniqueDocument(
        condominiumId,
        data.document
      );

    const email =
      await this.validateUniqueEmail(
        condominiumId,
        data.email
      );

    const status =
      data.status === undefined
        ? "ACTIVE"
        : this.validateStatus(
            data.status
          );

    const provider =
      await serviceProviderRepository
        .createForCondominium(
          condominiumId,
          {
            name,

            companyName:
              this.normalizeOptionalText(
                data.companyName
              ),

            document,

            phone:
              this.normalizeOptionalText(
                data.phone
              ),

            email,

            serviceType,

            notes:
              this.normalizeOptionalText(
                data.notes
              ),

            status,
          }
        );

    await AuditLogService.logCreate({
      condominiumId,
      user: authenticatedUser,
      module: "SERVICE_PROVIDER",
      referenceId: provider.id,
      afterData: provider,
      details:
        "Prestador cadastrado.",
      requestContext,
    });

    return provider;
  }

  /**
   * Atualiza um prestador.
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

    const updateData = {
      ...data,
    };

    if (
      updateData.name !==
      undefined
    ) {
      const name =
        String(updateData.name).trim();

      if (!name) {
        throw new ApiError(
          "O nome do prestador é obrigatório.",
          400
        );
      }

      updateData.name = name;
    }

    if (
      updateData.serviceType !==
      undefined
    ) {
      const serviceType =
        String(
          updateData.serviceType
        ).trim();

      if (!serviceType) {
        throw new ApiError(
          "O tipo de serviço é obrigatório.",
          400
        );
      }

      updateData.serviceType =
        serviceType;
    }

    if (
      updateData.document !==
      undefined
    ) {
      updateData.document =
        await this
          .validateUniqueDocument(
            condominiumId,
            updateData.document,
            id
          );
    }

    if (
      updateData.email !==
      undefined
    ) {
      updateData.email =
        await this
          .validateUniqueEmail(
            condominiumId,
            updateData.email,
            id
          );
    }

    if (
      updateData.companyName !==
      undefined
    ) {
      updateData.companyName =
        this.normalizeOptionalText(
          updateData.companyName
        );
    }

    if (
      updateData.phone !==
      undefined
    ) {
      updateData.phone =
        this.normalizeOptionalText(
          updateData.phone
        );
    }

    if (
      updateData.notes !==
      undefined
    ) {
      updateData.notes =
        this.normalizeOptionalText(
          updateData.notes
        );
    }

    if (
      updateData.status !==
      undefined
    ) {
      updateData.status =
        this.validateStatus(
          updateData.status
        );
    }

    delete updateData.id;
    delete updateData.condominiumId;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.deletedAt;
    delete updateData.accesses;

    const updated =
      await serviceProviderRepository
        .updateById(
          id,
          condominiumId,
          updateData
        );

    if (!updated) {
      throw new ApiError(
        "Prestador não encontrado.",
        404
      );
    }

    await AuditLogService.logUpdate({
      condominiumId,
      user: authenticatedUser,
      module: "SERVICE_PROVIDER",
      referenceId: id,
      beforeData: before,
      afterData: updated,
      details:
        "Prestador atualizado.",
      requestContext,
    });

    return updated;
  }

  /**
   * Altera o status do prestador.
   */
  async changeStatus(
    id,
    condominiumId,
    status,
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

    const normalizedStatus =
      this.validateStatus(status);

    if (
      before.status ===
      normalizedStatus
    ) {
      throw new ApiError(
        "O prestador já possui este status.",
        400
      );
    }

    let updated;

    switch (normalizedStatus) {
      case "ACTIVE":
        updated =
          await serviceProviderRepository
            .activate(
              id,
              condominiumId
            );
        break;

      case "INACTIVE":
        updated =
          await serviceProviderRepository
            .deactivate(
              id,
              condominiumId
            );
        break;

      case "BLOCKED":
        updated =
          await serviceProviderRepository
            .block(
              id,
              condominiumId
            );
        break;

      default:
        throw new ApiError(
          "Status de prestador inválido.",
          400
        );
    }

    if (!updated) {
      throw new ApiError(
        "Prestador não encontrado.",
        404
      );
    }

    await AuditLogService
      .logStatusChange({
        condominiumId,
        user: authenticatedUser,
        module:
          "SERVICE_PROVIDER",
        referenceId: id,
        previousStatus:
          before.status,
        newStatus:
          updated.status,
        details:
          "Status do prestador atualizado.",
        requestContext,
      });

    return updated;
  }

  /**
   * Ativa um prestador.
   */
  async activate(
    id,
    condominiumId,
    authenticatedUser,
    requestContext = null
  ) {
    return this.changeStatus(
      id,
      condominiumId,
      "ACTIVE",
      authenticatedUser,
      requestContext
    );
  }

  /**
   * Desativa um prestador.
   */
  async deactivate(
    id,
    condominiumId,
    authenticatedUser,
    requestContext = null
  ) {
    return this.changeStatus(
      id,
      condominiumId,
      "INACTIVE",
      authenticatedUser,
      requestContext
    );
  }

  /**
   * Bloqueia um prestador.
   */
  async block(
    id,
    condominiumId,
    authenticatedUser,
    requestContext = null
  ) {
    return this.changeStatus(
      id,
      condominiumId,
      "BLOCKED",
      authenticatedUser,
      requestContext
    );
  }

  /**
   * Exclusão lógica.
   *
   * O histórico de acessos será preservado.
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

    const hasActiveAccess =
      Array.isArray(before.accesses) &&
      before.accesses.some(
        (access) =>
          [
            "SCHEDULED",
            "INSIDE",
          ].includes(
            access.status
          )
      );

    if (hasActiveAccess) {
      throw new ApiError(
        "Não é possível remover um prestador com acesso agendado ou ainda dentro do condomínio.",
        409
      );
    }

    const deleted =
      await serviceProviderRepository
        .softDelete(
          id,
          condominiumId
        );

    if (!deleted) {
      throw new ApiError(
        "Não foi possível remover o prestador.",
        400
      );
    }

    await AuditLogService.logDelete({
      condominiumId,
      user: authenticatedUser,
      module: "SERVICE_PROVIDER",
      referenceId: id,
      beforeData: before,
      details:
        "Prestador removido logicamente.",
      requestContext,
    });

    return {
      message:
        "Prestador removido com sucesso.",
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
      active,
      inactive,
      blocked,
    ] = await Promise.all([
      serviceProviderRepository
        .countByCondominium(
          condominiumId
        ),

      serviceProviderRepository
        .countByStatus(
          condominiumId,
          "ACTIVE"
        ),

      serviceProviderRepository
        .countByStatus(
          condominiumId,
          "INACTIVE"
        ),

      serviceProviderRepository
        .countByStatus(
          condominiumId,
          "BLOCKED"
        ),
    ]);

    return {
      total,
      active,
      inactive,
      blocked,
    };
  }
}

export default new ServiceProviderService();
