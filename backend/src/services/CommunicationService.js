import communicationLogRepository from "../repositories/CommunicationLogRepository.js";
import userRepository from "../repositories/UserRepository.js";
import AuditLogService from "./AuditLogService.js";
import CommunicationProviderService from "./CommunicationProviderService.js";
import { ApiError } from "../utils/ApiError.js";

class CommunicationService {
  validateChannel(channel) {
    const normalized =
      String(channel ?? "")
        .trim()
        .toUpperCase();

    if (
      ![
        "WHATSAPP",
        "EMAIL",
      ].includes(normalized)
    ) {
      throw new ApiError(
        "Canal de comunicação inválido.",
        400
      );
    }

    return normalized;
  }

  normalizeRecipient(
    channel,
    recipient
  ) {
    const value =
      String(recipient ?? "")
        .trim();

    if (!value) {
      throw new ApiError(
        "Destinatário da comunicação é obrigatório.",
        400
      );
    }

    if (
      channel ===
      "WHATSAPP"
    ) {
      const digits =
        value.replace(
          /\D/g,
          ""
        );

      if (
        digits.length < 10 ||
        digits.length > 15
      ) {
        throw new ApiError(
          "Número de WhatsApp inválido.",
          400
        );
      }

      return digits;
    }

    return value
      .toLowerCase();
  }

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

  async findById(id) {
    const log =
      await communicationLogRepository
        .findById(id);

    if (!log) {
      throw new ApiError(
        "Registro de comunicação não encontrado.",
        404
      );
    }

    return log;
  }

  async findByCondominium(
    condominiumId
  ) {
    return communicationLogRepository
      .findByCondominium(
        condominiumId
      );
  }

  async findFailed(
    limit = 100
  ) {
    return communicationLogRepository
      .findFailed(limit);
  }

  async queue({
    condominiumId = null,
    recipientUserId = null,
    channel,
    recipient,
    subject = null,
    templateCode = null,
    content,
    module = null,
    referenceId = null,
    requestId = null,
    provider = null,
    metadata = null,
    preventDuplicate = true,
  }) {
    const normalizedChannel =
      this.validateChannel(
        channel
      );

    if (!content) {
      throw new ApiError(
        "Conteúdo da comunicação é obrigatório.",
        400
      );
    }

    const normalizedRecipient =
      this.normalizeRecipient(
        normalizedChannel,
        recipient
      );

    const normalizedModule =
      module
        ? String(module)
            .trim()
            .toUpperCase()
        : null;

    const normalizedReferenceId =
      this.normalizeOptionalText(
        referenceId
      );

    const normalizedTemplateCode =
      this.normalizeOptionalText(
        templateCode
      );

    /**
     * =====================================================
     * IDEMPOTÊNCIA DE COMUNICAÇÃO
     * =====================================================
     *
     * Quando existe um código estável de evento
     * (templateCode), evitamos criar uma nova mensagem
     * equivalente para o mesmo destinatário e referência.
     *
     * Comunicações FAILED são reaproveitadas e poderão
     * ser reenviadas pelo fluxo de retry.
     */
    if (
      preventDuplicate &&
      normalizedTemplateCode
    ) {
      const existing =
        await communicationLogRepository
          .findEquivalent({
            condominiumId,
            recipientUserId,
            channel:
              normalizedChannel,
            recipient:
              normalizedRecipient,
            module:
              normalizedModule,
            referenceId:
              normalizedReferenceId,
            templateCode:
              normalizedTemplateCode,
          });

      if (existing) {
        return existing;
      }
    }

    return communicationLogRepository
      .createLog({
        condominiumId,
        recipientUserId,
        channel:
          normalizedChannel,
        status:
          "PENDING",
        recipient:
          normalizedRecipient,
        subject:
          this.normalizeOptionalText(
            subject
          ),
        templateCode:
          normalizedTemplateCode,
        contentSnapshot:
          String(content).trim(),
        module:
          normalizedModule,
        referenceId:
          normalizedReferenceId,
        requestId:
          this.normalizeOptionalText(
            requestId
          ),
        provider:
          provider
            ? String(provider)
                .trim()
                .toUpperCase()
            : null,
        metadata,
        preventDuplicate,
      });
  }

  async queueForUser({
    condominiumId,
    recipientUserId,
    channel = "WHATSAPP",
    subject = null,
    templateCode = null,
    content,
    module = null,
    referenceId = null,
    requestId = null,
    provider = null,
    metadata = null,
    preventDuplicate = true,
  }) {
    const user =
      await userRepository
        .findById(
          recipientUserId,
          condominiumId
        );

    if (!user) {
      throw new ApiError(
        "Usuário destinatário não encontrado.",
        404
      );
    }

    if (
      user.status !==
      "ACTIVE"
    ) {
      throw new ApiError(
        "Usuário destinatário não está ativo.",
        400
      );
    }

    const normalizedChannel =
      this.validateChannel(
        channel
      );

    const recipient =
      normalizedChannel ===
      "WHATSAPP"
        ? user.phone
        : user.email;

    if (!recipient) {
      return {
        queued: false,
        reason:
          normalizedChannel ===
          "WHATSAPP"
            ? "Usuário sem telefone cadastrado."
            : "Usuário sem e-mail cadastrado.",
        userId:
          user.id,
      };
    }

    const communication =
      await this.queue({
        condominiumId,
        recipientUserId:
          user.id,
        channel:
          normalizedChannel,
        recipient,
        subject,
        templateCode,
        content,
        module,
        referenceId,
        requestId,
        provider,
        metadata,
        preventDuplicate,
      });

    return {
      queued: true,
      communication,
    };
  }

