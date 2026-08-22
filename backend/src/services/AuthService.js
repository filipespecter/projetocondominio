import AuditLogService from "./AuditLogService.js";

import userRepository from "../repositories/UserRepository.js";
import condominiumRepository from "../repositories/CondominiumRepository.js";

import Jwt from "../utils/Jwt.js";
import Password from "../utils/Password.js";
import env from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

class AuthService {
  /**
   * Remove dados sensíveis antes de devolver
   * o usuário para o Controller ou frontend.
   */
  sanitizeUser(user) {
    if (!user) {
      return null;
    }

    const safeUser = {
      ...user,
    };

    delete safeUser.passwordHash;
    delete safeUser.failedLoginAttempts;
    delete safeUser.lockedUntil;
    delete safeUser.deletedAt;

    return safeUser;
  }

  /**
   * Normaliza o nome de acesso.
   */
  normalizeUsername(username) {
    return String(username ?? "")
      .trim()
      .toLowerCase();
  }

  /**
   * Confere os dados mínimos do login.
   */
  validateLoginData({
    condominiumCode,
    username,
    password,
  }) {
    if (!username) {
      throw new ApiError(
        "O nome de acesso é obrigatório.",
        400
      );
    }

    if (!password) {
      throw new ApiError(
        "A senha é obrigatória.",
        400
      );
    }

    return {
      condominiumCode:
        condominiumCode
          ? String(condominiumCode)
              .trim()
              .toUpperCase()
          : null,

      username:
        this.normalizeUsername(username),

      password:
        String(password),
    };
  }

  /**
   * Confere se o condomínio permite autenticação.
   */
  validateCondominiumAccess(condominium) {
    if (!condominium) {
      throw new ApiError(
        "Usuário ou senha inválidos.",
        401
      );
    }

    if (
      ["SUSPENDED", "CANCELED"].includes(
        condominium.status
      )
    ) {
      throw new ApiError(
        "O acesso deste condomínio está suspenso.",
        403
      );
    }

    if (
      !["TRIAL", "ACTIVE"].includes(
        condominium.status
      )
    ) {
      throw new ApiError(
        "O condomínio não está disponível para acesso.",
        403
      );
    }
  }

  /**
   * Confere se o usuário pode autenticar.
   */
  validateUserAccess(user) {
    if (!user) {
      throw new ApiError(
        "Usuário ou senha inválidos.",
        401
      );
    }

    if (user.status === "BLOCKED") {
      throw new ApiError(
        "Este usuário está bloqueado.",
        403
      );
    }

    if (user.status === "INACTIVE") {
      throw new ApiError(
        "Este usuário está inativo.",
        403
      );
    }

    if (user.status === "PENDING") {
      throw new ApiError(
        "Este usuário ainda não está liberado para acesso.",
        403
      );
    }

    if (user.status !== "ACTIVE") {
      throw new ApiError(
        "Este usuário não pode acessar o sistema.",
        403
      );
    }

    if (
      user.lockedUntil &&
      new Date(user.lockedUntil) > new Date()
    ) {
      throw new ApiError(
        "Muitas tentativas inválidas. Tente novamente mais tarde.",
        429,
        {
          lockedUntil: user.lockedUntil,
        }
      );
    }
  }

  /**
   * Localiza o usuário conforme o contexto de acesso.
   *
   * Com condominiumCode:
   * usuário pertencente ao condomínio.
   *
   * Sem condominiumCode:
   * somente usuário interno da Central Star.
   */
  async findUserForLogin({
    condominiumCode,
    username,
  }) {
    if (!condominiumCode) {
      return userRepository
        .findPlatformUserByUsername(
          username
        );
    }

    const condominium =
      await condominiumRepository.findByCode(
        condominiumCode
      );

    this.validateCondominiumAccess(
      condominium
    );

    const user =
      await userRepository.findByUsername(
        username,
        condominium.id
      );

    return user;
  }

  /**
   * Registra uma tentativa inválida e, quando
   * necessário, aplica o bloqueio temporário.
   */
  async registerInvalidPassword(user) {
    const updatedUser =
      await userRepository.registerFailedLogin(
        user.id
      );

    if (
      updatedUser.failedLoginAttempts >=
      env.LOGIN_MAX_ATTEMPTS
    ) {
      const lockedUntil = new Date(
        Date.now() +
          env.LOGIN_LOCK_MINUTES *
            60 *
            1000
      );

      await userRepository.lockUntil(
        user.id,
        lockedUntil
      );

      throw new ApiError(
        "Muitas tentativas inválidas. O acesso foi bloqueado temporariamente.",
        429,
        {
          lockedUntil,
        }
      );
    }

    throw new ApiError(
      "Usuário ou senha inválidos.",
      401
    );
  }

  /**
   * Gera o par de tokens da autenticação.
   */
  generateTokens(user) {
    return {
      accessToken:
        Jwt.generateAccessToken(user),

      refreshToken:
        Jwt.generateRefreshToken(user),
    };
  }

  /**
   * Realiza o login.
   */
  async login(
    credentials,
    requestContext = null
  ) {
    const {
      condominiumCode,
      username,
      password,
    } = this.validateLoginData(
      credentials
    );

    const user =
      await this.findUserForLogin({
        condominiumCode,
        username,
      });

    this.validateUserAccess(user);

    if (user.condominiumId) {
      this.validateCondominiumAccess(
        user.condominium
      );
    }

    const passwordMatches =
      await Password.compare(
        password,
        user.passwordHash
      );

    if (!passwordMatches) {
      await this.registerInvalidPassword(
        user
      );
    }

    await userRepository
      .registerSuccessfulLogin(user.id);

    const authenticatedUser =
      await userRepository.findById(
        user.id,
        user.condominiumId ?? null
      );

    const tokens =
      this.generateTokens(
        authenticatedUser
      );

    await AuditLogService.logLogin({
      user: authenticatedUser,

      ipAddress:
        requestContext?.ipAddress ??
        null,

      userAgent:
        requestContext?.userAgent ??
        null,
    });

    return {
      ...tokens,
      user:
        this.sanitizeUser(
          authenticatedUser
        ),
    };
  }

