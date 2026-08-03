import BaseService from "./BaseService.js";
import AuthService from "./AuthService.js";
import userRepository from "../repositories/UserRepository.js";
import Password from "../utils/Password.js";
import { ApiError } from "../utils/ApiError.js";

class UserService extends BaseService {
  constructor() {
    super(userRepository);
  }

  /**
   * Remove dados sensíveis antes de devolver
   * o usuário para o Controller ou frontend.
   */
  sanitizeUser(user) {
    if (!user) {
      return null;
    }

    const {
      passwordHash,
      failedLoginAttempts,
      lockedUntil,
      deletedAt,
      ...safeUser
    } = user;

    return safeUser;
  }

  /**
   * Normaliza o username usado no cadastro.
   */
  normalizeUsername(username) {
    return String(username)
      .trim()
      .toLowerCase();
  }

  /**
   * Normaliza o e-mail.
   */
  normalizeEmail(email) {
    if (!email) {
      return null;
    }

    return String(email)
      .trim()
      .toLowerCase();
  }

  /**
   * Valida a força mínima de uma senha.
   */
  validatePassword(password) {
    if (!password) {
      throw new ApiError(
        "A senha é obrigatória.",
        400
      );
    }

    if (String(password).length < 8) {
      throw new ApiError(
        "A senha deve possuir pelo menos 8 caracteres.",
        400
      );
    }
  }

  /**
   * Confere se o perfil informado existe no schema.
   */
  validateRole(role) {
    const allowedRoles = [
      "PLATFORM_ADMIN",
      "CONDOMINIUM_ADMIN",
      "MANAGER",
      "DOORMAN",
      "RESIDENT",
    ];

    if (!allowedRoles.includes(role)) {
      throw new ApiError(
        "Perfil de usuário inválido.",
        400
      );
    }
  }

  /**
   * Confere se o status informado existe no schema.
   */
  validateStatus(status) {
    const allowedStatuses = [
      "ACTIVE",
      "INACTIVE",
      "BLOCKED",
      "PENDING",
    ];

    if (!allowedStatuses.includes(status)) {
      throw new ApiError(
        "Status de usuário inválido.",
        400
      );
    }
  }

  /**
   * Busca um usuário pelo ID.
   */
  async findById(id, condominiumId = null) {
    const user =
      await userRepository.findById(
        id,
        condominiumId
      );

    if (!user) {
      throw new ApiError(
        "Usuário não encontrado.",
        404
      );
    }

    return this.sanitizeUser(user);
  }

  /**
   * Lista os usuários de um condomínio.
   */
  async findAll(condominiumId) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    const users =
      await userRepository
        .findByCondominium(
          condominiumId
        );

