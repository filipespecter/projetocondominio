import crypto from "node:crypto";
import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const active = ["ACTIVE", "TRIAL"];
const messages = { INSTANCE_CONFLICT: "Existe um recurso com identificação incompatível. A equipe deve conferir a infraestrutura.", CAPACITY: "Aguardando capacidade disponível na infraestrutura.", SERVICE_UNAVAILABLE: "O serviço não ficou disponível. A equipe pode conferir e tentar novamente.", PREPARATION_FAILED: "Não foi possível preparar a conexão. Solicite à equipe uma nova tentativa." };
let lastAgentAt = 0;
export function agentSeen() { lastAgentAt = Date.now(); }
export function agentAvailable() { return process.env.WAHA_CONTROL_ENABLED === "true" && Date.now() - lastAgentAt < 30000; }

export class WahaProvisioningService {
  constructor(db = prisma, available = agentAvailable) { this.db = db; this.available = available; }
  requirePlatform(user, write = false) {
    if (user?.condominiumId || !(write ? ["PLATFORM_OWNER", "PLATFORM_ADMIN"] : ["PLATFORM_OWNER", "PLATFORM_ADMIN", "PLATFORM_SUPPORT"]).includes(user?.role)) throw new ApiError("Acesso restrito à Central.", 403);
  }
  async client(id, db = this.db) {
    if (!uuid.test(id || "")) throw new ApiError("Condomínio inválido.", 422);
    const client = await db.condominium.findFirst({ where: { id, deletedAt: null }, select: { id: true, status: true } });
    if (!client) throw new ApiError("Condomínio não encontrado.", 404);
    return client;
  }
  async status(user, id) {
    this.requirePlatform(user);
    const client = await this.client(id);
    const row = await this.db.wahaProvisioning.findUnique({ where: { condominiumId: id } });
    return { enabled: row?.enabled === true, state: row?.state || "NOT_ENABLED", preparedAt: row?.preparedAt || null,
      updatedAt: row?.updatedAt || null, message: messages[row?.errorCode] || null, infrastructureReady: this.available(),
      canPrepare: ["PLATFORM_OWNER", "PLATFORM_ADMIN"].includes(user.role) && active.includes(client.status) && this.available() };
  }
  async prepare(user, id, input) {
    this.requirePlatform(user, true);
    if (input?.confirmed !== true || Object.keys(input).some(key => key !== "confirmed")) throw new ApiError("Confirme a preparação deste condomínio.", 422);
    if (!this.available()) throw new ApiError("O serviço de preparação está indisponível. Nenhum vínculo foi criado.", 503);
    await this.db.$transaction(async tx => {
      await this.client(id, tx);
      // Serialize only this client; repeated clicks cannot enqueue multiple instances.
      await tx.$queryRaw`SELECT "id" FROM "Condominium" WHERE "id" = ${id}::uuid FOR UPDATE`;
      const client = await this.client(id, tx);
      if (!active.includes(client.status)) throw new ApiError("Habilite o acesso do condomínio antes de preparar o WhatsApp.", 409);
      const previous = await tx.wahaProvisioning.findUnique({ where: { condominiumId: id } });
      if (previous?.enabled && ["QUEUED", "PREPARING", "WAITING_CAPACITY"].includes(previous.state)) return;
      const values = { enabled: true, state: "QUEUED", operationId: crypto.randomUUID(), requestedBy: user.id,
        leaseId: null, leaseExpiresAt: null, attemptCount: 0, nextAttemptAt: new Date(), errorCode: null };
      await tx.wahaProvisioning.upsert({ where: { condominiumId: id }, create: { condominiumId: id, ...values }, update: values });
      await tx.auditLog.create({ data: { condominiumId: id, userId: user.id, userName: user.name, userRole: user.role,
        action: "UPDATE", module: "WHATSAPP_PROVISIONING", details: "Central confirmou a preparação de uma instância exclusiva. Sem pareamento ou envio automático." } });
    });
    return this.status(user, id);
  }
  async claim() {
    return this.db.$transaction(async tx => {
      const rows = await tx.$queryRaw`SELECT p."condominiumId" FROM "WahaProvisioning" p
        JOIN "Condominium" c ON c."id" = p."condominiumId"
        WHERE p."enabled" = true AND c."deletedAt" IS NULL AND c."status"::text IN ('ACTIVE','TRIAL')
        AND ((p."state" IN ('QUEUED','WAITING_CAPACITY') AND p."nextAttemptAt" <= NOW())
          OR (p."state" = 'PREPARING' AND p."leaseExpiresAt" < NOW()))
        ORDER BY p."updatedAt" ASC LIMIT 1 FOR UPDATE OF p SKIP LOCKED`;
      if (!rows.length) return null;
      const row = await tx.wahaProvisioning.findUnique({ where: { condominiumId: rows[0].condominiumId } });
      if (row.attemptCount >= 5) {
        await tx.wahaProvisioning.update({ where: { condominiumId: row.condominiumId }, data: { state: "FAILED", errorCode: "PREPARATION_FAILED", leaseId: null, leaseExpiresAt: null } });
        return null;
      }
      const leaseId = crypto.randomUUID();
      await tx.wahaProvisioning.update({ where: { condominiumId: row.condominiumId }, data: { state: "PREPARING", leaseId, leaseExpiresAt: new Date(Date.now() + 300000), attemptCount: { increment: 1 }, errorCode: null } });
      return { condominiumId: row.condominiumId, operationId: row.operationId, leaseId };
    });
  }
  async complete(input) {
    if (!input || ![input.condominiumId, input.operationId, input.leaseId].every(x => uuid.test(x || "")) || !["READY", "WAITING_CAPACITY", "FAILED"].includes(input.state)) throw new ApiError("Resultado inválido.", 422);
    const code = input.state === "WAITING_CAPACITY" ? "CAPACITY" : input.state === "FAILED" ? (messages[input.errorCode] ? input.errorCode : "PREPARATION_FAILED") : null;
    return this.db.$transaction(async tx => {
      const result = await tx.wahaProvisioning.updateMany({ where: { condominiumId: input.condominiumId, operationId: input.operationId, leaseId: input.leaseId,
        state: "PREPARING", enabled: true, leaseExpiresAt: { gt: new Date() }, condominium: { deletedAt: null, status: { in: active } } },
        data: { state: input.state, errorCode: code, leaseId: null, leaseExpiresAt: null, nextAttemptAt: new Date(Date.now() + 60000),
          ...(input.state === "READY" ? { preparedAt: new Date() } : {}), ...(input.state === "WAITING_CAPACITY" ? { attemptCount: { decrement: 1 } } : {}) } });
      if (result.count !== 1) throw new ApiError("Operação expirada ou substituída.", 409);
      await tx.auditLog.create({ data: { condominiumId: input.condominiumId, action: "UPDATE", module: "WHATSAPP_PROVISIONING",
        details: `Preparação da conexão: ${input.state}. Sem credenciais ou QR registrados.` } });
      return { accepted: true };
    });
  }
}
export default new WahaProvisioningService();