  /**
   * Renova os tokens utilizando um refresh token.
   *
   * A persistência e revogação individual de sessões
   * serão adicionadas quando o model de sessão for
   * implementado. Nesta etapa, o refresh é validado
   * pela assinatura e pelo estado atual do usuário.
   */
  async refresh(refreshToken) {
    if (!refreshToken) {
      throw new ApiError(
        "O refresh token é obrigatório.",
        400
      );
    }

    let payload;

    try {
      payload =
        Jwt.verifyRefreshToken(
          refreshToken
        );
    } catch {
      throw new ApiError(
        "Refresh token inválido ou expirado.",
        401
      );
    }

    if (!payload?.sub) {
      throw new ApiError(
        "Refresh token inválido.",
        401
      );
    }

    const user =
      await userRepository.findById(
        payload.sub
      );

    this.validateUserAccess(user);

    if (user.condominiumId) {
      this.validateCondominiumAccess(
        user.condominium
      );
    }

    return this.generateTokens(user);
  }

  /**
   * Retorna os dados atuais do usuário autenticado.
   */
  async getCurrentUser(userId) {
    if (!userId) {
      throw new ApiError(
        "Usuário não identificado.",
        401
      );
    }

    const user =
      await userRepository.findById(
        userId
      );

    this.validateUserAccess(user);

    if (user.condominiumId) {
      this.validateCondominiumAccess(
        user.condominium
      );
    }

    return this.sanitizeUser(user);
  }

  /**
   * Registra o logout do usuário.
   *
   * Nesta etapa, o access token continua válido até
   * expirar. A revogação imediata será implementada
   * junto ao controle persistente de sessões.
   */
  async logout(
    userId,
    requestContext = null
  ) {
    const user =
      await userRepository.findById(
        userId
      );

    if (!user) {
      throw new ApiError(
        "Usuário não encontrado.",
        404
      );
    }

    await userRepository.registerLogout(
      user.id
    );

    await AuditLogService.logLogout({
      user,

      ipAddress:
        requestContext?.ipAddress ??
        null,

      userAgent:
        requestContext?.userAgent ??
        null,
    });

    return {
      message:
        "Logout realizado com sucesso.",
    };
  }

  /**
   * Permite que o próprio usuário altere a senha.
   */
  async changePassword(
    userId,
    data,
    requestContext = null
  ) {
    const {
      currentPassword,
      newPassword,
      newPasswordConfirmation,
    } = data ?? {};

    if (
      !currentPassword ||
      !newPassword ||
      !newPasswordConfirmation
    ) {
      throw new ApiError(
        "Senha atual, nova senha e confirmação são obrigatórias.",
        400
      );
    }

    if (
      String(newPassword).length < 8
    ) {
      throw new ApiError(
        "A nova senha deve possuir pelo menos 8 caracteres.",
        400
      );
    }

    if (
      newPassword !==
      newPasswordConfirmation
    ) {
      throw new ApiError(
        "A confirmação da nova senha não corresponde.",
        400
      );
    }

    const user =
      await userRepository.findById(
        userId
      );

    if (!user) {
      throw new ApiError(
        "Usuário não encontrado.",
        404
      );
    }

    const currentPasswordMatches =
      await Password.compare(
        currentPassword,
        user.passwordHash
      );

    if (!currentPasswordMatches) {
      throw new ApiError(
        "A senha atual está incorreta.",
        401
      );
    }

    const samePassword =
      await Password.compare(
        newPassword,
        user.passwordHash
      );

    if (samePassword) {
      throw new ApiError(
        "A nova senha deve ser diferente da senha atual.",
        400
      );
    }

    const passwordHash =
      await Password.hash(
        newPassword
      );

    await userRepository.updatePassword(
      user.id,
      passwordHash,
      false
    );

    await AuditLogService.createLog({
      condominiumId:
        user.condominiumId ?? null,

      userId:
        user.id,

      userName:
        user.name,

      userRole:
        user.role,

      action:
        "PASSWORD_CHANGE",

      module:
        "AUTH",

      details:
        "Senha alterada pelo próprio usuário.",

      referenceId:
        user.id,

      ipAddress:
        requestContext?.ipAddress ??
        null,

      userAgent:
        requestContext?.userAgent ??
        null,
    });

    return {
      message:
        "Senha alterada com sucesso.",
    };
  }

  /**
   * Redefine a senha por ação administrativa.
   *
   * Este método já é utilizado pelo UserService.
   */
  async resetPasswordByAdministrator(
    userId,
    newPassword,
    mustChangePassword = true
  ) {
    if (!userId) {
      throw new ApiError(
        "Usuário não identificado.",
        400
      );
    }

    if (
      !newPassword ||
      String(newPassword).length < 8
    ) {
      throw new ApiError(
        "A nova senha deve possuir pelo menos 8 caracteres.",
        400
      );
    }

    const user =
      await userRepository.findById(
        userId
      );

    if (!user) {
      throw new ApiError(
        "Usuário não encontrado.",
        404
      );
    }

    const passwordHash =
      await Password.hash(
        newPassword
      );

    const updatedUser =
      await userRepository.updatePassword(
        user.id,
        passwordHash,
        mustChangePassword
      );

    return this.sanitizeUser(
      updatedUser
    );
  }
}

export default new AuthService();
