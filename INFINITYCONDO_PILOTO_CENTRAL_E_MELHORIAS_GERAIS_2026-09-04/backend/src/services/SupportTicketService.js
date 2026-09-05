import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import AuditLogService from "./AuditLogService.js";

const VALID_STATUS = new Set(["ABERTA", "EM_ATENDIMENTO", "AGUARDANDO_CLIENTE", "RESOLVIDA", "ENCERRADA"]);
const VALID_PRIORITY = new Set(["CRITICA", "ALTA", "MEDIA", "BAIXA"]);

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeUpper(value) {
  return normalizeText(value).toUpperCase();
}

class SupportTicketService {
  classify({ subject, description, impact }) {
    const text = `${subject ?? ""} ${description ?? ""} ${impact ?? ""}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    let category = "GERAL";
    if (/(login|senha|acesso|entrar|autentic)/.test(text)) category = "ACESSO";
    else if (/(encomenda|pacote|retirada|qr)/.test(text)) category = "ENCOMENDAS";
    else if (/(reserva|area comum|salao|quadra)/.test(text)) category = "RESERVAS";
    else if (/(pix|boleto|cobranca|pagamento|finance)/.test(text)) category = "FINANCEIRO";
    else if (/(relatorio|pdf|excel|planilha|bi|grafico)/.test(text)) category = "RELATORIOS";
    else if (/(whatsapp|mercado pago|webhook|integracao)/.test(text)) category = "INTEGRACAO";
    else if (/(visitante|prestador|portaria)/.test(text)) category = "PORTARIA";

    let priority = "MEDIA";
    if (/(sistema fora|sistema indisponivel|todos sem acesso|ninguem consegue|condominio inteiro|dados sumiram|perda de dados|vazamento)/.test(text)) {
      priority = "CRITICA";
    } else if (/(nao consigo acessar|nao entra|porteiro nao consegue|sindico sem acesso|bloqueado|operacao parada|urgente)/.test(text)) {
      priority = "ALTA";
    } else if (/(duvida|sugestao|melhoria|estetica|cor|texto)/.test(text)) {
      priority = "BAIXA";
    }

    return { category, priority };
  }

  async generateCode() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
      const code = `SA-${y}${m}${d}-${suffix}`;
      const exists = await prisma.supportTicket.findUnique({ where: { code }, select: { id: true } });
      if (!exists) return code;
    }
    throw new ApiError("Não foi possível gerar o protocolo da solicitação.", 500);
  }

  include() {
    return {
      condominium: { select: { id: true, code: true, name: true, status: true } },
      openedBy: { select: { id: true, name: true, username: true, email: true, role: true } },
      assignedTo: { select: { id: true, name: true, email: true, role: true } },
    };
  }

  async createForUser(data, user, requestContext = null) {
    if (!user?.id || !user?.condominiumId) {
      throw new ApiError("Usuário do condomínio não identificado.", 403);
    }

    const subject = normalizeText(data.subject);
    const description = normalizeText(data.description);
    if (subject.length < 4) throw new ApiError("Informe um assunto com pelo menos 4 caracteres.", 400);
    if (description.length < 10) throw new ApiError("Descreva a solicitação com pelo menos 10 caracteres.", 400);

    const automatic = this.classify({ subject, description, impact: data.impact });
    const ticket = await prisma.supportTicket.create({
      data: {
        code: await this.generateCode(),
        condominiumId: user.condominiumId,
        openedByUserId: user.id,
        subject,
        description,
        category: automatic.category,
        priority: automatic.priority,
        impact: normalizeText(data.impact) || null,
        attachmentUrl: normalizeText(data.attachmentUrl) || null,
      },
      include: this.include(),
    });

    await AuditLogService.logCreate({
      condominiumId: user.condominiumId,
      user,
      module: "SUPPORT_TICKET",
      referenceId: ticket.id,
      afterData: ticket,
      details: `Solicitação ${ticket.code} aberta.`,
      requestContext,
    });

    return ticket;
  }

  async listForUser(user, query = {}) {
    if (!user?.condominiumId) throw new ApiError("Condomínio não identificado.", 403);
    const where = { condominiumId: user.condominiumId };
    if (query.mine === "true") where.openedByUserId = user.id;
    if (query.status) where.status = normalizeUpper(query.status);
    return prisma.supportTicket.findMany({ where, include: this.include(), orderBy: { createdAt: "desc" }, take: 100 });
  }

  async platformList(query = {}) {
    const where = {};
    if (query.status) where.status = normalizeUpper(query.status);
    if (query.priority) where.priority = normalizeUpper(query.priority);
    if (query.category) where.category = normalizeUpper(query.category);
    if (query.condominiumId) where.condominiumId = normalizeText(query.condominiumId);
    if (query.search) {
      const search = normalizeText(query.search);
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { condominium: { name: { contains: search, mode: "insensitive" } } },
      ];
    }
    const [items, total, critical, high, open] = await Promise.all([
      prisma.supportTicket.findMany({ where, include: this.include(), orderBy: [{ priority: "asc" }, { createdAt: "asc" }], take: 200 }),
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.count({ where: { priority: "CRITICA", status: { notIn: ["RESOLVIDA", "ENCERRADA"] } } }),
      prisma.supportTicket.count({ where: { priority: "ALTA", status: { notIn: ["RESOLVIDA", "ENCERRADA"] } } }),
      prisma.supportTicket.count({ where: { status: { notIn: ["RESOLVIDA", "ENCERRADA"] } } }),
    ]);
    return { items, summary: { total, open, critical, high } };
  }

  async updatePlatform(id, data, user, requestContext = null) {
    const before = await prisma.supportTicket.findUnique({ where: { id }, include: this.include() });
    if (!before) throw new ApiError("Solicitação não encontrada.", 404);

    const patch = {};
    if (data.status !== undefined) {
      const status = normalizeUpper(data.status);
      if (!VALID_STATUS.has(status)) throw new ApiError("Status de suporte inválido.", 400);
      patch.status = status;
      if (status === "RESOLVIDA") patch.resolvedAt = new Date();
      if (status === "ENCERRADA") patch.closedAt = new Date();
      if (status === "EM_ATENDIMENTO" && !before.firstResponseAt) patch.firstResponseAt = new Date();
    }
    if (data.priority !== undefined) {
      const priority = normalizeUpper(data.priority);
      if (!VALID_PRIORITY.has(priority)) throw new ApiError("Prioridade inválida.", 400);
      patch.priority = priority;
    }
    if (data.category !== undefined) patch.category = normalizeUpper(data.category) || "GERAL";
    if (data.response !== undefined) {
      patch.response = normalizeText(data.response) || null;
      if (!before.firstResponseAt) patch.firstResponseAt = new Date();
    }
    if (data.resolutionSummary !== undefined) patch.resolutionSummary = normalizeText(data.resolutionSummary) || null;
    if (data.assignedToUserId !== undefined) patch.assignedToUserId = data.assignedToUserId || null;

    const updated = await prisma.supportTicket.update({ where: { id }, data: patch, include: this.include() });
    await AuditLogService.logUpdate({
      condominiumId: before.condominiumId,
      user,
      module: "SUPPORT_TICKET",
      referenceId: id,
      beforeData: before,
      afterData: updated,
      details: `Solicitação ${before.code} atualizada pela Central.`,
      requestContext,
    });
    return updated;
  }
}

export default new SupportTicketService();
