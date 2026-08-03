import BaseRepository from "./BaseRepository.js";

class ResidentRepository extends BaseRepository {
  constructor() {
    super("resident");
  }

  /**
   * Configuração padrão dos relacionamentos retornados
   * nas consultas de moradores.
   */
  get defaultInclude() {
    return {
      apartment: true,
      user: true,
    };
  }

  /**
   * Busca um morador pelo ID dentro do condomínio.
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
   * Lista todos os moradores não excluídos
   * pertencentes ao condomínio.
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
          user: {
            name: "asc",
          },
        },
      }
    );
  }

  /**
   * Lista os moradores vinculados a um apartamento.
   */
  async findByApartment(
    apartmentId,
    condominiumId
  ) {
    return this.findMany(
      {
        apartmentId,
        condominiumId,
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
        orderBy: [
          {
            isPrimary: "desc",
          },
          {
            user: {
              name: "asc",
            },
          },
        ],
      }
    );
  }

  /**
   * Busca o perfil de morador vinculado
   * a determinado usuário.
   */
  async findByUserId(
    userId,
    condominiumId = null
  ) {
    const where = {
      userId,
      deletedAt: null,
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
   * Busca o morador principal de um apartamento.
   */
  async findPrimaryByApartment(
    apartmentId,
    condominiumId
  ) {
    return this.findFirst(
      {
        apartmentId,
        condominiumId,
        isPrimary: true,
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Lista apenas os moradores principais
   * do condomínio.
   */
  async findPrimaryResidents(condominiumId) {
    return this.findMany(
      {
        condominiumId,
        isPrimary: true,
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
        orderBy: {
          user: {
            name: "asc",
          },
        },
      }
    );
  }

  /**
   * Lista moradores de determinado tipo.
   *
   * Tipos permitidos pelo schema:
   * OWNER
   * TENANT
   * DEPENDENT
   */
  async findByResidentType(
    condominiumId,
    residentType
  ) {
    return this.findMany(
      {
        condominiumId,
        residentType,
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
        orderBy: {
          user: {
            name: "asc",
          },
        },
      }
    );
  }

  /**
   * Busca um morador pelo username do usuário.
   */
  async findByUsername(
    condominiumId,
    username
  ) {
    return this.findFirst(
      {
        condominiumId,
        deletedAt: null,
        user: {
          username: String(username).trim(),
          deletedAt: null,
        },
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Busca um morador pelo e-mail do usuário.
   */
  async findByEmail(
    condominiumId,
    email
  ) {
    return this.findFirst(
      {
        condominiumId,
        deletedAt: null,
        user: {
          email: String(email)
            .trim()
            .toLowerCase(),
          deletedAt: null,
        },
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Cria o perfil de morador.
   *
   * O usuário deve ser criado primeiro pelo UserService.
   * Depois seu ID será utilizado aqui.
   */
  async createForCondominium(
    condominiumId,
    data
  ) {
    return this.create(
      {
        condominiumId,
        apartmentId: data.apartmentId,
        userId: data.userId,
        residentType:
          data.residentType ?? "OWNER",
        isPrimary:
          data.isPrimary ?? false,
        canReserve:
          data.canReserve ?? true,
        canOpenOccurrence:
          data.canOpenOccurrence ?? true,
        canViewPackages:
          data.canViewPackages ?? true,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Atualiza o perfil específico do morador.
   *
   * Nome, e-mail e telefone não são atualizados aqui,
   * porque pertencem ao model User.
   */
  async updateById(
    id,
    condominiumId,
    data
  ) {
    const updateData = {};

    if (data.apartmentId !== undefined) {
      updateData.apartmentId =
        data.apartmentId;
    }

    if (data.residentType !== undefined) {
      updateData.residentType =
        data.residentType;
    }

    if (data.isPrimary !== undefined) {
      updateData.isPrimary =
        Boolean(data.isPrimary);
    }

    if (data.canReserve !== undefined) {
      updateData.canReserve =
        Boolean(data.canReserve);
    }

    if (
      data.canOpenOccurrence !== undefined
    ) {
      updateData.canOpenOccurrence =
        Boolean(data.canOpenOccurrence);
    }

    if (data.canViewPackages !== undefined) {
      updateData.canViewPackages =
        Boolean(data.canViewPackages);
    }

    const result = await this.updateMany(
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
   * Move o morador para outro apartamento.
   */
  async changeApartment(
    id,
    condominiumId,
    apartmentId
  ) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        apartmentId,
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
   * Define o morador como principal.
   */
  async markAsPrimary(
    id,
    condominiumId
  ) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        isPrimary: true,
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
   * Remove a indicação de morador principal.
   */
  async removePrimaryStatus(
    id,
    condominiumId
  ) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        isPrimary: false,
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
   * Atualiza as permissões específicas do morador.
   */
  async updatePermissions(
    id,
    condominiumId,
    permissions
  ) {
    const updateData = {};

    if (permissions.canReserve !== undefined) {
      updateData.canReserve =
        Boolean(permissions.canReserve);
    }

    if (
      permissions.canOpenOccurrence !==
      undefined
    ) {
      updateData.canOpenOccurrence =
        Boolean(
          permissions.canOpenOccurrence
        );
    }

    if (
      permissions.canViewPackages !==
      undefined
    ) {
      updateData.canViewPackages =
        Boolean(
          permissions.canViewPackages
        );
    }

    const result = await this.updateMany(
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
   * Realiza exclusão lógica do perfil de morador.
   *
   * O usuário relacionado será tratado separadamente
   * pelo UserService.
   */
  async softDelete(id, condominiumId) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        isPrimary: false,
        canReserve: false,
        canOpenOccurrence: false,
        canViewPackages: false,
        deletedAt: new Date(),
      }
    );

    return result.count > 0;
  }

  /**
   * Conta moradores não excluídos do condomínio.
   */
  async countByCondominium(condominiumId) {
    return this.count({
      condominiumId,
      deletedAt: null,
    });
  }

  /**
   * Conta moradores de determinado apartamento.
   */
  async countByApartment(
    apartmentId,
    condominiumId
  ) {
    return this.count({
      apartmentId,
      condominiumId,
      deletedAt: null,
    });
  }

  /**
   * Conta moradores por tipo.
   */
  async countByResidentType(
    condominiumId,
    residentType
  ) {
    return this.count({
      condominiumId,
      residentType,
      deletedAt: null,
    });
  }
}

export default new ResidentRepository();