    return users.map((user) =>
      this.sanitizeUser(user)
    );
  }

  /**
   * Lista usuários por perfil.
   */
  async findByRole(
    condominiumId,
    role
  ) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    this.validateRole(role);

    const users =
      await userRepository.findByRole(
        condominiumId,
        role
      );

    return users.map((user) =>
      this.sanitizeUser(user)
    );
  }

  /**
   * Confere se username ou e-mail já estão cadastrados.
   */
  async validateUniqueCredentials({
    condominiumId,
    username,
    email,
    ignoredUserId = null,
  }) {
    const normalizedUsername =
      this.normalizeUsername(username);

    const existingUsername =
      await userRepository.findByUsername(
        normalizedUsername,
        condominiumId
      );

    if (
      existingUsername &&
      existingUsername.id !== ignoredUserId
    ) {
      throw new ApiError(
        "Este nome de usuário já está cadastrado neste condomínio.",
        409
      );
    }

    const normalizedEmail =
      this.normalizeEmail(email);

    if (normalizedEmail) {
      const existingEmail =
        await userRepository.findByEmail(
          normalizedEmail,
          condominiumId
        );

      if (
        existingEmail &&
        existingEmail.id !== ignoredUserId
      ) {
        throw new ApiError(
          "Este e-mail já está cadastrado neste condomínio.",
          409
        );
      }
    }
  }

  /**
   * Cria um usuário vinculado a um condomínio.
   *
   * O condominiumId deverá vir do usuário autenticado
   * ou da administração da plataforma.
   */
  async createForCondominium(
    condominiumId,
    data
  ) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    if (!data.name) {
      throw new ApiError(
        "O nome do usuário é obrigatório.",
        400
      );
    }

    if (!data.username) {
      throw new ApiError(
        "O nome de acesso é obrigatório.",
        400
      );
    }

    if (!data.role) {
      throw new ApiError(
        "O perfil do usuário é obrigatório.",
        400
      );
    }

    this.validatePassword(data.password);
    this.validateRole(data.role);

    if (data.status) {
      this.validateStatus(data.status);
    }

    await this.validateUniqueCredentials({
      condominiumId,
      username: data.username,
      email: data.email,
    });

    const passwordHash =
      await Password.hash(data.password);

    const user =
      await userRepository
        .createForCondominium(
          condominiumId,
          {
            name: String(data.name).trim(),
            username:
              this.normalizeUsername(
                data.username
              ),
            email:
              this.normalizeEmail(
                data.email
              ),
            phone:
              data.phone ?? null,
            passwordHash,
            role: data.role,
            status:
              data.status ?? "ACTIVE",
            mustChangePassword:
              data.mustChangePassword ??
              true,
          }
        );

    return this.sanitizeUser(user);
  }

  /**
   * Cria um administrador da plataforma.
   *
   * Esse usuário não pertence a um condomínio.
   */
  async createPlatformAdministrator(data) {
    if (!data.name || !data.username) {
      throw new ApiError(
        "Nome e usuário são obrigatórios.",
        400
      );
    }

    this.validatePassword(data.password);

    const normalizedUsername =
      this.normalizeUsername(
        data.username
      );

    const existingUser =
      await userRepository
        .findPlatformAdminByUsername(
          normalizedUsername
        );

    if (existingUser) {
      throw new ApiError(
        "Este administrador da plataforma já existe.",
        409
      );
    }

    const passwordHash =
      await Password.hash(data.password);

    const user =
      await userRepository.create({
        condominiumId: null,
        name: String(data.name).trim(),
        username: normalizedUsername,
        email:
          this.normalizeEmail(data.email),
        phone: data.phone ?? null,
        passwordHash,
        role: "PLATFORM_ADMIN",
        status:
          data.status ?? "ACTIVE",
        mustChangePassword:
          data.mustChangePassword ?? true,
      });

    return this.sanitizeUser(user);
  }

  /**
   * Atualiza os dados de um usuário.
   */
  async update(
    id,
    condominiumId,
    data
  ) {
    const existingUser =
      await userRepository.findById(
        id,
        condominiumId
      );

    if (!existingUser) {
      throw new ApiError(
        "Usuário não encontrado.",
        404
      );
    }

    if (
      data.username !== undefined ||
      data.email !== undefined
    ) {
      await this.validateUniqueCredentials({
        condominiumId,
        username:
          data.username ??
          existingUser.username,
        email:
          data.email !== undefined
            ? data.email
            : existingUser.email,
        ignoredUserId: id,
      });
    }

    if (data.role !== undefined) {
      this.validateRole(data.role);
    }

    if (data.status !== undefined) {
      this.validateStatus(data.status);
    }

    const updateData = {
      ...data,
    };

    if (data.name !== undefined) {
      updateData.name =
        String(data.name).trim();
    }

    if (data.username !== undefined) {
      updateData.username =
        this.normalizeUsername(
          data.username
        );
    }

    if (data.email !== undefined) {
      updateData.email =
        this.normalizeEmail(data.email);
    }

    delete updateData.password;
    delete updateData.passwordHash;
    delete updateData.condominiumId;
    delete updateData.failedLoginAttempts;
    delete updateData.lockedUntil;

    const user =
      await userRepository.updateById(
        id,
        condominiumId,
        updateData
      );

    if (!user) {
      throw new ApiError(
        "Usuário não encontrado.",
        404
      );
    }

    return this.sanitizeUser(user);
  }

  /**
   * Ativa o acesso de um usuário.
   */
  async activate(id, condominiumId) {
    const user =
      await userRepository.activate(
        id,
        condominiumId
      );

    if (!user) {
      throw new ApiError(
        "Usuário não encontrado.",
        404
      );
    }

    return this.sanitizeUser(user);
  }

  /**
   * Desativa o acesso de um usuário.
   */
  async deactivate(
    id,
    condominiumId
  ) {
    const user =
      await userRepository.deactivate(
        id,
        condominiumId
      );

    if (!user) {
      throw new ApiError(
        "Usuário não encontrado.",
        404
      );
    }

    return this.sanitizeUser(user);
  }

  /**
   * Bloqueia administrativamente um usuário.
   */
  async block(id, condominiumId) {
    const user =
      await userRepository.block(
        id,
        condominiumId
      );

    if (!user) {
      throw new ApiError(
        "Usuário não encontrado.",
        404
      );
    }

    return this.sanitizeUser(user);
  }

  /**
   * Redefine a senha administrativamente.
   *
   * Por padrão, o usuário deverá trocar a senha
   * no próximo acesso.
   */
  async resetPassword(
    id,
    condominiumId,
    newPassword
  ) {
    const user =
      await userRepository.findById(
        id,
        condominiumId
      );

    if (!user) {
      throw new ApiError(
        "Usuário não encontrado.",
        404
      );
    }

    this.validatePassword(newPassword);

    return AuthService
      .resetPasswordByAdministrator(
        id,
        newPassword,
        true
      );
  }

  /**
   * Permite que o próprio usuário troque a senha.
   */
  async changeOwnPassword(
    userId,
    data
  ) {
    return AuthService.changePassword(
      userId,
      data
    );
  }

  /**
   * Realiza exclusão lógica.
   */
  async remove(id, condominiumId) {
    const user =
      await userRepository.findById(
        id,
        condominiumId
      );

    if (!user) {
      throw new ApiError(
        "Usuário não encontrado.",
        404
      );
    }

    const deleted =
      await userRepository.softDelete(
        id,
        condominiumId
      );

    if (!deleted) {
      throw new ApiError(
        "Não foi possível remover o usuário.",
        400
      );
    }

    return {
      message:
        "Usuário removido com sucesso.",
    };
  }

  /**
   * Conta usuários do condomínio.
   */
  async count(condominiumId) {
    return userRepository.count({
      condominiumId,
      deletedAt: null,
    });
  }
}

export default new UserService();