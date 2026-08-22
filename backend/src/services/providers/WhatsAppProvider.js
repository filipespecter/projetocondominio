import crypto from "node:crypto";

import { ApiError } from "../../utils/ApiError.js";

/**
 * =====================================================
 * WHATSAPP CLOUD API PROVIDER
 * =====================================================
 *
 * Integração oficial via Graph API.
 *
 * Nenhuma credencial deve ser escrita diretamente
 * neste arquivo. Toda configuração vem do ambiente.
 */
class WhatsAppProvider {
  get providerName() {
    return "META_CLOUD_API";
  }

  get accessToken() {
    return String(
      process.env.WHATSAPP_ACCESS_TOKEN ?? ""
    ).trim();
  }

  get phoneNumberId() {
    return String(
      process.env.WHATSAPP_PHONE_NUMBER_ID ?? ""
    ).trim();
  }

  get apiVersion() {
    return String(
      process.env.WHATSAPP_API_VERSION ?? "v23.0"
    ).trim();
  }

  get verifyToken() {
    return String(
      process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? ""
    ).trim();
  }

  get appSecret() {
    return String(
      process.env.WHATSAPP_APP_SECRET ?? ""
    ).trim();
  }

  get baseUrl() {
    return `https://graph.facebook.com/${this.apiVersion}`;
  }

  ensureConfigured() {
    if (
      !this.accessToken ||
      !this.phoneNumberId
    ) {
      throw new ApiError(
        "WhatsApp Cloud API ainda não está configurada no servidor.",
        503
      );
    }
  }

  normalizePhone(phone) {
    const normalized =
      String(phone ?? "")
        .replace(/\D/g, "");

    if (
      normalized.length < 10 ||
      normalized.length > 15
    ) {
      throw new ApiError(
        "Número de WhatsApp inválido.",
        400
      );
    }

    return normalized;
  }

  buildTextPayload({
    recipient,
    content,
  }) {
    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipient,
      type: "text",
      text: {
        preview_url: false,
        body: String(content).trim(),
      },
    };
  }

  buildTemplatePayload({
    recipient,
    templateCode,
    metadata = null,
  }) {
    const languageCode =
      metadata?.languageCode ??
      "pt_BR";

    const payload = {
      messaging_product: "whatsapp",
      to: recipient,
      type: "template",
      template: {
        name: String(templateCode).trim(),
        language: {
          code: languageCode,
        },
      },
    };

    if (
      Array.isArray(
        metadata?.components
      ) &&
      metadata.components.length > 0
    ) {
      payload.template.components =
        metadata.components;
    }

    return payload;
  }

  async parseResponse(response) {
    const text =
      await response.text();

    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      return {
        raw: text,
      };
    }
  }

  async send({
    recipient,
    content,
    templateCode = null,
    metadata = null,
  }) {
    this.ensureConfigured();

    const normalizedRecipient =
      this.normalizePhone(
        recipient
      );

    if (
      !content &&
      !templateCode
    ) {
      throw new ApiError(
        "Conteúdo ou template do WhatsApp é obrigatório.",
        400
      );
    }

    const payload =
      templateCode
        ? this.buildTemplatePayload({
            recipient:
              normalizedRecipient,
            templateCode,
            metadata,
          })
        : this.buildTextPayload({
            recipient:
              normalizedRecipient,
            content,
          });

    let response;

    try {
      response =
        await fetch(
          `${this.baseUrl}/${this.phoneNumberId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization:
                `Bearer ${this.accessToken}`,
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify(
                payload
              ),
          }
        );
    } catch (error) {
      throw new ApiError(
        `Falha de conexão com a WhatsApp Cloud API: ${error.message}`,
        502
      );
    }

    const responseData =
      await this.parseResponse(
        response
      );

    if (!response.ok) {
      const providerMessage =
        responseData
          ?.error
          ?.message ??
        "A WhatsApp Cloud API recusou o envio.";

      throw new ApiError(
        providerMessage,
        502
      );
    }

    const providerMessageId =
      responseData
        ?.messages
        ?.[0]
        ?.id ??
      null;

    if (!providerMessageId) {
      throw new ApiError(
        "A WhatsApp Cloud API não retornou o identificador da mensagem.",
        502
      );
    }

    return {
      provider:
        this.providerName,

      providerMessageId,

      metadata: {
        contacts:
          responseData.contacts ??
          null,

        messages:
          responseData.messages ??
          null,
      },
    };
  }

  verifyWebhookChallenge({
    mode,
    token,
    challenge,
  }) {
    if (
      !this.verifyToken
    ) {
      throw new ApiError(
        "Token de verificação do webhook do WhatsApp não configurado.",
        503
      );
    }

    if (
      mode !== "subscribe" ||
      token !== this.verifyToken
    ) {
      throw new ApiError(
        "Falha na verificação do webhook do WhatsApp.",
        403
      );
    }

    return challenge;
  }

  verifyWebhookSignature({
    rawBody,
    signature,
  }) {
    if (!this.appSecret) {
      throw new ApiError(
        "WHATSAPP_APP_SECRET não configurado.",
        503
      );
    }

    if (
      !rawBody ||
      !signature
    ) {
      throw new ApiError(
        "Assinatura do webhook do WhatsApp ausente.",
        401
      );
    }

    const expectedSignature =
      `sha256=${
        crypto
          .createHmac(
            "sha256",
            this.appSecret
          )
          .update(rawBody)
          .digest("hex")
      }`;

    const receivedBuffer =
      Buffer.from(
        String(signature)
      );

    const expectedBuffer =
      Buffer.from(
        expectedSignature
      );

    if (
      receivedBuffer.length !==
      expectedBuffer.length
    ) {
      throw new ApiError(
        "Assinatura inválida do webhook do WhatsApp.",
        401
      );
    }

    const valid =
      crypto.timingSafeEqual(
        receivedBuffer,
        expectedBuffer
      );

    if (!valid) {
      throw new ApiError(
        "Assinatura inválida do webhook do WhatsApp.",
        401
      );
    }

    return true;
  }

  extractStatusEvents(payload) {
    const events = [];

    const entries =
      Array.isArray(
        payload?.entry
      )
        ? payload.entry
        : [];

    for (
      const entry of entries
    ) {
      const changes =
        Array.isArray(
          entry?.changes
        )
          ? entry.changes
          : [];

      for (
        const change of changes
      ) {
        const statuses =
          Array.isArray(
            change
              ?.value
              ?.statuses
          )
            ? change
                .value
                .statuses
            : [];

        for (
          const status of statuses
        ) {
          if (!status?.id) {
            continue;
          }

          events.push({
            provider:
              this.providerName,

            providerMessageId:
              status.id,

            status:
              String(
                status.status ??
                ""
              )
                .trim()
                .toUpperCase(),

            recipient:
              status.recipient_id ??
              null,

            timestamp:
              status.timestamp ??
              null,

            errors:
              status.errors ??
              null,

            raw:
              status,
          });
        }
      }
    }

    return events;
  }
}

export default new WhatsAppProvider();
