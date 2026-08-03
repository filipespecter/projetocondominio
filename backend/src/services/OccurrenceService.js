import BaseService from "./BaseService.js";
import AuditLogService from "./AuditLogService.js";
import NotificationService from "./NotificationService.js";

import occurrenceRepository from "../repositories/OccurrenceRepository.js";
import residentRepository from "../repositories/ResidentRepository.js";
import apartmentRepository from "../repositories/ApartmentRepository.js";
import userRepository from "../repositories/UserRepository.js";

import { ApiError } from "../utils/ApiError.js";

class OccurrenceService extends BaseService {
  constructor() {
    super(occurrenceRepository);
  }

  /**
   * Origens existentes no schema.
   */
  validateOrigin(origin) {
    const allowedOrigins = [
      "RESIDENT",
      "DOORMAN",
      "MANAGER",
      "SYSTEM",
    ];

    if (!allowedOrigins.includes(origin)) {
      throw new ApiError(
        "Origem da ocorrência inválida.",
        400
      );
    }
  }

  /**
   * Tipos existentes no schema.
   */
  validateType(type) {
    const allowedTypes = [
      "OCCURRENCE",
      "COMPLAINT",
      "SUGGESTION",
      "REQUEST",
    ];

    if (!allowedTypes.includes(type)) {
      throw new ApiError(
        "Tipo de ocorrência inválido.",
        400
      );
    }
  }

  /**
   * Prioridades existentes no schema.
   */
  validatePriority(priority) {
    const allowedPriorities = [
      "LOW",
      "MEDIUM",
      "HIGH",
      "URGENT",
    ];

    if (!allowedPriorities.includes(priority)) {
      throw new ApiError(
        "Prioridade da ocorrência inválida.",
        400
      );
    }
  }

