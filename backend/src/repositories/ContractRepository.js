import BaseRepository from "./BaseRepository.js";

class ContractRepository extends BaseRepository {
  constructor() {
    super("contract");
  }

  get defaultInclude() {
    return {
      supplier: {
        select: { id: true, legalName: true, tradeName: true, serviceType: true, status: true },
      },
      responsibleUser: {
        select: { id: true, name: true, role: true, status: true },
      },
    };
  }

  async findById(id, condominiumId) {
    return this.findFirst(
      { id, condominiumId, deletedAt: null },
      { include: this.defaultInclude }
    );
  }

  async findByCondominium(condominiumId, filters = {}) {
    const where = { condominiumId, deletedAt: null };
    if (filters.supplierId) where.supplierId = filters.supplierId;
    if (filters.status) where.status = filters.status;
    if (filters.contractKind) where.contractKind = filters.contractKind;
    if (filters.search) {
      where.OR = [
        { serviceType: { contains: filters.search, mode: "insensitive" } },
        { reference: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { supplier: { is: { legalName: { contains: filters.search, mode: "insensitive" } } } },
      ];
    }
    return this.findMany(where, {
      include: this.defaultInclude,
      orderBy: [{ endDate: "asc" }, { createdAt: "desc" }],
    });
  }

  async createForCondominium(condominiumId, data) {
    return this.create({ condominiumId, ...data }, { include: this.defaultInclude });
  }

  async updateById(id, condominiumId, data) {
    const result = await this.updateMany(
      { id, condominiumId, deletedAt: null },
      data
    );
    if (!result.count) return null;
    return this.findById(id, condominiumId);
  }

  async softDelete(id, condominiumId) {
    const result = await this.updateMany(
      { id, condominiumId, deletedAt: null },
      { deletedAt: new Date(), status: "CLOSED" }
    );
    return result.count > 0;
  }

  async findExpirationAlertCandidates(from, until) {
    return this.findMany(
      {
        deletedAt: null,
        status: { notIn: ["CLOSED", "CANCELED"] },
        expirationAlertSentAt: null,
        contractKind: "CONTRACT",
        endDate: { not: null, gte: from, lte: until },
        condominium: { status: { in: ["TRIAL", "ACTIVE"] } },
      },
      {
        include: this.defaultInclude,
        orderBy: { endDate: "asc" },
      }
    );
  }

  async markExpirationAlerted(id, condominiumId, sentAt) {
    return this.updateMany(
      {
        id,
        condominiumId,
        deletedAt: null,
        expirationAlertSentAt: null,
      },
      {
        status: "EXPIRES_SOON",
        expirationAlertSentAt: sentAt,
      }
    );
  }
}

export default new ContractRepository();
