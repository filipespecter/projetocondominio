import BaseRepository from "./BaseRepository.js";

class AuditLogRepository extends BaseRepository {
  constructor() {
    super("auditLog");
  }

  /**
   * Relacionamentos retornados nas consultas.
   */
  get defaultInclude() {
    return {
      user: true,
      condominium: true,
    };
  }

  /**
   * Busca um log pelo ID.
   *
   * condominiumId pode ser null para ações
   * realizadas no nível da plataforma.
   */
  async findById(id, condominiumId = null) {
    const where = {
      id,
    };

    if (condominiumId) {
      where.condominiumId = condominiumId;
    }

    return this.findFirst(
      where,
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Lista os logs de um condomínio.
   */
  async findByCondominium(condominiumId) {
    return this.findMany(
      {
        condominiumId,
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
   * Lista logs globais da plataforma.
   *
   * Esses registros não possuem condominiumId.
   */
  async findPlatformLogs() {
    return this.findMany(
      {
        condominiumId: null,
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
   * Lista ações realizadas por um usuário.
   */
  async findByUser(
    userId,
    condominiumId = null
  ) {
    const where = {
      userId,
    };

    if (condominiumId) {
      where.condominiumId =
        condominiumId;
    }

    return this.findMany(
      where,
      {
        include: this.defaultInclude,
        orderBy: {
          createdAt: "desc",
        },
      }
    );
  }

  /**
   * Lista logs de determinado módulo.
   *
   * Exemplos:
   * AUTH
   * USER
   * APARTMENT
   * RESIDENT
   * VISITOR
   * PACKAGE
   * RESERVATION
   * NOTICE
   * OCCURRENCE
   */
  async findByModule(
    condominiumId,
    module
  ) {
    return this.findMany(
      {
        condominiumId,
        module,
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
   * Lista logs por tipo de ação.
   *
   * Exemplos:
   * CREATE
   * UPDATE
   * DELETE
   * LOGIN
   * LOGOUT
   * APPROVE
   * REJECT
   * CANCEL
   */
  async findByAction(
    condominiumId,
    action
  ) {
    return this.findMany(
      {
        condominiumId,
        action,
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
   * Lista logs relacionados a um registro específico.
   */
  async findByReference(
    condominiumId,
    referenceId
  ) {
    return this.findMany(
      {
        condominiumId,
        referenceId,
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
   * Lista logs dentro de um período.
   */
  async findByPeriod(
    condominiumId,
    startDate,
    endDate
  ) {
    return this.findMany(
      {
        condominiumId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
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
   * Lista logs por usuário e período.
   */
  async findByUserAndPeriod(
    userId,
    condominiumId,
    startDate,
    endDate
  ) {
    return this.findMany(
      {
        userId,
        condominiumId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
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
   * Cria um registro de auditoria.
   *
   * O Service decide:
   * - qual ação ocorreu;
   * - em qual módulo;
   * - quem realizou;
   * - quais dados mudaram.
   */
  async createLog(data) {
    return this.create(
      {
        condominiumId:
          data.condominiumId ?? null,
        userId:
          data.userId ?? null,
        userName:
          data.userName ?? null,
        userRole:
          data.userRole ?? null,
        action: data.action,
        module: data.module,
        details:
          data.details ?? null,
        referenceId:
          data.referenceId ?? null,
        beforeData:
          data.beforeData ?? null,
        afterData:
          data.afterData ?? null,
        ipAddress:
          data.ipAddress ?? null,
        userAgent:
          data.userAgent ?? null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Conta todos os logs de um condomínio.
   */
  async countByCondominium(
    condominiumId
  ) {
    return this.count({
      condominiumId,
    });
  }

  /**
   * Conta logs de determinado módulo.
   */
  async countByModule(
    condominiumId,
    module
  ) {
    return this.count({
      condominiumId,
      module,
    });
  }

  /**
   * Conta ações de determinado usuário.
   */
  async countByUser(
    userId,
    condominiumId = null
  ) {
    const where = {
      userId,
    };

    if (condominiumId) {
      where.condominiumId =
        condominiumId;
    }

    return this.count(where);
  }

  /**
   * Conta ações de determinado tipo.
   */
  async countByAction(
    condominiumId,
    action
  ) {
    return this.count({
      condominiumId,
      action,
    });
  }
}

export default new AuditLogRepository();