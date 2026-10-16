import prisma from "../config/prisma.js";
import { WhatsAppProvider as Provider } from "./providers/WhatsAppProvider.js";
import TenantMessagingService from "./TenantMessagingService.js";
import communicationLogRepository from "../repositories/CommunicationLogRepository.js";
import WhatsAppProvider from "./providers/WhatsAppProvider.js";

class WhatsAppWebhookService {
  async verifyChallenge(query) {
    const provider = query.condominiumId ? await TenantMessagingService.provider(query.condominiumId,false) : new Provider({verifyToken:process.env.META_WEBHOOK_VERIFY_TOKEN||process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,appSecret:process.env.META_APP_SECRET||process.env.WHATSAPP_APP_SECRET});
    return provider
      .verifyWebhookChallenge({
        mode:
          query[
            "hub.mode"
          ] ??
          null,

        token:
          query[
            "hub.verify_token"
          ] ??
          null,

        challenge:
          query[
            "hub.challenge"
          ] ??
          null,
      });
  }

  async processStatusWebhook({
    condominiumId,
    payload,
    rawBody,
    signature,
  }) {
    if(!condominiumId) {
      // Endpoint único do aplicativo: autentica antes de usar qualquer ID recebido.
      new Provider({appSecret:process.env.META_APP_SECRET}).verifyWebhookSignature({rawBody,signature});
      const batches=[];
      for (const entry of payload?.entry||[]) for (const change of entry.changes||[]) {
        const phoneNumberId=change.value?.metadata?.phone_number_id;
        if (!phoneNumberId) continue;
        const config=await prisma.tenantMessagingConfig.findUnique({where:{phoneNumberId:String(phoneNumberId)}});
        if (!config || config.wabaId!==String(entry.id)) continue;
        batches.push(await this.processStatusWebhook({condominiumId:config.condominiumId,payload:{entry:[{...entry,changes:[change]}]},rawBody,signature}));
      }
      return {processed:batches};
    }
    const provider=await TenantMessagingService.provider(condominiumId,false);
    provider
      .verifyWebhookSignature({
        rawBody,
        signature,
      });

    const events =
      WhatsAppProvider
        .extractStatusEvents(
          payload
        );

    const results = [];

    for (
      const event of events
    ) {
      const communication =
        await communicationLogRepository
          .findByProviderMessageId(
            event.provider,
            event.providerMessageId
          );

      if (!communication || communication.condominiumId !== condominiumId) {
        results.push({
          providerMessageId:
            event.providerMessageId,
          found: false,
        });

        continue;
      }

      if (communication.status === "DELIVERED" || communication.status === "CANCELED") { results.push({providerMessageId:event.providerMessageId,found:true,status:communication.status}); continue; }
      let updated =
        communication;

      if (
        event.status ===
        "DELIVERED" ||
        event.status ===
        "READ"
      ) {
        updated =
          await communicationLogRepository
            .markDelivered(
              communication.id
            );
      } else if (
        event.status ===
        "FAILED"
      ) {
        const errorMessage =
          event.errors
            ? JSON.stringify(
                event.errors
              )
            : "Falha informada pela WhatsApp Cloud API.";

        updated =
          await communicationLogRepository
            .markFailed(
              communication.id,
              errorMessage,
              {
                ...(communication.metadata ??
                  {}),
                whatsappWebhook:
                  event.raw,
              }
            );
      }

      results.push({
        providerMessageId:
          event.providerMessageId,
        found: true,
        status:
          updated?.status ??
          communication.status,
      });
    }

    return {
      received:
        events.length,
      processed:
        results,
    };
  }
}

export default new WhatsAppWebhookService();
