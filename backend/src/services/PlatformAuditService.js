import PlatformAuditRepository from "../repositories/PlatformAuditRepository.js";
import AuditLogService from "./AuditLogService.js";
import { ApiError } from "../utils/ApiError.js";

class PlatformAuditService {
  parseDate(value, endOfDay = false) {
    if (!value) {
      return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new ApiError(
        "Data de auditoria inválida.",
        400
      );
    }

    if (
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
      date.setHours(
        endOfDay ? 23 : 0,
        endOfDay ? 59 : 0,
        endOfDay ? 59 : 0,
        endOfDay ? 999 : 0
      );
    }

    return date;
  }

  normalizePagination(query = {}) {
    const page = Math.max(
      Number.parseInt(query.page, 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number.parseInt(query.limit, 10) || 20,
        1
      ),
      100
    );

    return {
      page,
      limit,
    };
  }

  async list(query = {}) {
    const { page, limit } =
      this.normalizePagination(query);

    const startDate =
      this.parseDate(query.startDate);

    const endDate =
      this.parseDate(
        query.endDate,
        true
      );

    if (
      startDate &&
      endDate &&
      startDate > endDate
    ) {
      throw new ApiError(
        "A data inicial não pode ser posterior à data final.",
        400
      );
    }

    const filters = {
      condominiumId:
        query.condominiumId,
      userId:
        query.userId,
      userRole:
        query.userRole,
      module:
        query.module,
      action:
        query.action,
      referenceId:
        query.referenceId,
      requestId:
        query.requestId,
      supportSessionId:
        query.supportSessionId,
      search:
        query.search,
      startDate,
      endDate,
      includeDeleted: query.includeDeleted === "true",
    };

    const { items, total } =
      await PlatformAuditRepository
        .findPaginated(
          filters,
          page,
          limit
        );

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages:
          Math.ceil(
            total / limit
          ),
      },
    };
  }

  async findById(id) {
    if (!id) {
      throw new ApiError(
        "O ID do log é obrigatório.",
        400
      );
    }

    const log =
      await PlatformAuditRepository
        .findById(id);

    if (!log) {
      throw new ApiError(
        "Registro de auditoria não encontrado.",
        404
      );
    }

    return log;
  }

  async condominiumTimeline(
    condominiumId,
    query = {}
  ) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    return this.list({
      ...query,
      condominiumId,
    });
  }

  async userTimeline(
    userId,
    query = {}
  ) {
    if (!userId) {
      throw new ApiError(
        "Usuário não identificado.",
        400
      );
    }

    return this.list({
      ...query,
      userId,
    });
  }

  async supportTimeline(
    supportSessionId,
    query = {}
  ) {
    if (!supportSessionId) {
      throw new ApiError(
        "Sessão de suporte não identificada.",
        400
      );
    }

    return this.list({
      ...query,
      supportSessionId,
    });
  }

  async requestTimeline(
    requestId
  ) {
    const normalized =
      String(
        requestId ?? ""
      ).trim();

    if (!normalized) {
      throw new ApiError(
        "Request ID não identificado.",
        400
      );
    }

    const auditLogs =
      await PlatformAuditRepository
        .findByRequestId(
          normalized
        );

    return {
      requestId:
        normalized,
      auditLogs,
    };
  }


  normalizeArchiveReason(reason) {
    const normalized = String(reason ?? "").trim();
    if (normalized.length < 5) {
      throw new ApiError("Informe um motivo com pelo menos 5 caracteres para ocultar registros da auditoria.", 400);
    }
    if (normalized.length > 500) {
      throw new ApiError("O motivo da ocultação deve possuir no máximo 500 caracteres.", 400);
    }
    return normalized;
  }

  ensureOwner(platformUser) {
    if (platformUser?.role !== "PLATFORM_OWNER") {
      throw new ApiError("Somente o proprietário da plataforma pode alterar a visualização da auditoria.", 403);
    }
  }

  async archive(id, platformUser, reason = null) {
    this.ensureOwner(platformUser);
    const normalizedReason = this.normalizeArchiveReason(reason);
    const log = await PlatformAuditRepository.findById(id);
    if (!log || log.deletedAt) throw new ApiError("Registro de auditoria não encontrado.", 404);
    return PlatformAuditRepository.softDelete(id, platformUser.id, normalizedReason);
  }

  async archiveVisible(platformUser, reason = null, requestContext = null) {
    this.ensureOwner(platformUser);
    const normalizedReason = this.normalizeArchiveReason(reason);
    const result = await PlatformAuditRepository.softDeleteVisible(platformUser.id, normalizedReason);

    await AuditLogService.createLog({
      condominiumId: null,
      userId: platformUser.id,
      userName: platformUser.name ?? null,
      userRole: platformUser.role,
      action: "ARCHIVE_VIEW",
      module: "AUDIT",
      details: `Visualização da auditoria limpa logicamente. ${result.count} registro(s) ocultado(s).`,
      requestId: requestContext?.requestId ?? null,
      afterData: {
        archivedCount: result.count,
        archivedAt: result.archivedAt,
        reason: normalizedReason,
      },
      ipAddress: requestContext?.ipAddress ?? null,
      userAgent: requestContext?.userAgent ?? null,
    });

    return result;
  }

  async statistics() {
    return PlatformAuditRepository
      .statistics();
  }
}

export default new PlatformAuditService();
