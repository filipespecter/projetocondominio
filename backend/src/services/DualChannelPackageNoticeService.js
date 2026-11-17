import crypto from "node:crypto";
import { z } from "zod";
import prisma from "../config/prisma.js";
import env from "../config/env.js";
import { noticeData } from "./PackageNoticeService.js";
import { signNotice, verifyNotice } from "../utils/noticeConfirmation.js";
import { normalizeWhatsAppPhone } from "../utils/MessagingSecrets.js";
import { ApiError } from "../utils/ApiError.js";
import CommunicationService from "./CommunicationService.js";

export function noticeRecipients(data) {
  const list = [
    ...data.residents.map(r => ({ key: `resident:${r.id}`, name: r.user.name, email: r.user.email, phone: r.user.phone, whatsappOptIn: r.whatsappOptIn, canPickup: true, userId: r.userId })),
    ...data.contacts.filter(c => c.receiveNotices).map(c => ({ key: `contact:${c.id}`, name: c.name, email: c.email, phone: c.phone, whatsappOptIn: c.whatsappOptIn, canPickup: c.canPickup, contactId: c.id })),
  ];
  return list.map(person => {
    let phone = null;
    try { phone = person.whatsappOptIn && person.phone ? normalizeWhatsAppPhone(person.phone) : null; } catch { /* Invalid phone stays visible as unavailable, never silently substituted. */ }
    return { ...person, phone, email: person.email?.trim().toLowerCase() || null };
  });
}
const apartmentLabelFor = apartment => `${apartment.block ? "Bloco " + apartment.block + ", " : ""}Apto ${apartment.number}`;

