import { isWahaRecipientChat } from "../../utils/WahaRecipient.js";
import WahaConnectionService from "../WahaConnectionService.js";
import { normalizeWhatsAppPhone } from "../../utils/MessagingSecrets.js";
import { ApiError } from "../../utils/ApiError.js";
export class WahaProvider {
  constructor(condominiumId, connection = WahaConnectionService) { this.condominiumId = condominiumId; this.connection = connection; }
  async send({ recipient, content, attachments = [] }) {
    const session = await this.connection.session(this.condominiumId);
    if (session?.status !== "WORKING") throw new ApiError("WhatsApp do condomínio desconectado. O e-mail permanece independente.", 503);
    const phone = normalizeWhatsAppPhone(recipient);
    let resolved;
    try {
      resolved = await this.connection.request(this.condominiumId, `/api/contacts/check-exists?${new URLSearchParams({ session: "default", phone })}`);
    } catch {
      throw new ApiError("Não foi possível conferir o destinatário no WhatsApp. Nenhuma mensagem foi enviada nesta tentativa; o e-mail permanece independente.", 503);
    }
    if (resolved.numberExists === false) throw new ApiError("O WhatsApp não reconheceu o telefone cadastrado. Confira o número do destinatário; nenhum envio WhatsApp foi iniciado.", 422);
    if (resolved.numberExists !== true || !isWahaRecipientChat(resolved.chatId)) throw new ApiError("O WhatsApp não confirmou um destinatário válido. Nenhum envio WhatsApp foi iniciado.", 422);
    const chatId = resolved.chatId;
    const image = attachments.find(a => a.filename === "retirada.png");
    const body = image ? { session: "default", chatId, caption: content, file: { mimetype: "image/png", filename: image.filename, data: image.content } } : { session: "default", chatId, text: content };
    const data = await this.connection.request(this.condominiumId, image ? "/api/sendImage" : "/api/sendText", { method: "POST", body });
    const messageId = typeof data.id === "string" ? data.id : data.id?._serialized;
    if (!messageId || messageId.length > 512) throw new ApiError("WhatsApp não confirmou o envio. Não repita antes de conferir o histórico.", 502);
    return { provider: "WAHA", providerMessageId: messageId, metadata: { accepted: true, delivery: "UNCONFIRMED", wahaChatId: chatId } };
  }
}
