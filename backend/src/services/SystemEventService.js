import SystemEventRepository from "../repositories/SystemEventRepository.js";
import { ApiError } from "../utils/ApiError.js";

class SystemEventService {
  parseDate(value, endOfDay = false) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new ApiError("Data inválida.", 400);
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      date.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
    }
    return date;
  }

  async list(query = {}) {
    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);
    const filters = { ...query, startDate: this.parseDate(query.startDate), endDate: this.parseDate(query.endDate, true) };
    const { items, total } = await SystemEventRepository.findPaginated(filters, page, limit);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id) {
    const event = await SystemEventRepository.findById(id);
    if (!event) throw new ApiError("Evento do sistema não encontrado.", 404);
    return event;
  }

  async create(data = {}) {
    if (!data.type || !data.source || !data.message) throw new ApiError("type, source e message são obrigatórios para registrar evento do sistema.", 400);
    return SystemEventRepository.createEvent({ ...data, severity: String(data.severity ?? "INFO").trim().toUpperCase() });
  }

  async resolve(id, user, payload = {}) {
    const event = await this.findById(id);
    if (event.resolvedAt) throw new ApiError("Este evento já está resolvido.", 409);
    if (!user?.id) throw new ApiError("Responsável pela resolução não identificado.", 401);

    const resolutionAction = String(
      payload?.resolutionAction ?? payload?.resolutionNotes ?? ""
    ).trim();
    const resolutionComment = String(payload?.resolutionComment ?? "").trim() || null;

    if (resolutionAction.length < 5) {
      throw new ApiError("Descreva a ação tomada com pelo menos 5 caracteres.", 400);
    }
    if (resolutionAction.length > 1000) {
      throw new ApiError("A ação tomada deve possuir no máximo 1000 caracteres.", 400);
    }
    if (resolutionComment && resolutionComment.length > 2000) {
      throw new ApiError("A observação deve possuir no máximo 2000 caracteres.", 400);
    }

    return SystemEventRepository.resolve(
      id,
      user.id,
      resolutionAction,
      resolutionComment
    );
  }

  async reopen(id) {
    const event = await this.findById(id);
    if (!event.resolvedAt) throw new ApiError("Este evento já está aberto.", 409);
    return SystemEventRepository.reopen(id);
  }

  async statistics() { return SystemEventRepository.statistics(); }
}

export default new SystemEventService();
