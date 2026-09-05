import WhatsAppProvider from "./providers/WhatsAppProvider.js";
import EmailProvider from "./providers/EmailProvider.js";
import { ApiError } from "../utils/ApiError.js";

class CommunicationProviderService {
  getDefaultProvider(
    channel
  ) {
    if (
      channel ===
      "WHATSAPP"
    ) {
      return (
        process.env
          .WHATSAPP_PROVIDER ??
        "META_CLOUD_API"
      )
        .trim()
        .toUpperCase();
    }

    if (
      channel ===
      "EMAIL"
    ) {
      return (
        process.env
          .EMAIL_PROVIDER ??
        ""
      )
        .trim()
        .toUpperCase();
    }

    return "";
  }

  getProvider(
    channel,
    provider = null
  ) {
    const normalizedChannel =
      String(channel ?? "")
        .trim()
        .toUpperCase();

    const normalizedProvider =
      String(
        provider ??
        this.getDefaultProvider(
          normalizedChannel
        )
      )
        .trim()
        .toUpperCase();

    if (
      normalizedChannel ===
        "WHATSAPP" &&
      normalizedProvider ===
        "META_CLOUD_API"
    ) {
      return WhatsAppProvider;
    }

    if (normalizedChannel === "EMAIL") {
      return EmailProvider;
    }

    throw new ApiError(
      "Provider de comunicação não suportado.",
      400
    );
  }

  async send({
    channel,
    provider = null,
    recipient,
    subject = null,
    templateCode = null,
    content,
    metadata = null,
  }) {
    const selectedProvider =
      this.getProvider(
        channel,
        provider
      );

    return selectedProvider.send({
      recipient,
      subject,
      templateCode,
      content,
      metadata,
    });
  }
}

export default new CommunicationProviderService();
