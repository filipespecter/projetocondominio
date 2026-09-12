import BaseRepository from "./BaseRepository.js";

class DocumentRepository extends BaseRepository {
  constructor() {
    super("condominiumDocument");
  }

  get defaultInclude() {
    return {
      uploadedBy: {
        select: { id: true, name: true, role: true },
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
    if (filters.category) where.category = filters.category;
    if (filters.visibility) where.visibility = filters.visibility;
    if (filters.visibleFor?.length) where.visibility = { in: filters.visibleFor };
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { category: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    return this.findMany(where, {
      include: this.defaultInclude,
      orderBy: [{ documentDate: "desc" }, { createdAt: "desc" }],
    });
  }

  async createForCondominium(condominiumId, uploadedByUserId, data) {
    return this.create(
      {
        condominiumId,
        uploadedByUserId,
        title: data.title,
        description: data.description ?? null,
        category: data.category,
        visibility: data.visibility,
        documentDate: data.documentDate ?? null,
        fileName: data.fileName,
        filePath: data.filePath,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
      },
      { include: this.defaultInclude }
    );
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
      { deletedAt: new Date() }
    );
    return result.count > 0;
  }
}

export default new DocumentRepository();
