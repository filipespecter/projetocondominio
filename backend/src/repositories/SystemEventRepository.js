import BaseRepository from "./BaseRepository.js";

class SystemEventRepository extends BaseRepository {
  constructor() { super("systemEvent"); }

  get safeUserSelect() {
    return { id: true, condominiumId: true, name: true, username: true, email: true, role: true, status: true };
  }

  get defaultInclude() {
    return {
      condominium: { select: { id: true, code: true, name: true, status: true } },
      user: { select: this.safeUserSelect },
      resolvedBy: { select: this.safeUserSelect },
    };
  }

  buildWhere(filters = {}) {
    const where = {};
    if (filters.condominiumId) where.condominiumId = filters.condominiumId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.severity) where.severity = String(filters.severity).trim().toUpperCase();
    if (filters.type) where.type = { contains: String(filters.type).trim(), mode: "insensitive" };
    if (filters.source) where.source = { contains: String(filters.source).trim(), mode: "insensitive" };
    if (filters.requestId) where.requestId = String(filters.requestId).trim();
    if (filters.errorCode) where.errorCode = String(filters.errorCode).trim();
    if (filters.statusCode !== undefined && filters.statusCode !== null && filters.statusCode !== "") where.statusCode = Number(filters.statusCode);
    if (filters.resolved === true || filters.resolved === "true") where.resolvedAt = { not: null };
    if (filters.resolved === false || filters.resolved === "false") where.resolvedAt = null;
    if (filters.startDate || filters.endDate) {
      where.occurredAt = {};
      if (filters.startDate) where.occurredAt.gte = filters.startDate;
      if (filters.endDate) where.occurredAt.lte = filters.endDate;
    }
    return where;
  }

  async findById(id) {
    return this.findUnique({ id }, { include: this.defaultInclude });
  }

  async findPaginated(filters = {}, page = 1, limit = 20) {
    const where = this.buildWhere(filters);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.model.findMany({ where, include: this.defaultInclude, orderBy: { occurredAt: "desc" }, skip, take: limit }),
      this.model.count({ where }),
    ]);
    return { items, total };
  }

  async createEvent(data) {
    return this.create({
      condominiumId: data.condominiumId ?? null, userId: data.userId ?? null,
      severity: data.severity ?? "INFO", type: data.type, source: data.source, message: data.message,
      requestId: data.requestId ?? null, errorCode: data.errorCode ?? null, httpMethod: data.httpMethod ?? null,
      route: data.route ?? null, statusCode: data.statusCode ?? null, stack: data.stack ?? null, details: data.details ?? null,
      occurredAt: data.occurredAt ?? new Date(),
    }, { include: this.defaultInclude });
  }

  async resolve(id, resolvedByUserId, resolutionAction, resolutionComment = null) {
    const legacyNotes = [resolutionAction, resolutionComment].filter(Boolean).join(" — ");
    return this.update(
      { id },
      {
        resolvedByUserId,
        resolvedAt: new Date(),
        resolutionAction,
        resolutionComment,
        resolutionNotes: legacyNotes || null,
      },
      { include: this.defaultInclude }
    );
  }

  async reopen(id) {
    return this.update(
      { id },
      {
        resolvedByUserId: null,
        resolvedAt: null,
        resolutionAction: null,
        resolutionComment: null,
        resolutionNotes: null,
      },
      { include: this.defaultInclude }
    );
  }

  async statistics() {
    const [total, info, warning, error, critical, unresolved] = await Promise.all([
      this.count(), this.count({ severity: "INFO" }), this.count({ severity: "WARNING" }),
      this.count({ severity: "ERROR" }), this.count({ severity: "CRITICAL" }), this.count({ resolvedAt: null }),
    ]);
    return { total, info, warning, error, critical, unresolved };
  }
}

export default new SystemEventRepository();
