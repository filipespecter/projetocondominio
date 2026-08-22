import BaseRepository from "./BaseRepository.js";

class OperationalRecordRepository extends BaseRepository {
  constructor() {
    super("operationalRecord");
  }

  get defaultInclude() {
    return {
      createdBy: {
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
        },
      },
    };
  }

  async findByCondominium(condominiumId) {
    return this.findMany(
      { condominiumId, deletedAt: null },
      { include: this.defaultInclude, orderBy: [{ recordDate: "desc" }, { recordTime: "desc" }] }
    );
  }

  async findById(id, condominiumId) {
    return this.findFirst(
      { id, condominiumId, deletedAt: null },
      { include: this.defaultInclude }
    );
  }

  async createForCondominium(condominiumId, data) {
    return this.create(
      { condominiumId, ...data },
      { include: this.defaultInclude }
    );
  }

  async softDelete(id, condominiumId) {
    const result = await this.updateMany(
      { id, condominiumId, deletedAt: null },
      { deletedAt: new Date() }
    );
    return result.count > 0;
  }
}

export default new OperationalRecordRepository();
