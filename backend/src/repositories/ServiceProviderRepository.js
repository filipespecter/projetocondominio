import BaseRepository from "./BaseRepository.js";

class ServiceProviderRepository extends BaseRepository {
  constructor() {
    super("serviceProvider");
  }

  /**
   * Relacionamentos retornados nas consultas.
   */
  get defaultInclude() {
    return {
      accesses: {
        where: {
          deletedAt: null,
        },
        include: {
          apartment: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    };
  }

  normalizeOptionalText(value) {
    if (
      value === undefined ||
      value === null ||
      String(value).trim() === ""
    ) {
      return null;
    }

    return String(value).trim();
  }

  /**
   * Busca um prestador pelo ID dentro do condomínio.
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
   * Lista todos os prestadores do condomínio.
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
          name: "asc",
        },
      }
    );
  }

  /**
   * Lista prestadores por status.
   */
  async findByStatus(
    condominiumId,
    status
  ) {
    return this.findMany(
      {
        condominiumId,
        status,
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
        orderBy: {
          name: "asc",
        },
      }
    );
  }

  /**
   * Lista somente prestadores ativos.
   */
  async findActive(condominiumId) {
    return this.findByStatus(
      condominiumId,
      "ACTIVE"
    );
  }

  /**
   * Busca pelo documento.
   */
  async findByDocument(
    condominiumId,
    document
  ) {
    const normalizedDocument =
      this.normalizeOptionalText(
        document
      );

    if (!normalizedDocument) {
      return null;
    }

    return this.findFirst(
      {
        condominiumId,
        document:
          normalizedDocument,
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Busca pelo e-mail.
   */
  async findByEmail(
    condominiumId,
    email
  ) {
    const normalizedEmail =
      this.normalizeOptionalText(
        email
      );

    if (!normalizedEmail) {
      return null;
    }

    return this.findFirst(
      {
        condominiumId,
        email:
          normalizedEmail.toLowerCase(),
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Cria um prestador.
   */
  async createForCondominium(
    condominiumId,
    data
  ) {
    return this.create(
      {
        condominiumId,

        name:
          String(data.name).trim(),

        companyName:
          this.normalizeOptionalText(
            data.companyName
          ),

        document:
          this.normalizeOptionalText(
            data.document
          ),

        phone:
          this.normalizeOptionalText(
            data.phone
          ),

        email:
          data.email
            ? String(data.email)
                .trim()
                .toLowerCase()
            : null,

        serviceType:
          String(
            data.serviceType
          ).trim(),

        notes:
          this.normalizeOptionalText(
            data.notes
          ),

        status:
          data.status ?? "ACTIVE",
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Atualiza os campos enviados.
   */
  async updateById(
    id,
    condominiumId,
    data
  ) {
    const updateData = {};

    if (data.name !== undefined) {
      updateData.name =
        String(data.name).trim();
    }

    if (
      data.companyName !== undefined
    ) {
      updateData.companyName =
        this.normalizeOptionalText(
          data.companyName
        );
    }

    if (data.document !== undefined) {
      updateData.document =
        this.normalizeOptionalText(
          data.document
        );
    }

    if (data.phone !== undefined) {
      updateData.phone =
        this.normalizeOptionalText(
          data.phone
        );
    }

    if (data.email !== undefined) {
      updateData.email =
        data.email
          ? String(data.email)
              .trim()
              .toLowerCase()
          : null;
    }

    if (
      data.serviceType !== undefined
    ) {
      updateData.serviceType =
        String(
          data.serviceType
        ).trim();
    }

    if (data.notes !== undefined) {
      updateData.notes =
        this.normalizeOptionalText(
          data.notes
        );
    }

    if (data.status !== undefined) {
      updateData.status =
        data.status;
    }

    const result =
      await this.updateMany(
        {
          id,
          condominiumId,
          deletedAt: null,
        },
        updateData
      );

    if (result.count === 0) {
      return null;
    }

    return this.findById(
      id,
      condominiumId
    );
  }

  /**
   * Ativa um prestador.
   */
  async activate(
    id,
    condominiumId
  ) {
    return this.changeStatus(
      id,
      condominiumId,
      "ACTIVE"
    );
  }

  /**
   * Desativa um prestador.
   */
  async deactivate(
    id,
    condominiumId
  ) {
    return this.changeStatus(
      id,
      condominiumId,
      "INACTIVE"
    );
  }

  /**
   * Bloqueia um prestador.
   */
  async block(
    id,
    condominiumId
  ) {
    return this.changeStatus(
      id,
      condominiumId,
      "BLOCKED"
    );
  }

  /**
   * Altera o status do prestador.
   */
  async changeStatus(
    id,
    condominiumId,
    status
  ) {
    const result =
      await this.updateMany(
        {
          id,
          condominiumId,
          deletedAt: null,
        },
        {
          status,
        }
      );

    if (result.count === 0) {
      return null;
    }

    return this.findById(
      id,
      condominiumId
    );
  }

  /**
   * Exclusão lógica.
   */
  async softDelete(
    id,
    condominiumId
  ) {
    const result =
      await this.updateMany(
        {
          id,
          condominiumId,
          deletedAt: null,
        },
        {
          status: "INACTIVE",
          deletedAt: new Date(),
        }
      );

    return result.count > 0;
  }

  /**
   * Conta todos os prestadores.
   */
  async countByCondominium(
    condominiumId
  ) {
    return this.count({
      condominiumId,
      deletedAt: null,
    });
  }

  /**
   * Conta por status.
   */
  async countByStatus(
    condominiumId,
    status
  ) {
    return this.count({
      condominiumId,
      status,
      deletedAt: null,
    });
  }
}

export default new ServiceProviderRepository();