export class DualChannelPackageNoticeService {
  constructor(db = prisma, communication = CommunicationService, source = noticeData) { this.db = db; this.communication = communication; this.source = source; }
  fingerprint(data, recipients) { return crypto.createHash("sha256").update(JSON.stringify([data.fingerprint, recipients])).digest("hex"); }
  async preview(user, id) {
    const data = await this.source(user, id), recipients = noticeRecipients(data);
    const confirmation = signNotice({ userId: user.id, condominiumId: user.condominiumId, id, fingerprint: this.fingerprint(data, recipients), expires: Date.now() + 5 * 60000 }, env.JWT_ACCESS_SECRET);
    const condo = await this.db.condominium.findUnique({ where: { id: user.condominiumId }, select: { name: true } });
    return { confirmation, condominiumName: condo?.name || "Condomínio", apartment: apartmentLabelFor(data.pkg.apartment), type: data.pkg.type, description: data.pkg.description, carrier: data.pkg.carrier, receivedAt: data.pkg.receivedAt,
      recipients: recipients.map(({ key, name, email, phone, canPickup }) => ({ key, name, email, phone, canPickup })),
      defaultMode: "BOTH", message: "WhatsApp e e-mail usam a mesma credencial de retirada. Contatos sem autorização de retirada recebem somente o aviso." };
  }
  async history(user,id) {
    await this.source(user,id);
    const rows=await this.db.communicationLog.findMany({
      where:{condominiumId:user.condominiumId,module:"PACKAGE",referenceId:id,channel:{in:["WHATSAPP","EMAIL"]}},
      orderBy:{createdAt:"desc"},take:50,
      select:{id:true,channel:true,recipient:true,status:true,provider:true,lastAttemptAt:true,metadata:true}
    });
    return rows.map(row=>{
      const uncertain=row.metadata?.requiresReview===true;
      return {id:row.id,channel:row.channel,recipient:row.recipient,status:row.status,
        uncertain:row.status==="FAILED"&&uncertain,
        canRetry:row.status==="FAILED"&&!uncertain,
        canCheck:row.channel==="WHATSAPP"&&((row.provider==="WAHA"&&row.status==="SENT")||(row.status==="FAILED"&&uncertain)),
        retryAfter:row.lastAttemptAt?new Date(new Date(row.lastAttemptAt).getTime()+60000).toISOString():null};
    });
  }
  async confirm(user, id, input) {
    const parsed = z.object({ confirmation: z.string().min(10).max(4096), confirmed: z.literal(true), observation: z.string().trim().max(400).optional(), mode: z.enum(["BOTH", "EMAIL", "WHATSAPP"]), emailRecipient: z.string().max(100).nullable(), whatsappRecipient: z.string().max(100).nullable() }).strict().safeParse(input);
    if (!parsed.success) throw new ApiError("Confira destinatários, canais e confirme o envio.", 422);
    const value = parsed.data;
    const token = verifyNotice(value.confirmation, { userId: user.id, condominiumId: user.condominiumId, id }, env.JWT_ACCESS_SECRET);
    const data = await this.source(user, id), recipients = noticeRecipients(data);
    if (token.fingerprint !== this.fingerprint(data, recipients)) throw new ApiError("A encomenda, contatos ou configuração mudaram. Confira novamente.", 409);
    const channels = value.mode === "BOTH" ? ["EMAIL", "WHATSAPP"] : [value.mode];
    const condo = await this.db.condominium.findUnique({ where: { id: user.condominiumId }, select: { name: true } });
    const apartmentLabel = apartmentLabelFor(data.pkg.apartment);
    // Record the confirmed dispatch before external calls; no messages if audit cannot be saved.
    await this.db.auditLog.create({ data: { condominiumId: user.condominiumId, userId: user.id, userName: user.name, userRole: user.role, action: "SEND_REQUEST", module: "COMMUNICATION", referenceId: id, details: `Aviso de encomenda confirmado; canais: ${channels.join(", ")}. Credenciais omitidas.` } });
    const results = await Promise.all(channels.map(async channel => {
      const key = channel === "EMAIL" ? value.emailRecipient : value.whatsappRecipient;
      const person = recipients.find(r => r.key === key);
      const address = person && (channel === "EMAIL" ? person.email : person.phone);
      if (!address) {
        await this.db.auditLog.create({ data: { condominiumId: user.condominiumId, userId: user.id, userName: user.name, userRole: user.role, action: "SEND_FAILED", module: "COMMUNICATION", referenceId: id, details: `${channel}: destinatário ausente ou sem autorização. Nenhum envio neste canal.` } });
        return { channel, failed: true, message: "Destinatário ausente ou não autorizado para este canal." };
      }
      try {
        const result = await this.communication.queueAndSend({ authenticatedUser: user, condominiumId: user.condominiumId, ...(person.userId ? { recipientUserId: person.userId } : { recipient: address }), channel,
          subject: `${condo?.name || "Condomínio"}: encomenda recebida`, templateCode: channel === "EMAIL" ? "PACKAGE_RECEIVED_EMAIL" : "PACKAGE_RECEIVED_WHATSAPP",
          content: `${condo?.name || "Condomínio"}: encomenda recebida para ${apartmentLabel}.`, module: "PACKAGE", referenceId: id,
          metadata: { event: "PACKAGE_RECEIVED", dualChannelV1: true, observation: value.observation || null, ...(person.contactId ? { contactId: person.contactId, contactNotice: true } : {}), pickupCredential: person.canPickup,
            recipientName: person.name, apartmentId: data.pkg.apartmentId, apartmentLabel, emailApartmentLabel: apartmentLabel, condominiumName: condo?.name || "Condomínio", packageDetails: [data.pkg.type, data.pkg.description, data.pkg.carrier].filter(Boolean).join(" · ") }, preventDuplicate: true });
        return { channel, failed: result.queued === false, deduplicated: Boolean(result.deduplicated), status: result.communication?.status || null, message: result.queued === false ? "Contato sem endereço válido para este canal." : "Solicitação processada; aceito não significa entregue." };
      } catch { return { channel, failed: true, message: "Envio não concluído. Consulte o histórico antes de tentar novamente." }; }
    }));
    return { results };
  }
}
export default new DualChannelPackageNoticeService();