  /**
   * Status existentes no schema.
   */
  validateStatus(status) {
    const allowedStatuses = [
      "NEW",
      "FORWARDED",
      "IN_REVIEW",
      "IN_PROGRESS",
      "RESOLVED",
      "CLOSED",
      "CANCELED",
    ];

    if (!allowedStatuses.includes(status)) {
      throw new ApiError(
        "Status de ocorrência inválido.",
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
   * Obtém a origem com base no perfil autenticado.
   *
   * O frontend não escolhe livremente a origem.
   */
  resolveOrigin(authenticatedUser) {
    const originByRole = {
      RESIDENT: "RESIDENT",
      DOORMAN: "DOORMAN",
      MANAGER: "MANAGER",
      CONDOMINIUM_ADMIN: "MANAGER",
      PLATFORM_ADMIN: "SYSTEM",
    };

    const origin =
      originByRole[authenticatedUser?.role];

    if (!origin) {
      throw new ApiError(
        "Não foi possível determinar a origem da ocorrência.",
        400
      );
    }

    return origin;
  }

  /**
   * Busca uma ocorrência pelo ID.
   */
  async findById(id, condominiumId) {
    const occurrence =
      await occurrenceRepository.findById(
        id,
        condominiumId
      );

    if (!occurrence) {
      throw new ApiError(
        "Ocorrência não encontrada.",
        404
      );
    }

    return occurrence;
  }

  /**
   * Lista todas as ocorrências do condomínio.
   */
  async findAll(condominiumId) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    return occurrenceRepository
      .findByCondominium(
        condominiumId
      );
  }

  /**
   * Lista ocorrências ainda ativas.
   */
  async findActive(condominiumId) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    return occurrenceRepository.findActive(
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
    this.validateStatus(status);

    return occurrenceRepository.findByStatus(
      condominiumId,
      status
    );
  }

  /**
   * Lista por tipo.
   */
  async findByType(
    condominiumId,
    type
  ) {
    this.validateType(type);

    return occurrenceRepository.findByType(
      condominiumId,
      type
    );
  }

  /**
   * Lista por prioridade.
   */
  async findByPriority(
    condominiumId,
    priority
  ) {
    this.validatePriority(priority);

    return occurrenceRepository
      .findByPriority(
        condominiumId,
        priority
      );
  }

  /**
   * Lista ocorrências de um apartamento.
   */
  async findByApartment(
    apartmentId,
    condominiumId
  ) {
    await this.validateApartment(
      apartmentId,
      condominiumId
    );

    return occurrenceRepository
      .findByApartment(
        apartmentId,
        condominiumId
      );
  }

  /**
   * Lista ocorrências criadas pelo usuário.
   */
  async findByUser(
    userId,
    condominiumId
  ) {
    if (!userId) {
      throw new ApiError(
        "Usuário não identificado.",
        400
      );
    }

    return occurrenceRepository
      .findByCreatedUser(
        userId,
        condominiumId
      );
  }

  /**
   * Confere se o apartamento existe.
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

    return apartment;
  }

  /**
   * Confere se o responsável existe, está ativo
   * e pertence ao condomínio.
   */
  async validateAssignedUser(
    assignedToUserId,
    condominiumId
  ) {
    if (!assignedToUserId) {
      throw new ApiError(
        "O responsável pela ocorrência é obrigatório.",
        400
      );
    }

    const user =
      await userRepository.findById(
        assignedToUserId,
        condominiumId
      );

    if (!user) {
      throw new ApiError(
        "Usuário responsável não encontrado.",
        404
      );
    }

    if (user.status !== "ACTIVE") {
      throw new ApiError(
        "O usuário responsável não está ativo.",
        400
      );
    }

    if (
      ![
        "CONDOMINIUM_ADMIN",
        "MANAGER",
        "DOORMAN",
      ].includes(user.role)
    ) {
      throw new ApiError(
        "Este usuário não pode ser responsável por uma ocorrência.",
        400
      );
    }

    return user;
  }

  /**
   * Confere se um morador pode abrir ocorrências.
   */
  async validateResidentPermission(
    authenticatedUser,
    condominiumId
  ) {
    if (
      authenticatedUser.role !== "RESIDENT"
    ) {
      return null;
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

    if (!resident.canOpenOccurrence) {
      throw new ApiError(
        "Este morador não possui permissão para abrir ocorrências.",
        403
      );
    }

    return resident;
  }

  /**
   * Notifica gestores sobre uma nova ocorrência.
   */
  async notifyManagers(
    condominiumId,
    occurrence
  ) {
    const notificationData = {
      title:
        "Nova ocorrência registrada",

      message:
        occurrence.title,

      type:
        "OCCURRENCE_CREATED",

      origin:
        occurrence.origin,

      module:
        "OCCURRENCE",

      referenceId:
        occurrence.id,

      priority:
        occurrence.priority,
    };

    const [
      managers,
      administrators,
    ] = await Promise.all([
      NotificationService
        .createForActiveRoleUsers(
          condominiumId,
          "MANAGER",
          notificationData
        ),

      NotificationService
        .createForActiveRoleUsers(
          condominiumId,
          "CONDOMINIUM_ADMIN",
          notificationData
        ),
    ]);

    return {
      count:
        managers.count +
        administrators.count,
    };
  }

  /**
   * Cria uma ocorrência.
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

    if (!data.title) {
      throw new ApiError(
        "O título da ocorrência é obrigatório.",
        400
      );
    }

    if (!data.description) {
      throw new ApiError(
        "A descrição da ocorrência é obrigatória.",
        400
      );
    }

    if (!data.category) {
      throw new ApiError(
        "A categoria da ocorrência é obrigatória.",
        400
      );
    }

    const origin =
      this.resolveOrigin(
        authenticatedUser
      );

    const type =
      data.type ?? "OCCURRENCE";

    const priority =
      data.priority ?? "MEDIUM";

    this.validateOrigin(origin);
    this.validateType(type);
    this.validatePriority(priority);

    const resident =
      await this.validateResidentPermission(
        authenticatedUser,
        condominiumId
      );

    let apartmentId =
      data.apartmentId ?? null;

    if (resident) {
      apartmentId =
        resident.apartmentId;
    }

    if (apartmentId) {
      await this.validateApartment(
        apartmentId,
        condominiumId
      );
    }

    let assignedToUserId = null;

    if (data.assignedToUserId) {
      const assignedUser =
        await this.validateAssignedUser(
          data.assignedToUserId,
          condominiumId
        );

      assignedToUserId =
        assignedUser.id;
    }

    const occurrence =
      await occurrenceRepository
        .createForCondominium(
          condominiumId,
          {
            apartmentId,

            createdByUserId:
              authenticatedUser.id,

            assignedToUserId,

            origin,
            type,

            category:
              String(data.category).trim(),

            priority,

            title:
              String(data.title).trim(),

            description:
              String(
                data.description
              ).trim(),

            status:
              assignedToUserId
                ? "FORWARDED"
                : "NEW",

            shift:
              data.shift
                ? String(
                    data.shift
                  ).trim()
                : null,

            dutyDate:
              this.normalizeOptionalDate(
                data.dutyDate,
                "Data do plantão"
              ),
          }
        );

    await this.notifyManagers(
      condominiumId,
      occurrence
    );

    if (
      occurrence.assignedToUserId &&
      occurrence.assignedToUserId !==
        authenticatedUser.id
    ) {
      await NotificationService
        .createForUser(
          condominiumId,
          occurrence.assignedToUserId,
          {
            title:
              "Ocorrência atribuída a você",

            message:
              occurrence.title,

            type:
              "OCCURRENCE_ASSIGNED",

            origin:
              origin,

            module:
              "OCCURRENCE",

            referenceId:
              occurrence.id,

            priority:
              occurrence.priority,
          }
        );
    }

    await AuditLogService.logCreate({
      condominiumId,
      user: authenticatedUser,
      module: "OCCURRENCE",
      referenceId:
        occurrence.id,
      afterData:
        occurrence,
      details:
        "Ocorrência registrada.",
      requestContext,
    });

    return occurrence;
  }

  /**
   * Atualiza dados editáveis da ocorrência.
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
      [
        "RESOLVED",
        "CLOSED",
        "CANCELED",
      ].includes(before.status)
    ) {
      throw new ApiError(
        "Ocorrências finalizadas não podem ser editadas.",
        409
      );
    }

    if (
      authenticatedUser?.role ===
        "RESIDENT" &&
      before.createdByUserId !==
        authenticatedUser.id
    ) {
      throw new ApiError(
        "Você não possui permissão para alterar esta ocorrência.",
        403
      );
    }

    const updateData = {
      ...data,
    };

    if (data.title !== undefined) {
      if (!data.title) {
        throw new ApiError(
          "O título da ocorrência é obrigatório.",
          400
        );
      }

      updateData.title =
        String(data.title).trim();
    }

    if (
      data.description !== undefined
    ) {
      if (!data.description) {
        throw new ApiError(
          "A descrição da ocorrência é obrigatória.",
          400
        );
      }

      updateData.description =
        String(
          data.description
        ).trim();
    }

    if (data.category !== undefined) {
      if (!data.category) {
        throw new ApiError(
          "A categoria da ocorrência é obrigatória.",
          400
        );
      }

      updateData.category =
        String(data.category).trim();
    }

    if (data.type !== undefined) {
      this.validateType(data.type);
    }

    if (data.priority !== undefined) {
      this.validatePriority(
        data.priority
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

    if (
      data.assignedToUserId !==
      undefined
    ) {
      if (data.assignedToUserId) {
        await this.validateAssignedUser(
          data.assignedToUserId,
          condominiumId
        );
      }
    }

    if (data.dutyDate !== undefined) {
      updateData.dutyDate =
        this.normalizeOptionalDate(
          data.dutyDate,
          "Data do plantão"
        );
    }

    delete updateData.status;
    delete updateData.createdByUserId;
    delete updateData.origin;
    delete updateData.resolution;
    delete updateData.resolvedAt;
    delete updateData.closedAt;
    delete updateData.readByManagerAt;
    delete updateData.readByDoormanAt;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.deletedAt;

    const updated =
      await occurrenceRepository
        .updateById(
          id,
          condominiumId,
          updateData
        );

    if (!updated) {
      throw new ApiError(
        "Ocorrência não encontrada.",
        404
      );
    }

    await AuditLogService.logUpdate({
      condominiumId,
      user: authenticatedUser,
      module: "OCCURRENCE",
      referenceId: id,
      beforeData: before,
      afterData: updated,
      details:
        "Ocorrência atualizada.",
      requestContext,
    });

    return updated;
  }

  /**
   * Atribui um responsável.
   */
  async assign(
    id,
    condominiumId,
    assignedToUserId,
    authenticatedUser,
    requestContext = null
  ) {
    const before =
      await this.findById(
        id,
        condominiumId
      );

    if (
      [
        "RESOLVED",
        "CLOSED",
        "CANCELED",
      ].includes(before.status)
    ) {
      throw new ApiError(
        "Esta ocorrência não pode mais ser atribuída.",
        409
      );
    }

    const assignedUser =
      await this.validateAssignedUser(
        assignedToUserId,
        condominiumId
      );

    const occurrence =
      await occurrenceRepository.assign(
        id,
        condominiumId,
        assignedUser.id
      );

    if (!occurrence) {
      throw new ApiError(
        "Ocorrência não encontrada.",
        404
      );
    }

    await NotificationService
      .createForUser(
        condominiumId,
        assignedUser.id,
        {
          title:
            "Ocorrência atribuída a você",

          message:
            occurrence.title,

          type:
            "OCCURRENCE_ASSIGNED",

          origin:
            authenticatedUser?.role ??
            "MANAGER",

          module:
            "OCCURRENCE",

          referenceId:
            occurrence.id,

          priority:
            occurrence.priority,
        }
      );

    await AuditLogService
      .logStatusChange({
        condominiumId,
        user: authenticatedUser,
        module: "OCCURRENCE",
        referenceId: id,
        previousStatus:
          before.status,
        newStatus:
          occurrence.status,
        details:
          `Ocorrência atribuída a ${assignedUser.name}.`,
        requestContext,
      });

    return occurrence;
  }

  /**
   * Coloca a ocorrência em análise.
   */
  async markAsInReview(
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
        "NEW",
        "FORWARDED",
      ].includes(before.status)
    ) {
      throw new ApiError(
        "Esta ocorrência não pode ser colocada em análise.",
        409
      );
    }

    const occurrence =
      await occurrenceRepository
        .markAsInReview(
          id,
          condominiumId
        );

    if (!occurrence) {
      throw new ApiError(
        "Ocorrência não encontrada.",
        404
      );
    }

    await AuditLogService
      .logStatusChange({
        condominiumId,
        user: authenticatedUser,
        module: "OCCURRENCE",
        referenceId: id,
        previousStatus:
          before.status,
        newStatus:
          occurrence.status,
        details:
          "Ocorrência colocada em análise.",
        requestContext,
      });

    return occurrence;
  }

  /**
   * Inicia o atendimento.
   */
  async startProgress(
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
        "NEW",
        "FORWARDED",
        "IN_REVIEW",
      ].includes(before.status)
    ) {
      throw new ApiError(
        "Esta ocorrência não pode ser colocada em andamento.",
        409
      );
    }

