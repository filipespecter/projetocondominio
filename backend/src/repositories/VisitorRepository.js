import BaseRepository from "./BaseRepository.js";

class VisitorRepository extends BaseRepository {
  constructor() {
    super("visitor");
  }

  get defaultInclude() {
    return {
      apartment: true,
      registeredBy: true,
      authorizedBy: true,
    };
  }

  /**
   * Busca um visitante pelo ID.
   */
  async findById(id, condominiumId) {
    return this.findFirst(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Lista visitantes do condomínio.
   */
  async findByCondominium(condominiumId) {
    return this.findMany(
      {
        condominiumId,
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
        orderBy: {
          createdAt: "desc",
        },
      }
    );
  }

  /**
   * Lista visitantes de um apartamento.
   */
  async findByApartment(apartmentId, condominiumId) {
    return this.findMany(
      {
        apartmentId,
        condominiumId,
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
        orderBy: {
          createdAt: "desc",
        },
      }
    );
  }

  /**
   * Lista visitantes por status.
   */
  async findByStatus(condominiumId, status) {
    return this.findMany(
      {
        condominiumId,
        status,
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
        orderBy: {
          createdAt: "desc",
        },
      }
    );
  }

  /**
   * Busca visitante pelo documento.
   */
  async findByDocument(condominiumId, document) {
    return this.findFirst(
      {
        condominiumId,
        document,
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Cria um visitante.
   */
  async createForCondominium(condominiumId, data) {
    return this.create(
      {
        condominiumId,
        apartmentId: data.apartmentId,
        name: data.name,
        document: data.document ?? null,
        phone: data.phone ?? null,
        visitType: data.visitType ?? null,
        vehicle: data.vehicle ?? null,
        plate: data.plate ?? null,
        notes: data.notes ?? null,
        expectedAt: data.expectedAt ?? null,
        registeredByUserId:
          data.registeredByUserId ?? null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Autoriza a entrada.
   */
  async authorize(
    id,
    condominiumId,
    authorizedByUserId
  ) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        status: "AUTHORIZED",
        authorizedAt: new Date(),
        authorizedByUserId,
      }
    );

    if (!result.count) return null;

    return this.findById(id, condominiumId);
  }

  /**
   * Registra entrada.
   */
  async registerEntry(id, condominiumId) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        status: "INSIDE",
        enteredAt: new Date(),
      }
    );

    if (!result.count) return null;

    return this.findById(id, condominiumId);
  }

  /**
   * Registra saída.
   */
  async registerExit(id, condominiumId) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        status: "LEFT",
        exitedAt: new Date(),
      }
    );

    if (!result.count) return null;

    return this.findById(id, condominiumId);
  }

  /**
   * Nega o acesso.
   */
  async deny(
    id,
    condominiumId,
    authorizedByUserId
  ) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        status: "DENIED",
        deniedAt: new Date(),
        authorizedByUserId,
      }
    );

    if (!result.count) return null;

    return this.findById(id, condominiumId);
  }

  /**
   * Atualiza dados.
   */
  async updateById(id, condominiumId, data) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        name: data.name,
        document: data.document,
        phone: data.phone,
        visitType: data.visitType,
        vehicle: data.vehicle,
        plate: data.plate,
        notes: data.notes,
        expectedAt: data.expectedAt,
      }
    );

    if (!result.count) return null;

    return this.findById(id, condominiumId);
  }

  /**
   * Exclusão lógica.
   */
  async softDelete(id, condominiumId) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        deletedAt: new Date(),
      }
    );

    return result.count > 0;
  }

  /**
   * Quantidade de visitantes.
   */
  async countByCondominium(condominiumId) {
    return this.count({
      condominiumId,
      deletedAt: null,
    });
  }

  /**
   * Quantidade por status.
   */
  async countByStatus(condominiumId, status) {
    return this.count({
      condominiumId,
      status,
      deletedAt: null,
    });
  }
}

export default new VisitorRepository();