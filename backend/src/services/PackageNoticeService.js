import { signNotice, verifyNotice } from "../utils/noticeConfirmation.js";
import crypto from "node:crypto";
import prisma from "../config/prisma.js";
import env from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import TenantMessagingService from "./TenantMessagingService.js";
import CommunicationTriggerService from "./CommunicationTriggerService.js";
function actor(user) {
  if (!user?.condominiumId || !["CONDOMINIUM_ADMIN", "MANAGER", "DOORMAN"].includes(user.role)) throw new ApiError("Acesso restrito à portaria e administração.", 403);
}
export async function noticeData(user, id) {
  actor(user);
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new ApiError("Encomenda inválida.", 422);
  const pkg = await prisma.package.findFirst({
    where: {
      id,
      condominiumId: user.condominiumId,
      status: "RECEIVED",
      deletedAt: null
    },
    include: {
      apartment: true
    }
  });
  if (!pkg) throw new ApiError("Encomenda não está aguardando retirada.", 404);
  const config = await TenantMessagingService.get(user.condominiumId),
    channel = config.ativo ? config.channel : "EMAIL";
  const residents = await prisma.resident.findMany({
    where: {
      condominiumId: user.condominiumId,
      apartmentId: pkg.apartmentId,
      deletedAt: null,
      canViewPackages: true,
      user: {
        status: "ACTIVE",
        deletedAt: null
      },
      ...(pkg.expectedByResidentId ? {
        id: pkg.expectedByResidentId
      } : {})
    },
    include: {
      user: true
    },
    orderBy: {
      id: "asc"
    }
  });
  const contacts = await prisma.apartmentContact.findMany({
    where: {
      condominiumId: user.condominiumId,
      apartmentId: pkg.apartmentId,
      deletedAt: null,
      receiveNotices: true
    },
    orderBy: {
      id: "asc"
    }
  });
  const recipients = [...residents.filter(r => channel !== "WHATSAPP" || r.whatsappOptIn).map(r => ({
    id: r.id,
    name: r.user.name,
    address: channel === "WHATSAPP" ? r.user.phone : r.user.email
  })), ...contacts.filter(c => channel !== "WHATSAPP" || c.whatsappOptIn).map(c => ({
    id: c.id,
    name: c.name,
    address: channel === "WHATSAPP" ? c.phone : c.email
  }))].filter(x => x.address);
  const fingerprint = crypto.createHash("sha256").update(JSON.stringify({
    pkg,
    recipients,
    contacts,
    config
  })).digest("hex");
  return {
    pkg,
    residents,
    contacts,
    channel,
    recipients,
    fingerprint
  };
}
export async function previewNotice(user, id) {
  const data = await noticeData(user, id);
  const confirmation = signNotice({
    userId: user.id,
    condominiumId: user.condominiumId,
    id,
    fingerprint: data.fingerprint,
    expires: Date.now() + 5 * 60000
  }, env.JWT_ACCESS_SECRET);
  return {
    confirmation,
    channel: data.channel,
    apartment: `${data.pkg.apartment.block} / ${data.pkg.apartment.number}`,
    type: data.pkg.type,
    description: data.pkg.description,
    carrier: data.pkg.carrier,
    receivedAt: data.pkg.receivedAt,
    recipients: data.recipients
  };
}
export async function confirmNotice(user, id, input) {
  actor(user);
  const token = String(input?.confirmation || "");
  if (token.length > 4096 || input?.confirmed !== true) throw new ApiError("Confira os dados e confirme o envio.", 422);
  const parsed = verifyNotice(token, {
    userId: user.id,
    condominiumId: user.condominiumId,
    id
  }, env.JWT_ACCESS_SECRET);
  const data = await noticeData(user, id);
  if (data.fingerprint !== parsed.fingerprint) throw new ApiError("A encomenda, contatos ou canal mudaram. Confira novamente antes de enviar.", 409);
  if (!data.recipients.length) throw new ApiError("Nenhum destinatário elegível para este canal.", 422);
  return CommunicationTriggerService.notifyPackageArrival({
    condominiumId: user.condominiumId,
    apartment: data.pkg.apartment,
    packageRecord: data.pkg,
    residents: data.residents,
    authenticatedUser: user,
    contacts: data.contacts
  });
}
