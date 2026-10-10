import TenantMessagingService from "./TenantMessagingService.js";
import { ApiError } from "../utils/ApiError.js";
import communicationLogRepository from "../repositories/CommunicationLogRepository.js";
import WhatsAppProvider from "./providers/WhatsAppProvider.js";

class WhatsAppWebhookService {
  async verifyChallenge(query) {
    const provider = query.condominiumId ? await TenantMessagingService.provider(query.condominiumId,false) : WhatsAppProvider;
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
    if(!condominiumId) throw new ApiError("Condomínio obrigatório no webhook.",422);
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
