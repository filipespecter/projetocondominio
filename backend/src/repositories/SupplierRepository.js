import BaseRepository from "./BaseRepository.js";

class SupplierRepository extends BaseRepository {
  constructor() { super("supplier"); }
  get defaultInclude() {
    return { _count: { select: { contracts: true, assets: true } } };
  }
  async findById(id, condominiumId) {
    return this.findFirst({ id, condominiumId, deletedAt: null }, { include: this.defaultInclude });
  }
  async findByCondominium(condominiumId, filters = {}) {
    const where = { condominiumId, deletedAt: null };
    if (filters.status) where.status = filters.status;
    if (filters.search) where.OR = [
      { legalName: { contains: filters.search, mode: "insensitive" } },
      { tradeName: { contains: filters.search, mode: "insensitive" } },
      { serviceType: { contains: filters.search, mode: "insensitive" } },
      { document: { contains: filters.search, mode: "insensitive" } },
    ];
    return this.findMany(where, { include: this.defaultInclude, orderBy: { legalName: "asc" } });
  }
  async findByDocument(condominiumId, document) {
    if (!document) return null;
    return this.findFirst({ condominiumId, document, deletedAt: null });
  }
  async createForCondominium(condominiumId, data) {
    return this.create({ condominiumId, ...data }, { include: this.defaultInclude });
  }
  async updateById(id, condominiumId, data) {
    const result = await this.updateMany({ id, condominiumId, deletedAt: null }, data);
    if (!result.count) return null;
    return this.findById(id, condominiumId);
  }
  async softDelete(id, condominiumId) {
    const result = await this.updateMany({ id, condominiumId, deletedAt: null }, { deletedAt: new Date(), status: "INACTIVE" });
    return result.count > 0;
  }
}
export default new SupplierRepository();
