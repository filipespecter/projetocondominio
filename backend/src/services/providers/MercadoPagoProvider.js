import {
  WebhookSignatureValidator,
  InvalidWebhookSignatureError,
} from "mercadopago";

import { randomUUID } from "node:crypto";

import { ApiError } from "../../utils/ApiError.js";

class MercadoPagoProvider {
  get providerName() {
    return "MERCADO_PAGO";
  }

  get apiBaseUrl() {
    return "https://api.mercadopago.com";
  }

  get accessToken() {
    return (
      process.env
        .MERCADO_PAGO_ACCESS_TOKEN ??
      ""
    ).trim();
  }

  get webhookSecret() {
    return (
      process.env
        .MERCADO_PAGO_WEBHOOK_SECRET ??
      ""
    ).trim();
  }

  ensureConfigured() {
    if (!this.accessToken) {
      throw new ApiError(
        "Mercado Pago ainda não está configurado no servidor.",
        503
      );
    }
  }

  ensureWebhookConfigured() {
    if (!this.webhookSecret) {
      throw new ApiError(
        "A assinatura secreta do webhook do Mercado Pago não está configurada.",
        503
      );
    }
  }

  buildHeaders(
    idempotencyKey = null
  ) {
    const headers = {
      Authorization:
        `Bearer ${this.accessToken}`,
      "Content-Type":
        "application/json",
    };

    if (idempotencyKey) {
      headers[
        "X-Idempotency-Key"
      ] = idempotencyKey;
    }

    return headers;
  }

  async request(
    path,
    {
      method = "GET",
      body = null,
      idempotencyKey = null,
    } = {}
  ) {
    this.ensureConfigured();

    const response =
      await fetch(
        `${this.apiBaseUrl}${path}`,
        {
          method,

          headers:
            this.buildHeaders(
              idempotencyKey
            ),

          body:
            body === null
              ? undefined
              : JSON.stringify(body),
        }
      );

    let responseBody;

    try {
      responseBody =
        await response.json();
    } catch {
      responseBody =
        null;
    }

    if (!response.ok) {
      throw new ApiError(
        responseBody?.message ??
        responseBody?.error ??
        "Erro ao comunicar com o Mercado Pago.",
        response.status >= 500
          ? 502
          : 400,
        {
          provider:
            this.providerName,

          statusCode:
            response.status,

          providerResponse:
            responseBody,
        }
      );
    }

    return responseBody;
  }

  centsToAmount(
    amountInCents
  ) {
    return (
      Number(
        amountInCents
      ) / 100
    );
  }

  splitName(
    fullName
  ) {
    const parts =
      String(
        fullName ?? ""
      )
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    return {
      firstName:
        parts.shift() ??
        "",

      lastName:
        parts.join(" "),
    };
  }

  buildPayer({
    customer,
    paymentMethod,
  }) {
    if (!customer?.email) {
      throw new ApiError(
        "O e-mail do responsável financeiro é obrigatório para processar a cobrança.",
        400
      );
    }

    const payer = {
      email:
        String(
          customer.email
        )
          .trim()
          .toLowerCase(),
    };

    const {
      firstName,
      lastName,
    } = this.splitName(
      customer.name
    );

    if (firstName) {
      payer.first_name =
        firstName;
    }

    if (lastName) {
      payer.last_name =
        lastName;
    }

    if (
      customer.identificationType &&
      customer.identificationNumber
    ) {
      payer.identification = {
        type:
          String(
            customer.identificationType
          ).trim(),

        number:
          String(
            customer.identificationNumber
          )
            .replace(
              /\D/g,
              ""
            ),
      };
    }

    if (
      paymentMethod.type ===
      "BOLETO"
    ) {
      const address =
        customer.address;

      if (
        !address?.zipCode ||
        !address?.streetName ||
        !address?.streetNumber ||
        !address?.neighborhood ||
        !address?.city ||
        !address?.state
      ) {
        throw new ApiError(
          "Para boleto, CEP, rua, número, bairro, cidade e estado do responsável financeiro são obrigatórios.",
          400
        );
      }

      payer.address = {
        zip_code:
          String(
            address.zipCode
          ).replace(
            /\D/g,
            ""
          ),

        street_name:
          String(
            address.streetName
          ).trim(),

        street_number:
          String(
            address.streetNumber
          ).trim(),

        neighborhood:
          String(
            address.neighborhood
          ).trim(),

        city:
          String(
            address.city
          ).trim(),

        federal_unit:
          String(
            address.state
          )
            .trim()
            .toUpperCase(),
      };
    }

    return payer;
  }

  buildPaymentBody({
    charge,
    paymentMethod,
    customer,
    paymentData = {},
  }) {
    const body = {
      transaction_amount:
        this.centsToAmount(
          charge.amountInCents
        ),

      description:
        paymentData.description ??
        `InfinityCondo - ${charge.subscription?.plan?.name ?? "Assinatura"}`,

      external_reference:
        charge.id,

      payer:
        this.buildPayer({
          customer,
          paymentMethod,
        }),
    };

    const webhookUrl =
      (
        process.env
          .MERCADO_PAGO_WEBHOOK_URL ??
        ""
      ).trim();

    if (webhookUrl) {
      body.notification_url =
        webhookUrl;
    }

    if (
      paymentMethod.type ===
      "PIX"
    ) {
      body.payment_method_id =
        "pix";

      return body;
    }

    if (
      paymentMethod.type ===
      "BOLETO"
    ) {
      body.payment_method_id =
        "boleto";

      return body;
    }

    if (
      paymentMethod.type ===
      "CARD"
    ) {
      if (!paymentData.token) {
        throw new ApiError(
          "O token temporário do cartão é obrigatório.",
          400
        );
      }

      if (
        !paymentData.paymentMethodId
      ) {
        throw new ApiError(
          "O identificador da bandeira/meio de pagamento do cartão é obrigatório.",
          400
        );
      }

      body.token =
        paymentData.token;

      body.payment_method_id =
        paymentData.paymentMethodId;

      body.installments =
        Number(
          paymentData.installments ??
          1
        );

      if (
        paymentData.issuerId
      ) {
        body.issuer_id =
          paymentData.issuerId;
      }

      return body;
    }

    throw new ApiError(
      "Tipo de método de pagamento não suportado pelo Mercado Pago.",
      400
    );
  }

