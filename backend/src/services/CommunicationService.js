import crypto from "node:crypto";
import ApartmentContactService from "./ApartmentContactService.js";
import { normalizeWhatsAppPhone } from "../utils/MessagingSecrets.js";
import PackageCredentialService from "./PackageCredentialService.js";
import prisma from "../config/prisma.js";
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
      return normalizeWhatsAppPhone(value);
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

    const deduplicationKey = preventDuplicate && normalizedModule === "PACKAGE"
      ? crypto.createHash("sha256").update(JSON.stringify([condominiumId,normalizedChannel,normalizedRecipient,normalizedReferenceId,normalizedTemplateCode])).digest("hex") : null;
    try {
      return await prisma.communicationLog.create({data:{condominiumId,recipientUserId,channel:normalizedChannel,status:"PENDING",recipient:normalizedRecipient,subject:this.normalizeOptionalText(subject),templateCode:normalizedTemplateCode,contentSnapshot:String(content).trim(),module:normalizedModule,referenceId:normalizedReferenceId,requestId:this.normalizeOptionalText(requestId),provider:provider?String(provider).trim().toUpperCase():null,metadata,deduplicationKey}});
    } catch(error) {
      if(error.code!=="P2002"||!deduplicationKey)throw error;
      const existing=await prisma.communicationLog.findUnique({where:{deduplicationKey}});
      if(!existing)throw error;return existing;
    }
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

    if(before.metadata?.requiresReview) throw new ApiError("Resultado anterior incerto. Confira a entrega no provedor antes de autorizar outro envio.",409);
    const claimed = await communicationLogRepository.markAttempt(id);
    if (!claimed) throw new ApiError("Aviso já está sendo enviado ou foi concluído. Atualize o histórico.",409);

    let providerAccepted = false;
    try {
      let content=before.contentSnapshot;
      let metadata=before.metadata;
      if((metadata?.pickupCredential || metadata?.contactNotice) && before.module==="PACKAGE") {
        const pkg=await prisma.package.findFirst({where:{id:before.referenceId,condominiumId:before.condominiumId,status:"RECEIVED",deletedAt:null}});
        if(!pkg) throw new ApiError("Encomenda não está mais disponível.",409);
        let canPickup=true;
        if(metadata.contactId) {
          const contact=await ApartmentContactService.eligibleForMessage(before,pkg);
          canPickup=contact.canPickup;
        } else {
          const resident=await prisma.resident.findFirst({where:{condominiumId:before.condominiumId,userId:before.recipientUserId,deletedAt:null},include:{user:true}});
          if(!resident || resident.apartmentId!==pkg.apartmentId || !resident.canViewPackages || resident.user.status!=="ACTIVE" || (before.channel==="WHATSAPP"&&!resident.whatsappOptIn) || this.normalizeRecipient(before.channel,before.channel==="WHATSAPP"?resident.user.phone:resident.user.email)!==before.recipient) throw new ApiError("Destinatário ou encomenda não está mais elegível para o aviso.",409);
        }
        const credential=canPickup?await PackageCredentialService.ensure(before.referenceId,before.condominiumId):null;
        const instructions=canPickup?`Código de retirada: ${credential.code}. Apresente à portaria. Não compartilhe a credencial.`:"Avise o responsável autorizado pela retirada. Este aviso não autoriza retirar a encomenda.";
        content+=` Destinatário: ${metadata.recipientName || "Contato autorizado"}. ${metadata.packageDetails || ""}. ${instructions}`;
        const thirdParameter=credential?.code||"Consulte o responsável autorizado pela retirada.";
        metadata={...metadata,components:[{type:"body",parameters:[metadata.condominiumName,[metadata.apartmentLabel,metadata.recipientName,metadata.packageDetails].filter(Boolean).join(" · "),thirdParameter].map(text=>({type:"text",text:String(text)}))}]};
      }
      const result =
        await CommunicationProviderService
          .send({
            condominiumId: before.condominiumId,
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
              content,
            metadata,
          });

      providerAccepted = true;
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

      try {
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
      } catch { console.error("[COMMUNICATION_AUDIT] Provedor aceitou mensagem; auditoria pendente. Não reenviar."); }

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
              requiresReview: providerAccepted || error?.statusCode === 502 || error?.name === "AbortError" || error?.name === "TimeoutError",
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
