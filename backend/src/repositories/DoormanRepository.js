import BaseRepository from "./BaseRepository.js";

class DoormanRepository extends BaseRepository {
  constructor() {
    super("doorman");
  }

  /**
   * Campos seguros do usuário vinculado ao porteiro.
   *
   * Nunca retornar passwordHash, tentativas de login,
   * bloqueios ou outros dados sensíveis.
   */
  get safeUserSelect() {
    return {
      id: true,
      condominiumId: true,
      name: true,
      username: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      mustChangePassword: true,
      lastLoginAt: true,
      lastLogoutAt: true,
      passwordChangedAt: true,
      createdAt: true,
      updatedAt: true,
    };
  }

  /**
   * Relações carregadas por padrão.
   */
  get defaultInclude() {
    return {
      user: {
        select: this.safeUserSelect,
      },
    };
  }

  /**
   * Busca um porteiro pelo ID dentro do condomínio.
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
   * Lista todos os porteiros ativos no cadastro
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
   * Busca o perfil de porteiro vinculado
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
      where.condominiumId =
        condominiumId;
    }

    return this.findFirst(
      where,
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Busca um porteiro pelo código interno.
   */
  async findByCode(
    condominiumId,
    code
  ) {
    return this.findFirst(
      {
        condominiumId,
        code: String(code)
          .trim()
          .toUpperCase(),
        deletedAt: null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Lista porteiros por turno.
   *
   * Turnos permitidos pelo schema:
   * MORNING
   * AFTERNOON
   * NIGHT
   * TWELVE_BY_THIRTY_SIX
   * OTHER
   */
  async findByShift(
    condominiumId,
    shift
  ) {
    return this.findMany(
      {
        condominiumId,
        shift,
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
   * Cria o perfil específico do porteiro.
   *
   * O usuário deve ser criado antes pelo UserService.
   */
  async createForCondominium(
    condominiumId,
    data
  ) {
    return this.create(
      {
        condominiumId,
        userId: data.userId,
        code: String(data.code)
          .trim()
          .toUpperCase(),
        shift: data.shift,
        customShift:
          data.customShift !== undefined &&
          data.customShift !== null &&
          String(data.customShift).trim() !== ""
            ? String(data.customShift).trim()
            : null,
        lastDutyAt:
          data.lastDutyAt ?? null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Atualiza os campos específicos do porteiro.
   *
   * Nome, username, e-mail, telefone e status
   * pertencem ao model User.
   */
  async updateById(
    id,
    condominiumId,
    data
  ) {
    const updateData = {};

    if (data.code !== undefined) {
      updateData.code =
        String(data.code)
          .trim()
          .toUpperCase();
    }

    if (data.shift !== undefined) {
      updateData.shift =
        data.shift;
    }

    if (
      data.customShift !== undefined
    ) {
      updateData.customShift =
        data.customShift === null ||
        String(data.customShift).trim() === ""
          ? null
          : String(
              data.customShift
            ).trim();
    }

    if (
      data.lastDutyAt !== undefined
    ) {
      updateData.lastDutyAt =
        data.lastDutyAt === null ||
        data.lastDutyAt === ""
          ? null
          : new Date(data.lastDutyAt);
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
   * Altera somente o turno do porteiro.
   */
  async changeShift(
    id,
    condominiumId,
    shift,
    customShift = null
  ) {
    const result =
      await this.updateMany(
        {
          id,
          condominiumId,
          deletedAt: null,
        },
        {
          shift,
          customShift:
            customShift === null ||
            String(customShift).trim() === ""
              ? null
              : String(
                  customShift
                ).trim(),
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
   * Registra a última atuação ou início de plantão.
   */
  async registerLastDuty(
    id,
    condominiumId,
    dutyDate = new Date()
  ) {
    const result =
      await this.updateMany(
        {
          id,
          condominiumId,
          deletedAt: null,
        },
        {
          lastDutyAt:
            dutyDate instanceof Date
              ? dutyDate
              : new Date(dutyDate),
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
   * Realiza exclusão lógica do perfil de porteiro.
   *
   * O usuário relacionado será desativado
   * separadamente pelo UserService.
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
          deletedAt: new Date(),
        }
      );

    return result.count > 0;
  }

  /**
   * Conta porteiros não excluídos do condomínio.
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
   * Conta porteiros por turno.
   */
  async countByShift(
    condominiumId,
    shift
  ) {
    return this.count({
      condominiumId,
      shift,
      deletedAt: null,
    });
  }
}

export default new DoormanRepository();
