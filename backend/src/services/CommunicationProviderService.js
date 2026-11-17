import { WahaProvider } from "./providers/WahaProvider.js";
import TenantMessagingService from "./TenantMessagingService.js";
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
    condominiumId,
    channel,
    provider = null,
    recipient,
    subject = null,
    templateCode = null,
    content,
    html = undefined,
    attachments = undefined,
    metadata = null,
  }) {
    const selectedProvider = channel === "WHATSAPP" ? await TenantMessagingService.provider(condominiumId) : this.getProvider(channel, provider);

    if (metadata?.dualChannelV1 && channel === "WHATSAPP" && !(selectedProvider instanceof WahaProvider)) throw new ApiError("Conecte o WhatsApp deste condomínio pelo novo fluxo antes de enviar. O e-mail permanece independente.", 503);

    if (selectedProvider instanceof WahaProvider && !metadata?.dualChannelV1) throw new ApiError("WAHA habilitado somente para avisos de encomenda conferidos no novo fluxo.", 409);

    return selectedProvider.send({
      recipient,
      subject,
      templateCode,
      content,
      html,
      attachments,
      metadata,
    });
  }
}

export default new CommunicationProviderService();
