import { z } from "zod";
import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { normalizeWhatsAppPhone } from "../utils/MessagingSecrets.js";

const contactSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(150),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().min(10).max(25),
  relationship: z.string().trim().min(2).max(80),
  receiveNotices: z.boolean(),
  whatsappOptIn: z.boolean(),
  canPickup: z.boolean(),
}).strict();

export function validateContacts(input) {
  const parsed = z.array(contactSchema).min(2, "Cadastre pelo menos duas pessoas de contato.").max(30).safeParse(input);
  if (!parsed.success) throw new ApiError("Informe pelo menos dois contatos com nome, e-mail, celular e vínculo válidos.", 422);
  const contacts = parsed.data.map(c => ({ ...c, phone: normalizeWhatsAppPhone(c.phone) }));
  if (new Set(contacts.map(c => c.phone)).size !== contacts.length || new Set(contacts.map(c => c.email)).size !== contacts.length) {
    throw new ApiError("Cada pessoa deve possuir celular e e-mail próprios, sem repetição no apartamento.", 422);
  }
  return contacts;
}

export class ApartmentContactService {
  constructor(db = prisma) { this.db = db; }
  async apartment(db, apartmentId, condominiumId) {
    if (!z.string().uuid().safeParse(apartmentId).success || !condominiumId) throw new ApiError("Apartamento inválido.", 422);
    const apt = await db.apartment.findFirst({ where: { id: apartmentId, condominiumId, deletedAt: null } });
    if (!apt) throw new ApiError("Apartamento não encontrado.", 404);
    return apt;
  }
  async list(apartmentId, condominiumId) {
    await this.apartment(this.db, apartmentId, condominiumId);
    const contacts = await this.db.apartmentContact.findMany({ where: { apartmentId, condominiumId, deletedAt: null }, orderBy: { createdAt: "asc" } });
    return { contacts, complete: contacts.length >= 2, minimum: 2 };
  }
  async save(user, apartmentId, input) {
    if (user?.role !== "CONDOMINIUM_ADMIN" || !user.condominiumId) throw new ApiError("Somente o síndico pode alterar contatos autorizados.", 403);
    const contacts = validateContacts(input);
    const condominiumId = user.condominiumId;
    await this.db.$transaction(async tx => {
      await this.apartment(tx, apartmentId, condominiumId);
      // Serializa a substituição da lista e a conferência do mínimo por apartamento.
      await tx.$queryRaw`SELECT id FROM "Apartment" WHERE id=${apartmentId}::uuid AND "condominiumId"=${condominiumId}::uuid FOR UPDATE`;
      const current = await tx.apartmentContact.findMany({ where: { apartmentId, condominiumId, deletedAt: null } });
      const ids = contacts.flatMap(c => c.id ? [c.id] : []);
      if (new Set(ids).size !== ids.length || ids.some(id => !current.some(c => c.id === id))) throw new ApiError("Contato não pertence a este apartamento.", 422);
      await tx.apartmentContact.updateMany({ where: { apartmentId, condominiumId, deletedAt: null, id: { notIn: ids } }, data: { deletedAt: new Date(), receiveNotices: false, whatsappOptIn: false, canPickup: false } });
      for (const { id, ...data } of contacts) {
        if (id) await tx.apartmentContact.updateMany({ where: { id, apartmentId, condominiumId, deletedAt: null }, data });
        else await tx.apartmentContact.create({ data: { ...data, apartmentId, condominiumId } });
      }
      await tx.auditLog.create({ data: { condominiumId, userId: user.id, userName: user.name, userRole: user.role, action: "UPDATE", module: "APARTMENT_CONTACTS", referenceId: apartmentId, details: `Contatos e permissões atualizados: ${contacts.length} pessoas. Dados pessoais omitidos.` } });
    });
    return this.list(apartmentId, condominiumId);
  }
  async requireComplete(apartmentId, condominiumId) {
    const count = await this.db.apartmentContact.count({ where: { apartmentId, condominiumId, deletedAt: null } });
    if (count < 2) throw new ApiError("Cadastre duas pessoas de contato com e-mail e celular no apartamento antes de criar um novo morador.", 422);
  }
  async eligibleForMessage(message, pkg) {
    const contact = await this.db.apartmentContact.findFirst({ where: { id: message.metadata.contactId, condominiumId: message.condominiumId, apartmentId: pkg.apartmentId, deletedAt: null, receiveNotices: true } });
    if (!contact || (message.channel === "WHATSAPP" && !contact.whatsappOptIn)) throw new ApiError("Contato não está mais autorizado a receber este aviso.", 409);
    const recipient = message.channel === "WHATSAPP" ? contact.phone : contact.email;
    if (recipient !== message.recipient) throw new ApiError("O contato foi alterado; o aviso antigo não será reenviado.", 409);
    return contact;
  }
}
export default new ApartmentContactService();
