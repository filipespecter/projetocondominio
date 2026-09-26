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
  isSchemaUnavailable(error) { return ["P2021", "P2022"].includes(error?.code); }

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
    try {
      return await prisma.supportTicket.findMany({
        where,
        orderBy: [{ priority: "desc" }, { openedAt: "asc" }],
        include: {
          condominium: { select: { id: true, name: true, code: true, email: true, phone: true } },
          openedBy: { select: { id: true, name: true, email: true, role: true } },
          assignedTo: { select: { id: true, name: true } },
        },
      });
    } catch (error) {
      if (this.isSchemaUnavailable(error)) return [];
      throw error;
    }
  }

  async statistics() {
    try {
      const [total, open, critical, high, waiting, resolved] = await Promise.all([
        prisma.supportTicket.count(),
        prisma.supportTicket.count({ where: { status: { in: OPEN_STATUSES } } }),
        prisma.supportTicket.count({ where: { status: { in: OPEN_STATUSES }, priority: "CRITICAL" } }),
        prisma.supportTicket.count({ where: { status: { in: OPEN_STATUSES }, priority: "HIGH" } }),
        prisma.supportTicket.count({ where: { status: "WAITING_CUSTOMER" } }),
        prisma.supportTicket.count({ where: { status: { in: ["RESOLVED", "CLOSED"] } } }),
      ]);
      return { total, open, critical, high, waiting, resolved };
    } catch (error) {
      if (this.isSchemaUnavailable(error)) return { total:0, open:0, critical:0, high:0, waiting:0, resolved:0, schemaPending:true };
      throw error;
    }
  }

  async update(id, payload, platformUser) {
    const current = await prisma.supportTicket.findUnique({ where: { id } });
    if (!current) throw new ApiError("Solicitação de atendimento não encontrada.", 404);
    if (!platformUser?.id) throw new ApiError("Responsável da plataforma não identificado.", 401);

    const allowedStatuses = ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED", "CLOSED"];
    const allowedPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const data = {};

    if (payload.status) {
      const status = String(payload.status).trim().toUpperCase();
      if (!allowedStatuses.includes(status)) throw new ApiError("Status de atendimento inválido.", 400);
      data.status = status;
    }

    if (payload.priority) {
      const priority = String(payload.priority).trim().toUpperCase();
      if (!allowedPriorities.includes(priority)) throw new ApiError("Prioridade de atendimento inválida.", 400);
      data.priority = priority;
    }

    if (payload.category) data.category = String(payload.category).trim();
    if (payload.assignToMe) data.assignedToUserId = platformUser.id;

    const now = new Date();
    if (!current.firstResponseAt && (data.status === "IN_PROGRESS" || payload.assignToMe)) {
      data.firstResponseAt = now;
    }

    if (data.status === "RESOLVED") {
      const resolution = String(payload.resolution ?? "").trim();
      if (resolution.length < 5) {
        throw new ApiError("Descreva a solução aplicada com pelo menos 5 caracteres.", 400);
      }
      if (resolution.length > 2000) {
        throw new ApiError("A solução aplicada deve possuir no máximo 2000 caracteres.", 400);
      }
      data.resolution = resolution;
      data.resolvedAt = now;
      data.closedAt = null;
      if (!current.assignedToUserId) data.assignedToUserId = platformUser.id;
      if (!current.firstResponseAt) data.firstResponseAt = now;
    } else if (payload.resolution !== undefined) {
      data.resolution = String(payload.resolution ?? "").trim() || null;
    }

    if (data.status === "CLOSED") {
      if (current.status !== "RESOLVED" && !current.resolvedAt) {
        throw new ApiError("Resolva a solicitação antes de encerrá-la.", 409);
      }
      data.closedAt = now;
    }

    if (["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"].includes(data.status)) {
      data.resolvedAt = null;
      data.closedAt = null;
    }

    return prisma.supportTicket.update({
      where: { id },
      data,
      include: {
        condominium: true,
        openedBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });
  }
}

export default new SupportTicketService();
