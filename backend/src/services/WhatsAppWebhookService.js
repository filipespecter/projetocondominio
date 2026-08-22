import communicationLogRepository from "../repositories/CommunicationLogRepository.js";
import WhatsAppProvider from "./providers/WhatsAppProvider.js";

class WhatsAppWebhookService {
  verifyChallenge(query) {
    return WhatsAppProvider
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
    payload,
    rawBody,
    signature,
  }) {
    WhatsAppProvider
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

      if (!communication) {
        results.push({
          providerMessageId:
            event.providerMessageId,
          found: false,
        });

        continue;
      }

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
