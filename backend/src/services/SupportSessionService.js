import SupportSessionRepository from "../repositories/SupportSessionRepository.js";
import condominiumRepository from "../repositories/CondominiumRepository.js";
import AuditLogService from "./AuditLogService.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * =====================================================
 * SUPPORT SESSION SERVICE
 * =====================================================
 *
 * Controla o acesso temporário do PLATFORM_ADMIN
 * ao contexto de um condomínio.
 *
 * O administrador da plataforma nunca se transforma
 * em usuário do cliente. A identidade permanece sendo
 * PLATFORM_ADMIN e o condomínio é apenas um contexto
 * temporário de suporte.
 */
class SupportSessionService {
  get maxIdleMinutes() {
    return 30;
  }

  validatePlatformAdmin(
    platformAdmin
  ) {
    if (
      !platformAdmin?.id ||
      ![
        "PLATFORM_OWNER",
        "PLATFORM_ADMIN",
        "PLATFORM_SUPPORT",
      ].includes(
        platformAdmin.role
      )
    ) {
      throw new ApiError(
        "Acesso restrito à equipe interna da plataforma.",
        403
      );
    }
  }

  normalizeReason(reason) {
    const normalized =
      String(
        reason ?? ""
      ).trim();

    if (
      normalized.length < 5
    ) {
      throw new ApiError(
        "Informe o motivo do acesso de suporte com pelo menos 5 caracteres.",
        400
      );
    }

    if (
      normalized.length > 1000
    ) {
      throw new ApiError(
        "O motivo do acesso de suporte deve possuir no máximo 1000 caracteres.",
        400
      );
    }

    return normalized;
  }

  buildRequestContext(
    requestContext = null
  ) {
    return {
      requestId:
        requestContext?.requestId ??
        null,

      ipAddress:
        requestContext?.ipAddress ??
        null,

      userAgent:
        requestContext?.userAgent ??
        null,
    };
  }

  async expireOldSessions() {
    const referenceDate =
      new Date(
        Date.now() -
        this.maxIdleMinutes *
        60 *
        1000
      );

    await SupportSessionRepository
      .expireInactiveBefore(
        referenceDate
      );
  }

  async start(
    condominiumId,
    reason,
    platformAdmin,
    requestContext = null
  ) {
    this.validatePlatformAdmin(
      platformAdmin
    );

    await this.expireOldSessions();

    const condominium =
      await condominiumRepository
        .findById(
          condominiumId
        );

    if (!condominium) {
      throw new ApiError(
        "Condomínio não encontrado.",
        404
      );
    }

    if (
      condominium.status ===
        "CANCELED" ||
      condominium.status ===
        "REJECTED"
    ) {
      throw new ApiError(
        "Não é possível iniciar suporte para este condomínio.",
        409
      );
    }

    const activeSession =
      await SupportSessionRepository
        .findActiveByPlatformAdmin(
          platformAdmin.id
        );

    if (activeSession) {
      throw new ApiError(
        "Já existe uma sessão de suporte ativa. Encerre a sessão atual antes de acessar outro condomínio.",
        409
      );
    }

    const normalizedReason =
      this.normalizeReason(
        reason
      );

    const context =
      this.buildRequestContext(
        requestContext
      );

    const session =
      await SupportSessionRepository
        .createSession({
          platformAdminUserId:
            platformAdmin.id,

          condominiumId:
            condominium.id,

          reason:
            normalizedReason,

          requestId:
            context.requestId,

          ipAddress:
            context.ipAddress,

          userAgent:
            context.userAgent,
        });

    await AuditLogService
      .createLog({
        condominiumId:
          condominium.id,

        userId:
          platformAdmin.id,

        userName:
          platformAdmin.name,

        userRole:
          platformAdmin.role,

        supportSessionId:
          session.id,

        action:
          "SUPPORT_START",

        module:
          "SUPPORT",

        details:
          normalizedReason,

        referenceId:
          session.id,

        requestId:
          context.requestId,

        ipAddress:
          context.ipAddress,

        userAgent:
          context.userAgent,

        afterData: {
          supportSessionId:
            session.id,

          condominiumId:
            condominium.id,

          status:
            session.status,

          startedAt:
            session.startedAt,
        },
      });

    return session;
  }

  async getCurrent(
    platformAdmin
  ) {
    this.validatePlatformAdmin(
      platformAdmin
    );

    await this.expireOldSessions();

    return SupportSessionRepository
      .findActiveByPlatformAdmin(
        platformAdmin.id
      );
  }

  async findById(
    id,
    platformAdmin
  ) {
    this.validatePlatformAdmin(
      platformAdmin
    );

    const session =
      await SupportSessionRepository
        .findById(id);

    if (!session) {
      throw new ApiError(
        "Sessão de suporte não encontrada.",
        404
      );
    }

    if (
      session.platformAdminUserId !==
      platformAdmin.id
    ) {
      throw new ApiError(
        "Você não possui acesso a esta sessão de suporte.",
        403
      );
    }

    return session;
  }

  async listMine(
    platformAdmin
  ) {
    this.validatePlatformAdmin(
      platformAdmin
    );

    return SupportSessionRepository
      .listByPlatformAdmin(
        platformAdmin.id
      );
  }

  async close(
    id,
    platformAdmin,
    requestContext = null
  ) {
    this.validatePlatformAdmin(
      platformAdmin
    );

    const before =
      await this.findById(
        id,
        platformAdmin
      );

    if (
      before.status !==
      "ACTIVE"
    ) {
      throw new ApiError(
        "Esta sessão de suporte já foi encerrada.",
        409
      );
    }

    const endedAt =
      new Date();

    const closed =
      await SupportSessionRepository
        .close(
          before.id,
          endedAt
        );

    const context =
      this.buildRequestContext(
        requestContext
      );

    await AuditLogService
      .createLog({
        condominiumId:
          before.condominiumId,

        userId:
          platformAdmin.id,

        userName:
          platformAdmin.name,

        userRole:
          platformAdmin.role,

        supportSessionId:
          before.id,

        action:
          "SUPPORT_END",

        module:
          "SUPPORT",

        details:
          "Sessão de suporte encerrada pelo PLATFORM_ADMIN.",

        referenceId:
          before.id,

        requestId:
          context.requestId,

        ipAddress:
          context.ipAddress,

        userAgent:
          context.userAgent,

        beforeData: {
          status:
            before.status,
        },

        afterData: {
          status:
            closed.status,

          endedAt:
            closed.endedAt,
        },
      });

    return closed;
  }

  async validateActiveSession(
    sessionId,
    platformAdmin
  ) {
    this.validatePlatformAdmin(
      platformAdmin
    );

    if (!sessionId) {
      throw new ApiError(
        "Sessão de suporte não informada.",
        401
      );
    }

    await this.expireOldSessions();

    const session =
      await SupportSessionRepository
        .findActiveById(
          sessionId
        );

    if (!session) {
      throw new ApiError(
        "Sessão de suporte inválida, encerrada ou expirada.",
        401
      );
    }

    if (
      session.platformAdminUserId !==
      platformAdmin.id
    ) {
      throw new ApiError(
        "Esta sessão de suporte pertence a outro administrador.",
        403
      );
    }

    await SupportSessionRepository
      .touch(
        session.id
      );

    return session;
  }
}

export default new SupportSessionService();
