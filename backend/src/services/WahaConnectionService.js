import { isWahaRecipientChat } from "../utils/WahaRecipient.js";
import fs from "node:fs/promises";
import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { normalizeWhatsAppPhone, seal, unseal } from "../utils/MessagingSecrets.js";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export class WahaConnectionService {
  constructor(db = prisma, transport = (...args) => fetch(...args), registry = null) {
    this.db = db; this.transport = transport; this.registry = registry;
  }
  requireAdmin(user) {
    if (user?.role !== "CONDOMINIUM_ADMIN" || !uuid.test(user.condominiumId || "")) throw new ApiError("Somente o síndico pode conectar ou desconectar o número.", 403);
  }
  async instance(id) {
    if (!uuid.test(id || "")) throw new ApiError("Condomínio inválido.", 422);
    const provision = await this.db.wahaProvisioning.findUnique({ where: { condominiumId: id }, include: { condominium: { select: { status: true, deletedAt: true } } } });
    if (!provision?.enabled || provision.state !== "READY" || provision.condominium?.deletedAt || !["ACTIVE", "TRIAL"].includes(provision.condominium?.status)) throw new ApiError("A Central precisa habilitar e preparar a conexão deste condomínio. O e-mail permanece independente.", 503);
    let registry;
    try { registry = this.registry || JSON.parse(await fs.readFile(process.env.WAHA_REGISTRY_FILE, "utf8")); }
    catch { throw new ApiError("Conexão WhatsApp ainda não preparada pela plataforma. O e-mail permanece independente.", 503); }
    const instance = registry[id];
    if (!instance || instance.condominiumId !== id || !/^[a-f0-9]{64}$/.test(instance.apiKey || "")) throw new ApiError("Instância WhatsApp deste condomínio não configurada.", 503);
    // Only a fixed, private Docker hostname controlled by the platform; never accept a URL from the browser.
    const expected = `http://infinitycondo-waha-${id}:3000`;
    if (instance.baseUrl !== expected) throw new ApiError("Endereço da instância WhatsApp inválido.", 503);
    return { ...instance, session: "default" };
  }
  async request(id, path, { method = "GET", body, allowMissing = false } = {}) {
    const instance = await this.instance(id);
    let response;
    try {
      response = await this.transport(`${instance.baseUrl}${path}`, {
        method, headers: { "X-Api-Key": instance.apiKey, Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}), redirect: "error", signal: AbortSignal.timeout(20000),
      });
    } catch {
      const error = new ApiError(method === "GET" ? "Serviço WhatsApp indisponível. O e-mail não depende desta conexão." : "Resultado da solicitação WhatsApp não confirmado. Confira o histórico antes de repetir.", method === "GET" ? 503 : 502);
      throw error;
    }
    if (allowMissing && response.status === 404) return null;
    if (!response.ok) throw new ApiError(response.status >= 500 ? "Serviço WhatsApp indisponível; resultado precisa ser conferido." : "O serviço WhatsApp recusou a solicitação. Solicite suporte à plataforma.", response.status >= 500 ? 502 : 422);
    const data = await response.json().catch(() => null);
    if (!data || typeof data !== "object") throw new ApiError("Resposta WhatsApp não confirmada. Consulte o suporte antes de repetir.", 502);
    return data;
  }
  async session(id) {
    const data = await this.request(id, "/api/sessions/default", { allowMissing: true });
    if (data && (data.name !== "default" || data.config?.metadata?.condominiumId !== id)) throw new ApiError("A sessão não pertence a este condomínio. Solicite suporte.", 409);
    return data;
  }
  async audit(user, action, db = this.db) {
    await db.auditLog.create({ data: { condominiumId: user.condominiumId, userId: user.id, userName: user.name, userRole: user.role, action: "UPDATE", module: "WHATSAPP_CONNECTION", details: action } });
  }
  async status(user, includeQr = false) {
    this.requireAdmin(user);
    const id = user.condominiumId;
    const session = await this.session(id);
    const connected = session?.status === "WORKING";
    const rawPhone = String(session?.me?.id || "").split("@")[0];
    const phone = /^\d{8,15}$/.test(rawPhone) ? rawPhone : null;
    if (connected && !phone) throw new ApiError("Número conectado sem identificação confirmada.", 502);
    const current = await this.db.tenantMessagingConfig.findUnique({ where: { condominiumId: id } });
    if (connected) {
      if (current?.secrets && !String(current.onboardingStatus).startsWith("WAHA_")) throw new ApiError("Existe uma configuração Meta preservada. A plataforma deve revisar a transição antes de conectar.", 409);
      const duplicate = await this.db.tenantMessagingConfig.findFirst({ where: { phoneNumberId: `waha:${phone}`, condominiumId: { not: id } } });
      if (duplicate) throw new ApiError("Este número já está vinculado a outro condomínio.", 409);
      const values = { channel: "WHATSAPP", enabled: true, displayPhone: `+${phone}`, phoneNumberId: `waha:${phone}`, onboardingStatus: "WAHA_READY", secrets: seal({ ...(current?.secrets ? unseal(current.secrets, `whatsapp:${id}`) : {}), provider: "WAHA", condominiumId: id }, `whatsapp:${id}`), verifiedAt: new Date() };
      await this.db.$transaction(async tx => {
        await tx.tenantMessagingConfig.upsert({ where: { condominiumId: id }, create: { condominiumId: id, ...values }, update: values });
        if (current?.onboardingStatus !== "WAHA_READY" || current?.displayPhone !== values.displayPhone) await this.audit(user, "Número WhatsApp conectado via QR; credenciais omitidas.", tx);
      });
    } else if (current?.onboardingStatus === "WAHA_READY") {
      await this.db.$transaction(async tx => {
        await tx.tenantMessagingConfig.update({ where: { condominiumId: id }, data: { enabled: false, verifiedAt: null, onboardingStatus: "WAHA_DISCONNECTED" } });
        await this.audit(user, "Conexão WhatsApp indisponível; canal de e-mail preservado.", tx);
      });
    }
    let qr = null;
    if (includeQr && session?.status === "SCAN_QR_CODE") {
      const image = await this.request(id, "/api/default/auth/qr");
      if (image.mimetype !== "image/png" || typeof image.data !== "string" || image.data.length > 400000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(image.data)) throw new ApiError("Não foi possível obter um QR válido. Atualize a conexão.", 502);
      qr = `data:image/png;base64,${image.data}`;
    }
    return { provider: "WAHA", connected, status: session?.status || "NOT_CONNECTED", phone: connected ? `+${phone}` : null, qr, checkedAt: new Date().toISOString() };
  }
  async start(user, replaceMetaConfirmed = false) {
    this.requireAdmin(user);
    const id = user.condominiumId;
    const current = await this.db.tenantMessagingConfig.findUnique({ where: { condominiumId: id } });
    if (current?.secrets && !String(current.onboardingStatus).startsWith("WAHA_")) {
      if (replaceMetaConfirmed !== true) throw new ApiError("Existe uma configuração Meta. Confirme a substituição para WAHA; a configuração anterior será preservada protegida.", 409);
      const previousMeta = { secrets: current.secrets, phoneNumberId: current.phoneNumberId, displayPhone: current.displayPhone, wabaId: current.wabaId, templateName: current.templateName, languageCode: current.languageCode, apiVersion: current.apiVersion, onboardingStatus: current.onboardingStatus, templateStatus: current.templateStatus, verifiedAt: current.verifiedAt, enabled: current.enabled, channel: current.channel };
      const secrets = seal({ provider: "WAHA", condominiumId: id, previousMeta }, `whatsapp:${id}`);
      await this.db.$transaction(async tx => {
        await tx.tenantMessagingConfig.update({ where: { condominiumId: id }, data: { secrets, enabled: false, verifiedAt: null, onboardingStatus: "WAHA_DISCONNECTED" } });
        await this.audit(user, "Transição Meta para WAHA confirmada pelo síndico; configuração anterior preservada protegida.", tx);
      });
    }
    seal({ provider: "WAHA" }, `whatsapp:${id}`); // Validate encryption before any external mutation.
    const session = await this.session(id);
    if (!session) await this.request(id, "/api/sessions", { method: "POST", body: { name: "default", start: true, config: { metadata: { condominiumId: id } } } });
    else if (session.status === "FAILED") {
      await this.request(id, "/api/sessions/default/logout", { method: "POST" });
      await this.request(id, "/api/sessions/default/start", { method: "POST" });
    } else if (session.status === "STOPPED") await this.request(id, "/api/sessions/default/start", { method: "POST" });
    await this.audit(user, "Preparação de conexão WhatsApp solicitada pelo síndico; sem disparo de mensagens.");
    return this.status(user, true);
  }
  async checkDelivery(user, messageId) {
    if (!user?.condominiumId || !["CONDOMINIUM_ADMIN", "MANAGER", "DOORMAN"].includes(user.role) || !uuid.test(messageId || "")) throw new ApiError("Consulta de aviso inválida.", 403);
    const row = await this.db.communicationLog.findFirst({ where: { id: messageId, condominiumId: user.condominiumId, module: "PACKAGE", channel: "WHATSAPP" } });
    if (!row) throw new ApiError("Aviso WhatsApp não encontrado neste condomínio.", 404);
    const uncertain = row.status === "FAILED" && row.metadata?.requiresReview === true;
    const savedReceipt = uncertain ? row.metadata?.wahaReviewReceipt : null;
    const remoteId = savedReceipt?.id ?? row.providerMessageId;
    if (uncertain && !remoteId) return { status: row.status, message: "Resultado incerto sem identificador do provedor. Confira a conversa no WhatsApp e solicite apoio à plataforma. O reenvio permanece bloqueado." };
    if ((row.status !== "SENT" && !uncertain) || !remoteId || (!savedReceipt && row.provider !== "WAHA")) return { status: row.status, message: "Não há confirmação de entrega para consultar neste estado." };
    const session = await this.session(user.condominiumId);
    if (session?.status !== "WORKING") throw new ApiError("WhatsApp desconectado. O registro do aviso foi preservado.", 503);
    const resolvedChat = savedReceipt?.chatId ?? row.metadata?.providerResponse?.wahaChatId;
    if (resolvedChat !== undefined && !isWahaRecipientChat(resolvedChat)) throw new ApiError("Identificador do aviso inválido. Solicite conferência ao suporte.", 422);
    const chat = resolvedChat ?? `${normalizeWhatsAppPhone(row.recipient)}@c.us`;
    const receipt = await this.request(user.condominiumId, `/api/default/chats/${encodeURIComponent(chat)}/messages/${encodeURIComponent(remoteId)}?downloadMedia=false`);
    const providerId = typeof receipt.id === "string" ? receipt.id : receipt.id?._serialized;
    if (providerId !== remoteId || receipt.fromMe !== true || ![2, 3, 4].includes(receipt.ack)) return { status: row.status, message: "Entrega ainda não confirmada pelo WhatsApp." };
    const count = await this.db.$transaction(async tx => {
      const updated = await tx.communicationLog.updateMany({ where: { id: row.id, condominiumId: user.condominiumId, status: row.status, ...(uncertain ? {attemptCount: row.attemptCount, metadata:{path:["requiresReview"],equals:true}} : {provider:"WAHA",providerMessageId:remoteId}) }, data: { status: "DELIVERED", deliveredAt: new Date(), provider:"WAHA",providerMessageId:remoteId, lastError:null } });
      if (updated.count) await tx.auditLog.create({ data: { condominiumId: user.condominiumId, userId: user.id, userName: user.name, userRole: user.role, action: "DELIVERED", module: "COMMUNICATION", referenceId: row.id, details: "Entrega WhatsApp confirmada por consulta autenticada ao provedor." } });
      return updated.count;
    });
    if (!count) {
      const latest = await this.db.communicationLog.findFirst({ where: { id: row.id, condominiumId: user.condominiumId }, select: { status: true } });
      return { status: latest?.status || row.status, message: "O estado foi atualizado por outra operação. Confira o histórico." };
    }
    return { status: "DELIVERED", message: "Entrega confirmada pelo WhatsApp." };
  }
  async disconnect(user, confirmed) {
    this.requireAdmin(user);
    if (confirmed !== true) throw new ApiError("Confirme a desconexão do número.", 422);
    const id = user.condominiumId;
    const session = await this.session(id);
    if (session) {
      await this.request(id, "/api/sessions/default/logout", { method: "POST" });
      await this.request(id, "/api/sessions/default/stop", { method: "POST" });
    }
    await this.db.$transaction(async tx => {
      await tx.tenantMessagingConfig.updateMany({ where: { condominiumId: id, onboardingStatus: { startsWith: "WAHA_" } }, data: { enabled: false, verifiedAt: null, onboardingStatus: "WAHA_DISCONNECTED" } });
      await this.audit(user, "Número WhatsApp desconectado pelo síndico; e-mail e encomendas preservados.", tx);
    });
    return { connected: false, status: "STOPPED", phone: null, qr: null };
  }
}
export default new WahaConnectionService();
