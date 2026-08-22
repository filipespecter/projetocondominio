import auditLogRepository from "../repositories/AuditLogRepository.js";
import { ApiError } from "../utils/ApiError.js";

class AuditLogService {
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

  normalizeUppercaseText(value) {
    const normalizedValue =
      this.normalizeOptionalText(
        value
      );

    if (!normalizedValue) {
      return null;
    }

    return normalizedValue
      .toUpperCase();
  }

  async findByCondominium(
    condominiumId
  ) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    return auditLogRepository
      .findByCondominium(
        condominiumId
      );
  }

  async findById(
    id,
    condominiumId = null
  ) {
    if (!id) {
      throw new ApiError(
        "O ID do log é obrigatório.",
        400
      );
    }

    const log =
      await auditLogRepository
        .findById(
          id,
          condominiumId
        );

    if (!log) {
      throw new ApiError(
        "Registro de auditoria não encontrado.",
        404
      );
    }

    return log;
  }

  async findPlatformLogs() {
    return auditLogRepository
      .findPlatformLogs();
  }

  async findByUser(
    userId,
    condominiumId = null
  ) {
    if (!userId) {
      throw new ApiError(
        "Usuário não identificado.",
        400
      );
    }

    return auditLogRepository
      .findByUser(
        userId,
        condominiumId
      );
  }

  async findBySupportSession(
    supportSessionId
  ) {
    if (!supportSessionId) {
      throw new ApiError(
        "Sessão de suporte não identificada.",
        400
      );
    }

    return auditLogRepository
      .findBySupportSession(
        supportSessionId
      );
  }

  async findByModule(
    condominiumId,
    module
  ) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    if (!module) {
      throw new ApiError(
        "O módulo é obrigatório.",
        400
      );
    }

    return auditLogRepository
      .findByModule(
        condominiumId,
        String(module)
          .trim()
          .toUpperCase()
      );
  }

  async findByAction(
    condominiumId,
    action
  ) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    if (!action) {
      throw new ApiError(
        "A ação é obrigatória.",
        400
      );
    }

    return auditLogRepository
      .findByAction(
        condominiumId,
        String(action)
          .trim()
          .toUpperCase()
      );
  }

  async findByReference(
    condominiumId,
    referenceId
  ) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    if (!referenceId) {
      throw new ApiError(
        "A referência é obrigatória.",
        400
      );
    }

    return auditLogRepository
      .findByReference(
        condominiumId,
        String(
          referenceId
        ).trim()
      );
  }

  async findByPeriod(
    condominiumId,
    startDate,
    endDate
  ) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    const start =
      new Date(
        startDate
      );

    const end =
      new Date(
        endDate
      );

    if (
      Number.isNaN(
        start.getTime()
      ) ||
      Number.isNaN(
        end.getTime()
      )
    ) {
      throw new ApiError(
        "Período de auditoria inválido.",
        400
      );
    }

    if (
      typeof startDate ===
        "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(
        startDate
      )
    ) {
      start.setHours(
        0,
        0,
        0,
        0
      );
    }

    if (
      typeof endDate ===
        "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(
        endDate
      )
    ) {
      end.setHours(
        23,
        59,
        59,
        999
      );
    }

    if (
      start > end
    ) {
      throw new ApiError(
        "A data inicial não pode ser posterior à data final.",
        400
      );
    }

    return auditLogRepository
      .findByPeriod(
        condominiumId,
        start,
        end
      );
  }

  async createLog(data) {
    if (!data?.action) {
      throw new ApiError(
        "A ação da auditoria é obrigatória.",
        400
      );
    }

    if (!data?.module) {
      throw new ApiError(
        "O módulo da auditoria é obrigatório.",
        400
      );
    }

    return auditLogRepository
      .createLog({
        condominiumId:
          data.condominiumId ??
          null,

        userId:
          data.userId ??
          null,

        supportSessionId:
          data.supportSessionId ??
          null,

        userName:
          this.normalizeOptionalText(
            data.userName
          ),

        userRole:
          this.normalizeUppercaseText(
            data.userRole
          ),

        action:
          String(data.action)
            .trim()
            .toUpperCase(),

        module:
          String(data.module)
            .trim()
            .toUpperCase(),

        details:
          this.normalizeOptionalText(
            data.details
          ),

        referenceId:
          this.normalizeOptionalText(
            data.referenceId
          ),

        requestId:
          this.normalizeOptionalText(
            data.requestId
          ),

        beforeData:
          this.prepareJsonData(
            data.beforeData
          ),

        afterData:
          this.prepareJsonData(
            data.afterData
          ),

        ipAddress:
          this.normalizeOptionalText(
            data.ipAddress
          ),

        userAgent:
          this.normalizeOptionalText(
            data.userAgent
          ),
      });
  }

  async logCreate({
    condominiumId,
    user,
    module,
    referenceId,
    afterData,
    details,
    requestContext,
  }) {
    return this.createLog({
      condominiumId,

      userId:
        user?.id ??
        null,

      userName:
        user?.name ??
        null,

      userRole:
        user?.role ??
        null,

      supportSessionId:
        requestContext
          ?.supportSessionId ??
        null,

      action:
        "CREATE",

      module,

      details:
        details ??
        "Registro criado.",

      referenceId,

      requestId:
        requestContext
          ?.requestId ??
        null,

      beforeData:
        null,

      afterData,

      ipAddress:
        requestContext
          ?.ipAddress ??
        null,

      userAgent:
        requestContext
          ?.userAgent ??
        null,
    });
  }

  async logUpdate({
    condominiumId,
    user,
    module,
    referenceId,
    beforeData,
    afterData,
    details,
    requestContext,
  }) {
    return this.createLog({
      condominiumId,

      userId:
        user?.id ??
        null,

      userName:
        user?.name ??
        null,

      userRole:
        user?.role ??
        null,

      supportSessionId:
        requestContext
          ?.supportSessionId ??
        null,

      action:
        "UPDATE",

      module,

      details:
        details ??
        "Registro atualizado.",

      referenceId,

      requestId:
        requestContext
          ?.requestId ??
        null,

      beforeData,

      afterData,

      ipAddress:
        requestContext
          ?.ipAddress ??
        null,

      userAgent:
        requestContext
          ?.userAgent ??
        null,
    });
  }

  async logDelete({
    condominiumId,
    user,
    module,
    referenceId,
    beforeData,
    details,
    requestContext,
  }) {
    return this.createLog({
      condominiumId,

      userId:
        user?.id ??
        null,

      userName:
        user?.name ??
        null,

      userRole:
        user?.role ??
        null,

      supportSessionId:
        requestContext
          ?.supportSessionId ??
        null,

      action:
        "DELETE",

      module,

      details:
        details ??
        "Registro removido logicamente.",

      referenceId,

      requestId:
        requestContext
          ?.requestId ??
        null,

      beforeData,

      afterData:
        null,

      ipAddress:
        requestContext
          ?.ipAddress ??
        null,

      userAgent:
        requestContext
          ?.userAgent ??
        null,
    });
  }

  async logStatusChange({
    condominiumId,
    user,
    module,
    referenceId,
    previousStatus,
    newStatus,
    details,
    requestContext,
  }) {
    return this.createLog({
      condominiumId,

      userId:
        user?.id ??
        null,

      userName:
        user?.name ??
        null,

      userRole:
        user?.role ??
        null,

      supportSessionId:
        requestContext
          ?.supportSessionId ??
        null,

      action:
        "STATUS_CHANGE",

      module,

      details:
        details ??
        `Status alterado de ${previousStatus} para ${newStatus}.`,

      referenceId,

      requestId:
        requestContext
          ?.requestId ??
        null,

      beforeData: {
        status:
          previousStatus,
      },

      afterData: {
        status:
          newStatus,
      },

      ipAddress:
        requestContext
          ?.ipAddress ??
        null,

      userAgent:
        requestContext
          ?.userAgent ??
        null,
    });
  }

  async logLogin({
    user,
    ipAddress = null,
    userAgent = null,
    requestId = null,
  }) {
    return this.createLog({
      condominiumId:
        user?.condominiumId ??
        null,

      userId:
        user?.id ??
        null,

      userName:
        user?.name ??
        null,

      userRole:
        user?.role ??
        null,

      action:
        "LOGIN",

      module:
        "AUTH",

      details:
        "Login realizado com sucesso.",

      referenceId:
        user?.id ??
        null,

      requestId,

      ipAddress,
      userAgent,
    });
  }

  async logLogout({
    user,
    ipAddress = null,
    userAgent = null,
    requestId = null,
  }) {
    return this.createLog({
      condominiumId:
        user?.condominiumId ??
        null,

      userId:
        user?.id ??
        null,

      userName:
        user?.name ??
        null,

      userRole:
        user?.role ??
        null,

      action:
        "LOGOUT",

      module:
        "AUTH",

      details:
        "Logout realizado com sucesso.",

      referenceId:
        user?.id ??
        null,

      requestId,

      ipAddress,
      userAgent,
    });
  }

  prepareJsonData(data) {
    if (
      data === undefined ||
      data === null
    ) {
      return null;
    }

    try {
      return JSON.parse(
        JSON.stringify(
          data
        )
      );
    } catch {
      return {
        message:
          "Não foi possível serializar os dados para auditoria.",
      };
    }
  }

  async countByCondominium(
    condominiumId
  ) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    return auditLogRepository
      .countByCondominium(
        condominiumId
      );
  }

  async countByModule(
    condominiumId,
    module
  ) {
    if (
      !condominiumId ||
      !module
    ) {
      throw new ApiError(
        "Condomínio e módulo são obrigatórios.",
        400
      );
    }

    return auditLogRepository
      .countByModule(
        condominiumId,
        String(module)
          .trim()
          .toUpperCase()
      );
  }

  async countBySupportSession(
    supportSessionId
  ) {
    if (
      !supportSessionId
    ) {
      throw new ApiError(
        "Sessão de suporte não identificada.",
        400
      );
    }

    return auditLogRepository
      .countBySupportSession(
        supportSessionId
      );
  }
}

export default new AuditLogService();