  async send(
    id,
    authenticatedUser = null,
    requestContext = null
  ) {
    const before =
      await this.findById(id);

    if (
      before.status ===
      "CANCELED"
    ) {
      throw new ApiError(
        "Comunicação cancelada não pode ser enviada.",
        409
      );
    }

    if (
      [
        "SENT",
        "DELIVERED",
      ].includes(
        before.status
      )
    ) {
      return before;
    }

    await communicationLogRepository
      .markAttempt(id);

    try {
      const result =
        await CommunicationProviderService
          .send({
            channel:
              before.channel,
            provider:
              before.provider,
            recipient:
              before.recipient,
            subject:
              before.subject,
            templateCode:
              before.templateCode,
            content:
              before.contentSnapshot,
            metadata:
              before.metadata,
          });

      const sent =
        await communicationLogRepository
          .markSent(
            id,
            {
              provider:
                result.provider,
              providerMessageId:
                result.providerMessageId ??
                null,
              metadata: {
                ...(before.metadata ??
                  {}),
                providerResponse:
                  result.metadata ??
                  null,
              },
            }
          );

      await AuditLogService
        .createLog({
          condominiumId:
            before.condominiumId,
          userId:
            authenticatedUser
              ?.id ??
            null,
          userName:
            authenticatedUser
              ?.name ??
            null,
          userRole:
            authenticatedUser
              ?.role ??
            null,
          action:
            "SEND",
          module:
            "COMMUNICATION",
          details:
            `${before.channel} enviado com sucesso.`,
          referenceId:
            before.id,
          requestId:
            requestContext
              ?.requestId ??
            before.requestId ??
            null,
          afterData: {
            status:
              sent?.status ??
              "SENT",
            provider:
              result.provider,
            providerMessageId:
              result.providerMessageId ??
              null,
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

      return sent;
    } catch (error) {
      const failed =
        await communicationLogRepository
          .markFailed(
            id,
            error?.message ??
            "Falha ao enviar comunicação.",
            {
              ...(before.metadata ??
                {}),
              errorName:
                error?.name ??
                null,
            }
          );

      await AuditLogService
        .createLog({
          condominiumId:
            before.condominiumId,
          userId:
            authenticatedUser
              ?.id ??
            null,
          userName:
            authenticatedUser
              ?.name ??
            null,
          userRole:
            authenticatedUser
              ?.role ??
            null,
          action:
            "SEND_FAILED",
          module:
            "COMMUNICATION",
          details:
            error?.message ??
            "Falha ao enviar comunicação.",
          referenceId:
            before.id,
          requestId:
            requestContext
              ?.requestId ??
            before.requestId ??
            null,
          afterData: {
            status:
              failed?.status ??
              "FAILED",
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

      throw error;
    }
  }

  async queueAndSend(data) {
    const queued =
      data.recipientUserId
        ? await this.queueForUser(
            data
          )
        : {
            queued: true,
            communication:
              await this.queue(
                data
              ),
          };

    if (!queued.queued) {
      return queued;
    }

    const communication =
      queued.communication;

    /**
     * Se o mesmo evento já foi SENT ou DELIVERED,
     * não enviamos novamente.
     */
    if (
      [
        "SENT",
        "DELIVERED",
      ].includes(
        communication.status
      )
    ) {
      return {
        queued: true,
        deduplicated: true,
        communication,
      };
    }

    /**
     * Se a comunicação equivalente já havia falhado,
     * reutilizamos o mesmo registro e fazemos retry.
     */
    const sent =
      await this.send(
        communication.id,
        data.authenticatedUser ??
          null,
        data.requestContext ??
          null
      );

    return {
      queued: true,
      deduplicated:
        communication.attemptCount >
        0,
      communication:
        sent,
    };
  }

  async retry(
    id,
    authenticatedUser = null,
    requestContext = null
  ) {
    const communication =
      await this.findById(id);

    if (
      communication.status !==
      "FAILED"
    ) {
      throw new ApiError(
        "Somente comunicações com falha podem ser reenviadas.",
        409
      );
    }

    return this.send(
      id,
      authenticatedUser,
      requestContext
    );
  }

  async markDeliveredByProvider({
    provider,
    providerMessageId,
  }) {
    const communication =
      await communicationLogRepository
        .findByProviderMessageId(
          provider,
          providerMessageId
        );

    if (!communication) {
      return null;
    }

    return communicationLogRepository
      .markDelivered(
        communication.id
      );
  }

  async statistics() {
    const [
      pending,
      sent,
      delivered,
      failed,
      canceled,
      whatsapp,
      email,
    ] = await Promise.all([
      communicationLogRepository
        .countByStatus(
          "PENDING"
        ),
      communicationLogRepository
        .countByStatus(
          "SENT"
        ),
      communicationLogRepository
        .countByStatus(
          "DELIVERED"
        ),
      communicationLogRepository
        .countByStatus(
          "FAILED"
        ),
      communicationLogRepository
        .countByStatus(
          "CANCELED"
        ),
      communicationLogRepository
        .countByChannel(
          "WHATSAPP"
        ),
      communicationLogRepository
        .countByChannel(
          "EMAIL"
        ),
    ]);

    return {
      pending,
      sent,
      delivered,
      failed,
      canceled,
      whatsapp,
      email,
      total:
        pending +
        sent +
        delivered +
        failed +
        canceled,
    };
  }
}

export default new CommunicationService();
