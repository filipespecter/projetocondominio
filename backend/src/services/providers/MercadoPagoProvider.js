import {normalizeBoletoOrder} from "../../utils/mercadoPagoBoletoOrder.js";
import {normalizeCardOrder} from "../../utils/mercadoPagoCardOrder.js";
import { normalizePixOrder } from "../../utils/mercadoPagoOrder.js";
import {
  WebhookSignatureValidator,
  InvalidWebhookSignatureError,
} from "mercadopago";

import { randomUUID } from "node:crypto";

import { ApiError } from "../../utils/ApiError.js";

const safeErrorCode = value => /^[a-zA-Z0-9_-]{1,80}$/.test(String(value ?? "")) ? String(value) : null;

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
    if (process.env.MERCADO_PAGO_ENABLED !== "true" || !this.accessToken) {
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

    let response;
    try {
      response =
      await fetch(
        `${this.apiBaseUrl}${path}`,
        {
          method,
          signal: AbortSignal.timeout(20000),

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

    } catch {
      throw new ApiError("A comunicação com o Mercado Pago não foi concluída. O resultado precisa ser consultado antes de uma nova tentativa.",502);
    }

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
        "O Mercado Pago não concluiu a operação. Confira os dados e consulte o estado da cobrança antes de tentar novamente.",
        (response.status >= 500 || (method === "POST" && [408, 409, 429].includes(response.status)))
          ? 502
          : 400,
        {
          provider:
            this.providerName,

          statusCode:
            response.status,

          providerResponse: {
            error: safeErrorCode(responseBody?.error),
            causes: [...(Array.isArray(responseBody?.cause) ? responseBody.cause : []),
              ...(Array.isArray(responseBody?.errors) ? responseBody.errors : [])]
              .slice(0, 5).map(item => safeErrorCode(item?.code)).filter(Boolean),
          },
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
      const document = payer.identification;
      if (!document || !({ CPF: /^\d{11}$/, CNPJ: /^\d{14}$/ })[document.type]?.test(document.number)) {
        throw new ApiError("Para boleto, informe o CPF ou CNPJ do pagador.", 400);
      }
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

      currency: payment?.currency_id ?? null,
      expiresAt: payment?.date_of_expiration ?? null,

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

  buildPixOrder(charge, customer) {
    const total = (charge.amountInCents / 100).toFixed(2);
    if (process.env.MERCADO_PAGO_PIX_TEST_PAYER === "true") {
      const db = new URL(process.env.DATABASE_URL ?? "http://invalid");
      if (process.env.NODE_ENV === "production" || db.hostname !== "postgres" || db.pathname !== "/infinitycondo_homolog") {
        throw new ApiError("O pagador simulado só pode ser usado na Homolog local.", 400);
      }
      return this.pixOrderBody(charge.id, total, { email: "test_payer@example.com", first_name: "APRO" });
    }
    return this.pixOrderBody(charge.id, total, this.buildPayer({ customer, paymentMethod: { type: "PIX" } }));
  }

  pixOrderBody(reference, total, payer) {
    return {
      type: "online", processing_mode: "automatic", external_reference: reference, total_amount: total, payer,
      transactions: { payments: [{ amount: total, payment_method: { id: "pix", type: "bank_transfer" } }] },
    };
  }

  async createPixOrder({ charge, customer, idempotencyKey }) {
    const body = this.buildPixOrder(charge, customer);
    const order = await this.request("/v1/orders", { method: "POST", body, idempotencyKey });
    return normalizePixOrder(order);
  }

  async getPixOrder(id) {
    return normalizePixOrder(await this.request(`/v1/orders/${encodeURIComponent(id)}`), id);
  }

  async cardOrderBody(charge) {
    const amount = (charge.amountInCents / 100).toFixed(2);
    const frontend = new URL(process.env.FRONTEND_URL);
    if (frontend.protocol !== "https:") throw new ApiError("Configure o endereço HTTPS do portal para receber o retorno do checkout.", 503);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(frontend.hostname);
    const back = new URL("/dashboard/financeiro#assinatura", frontend).href;
    const catalog = await this.request("/v1/payment_methods");
    const types = new Set(Array.isArray(catalog) ? catalog.map(method => safeErrorCode(method?.payment_type_id)).filter(Boolean) : []);
    if (!types.delete("credit_card")) throw new ApiError("Cartão de crédito indisponível na credencial do Mercado Pago.", 503);
    const excludedTypes = [...new Set([...types].map(type => ["digital_wallet", "digital_currency"].includes(type) ? "wallet" : type))].sort();
    return {
      type:"online", processing_mode:"manual", capture_mode:"automatic", total_amount:amount, external_reference:charge.id,
      items:[{title:"Mensalidade InfinityCondo",quantity:1,unit_price:amount}],
      config:{
        ...(!local ? {online:{success_url:back,failure_url:back,pending_url:back}} : {}),
        ...(excludedTypes.length ? {payment_method:{not_allowed_types:excludedTypes}} : {}),
      },
    };
  }

  async createCardOrder({charge,idempotencyKey,body}) {
    const order=await this.request("/v1/orders",{method:"POST",body:body??await this.cardOrderBody(charge),idempotencyKey});
    return normalizeCardOrder(order);
  }

  async getOrderPayment(id) {
    const order=await this.request(`/v1/orders/${encodeURIComponent(id)}`);
    if(order?.transactions?.payments?.[0]?.payment_method?.type==="ticket")return normalizeBoletoOrder(order,id);
    return order?.processing_mode==="manual"?normalizeCardOrder(order,id):normalizePixOrder(order,id);
  }

  buildBoletoOrder(charge,customer) {
    const payer=this.buildPayer({customer,paymentMethod:{type:"BOLETO"}});
    const {federal_unit:state,...address}=payer.address;
    if(!/^[A-Z]{2}$/.test(state)||!/^\d{8}$/.test(address.zip_code))throw new ApiError("Confira o CEP e a UF do responsável financeiro.",400);
    const total=(charge.amountInCents/100).toFixed(2);
    return {type:"online",processing_mode:"automatic",total_amount:total,external_reference:charge.id,
      description:"Mensalidade InfinityCondo",payer:{...payer,address:{...address,state}},
      transactions:{payments:[{amount:total,payment_method:{id:"boleto",type:"ticket"}}]}};
  }

  async createBoletoOrder({charge,customer,idempotencyKey}) {
    return normalizeBoletoOrder(await this.request("/v1/orders",{method:"POST",body:this.buildBoletoOrder(charge,customer),idempotencyKey}));
  }

  async cancelPixOrder(id, idempotencyKey) {
    return this.cancelOrder(id,idempotencyKey);
  }

  async cancelOrder(id, idempotencyKey) {
    await this.request(`/v1/orders/${encodeURIComponent(id)}/cancel`, { method:"POST", idempotencyKey });
  }

  async createCharge({
    charge,
    paymentMethod,
    customer,
    paymentData = {},
    idempotencyKey = null,
  }) {
    this.ensureConfigured();
    this.ensureWebhookConfigured();
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

    const signature = { xSignature: headers?.["x-signature"], xRequestId: headers?.["x-request-id"], dataId };
    try {
      this.validateWebhookSignature(signature);
    } catch (error) {
      const lower = typeof dataId === "string" ? dataId.toLowerCase() : dataId;
      if (lower === dataId || error.statusCode !== 401) throw error;
      this.validateWebhookSignature({ ...signature, dataId: lower });
    }

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
