import PaymentGatewayService from "./PaymentGatewayService.js";
import PaymentGatewayOrchestratorService from "./PaymentGatewayOrchestratorService.js";

class PaymentWebhookService {
  async handleMercadoPago({
    payload,
    headers,
    query,
    requestContext = null,
  }) {
    const normalized =
      PaymentGatewayService
        .normalizeWebhook({
          provider:
            "MERCADO_PAGO",

          payload,
          headers,
          query,
        });

    if (
      !normalized.dataId
    ) {
      return {
        received:
          true,

        ignored:
          true,

        reason:
          "Notificação sem identificador de recurso.",
      };
    }

    if (
      normalized.type !==
        "payment" &&
      !String(
        normalized.action ??
        ""
      ).startsWith(
        "payment."
      )
    ) {
      return {
        received:
          true,

        ignored:
          true,

        reason:
          "Evento não relacionado a payment.",
      };
    }

    const synchronized =
      await PaymentGatewayOrchestratorService
        .synchronizeProviderPayment({
          provider:
            "MERCADO_PAGO",

          providerPaymentId:
            normalized.dataId,

          requestContext,
        });

    return {
      received:
        true,

      notification:
        normalized,

      synchronized,
    };
  }
}

export default new PaymentWebhookService();
