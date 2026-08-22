import MercadoPagoProvider from "./providers/MercadoPagoProvider.js";
import { ApiError } from "../utils/ApiError.js";

class PaymentGatewayService {
  getProvider(providerName) {
    const normalized =
      String(
        providerName ?? ""
      )
        .trim()
        .toUpperCase();

    if (
      normalized ===
      "MERCADO_PAGO"
    ) {
      return MercadoPagoProvider;
    }

    throw new ApiError(
      "Gateway de pagamento não suportado.",
      400
    );
  }

  async createCharge({
    provider,
    charge,
    paymentMethod,
    customer,
    paymentData = {},
    idempotencyKey = null,
  }) {
    const gateway =
      this.getProvider(
        provider
      );

    return gateway.createCharge({
      charge,
      paymentMethod,
      customer,
      paymentData,
      idempotencyKey,
    });
  }

  async getPayment({
    provider,
    providerPaymentId,
  }) {
    const gateway =
      this.getProvider(
        provider
      );

    return gateway.getPayment({
      providerPaymentId,
    });
  }

  async refundPayment({
    provider,
    providerPaymentId,
    amountInCents = null,
    idempotencyKey = null,
  }) {
    const gateway =
      this.getProvider(
        provider
      );

    return gateway.refundPayment({
      providerPaymentId,
      amountInCents,
      idempotencyKey,
    });
  }

  normalizeWebhook({
    provider,
    payload,
    headers,
    query,
  }) {
    const gateway =
      this.getProvider(
        provider
      );

    return gateway.normalizeWebhook({
      payload,
      headers,
      query,
    });
  }

  mapTransactionStatus({
    provider,
    providerStatus,
  }) {
    const gateway =
      this.getProvider(
        provider
      );

    return gateway.mapTransactionStatus(
      providerStatus
    );
  }
}

export default new PaymentGatewayService();