  normalizePayment(
    payment
  ) {
    const transactionData =
      payment
        ?.point_of_interaction
        ?.transaction_data ??
      {};

    return {
      provider:
        this.providerName,

      providerPaymentId:
        payment?.id
          ? String(
              payment.id
            )
          : null,

      externalReference:
        payment
          ?.external_reference ??
        null,

      status:
        payment?.status ??
        null,

      statusDetail:
        payment
          ?.status_detail ??
        null,

      paymentMethodId:
        payment
          ?.payment_method_id ??
        null,

      paymentTypeId:
        payment
          ?.payment_type_id ??
        null,

      dateApproved:
        payment
          ?.date_approved ??
        null,

      transactionAmount:
        payment
          ?.transaction_amount ??
        null,

      paymentUrl:
        transactionData
          ?.ticket_url ??
        payment
          ?.transaction_details
          ?.external_resource_url ??
        null,

      pixCopyPaste:
        transactionData
          ?.qr_code ??
        null,

      pixQrCodeBase64:
        transactionData
          ?.qr_code_base64 ??
        null,

      boletoBarcode:
        payment
          ?.barcode
          ?.content ??
        null,

      raw:
        payment,
    };
  }

  mapTransactionStatus(
    providerStatus
  ) {
    const status =
      String(
        providerStatus ?? ""
      )
        .trim()
        .toLowerCase();

    if (
      status === "approved"
    ) {
      return "APPROVED";
    }

    if (
      [
        "pending",
        "in_process",
        "authorized",
      ].includes(status)
    ) {
      return "PENDING";
    }

    if (
      status === "rejected"
    ) {
      return "REJECTED";
    }

    if (
      status === "cancelled" ||
      status === "canceled"
    ) {
      return "CANCELED";
    }

    if (
      status === "refunded"
    ) {
      return "REFUNDED";
    }

    if (
      status ===
      "charged_back"
    ) {
      return "CHARGEBACK";
    }

    return "ERROR";
  }

  async createCharge({
    charge,
    paymentMethod,
    customer,
    paymentData = {},
    idempotencyKey = null,
  }) {
    const body =
      this.buildPaymentBody({
        charge,
        paymentMethod,
        customer,
        paymentData,
      });

    const payment =
      await this.request(
        "/v1/payments",
        {
          method:
            "POST",

          body,

          idempotencyKey:
            idempotencyKey ??
            randomUUID(),
        }
      );

    return this.normalizePayment(
      payment
    );
  }

  async getPayment({
    providerPaymentId,
  }) {
    if (!providerPaymentId) {
      throw new ApiError(
        "Identificador do pagamento é obrigatório.",
        400
      );
    }

    const payment =
      await this.request(
        `/v1/payments/${encodeURIComponent(
          providerPaymentId
        )}`
      );

    return this.normalizePayment(
      payment
    );
  }

  async refundPayment({
    providerPaymentId,
    amountInCents = null,
    idempotencyKey = null,
  }) {
    if (!providerPaymentId) {
      throw new ApiError(
        "Identificador do pagamento é obrigatório.",
        400
      );
    }

    const body =
      amountInCents === null
        ? {}
        : {
            amount:
              this.centsToAmount(
                amountInCents
              ),
          };

    const refund =
      await this.request(
        `/v1/payments/${encodeURIComponent(
          providerPaymentId
        )}/refunds`,
        {
          method:
            "POST",

          body,

          idempotencyKey:
            idempotencyKey ??
            randomUUID(),
        }
      );

    return {
      provider:
        this.providerName,

      refundId:
        refund?.id
          ? String(
              refund.id
            )
          : null,

      paymentId:
        refund?.payment_id
          ? String(
              refund.payment_id
            )
          : providerPaymentId,

      amount:
        refund?.amount ??
        null,

      status:
        refund?.status ??
        null,

      raw:
        refund,
    };
  }

  validateWebhookSignature({
    xSignature,
    xRequestId,
    dataId,
  }) {
    this.ensureWebhookConfigured();

    try {
      WebhookSignatureValidator
        .validate({
          xSignature,
          xRequestId,
          dataId,
          secret:
            this.webhookSecret,
        });

      return true;
    } catch (error) {
      if (
        error instanceof
        InvalidWebhookSignatureError
      ) {
        throw new ApiError(
          "Assinatura do webhook do Mercado Pago inválida.",
          401
        );
      }

      throw error;
    }
  }

  normalizeWebhook({
    payload,
    headers,
    query,
  }) {
    const dataId =
      query?.["data.id"] ??
      payload?.data?.id ??
      null;

    this.validateWebhookSignature({
      xSignature:
        headers?.[
          "x-signature"
        ],

      xRequestId:
        headers?.[
          "x-request-id"
        ],

      dataId,
    });

    return {
      provider:
        this.providerName,

      type:
        payload?.type ??
        query?.type ??
        null,

      action:
        payload?.action ??
        null,

      dataId:
        dataId
          ? String(
              dataId
            )
          : null,

      liveMode:
        payload
          ?.live_mode ??
        null,

      payload:
        payload ??
        null,
    };
  }
}

export default new MercadoPagoProvider();
