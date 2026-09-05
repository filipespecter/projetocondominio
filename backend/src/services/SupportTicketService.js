import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

const OPEN_STATUSES = ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"];

function classify({ title = "", description = "", category = "" }) {
  const text = `${title} ${description} ${category}`.toLowerCase();
  const critical = ["sistema fora", "todos sem acesso", "indisponível", "indisponivel", "queda geral", "vazamento", "dados expostos"];
  const high = ["sem acesso", "não consigo entrar", "nao consigo entrar", "porteiro", "síndico", "sindico", "encomenda travada", "erro ao salvar"];
  const low = ["sugestão", "sugestao", "melhoria", "cor", "visual", "dúvida", "duvida"];
  const inferredCategory = category?.trim() || (
    /senha|login|acesso/.test(text) ? "ACESSO" :
    /encomenda|pacote/.test(text) ? "ENCOMENDAS" :
    /reserva|área comum|area comum/.test(text) ? "RESERVAS" :
    /finance|cobran|pix|boleto/.test(text) ? "FINANCEIRO" :
    /relat|pdf|excel/.test(text) ? "RELATORIOS" :
    "GERAL"
  );
  const priority = critical.some((term) => text.includes(term))
    ? "CRITICAL"
    : high.some((term) => text.includes(term))
      ? "HIGH"
      : low.some((term) => text.includes(term))
        ? "LOW"
        : "MEDIUM";
  return { category: inferredCategory, priority };
}

class SupportTicketService {
  async create(payload, user) {
    if (!user?.id || !user?.condominiumId) throw new ApiError("Usuário de condomínio inválido.", 403);
    const title = String(payload?.title ?? "").trim();
    const description = String(payload?.description ?? "").trim();
    if (title.length < 4) throw new ApiError("Informe um título com pelo menos 4 caracteres.", 400);
    if (description.length < 10) throw new ApiError("Descreva a solicitação com pelo menos 10 caracteres.", 400);
    const classification = classify({ title, description, category: payload?.category });
    return prisma.supportTicket.create({
      data: {
        condominiumId: user.condominiumId,
        openedByUserId: user.id,
        title,
        description,
        category: classification.category,
        priority: classification.priority,
        metadata: { autoClassified: true },
      },
      include: { condominium: true, openedBy: { select: { id: true, name: true, email: true, role: true } } },
    });
  }

  async listMine(user) {
    if (!user?.condominiumId) throw new ApiError("Condomínio não identificado.", 403);
    return prisma.supportTicket.findMany({
      where: { condominiumId: user.condominiumId },
      orderBy: [{ openedAt: "desc" }],
      include: { assignedTo: { select: { id: true, name: true } } },
    });
  }

  async listPlatform(query = {}) {
    const where = {};
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.condominiumId) where.condominiumId = query.condominiumId;
    return prisma.supportTicket.findMany({
      where,
      orderBy: [{ priority: "desc" }, { openedAt: "asc" }],
      include: {
        condominium: { select: { id: true, name: true, code: true, email: true, phone: true } },
        openedBy: { select: { id: true, name: true, email: true, role: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });
  }

  async statistics() {
    const [total, open, critical, high, waiting, resolved] = await Promise.all([
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: { in: OPEN_STATUSES } } }),
      prisma.supportTicket.count({ where: { status: { in: OPEN_STATUSES }, priority: "CRITICAL" } }),
      prisma.supportTicket.count({ where: { status: { in: OPEN_STATUSES }, priority: "HIGH" } }),
      prisma.supportTicket.count({ where: { status: "WAITING_CUSTOMER" } }),
      prisma.supportTicket.count({ where: { status: { in: ["RESOLVED", "CLOSED"] } } }),
    ]);
    return { total, open, critical, high, waiting, resolved };
  }

  async update(id, payload, platformUser) {
    const current = await prisma.supportTicket.findUnique({ where: { id } });
    if (!current) throw new ApiError("Solicitação de atendimento não encontrada.", 404);
    const data = {};
    if (payload.status) data.status = payload.status;
    if (payload.priority) data.priority = payload.priority;
    if (payload.category) data.category = String(payload.category).trim();
    if (payload.resolution !== undefined) data.resolution = String(payload.resolution ?? "").trim() || null;
    if (payload.assignToMe) data.assignedToUserId = platformUser.id;
    const now = new Date();
    if (!current.firstResponseAt && (payload.status === "IN_PROGRESS" || payload.assignToMe)) data.firstResponseAt = now;
    if (payload.status === "RESOLVED") data.resolvedAt = now;
    if (payload.status === "CLOSED") data.closedAt = now;
    return prisma.supportTicket.update({
      where: { id }, data,
      include: { condominium: true, openedBy: { select: { id: true, name: true, email: true } }, assignedTo: { select: { id: true, name: true } } },
    });
  }
}

export default new SupportTicketService();