    const occurrence =
      await occurrenceRepository
        .startProgress(
          id,
          condominiumId
        );

    if (!occurrence) {
      throw new ApiError(
        "Ocorrência não encontrada.",
        404
      );
    }

    await AuditLogService
      .logStatusChange({
        condominiumId,
        user: authenticatedUser,
        module: "OCCURRENCE",
        referenceId: id,
        previousStatus:
          before.status,
        newStatus:
          occurrence.status,
        details:
          "Atendimento da ocorrência iniciado.",
        requestContext,
      });

    return occurrence;
  }

  /**
   * Resolve uma ocorrência.
   */
  async resolve(
    id,
    condominiumId,
    resolution,
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
        "NEW",
        "FORWARDED",
        "IN_REVIEW",
        "IN_PROGRESS",
      ].includes(before.status)
    ) {
      throw new ApiError(
        "Esta ocorrência não pode ser resolvida.",
        409
      );
    }

    if (!resolution) {
      throw new ApiError(
        "A descrição da solução é obrigatória.",
        400
      );
    }

    const occurrence =
      await occurrenceRepository.resolve(
        id,
        condominiumId,
        String(resolution).trim()
      );

    if (!occurrence) {
      throw new ApiError(
        "Ocorrência não encontrada.",
        404
      );
    }

    if (before.createdByUserId) {
      await NotificationService
        .createForUser(
          condominiumId,
          before.createdByUserId,
          {
            title:
              "Sua ocorrência foi resolvida",

            message:
              occurrence.title,

            type:
              "OCCURRENCE_RESOLVED",

            origin:
              "MANAGER",

            module:
              "OCCURRENCE",

            referenceId:
              occurrence.id,

            priority:
              "NORMAL",
          }
        );
    }

    await AuditLogService
      .logStatusChange({
        condominiumId,
        user: authenticatedUser,
        module: "OCCURRENCE",
        referenceId: id,
        previousStatus:
          before.status,
        newStatus:
          occurrence.status,
        details:
          "Ocorrência resolvida.",
        requestContext,
      });

    return occurrence;
  }

  /**
   * Fecha uma ocorrência resolvida.
   */
  async close(
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

    if (before.status !== "RESOLVED") {
      throw new ApiError(
        "Somente ocorrências resolvidas podem ser fechadas.",
        409
      );
    }

    const occurrence =
      await occurrenceRepository.close(
        id,
        condominiumId
      );

    if (!occurrence) {
      throw new ApiError(
        "Ocorrência não encontrada.",
        404
      );
    }

    await AuditLogService
      .logStatusChange({
        condominiumId,
        user: authenticatedUser,
        module: "OCCURRENCE",
        referenceId: id,
        previousStatus:
          before.status,
        newStatus:
          occurrence.status,
        details:
          "Ocorrência encerrada.",
        requestContext,
      });

    return occurrence;
  }

  /**
   * Cancela uma ocorrência.
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
      [
        "RESOLVED",
        "CLOSED",
        "CANCELED",
      ].includes(before.status)
    ) {
      throw new ApiError(
        "Esta ocorrência não pode ser cancelada.",
        409
      );
    }

    if (
      authenticatedUser?.role ===
        "RESIDENT" &&
      before.createdByUserId !==
        authenticatedUser.id
    ) {
      throw new ApiError(
        "Você não possui permissão para cancelar esta ocorrência.",
        403
      );
    }

    const occurrence =
      await occurrenceRepository.cancel(
        id,
        condominiumId
      );

    if (!occurrence) {
      throw new ApiError(
        "Ocorrência não encontrada.",
        404
      );
    }

    await AuditLogService
      .logStatusChange({
        condominiumId,
        user: authenticatedUser,
        module: "OCCURRENCE",
        referenceId: id,
        previousStatus:
          before.status,
        newStatus:
          occurrence.status,
        details:
          "Ocorrência cancelada.",
        requestContext,
      });

    return occurrence;
  }

  /**
   * Marca como lida pelo gestor.
   */
  async markAsReadByManager(
    id,
    condominiumId
  ) {
    const occurrence =
      await occurrenceRepository
        .markAsReadByManager(
          id,
          condominiumId
        );

    if (!occurrence) {
      throw new ApiError(
        "Ocorrência não encontrada.",
        404
      );
    }

    return occurrence;
  }

  /**
   * Marca como lida pelo porteiro.
   */
  async markAsReadByDoorman(
    id,
    condominiumId
  ) {
    const occurrence =
      await occurrenceRepository
        .markAsReadByDoorman(
          id,
          condominiumId
        );

    if (!occurrence) {
      throw new ApiError(
        "Ocorrência não encontrada.",
        404
      );
    }

    return occurrence;
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
        "CANCELED",
        "CLOSED",
      ].includes(before.status)
    ) {
      throw new ApiError(
        "Somente ocorrências canceladas ou fechadas podem ser removidas.",
        409
      );
    }

    const deleted =
      await occurrenceRepository.softDelete(
        id,
        condominiumId
      );

    if (!deleted) {
      throw new ApiError(
        "Não foi possível remover a ocorrência.",
        400
      );
    }

    await AuditLogService.logDelete({
      condominiumId,
      user: authenticatedUser,
      module: "OCCURRENCE",
      referenceId: id,
      beforeData: before,
      details:
        "Ocorrência removida logicamente.",
      requestContext,
    });

    return {
      message:
        "Ocorrência removida com sucesso.",
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
      active,
      newOccurrences,
      forwarded,
      inReview,
      inProgress,
      resolved,
      closed,
      canceled,
    ] = await Promise.all([
      occurrenceRepository
        .countByCondominium(
          condominiumId
        ),

      occurrenceRepository.countActive(
        condominiumId
      ),

      occurrenceRepository.countByStatus(
        condominiumId,
        "NEW"
      ),

      occurrenceRepository.countByStatus(
        condominiumId,
        "FORWARDED"
      ),

      occurrenceRepository.countByStatus(
        condominiumId,
        "IN_REVIEW"
      ),

      occurrenceRepository.countByStatus(
        condominiumId,
        "IN_PROGRESS"
      ),

      occurrenceRepository.countByStatus(
        condominiumId,
        "RESOLVED"
      ),

      occurrenceRepository.countByStatus(
        condominiumId,
        "CLOSED"
      ),

      occurrenceRepository.countByStatus(
        condominiumId,
        "CANCELED"
      ),
    ]);

    return {
      total,
      active,
      new: newOccurrences,
      forwarded,
      inReview,
      inProgress,
      resolved,
      closed,
      canceled,
    };
  }
}

export default new OccurrenceService();