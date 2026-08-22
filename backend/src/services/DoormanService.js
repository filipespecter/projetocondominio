import BaseService from "./BaseService.js";
import UserService from "./UserService.js";
import AuditLogService from "./AuditLogService.js";

import doormanRepository from "../repositories/DoormanRepository.js";

import { ApiError } from "../utils/ApiError.js";

const ALLOWED_SHIFTS = [
  "MORNING",
  "AFTERNOON",
  "NIGHT",
  "TWELVE_BY_THIRTY_SIX",
  "OTHER",
];

class DoormanService extends BaseService {
  constructor() {
    super(doormanRepository);
  }

  /**
   * Garante que o condomínio foi identificado.
   */
  validateCondominiumId(condominiumId) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }
  }

  /**
   * Garante que o usuário autenticado está disponível
   * para auditoria.
   */
  validateAuthenticatedUser(
    authenticatedUser
  ) {
    if (!authenticatedUser?.id) {
      throw new ApiError(
        "Usuário autenticado não identificado.",
        401
      );
    }
  }

  /**
   * Normaliza e valida o turno.
   */
  validateShift(shift) {
    const normalizedShift =
      String(shift ?? "")
        .trim()
        .toUpperCase();

    if (
      !ALLOWED_SHIFTS.includes(
        normalizedShift
      )
    ) {
      throw new ApiError(
        "Turno de trabalho inválido.",
        400,
        {
          allowedShifts:
            ALLOWED_SHIFTS,
        }
      );
    }

    return normalizedShift;
  }

  /**
   * Normaliza e valida o código interno.
   */
  normalizeCode(code) {
    const normalizedCode =
      String(code ?? "")
        .trim()
        .toUpperCase();

    if (!normalizedCode) {
      throw new ApiError(
        "O código do porteiro é obrigatório.",
        400
      );
    }

    if (
      normalizedCode.length > 50
    ) {
      throw new ApiError(
        "O código do porteiro deve possuir no máximo 50 caracteres.",
        400
      );
    }

    return normalizedCode;
  }

  /**
   * Valida o campo customShift.
   */
  normalizeCustomShift(
    shift,
    customShift
  ) {
    if (shift !== "OTHER") {
      return null;
    }

    const normalizedCustomShift =
      String(customShift ?? "")
        .trim();

    if (!normalizedCustomShift) {
      throw new ApiError(
        "Informe a descrição do turno personalizado.",
        400
      );
    }

    if (
      normalizedCustomShift.length >
      100
    ) {
      throw new ApiError(
        "A descrição do turno deve possuir no máximo 100 caracteres.",
        400
      );
    }

    return normalizedCustomShift;
  }

  /**
   * Busca porteiro pelo ID.
   */
  async findById(id, condominiumId) {
    this.validateCondominiumId(
      condominiumId
    );

    if (!id) {
      throw new ApiError(
        "Porteiro não identificado.",
        400
      );
    }

    const doorman =
      await doormanRepository.findById(
        id,
        condominiumId
      );

    if (!doorman) {
      throw new ApiError(
        "Porteiro não encontrado.",
        404
      );
    }

    return doorman;
  }

  /**
   * Lista todos os porteiros do condomínio.
   */
  async findAll(condominiumId) {
    this.validateCondominiumId(
      condominiumId
    );

    return doormanRepository
      .findByCondominium(
        condominiumId
      );
  }

  /**
   * Busca o perfil de porteiro pelo usuário.
   */
  async findByUserId(
    userId,
    condominiumId
  ) {
    this.validateCondominiumId(
      condominiumId
    );

    if (!userId) {
      throw new ApiError(
        "Usuário não identificado.",
        400
      );
    }

    const doorman =
      await doormanRepository.findByUserId(
        userId,
        condominiumId
      );

    if (!doorman) {
      throw new ApiError(
        "Perfil de porteiro não encontrado.",
        404
      );
    }

    return doorman;
  }

  /**
   * Lista porteiros por turno.
   */
  async findByShift(
    condominiumId,
    shift
  ) {
    this.validateCondominiumId(
      condominiumId
    );

    const normalizedShift =
      this.validateShift(shift);

    return doormanRepository
      .findByShift(
        condominiumId,
        normalizedShift
      );
  }

  /**
   * Cadastra usuário e perfil de porteiro.
   */
  async create(
    condominiumId,
    data,
    authenticatedUser,
    requestContext = null
  ) {
    this.validateCondominiumId(
      condominiumId
    );

    this.validateAuthenticatedUser(
      authenticatedUser
    );

    if (!data?.name) {
      throw new ApiError(
        "O nome do porteiro é obrigatório.",
        400
      );
    }

    if (!data?.username) {
      throw new ApiError(
        "O nome de acesso é obrigatório.",
        400
      );
    }

    if (!data?.password) {
      throw new ApiError(
        "A senha inicial é obrigatória.",
        400
      );
    }

    const code =
      this.normalizeCode(data.code);

    const shift =
      this.validateShift(data.shift);

    const customShift =
      this.normalizeCustomShift(
        shift,
        data.customShift
      );

    const existingCode =
      await doormanRepository.findByCode(
        condominiumId,
        code
      );

    if (existingCode) {
      throw new ApiError(
        "Já existe um porteiro com este código.",
        409
      );
    }

    let createdUser = null;

    try {
      createdUser =
        await UserService
          .createForCondominium(
            condominiumId,
            {
              name:
                String(data.name).trim(),

              username:
                String(data.username)
                  .trim()
                  .toLowerCase(),

              email:
                data.email ?? null,

              phone:
                data.phone ?? null,

              password:
                data.password,

              role:
                "DOORMAN",

              status:
                data.status ??
                "ACTIVE",

              mustChangePassword:
                data.mustChangePassword ??
                true,
            }
          );

      const doorman =
        await doormanRepository
          .createForCondominium(
            condominiumId,
            {
              userId:
                createdUser.id,

              code,

              shift,

              customShift,

              lastDutyAt:
                data.lastDutyAt ??
                null,
            }
          );

      if (!doorman) {
        throw new ApiError(
          "Não foi possível cadastrar o porteiro.",
          500
        );
      }

      await AuditLogService.logCreate({
        condominiumId,
        user: authenticatedUser,
        module: "DOORMAN",
        referenceId: doorman.id,
        afterData: doorman,
        details:
          "Porteiro cadastrado e vinculado ao usuário.",
        requestContext,
      });

      return doorman;
    } catch (error) {
      if (createdUser?.id) {
        try {
          await UserService.remove(
            createdUser.id,
            condominiumId
          );
        } catch {
          // Mantém o erro original.
        }
      }

      throw error;
    }
  }

  /**
   * Atualiza dados do usuário e do perfil de porteiro.
   */
  async update(
    id,
    condominiumId,
    data,
    authenticatedUser,
    requestContext = null
  ) {
    this.validateAuthenticatedUser(
      authenticatedUser
    );

    const before =
      await this.findById(
        id,
        condominiumId
      );

    const userData = {};

    if (data.name !== undefined) {
      userData.name =
        String(data.name).trim();
    }

    if (
      data.username !== undefined
    ) {
      userData.username =
        String(data.username)
          .trim()
          .toLowerCase();
    }

    if (data.email !== undefined) {
      userData.email =
        data.email === ""
          ? null
          : data.email;
    }

    if (data.phone !== undefined) {
      userData.phone =
        data.phone === ""
          ? null
          : data.phone;
    }

    if (data.status !== undefined) {
      userData.status =
        data.status;
    }

    if (
      Object.keys(userData).length > 0
    ) {
      await UserService.update(
        before.userId,
        condominiumId,
        userData
      );
    }

    const doormanData = {};

    if (data.code !== undefined) {
      const code =
        this.normalizeCode(
          data.code
        );

      const existingCode =
        await doormanRepository
          .findByCode(
            condominiumId,
            code
          );

      if (
        existingCode &&
        existingCode.id !== id
      ) {
        throw new ApiError(
          "Já existe outro porteiro com este código.",
          409
        );
      }

      doormanData.code = code;
    }

    const targetShift =
      data.shift !== undefined
        ? this.validateShift(
            data.shift
          )
        : before.shift;

    if (data.shift !== undefined) {
      doormanData.shift =
        targetShift;
    }

    if (
      data.customShift !==
        undefined ||
      data.shift !== undefined
    ) {
      doormanData.customShift =
        this.normalizeCustomShift(
          targetShift,
          data.customShift ??
            before.customShift
        );
    }

    if (
      data.lastDutyAt !== undefined
    ) {
      doormanData.lastDutyAt =
        data.lastDutyAt;
    }

    if (
      Object.keys(doormanData)
        .length > 0
    ) {
      const updatedProfile =
        await doormanRepository
          .updateById(
            id,
            condominiumId,
            doormanData
          );

      if (!updatedProfile) {
        throw new ApiError(
          "Porteiro não encontrado ou não pôde ser atualizado.",
          404
        );
      }
    }

    const updated =
      await this.findById(
        id,
        condominiumId
      );

    await AuditLogService.logUpdate({
      condominiumId,
      user: authenticatedUser,
      module: "DOORMAN",
      referenceId: id,
      beforeData: before,
      afterData: updated,
      details:
        "Cadastro do porteiro atualizado.",
      requestContext,
    });

    return updated;
  }

  /**
   * Altera apenas o turno.
   */
  async changeShift(
    id,
    condominiumId,
    shift,
    customShift,
    authenticatedUser,
    requestContext = null
  ) {
    this.validateAuthenticatedUser(
      authenticatedUser
    );

    const before =
      await this.findById(
        id,
        condominiumId
      );

    const normalizedShift =
      this.validateShift(shift);

    const normalizedCustomShift =
      this.normalizeCustomShift(
        normalizedShift,
        customShift
      );

    const updated =
      await doormanRepository
        .changeShift(
          id,
          condominiumId,
          normalizedShift,
          normalizedCustomShift
        );

    if (!updated) {
      throw new ApiError(
        "Porteiro não encontrado ou não pôde ter o turno alterado.",
        404
      );
    }

    await AuditLogService.logUpdate({
      condominiumId,
      user: authenticatedUser,
      module: "DOORMAN",
      referenceId: id,
      beforeData: before,
      afterData: updated,
      details:
        "Turno do porteiro atualizado.",
      requestContext,
    });

    return updated;
  }

  /**
   * Registra o último plantão ou atuação.
   */
  async registerDuty(
    id,
    condominiumId,
    dutyDate,
    authenticatedUser,
    requestContext = null
  ) {
    this.validateAuthenticatedUser(
      authenticatedUser
    );

    const before =
      await this.findById(
        id,
        condominiumId
      );

    const normalizedDutyDate =
      dutyDate
        ? new Date(dutyDate)
        : new Date();

    if (
      Number.isNaN(
        normalizedDutyDate.getTime()
      )
    ) {
      throw new ApiError(
        "A data do plantão é inválida.",
        400
      );
    }

    const updated =
      await doormanRepository
        .registerLastDuty(
          id,
          condominiumId,
          normalizedDutyDate
        );

    if (!updated) {
      throw new ApiError(
        "Porteiro não encontrado ou não pôde ter o plantão registrado.",
        404
      );
    }

    await AuditLogService.logUpdate({
      condominiumId,
      user: authenticatedUser,
      module: "DOORMAN",
      referenceId: id,
      beforeData: before,
      afterData: updated,
      details:
        "Último plantão do porteiro atualizado.",
      requestContext,
    });

    return updated;
  }

  /**
   * Redefine administrativamente a senha.
   */
  async resetPassword(
    id,
    condominiumId,
    newPassword,
    authenticatedUser,
    requestContext = null
  ) {
    this.validateAuthenticatedUser(
      authenticatedUser
    );

    const doorman =
      await this.findById(
        id,
        condominiumId
      );

    const result =
      await UserService.resetPassword(
        doorman.userId,
        condominiumId,
        newPassword
      );

    await AuditLogService.createLog({
      condominiumId,
      userId:
        authenticatedUser.id,
      userName:
        authenticatedUser.name ??
        null,
      userRole:
        authenticatedUser.role ??
        null,
      action:
        "RESET_PASSWORD",
      module:
        "DOORMAN",
      referenceId:
        id,
      details:
        "Senha do porteiro redefinida administrativamente.",
      ipAddress:
        requestContext?.ipAddress ??
        null,
      userAgent:
        requestContext?.userAgent ??
        null,
    });

    return result;
  }

  /**
   * Remove logicamente o perfil e desativa o usuário.
   */
  async remove(
    id,
    condominiumId,
    authenticatedUser,
    requestContext = null
  ) {
    this.validateAuthenticatedUser(
      authenticatedUser
    );

    const before =
      await this.findById(
        id,
        condominiumId
      );

    const deleted =
      await doormanRepository
        .softDelete(
          id,
          condominiumId
        );

    if (!deleted) {
      throw new ApiError(
        "Não foi possível remover o porteiro.",
        400
      );
    }

    await UserService.deactivate(
      before.userId,
      condominiumId
    );

    await AuditLogService.logDelete({
      condominiumId,
      user: authenticatedUser,
      module: "DOORMAN",
      referenceId: id,
      beforeData: before,
      details:
        "Porteiro removido e acesso desativado.",
      requestContext,
    });

    return {
      message:
        "Porteiro removido com sucesso.",
    };
  }

  /**
   * Estatísticas para dashboard e BI.
   */
  async statistics(condominiumId) {
    this.validateCondominiumId(
      condominiumId
    );

    const [
      total,
      morning,
      afternoon,
      night,
      twelveByThirtySix,
      other,
    ] = await Promise.all([
      doormanRepository
        .countByCondominium(
          condominiumId
        ),

      doormanRepository
        .countByShift(
          condominiumId,
          "MORNING"
        ),

      doormanRepository
        .countByShift(
          condominiumId,
          "AFTERNOON"
        ),

      doormanRepository
        .countByShift(
          condominiumId,
          "NIGHT"
        ),

      doormanRepository
        .countByShift(
          condominiumId,
          "TWELVE_BY_THIRTY_SIX"
        ),

      doormanRepository
        .countByShift(
          condominiumId,
          "OTHER"
        ),
    ]);

    return {
      total,
      morning,
      afternoon,
      night,
      twelveByThirtySix,
      other,
    };
  }
}

export default new DoormanService();
