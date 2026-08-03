import BaseRepository from "./BaseRepository.js";

class UserRepository extends BaseRepository {
  constructor() {
    super("user");
  }

  /**
   * Busca um usuário pelo ID.
   *
   * O deletedAt impede que usuários removidos
   * logicamente sejam retornados.
   */
  async findById(id, condominiumId = null) {
    const where = {
      id,
      deletedAt: null,
    };

    if (condominiumId) {
      where.condominiumId = condominiumId;
    }

    return this.findFirst(
      where,
      {
        include: {
          condominium: true,
          resident: {
            include: {
              apartment: true,
            },
          },
          doorman: true,
        },
      }
    );
  }

  /**
   * Busca um usuário pelo nome de acesso dentro
   * de determinado condomínio.
   *
   * O username é único somente dentro do condomínio.
   */
  async findByUsername(username, condominiumId) {
    return this.findFirst(
      {
        condominiumId,
        username: String(username).trim(),
        deletedAt: null,
      },
      {
        include: {
          condominium: true,
          resident: {
            include: {
              apartment: true,
            },
          },
          doorman: true,
        },
      }
    );
  }

  /**
   * Busca um usuário pelo e-mail dentro do condomínio.
   */
  async findByEmail(email, condominiumId) {
    return this.findFirst(
      {
        condominiumId,
        email: String(email).trim().toLowerCase(),
        deletedAt: null,
      },
      {
        include: {
          condominium: true,
          resident: {
            include: {
              apartment: true,
            },
          },
          doorman: true,
        },
      }
    );
  }

  /**
   * Busca um administrador da plataforma pelo username.
   *
   * Usuários PLATFORM_ADMIN podem não estar associados
   * a um condomínio.
   */
  async findPlatformAdminByUsername(username) {
    return this.findFirst({
      condominiumId: null,
      username: String(username).trim(),
      role: "PLATFORM_ADMIN",
      deletedAt: null,
    });
  }

  /**
   * Lista todos os usuários ativos no cadastro
   * de determinado condomínio.
   */
  async findByCondominium(condominiumId) {
    return this.findMany(
      {
        condominiumId,
        deletedAt: null,
      },
      {
        include: {
          resident: {
            include: {
              apartment: true,
            },
          },
          doorman: true,
        },
        orderBy: {
          name: "asc",
        },
      }
    );
  }

  /**
   * Lista usuários de determinado perfil.
   */
  async findByRole(condominiumId, role) {
    return this.findMany(
      {
        condominiumId,
        role,
        deletedAt: null,
      },
      {
        include: {
          resident: {
            include: {
              apartment: true,
            },
          },
          doorman: true,
        },
        orderBy: {
          name: "asc",
        },
      }
    );
  }

  /**
   * Lista usuários disponíveis para receber notificações.
   */
  async findActiveByRole(condominiumId, role) {
    return this.findMany(
      {
        condominiumId,
        role,
        status: "ACTIVE",
        deletedAt: null,
      },
      {
        orderBy: {
          name: "asc",
        },
      }
    );
  }

  /**
   * Cria um usuário vinculado a um condomínio.
   *
   * A senha já deve chegar criptografada pelo Service.
   */
  async createForCondominium(
    condominiumId,
    data
  ) {
    return this.create({
      condominiumId,
      name: data.name,
      username: String(data.username).trim(),
      email: data.email
        ? String(data.email).trim().toLowerCase()
        : null,
      phone: data.phone ?? null,
      passwordHash: data.passwordHash,
      role: data.role,
      status: data.status ?? "ACTIVE",
      mustChangePassword:
        data.mustChangePassword ?? true,
    });
  }

  /**
   * Atualiza os dados básicos do usuário.
   */
  async updateById(id, condominiumId, data) {
    const updateData = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.username !== undefined) {
      updateData.username =
        String(data.username).trim();
    }

    if (data.email !== undefined) {
      updateData.email = data.email
        ? String(data.email).trim().toLowerCase()
        : null;
    }

    if (data.phone !== undefined) {
      updateData.phone = data.phone;
    }

    if (data.role !== undefined) {
      updateData.role = data.role;
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.mustChangePassword !== undefined) {
      updateData.mustChangePassword =
        data.mustChangePassword;
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

    return this.findById(id, condominiumId);
  }

  /**
   * Registra um login realizado com sucesso.
   */
  async registerSuccessfulLogin(id) {
    return this.update(
      { id },
      {
        lastLoginAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      }
    );
  }

  /**
   * Registra uma tentativa de login inválida.
   */
  async registerFailedLogin(id) {
    return this.model.update({
      where: {
        id,
      },
      data: {
        failedLoginAttempts: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Bloqueia temporariamente o acesso do usuário.
   */
  async lockUntil(id, lockedUntil) {
    return this.update(
      { id },
      {
        lockedUntil,
      }
    );
  }

  /**
   * Registra o logout.
   */
  async registerLogout(id) {
    return this.update(
      { id },
      {
        lastLogoutAt: new Date(),
      }
    );
  }

  /**
   * Atualiza a senha criptografada.
   */
  async updatePassword(
    id,
    passwordHash,
    mustChangePassword = false
  ) {
    return this.update(
      { id },
      {
        passwordHash,
        mustChangePassword,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      }
    );
  }

  /**
   * Ativa o acesso do usuário.
   */
  async activate(id, condominiumId) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        status: "ACTIVE",
      }
    );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id, condominiumId);
  }

  /**
   * Desativa o acesso do usuário.
   */
  async deactivate(id, condominiumId) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        status: "INACTIVE",
      }
    );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id, condominiumId);
  }

  /**
   * Bloqueia o usuário administrativamente.
   */
  async block(id, condominiumId) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        status: "BLOCKED",
      }
    );

    if (result.count === 0) {
      return null;
    }

    return this.findById(id, condominiumId);
  }

  /**
   * Realiza exclusão lógica.
   */
  async softDelete(id, condominiumId) {
    const result = await this.updateMany(
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
}

export default new UserRepository();