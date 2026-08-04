import auditLogRepository from "../repositories/AuditLogRepository.js";
import { ApiError } from "../utils/ApiError.js";

class AuditLogService {
  /**
   * Lista os logs de auditoria de um condomínio.
   */
  async findByCondominium(condominiumId) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    return auditLogRepository.findByCondominium(
      condominiumId
    );
  }

  /**
   * Busca um log pelo ID.
   */
  async findById(id, condominiumId = null) {
    if (!id) {
      throw new ApiError(
        "O ID do log é obrigatório.",
        400
      );
    }

    const log =
      await auditLogRepository.findById(
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

  /**
   * Lista logs globais da plataforma.
   *
   * Esse método será usado somente pelo
   * administrador da Star Infinity Code.
   */
  async findPlatformLogs() {
    return auditLogRepository.findPlatformLogs();
  }

  /**
   * Lista ações realizadas por um usuário.
   */
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

    return auditLogRepository.findByUser(
      userId,
      condominiumId
    );
  }

  /**
   * Lista logs de determinado módulo.
   */
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

    return auditLogRepository.findByModule(
      condominiumId,
      String(module).trim().toUpperCase()
    );
  }

  /**
   * Lista logs por ação.
   */
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

    return auditLogRepository.findByAction(
      condominiumId,
      String(action).trim().toUpperCase()
    );
  }

  /**
   * Lista logs relacionados a um registro.
   */
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

    return auditLogRepository.findByReference(
      condominiumId,
      referenceId
    );
  }

  /**
   * Lista logs dentro de um período.
   */
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

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      throw new ApiError(
        "Período de auditoria inválido.",
        400
      );
    }

    if (start > end) {
      throw new ApiError(
        "A data inicial não pode ser posterior à data final.",
        400
      );
    }

    return auditLogRepository.findByPeriod(
      condominiumId,
      start,
      end
    );
  }

  /**
   * Cria um registro de auditoria.
   *
   * Esse método será chamado pelos demais Services.
   */
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

    return auditLogRepository.createLog({
      condominiumId:
        data.condominiumId ?? null,

      userId:
        data.userId ?? null,

      userName:
        data.userName ?? null,

      userRole:
        data.userRole ?? null,

      action:
        String(data.action)
          .trim()
          .toUpperCase(),

      module:
        String(data.module)
          .trim()
          .toUpperCase(),

      details:
        data.details ?? null,

      referenceId:
        data.referenceId ?? null,

      beforeData:
        this.prepareJsonData(
          data.beforeData
        ),

      afterData:
        this.prepareJsonData(
          data.afterData
        ),

      ipAddress:
        data.ipAddress ?? null,

      userAgent:
        data.userAgent ?? null,
    });
  }

  /**
   * Registra a criação de um dado.
   */
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
      userId: user?.id ?? null,
      userName: user?.name ?? null,
      userRole: user?.role ?? null,
      action: "CREATE",
      module,
      details:
        details ??
        "Registro criado.",
      referenceId,
      beforeData: null,
      afterData,
      ipAddress:
        requestContext?.ipAddress ?? null,
      userAgent:
        requestContext?.userAgent ?? null,
    });
  }

  /**
   * Registra a atualização de um dado.
   */
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
      userId: user?.id ?? null,
      userName: user?.name ?? null,
      userRole: user?.role ?? null,
      action: "UPDATE",
      module,
      details:
        details ??
        "Registro atualizado.",
      referenceId,
      beforeData,
      afterData,
      ipAddress:
        requestContext?.ipAddress ?? null,
      userAgent:
        requestContext?.userAgent ?? null,
    });
  }

  /**
   * Registra exclusão lógica.
   */
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
      userId: user?.id ?? null,
      userName: user?.name ?? null,
      userRole: user?.role ?? null,
      action: "DELETE",
      module,
      details:
        details ??
        "Registro removido logicamente.",
      referenceId,
      beforeData,
      afterData: null,
      ipAddress:
        requestContext?.ipAddress ?? null,
      userAgent:
        requestContext?.userAgent ?? null,
    });
  }

  /**
   * Registra uma mudança de status.
   *
   * Será usado em reservas, visitantes,
   * encomendas e ocorrências.
   */
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
      userId: user?.id ?? null,
      userName: user?.name ?? null,
      userRole: user?.role ?? null,
      action: "STATUS_CHANGE",
      module,
      details:
        details ??
        `Status alterado de ${previousStatus} para ${newStatus}.`,
      referenceId,
      beforeData: {
        status: previousStatus,
      },
      afterData: {
        status: newStatus,
      },
      ipAddress:
        requestContext?.ipAddress ?? null,
      userAgent:
        requestContext?.userAgent ?? null,
    });
  }

  /**
   * Registra login.
   */
  async logLogin({
    user,
    ipAddress = null,
    userAgent = null,
  }) {
    return this.createLog({
      condominiumId:
        user?.condominiumId ?? null,
      userId:
        user?.id ?? null,
      userName:
        user?.name ?? null,
      userRole:
        user?.role ?? null,
      action: "LOGIN",
      module: "AUTH",
      details:
        "Login realizado com sucesso.",
      referenceId:
        user?.id ?? null,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Registra logout.
   */
  async logLogout({
    user,
    ipAddress = null,
    userAgent = null,
  }) {
    return this.createLog({
      condominiumId:
        user?.condominiumId ?? null,
      userId:
        user?.id ?? null,
      userName:
        user?.name ?? null,
      userRole:
        user?.role ?? null,
      action: "LOGOUT",
      module: "AUTH",
      details:
        "Logout realizado com sucesso.",
      referenceId:
        user?.id ?? null,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Prepara dados para os campos Json do Prisma.
   *
   * Remove valores indefinidos e objetos
   * que não podem ser serializados.
   */
  prepareJsonData(data) {
    if (data === undefined || data === null) {
      return null;
    }

    try {
      return JSON.parse(
        JSON.stringify(data)
      );
    } catch {
      return {
        message:
          "Não foi possível serializar os dados para auditoria.",
      };
    }
  }

  /**
   * Conta os logs de um condomínio.
   */
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

  /**
   * Conta logs por módulo.
   */
  async countByModule(
    condominiumId,
    module
  ) {
    if (!condominiumId || !module) {
      throw new ApiError(
        "Condomínio e módulo são obrigatórios.",
        400
      );
    }

    return auditLogRepository.countByModule(
      condominiumId,
      String(module).trim().toUpperCase()
    );
  }
}

export default new AuditLogService();