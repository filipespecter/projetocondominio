import BaseService from "./BaseService.js";
import UserService from "./UserService.js";
import AuditLogService from "./AuditLogService.js";

import residentRepository from "../repositories/ResidentRepository.js";
import apartmentRepository from "../repositories/ApartmentRepository.js";

import { ApiError } from "../utils/ApiError.js";

class ResidentService extends BaseService {
  constructor() {
    super(residentRepository);
  }

  /**
   * Tipos de moradores permitidos pelo schema.
   */
  validateResidentType(residentType) {
    const allowedTypes = [
      "OWNER",
      "TENANT",
      "DEPENDENT",
    ];

    if (!allowedTypes.includes(residentType)) {
      throw new ApiError(
        "Tipo de morador inválido.",
        400
      );
    }
  }

  /**
   * Confere se o apartamento existe e pertence
   * ao mesmo condomínio.
   */
  async validateApartment(
    apartmentId,
    condominiumId
  ) {
    if (!apartmentId) {
      throw new ApiError(
        "O apartamento é obrigatório.",
        400
      );
    }

    const apartment =
      await apartmentRepository.findById(
        apartmentId,
        condominiumId
      );

    if (!apartment) {
      throw new ApiError(
        "Apartamento não encontrado.",
        404
      );
    }

    if (apartment.status === "INACTIVE") {
      throw new ApiError(
        "Não é possível vincular um morador a um apartamento inativo.",
        400
      );
    }

    return apartment;
  }

  /**
   * Busca um morador pelo ID.
   */
  async findById(id, condominiumId) {
    const resident =
      await residentRepository.findById(
        id,
        condominiumId
      );

    if (!resident) {
      throw new ApiError(
        "Morador não encontrado.",
        404
      );
    }

    return resident;
  }

  /**
   * Lista todos os moradores do condomínio.
   */
  async findAll(condominiumId) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    return residentRepository.findByCondominium(
      condominiumId
    );
  }

  /**
   * Lista os moradores de um apartamento.
   */
  async findByApartment(
    apartmentId,
    condominiumId
  ) {
    await this.validateApartment(
      apartmentId,
      condominiumId
    );

    return residentRepository.findByApartment(
      apartmentId,
      condominiumId
    );
  }

  /**
   * Busca o perfil de morador associado
   * ao usuário autenticado.
   */
  async findByUserId(
    userId,
    condominiumId
  ) {
    const resident =
      await residentRepository.findByUserId(
        userId,
        condominiumId
      );

    if (!resident) {
      throw new ApiError(
        "Perfil de morador não encontrado.",
        404
      );
    }

    return resident;
  }

  /**
   * Lista moradores por tipo.
   */
  async findByResidentType(
    condominiumId,
    residentType
  ) {
    this.validateResidentType(
      residentType
    );

    return residentRepository.findByResidentType(
      condominiumId,
      residentType
    );
  }

  /**
   * Remove a indicação de morador principal anterior.
   *
   * Um apartamento poderá ter somente um morador
   * marcado como principal.
   */
  async removePreviousPrimary(
    apartmentId,
    condominiumId,
    ignoredResidentId = null
  ) {
    const currentPrimary =
      await residentRepository
        .findPrimaryByApartment(
          apartmentId,
          condominiumId
        );

    if (
      currentPrimary &&
      currentPrimary.id !== ignoredResidentId
    ) {
      await residentRepository
        .removePrimaryStatus(
          currentPrimary.id,
          condominiumId
        );
    }
  }

  /**
   * Cria usuário e perfil de morador.
   *
   * Dados esperados:
   *
   * {
   *   apartmentId,
   *   name,
   *   username,
   *   email,
   *   phone,
   *   password,
   *   residentType,
   *   isPrimary,
   *   canReserve,
   *   canOpenOccurrence,
   *   canViewPackages
   * }
   */
  async create(
    condominiumId,
    data,
    authenticatedUser,
    requestContext = null
  ) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    await this.validateApartment(
      data.apartmentId,
      condominiumId
    );

    const residentType =
      data.residentType ?? "OWNER";

    this.validateResidentType(
      residentType
    );

    if (data.isPrimary) {
      await this.removePreviousPrimary(
        data.apartmentId,
        condominiumId
      );
    }

    let createdUser = null;

    try {
      /*
       * Primeiro criamos o usuário de acesso.
       *
       * Nome, telefone, e-mail, username e senha
       * pertencem ao model User.
       */
      createdUser =
        await UserService.createForCondominium(
          condominiumId,
          {
            name: data.name,
            username: data.username,
            email: data.email,
            phone: data.phone,
            password: data.password,
            role: "RESIDENT",
            status:
              data.status ?? "ACTIVE",
            mustChangePassword:
              data.mustChangePassword ??
              true,
          }
        );

      /*
       * Depois criamos o perfil específico
       * do morador.
       */
      const resident =
        await residentRepository
          .createForCondominium(
            condominiumId,
            {
              apartmentId:
                data.apartmentId,

              userId:
                createdUser.id,

              residentType,

              isPrimary:
                data.isPrimary ??
                false,

              canReserve:
                data.canReserve ??
                true,

              canOpenOccurrence:
                data.canOpenOccurrence ??
                true,

              canViewPackages:
                data.canViewPackages ??
                true,
            }
          );

      await AuditLogService.logCreate({
        condominiumId,
        user: authenticatedUser,
        module: "RESIDENT",
        referenceId: resident.id,
        afterData: resident,
        details:
          "Morador cadastrado e vinculado ao apartamento.",
        requestContext,
      });

      return resident;
    } catch (error) {
      /*
       * Enquanto a transação real do Prisma ainda
       * não estiver implementada, removemos logicamente
       * o usuário caso a criação do perfil falhe.
       *
       * Quando o PostgreSQL for conectado, esta operação
       * deverá ser envolvida em uma transação atômica.
       */
      if (createdUser?.id) {
        try {
          await UserService.remove(
            createdUser.id,
            condominiumId
          );
        } catch {
          /*
           * Não substituímos o erro original caso
           * a limpeza também falhe.
           */
        }
      }

      throw error;
    }
  }

  /**
   * Atualiza os dados do morador e do usuário.
   */
  async update(
    id,
    condominiumId,
    data,
    authenticatedUser,
    requestContext = null
  ) {
    const before =
      await this.findById(
        id,
        condominiumId
      );

    if (
      data.apartmentId !== undefined
    ) {
      await this.validateApartment(
        data.apartmentId,
        condominiumId
      );
    }

    if (
      data.residentType !== undefined
    ) {
      this.validateResidentType(
        data.residentType
      );
    }

    const targetApartmentId =
      data.apartmentId ??
      before.apartmentId;

    if (data.isPrimary === true) {
      await this.removePreviousPrimary(
        targetApartmentId,
        condominiumId,
        id
      );
    }

    /*
     * Atualiza os dados que pertencem ao User.
     */
    const userData = {};

    if (data.name !== undefined) {
      userData.name = data.name;
    }

    if (data.username !== undefined) {
      userData.username =
        data.username;
    }

    if (data.email !== undefined) {
      userData.email = data.email;
    }

    if (data.phone !== undefined) {
      userData.phone = data.phone;
    }

    if (data.status !== undefined) {
      userData.status = data.status;
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

    /*
     * Atualiza os campos específicos do Resident.
     */
    const residentData = {};

    if (
      data.apartmentId !== undefined
    ) {
      residentData.apartmentId =
        data.apartmentId;
    }

    if (
      data.residentType !== undefined
    ) {
      residentData.residentType =
        data.residentType;
    }

    if (data.isPrimary !== undefined) {
      residentData.isPrimary =
        data.isPrimary;
    }

    if (data.canReserve !== undefined) {
      residentData.canReserve =
        data.canReserve;
    }

    if (
      data.canOpenOccurrence !==
      undefined
    ) {
      residentData.canOpenOccurrence =
        data.canOpenOccurrence;
    }

    if (
      data.canViewPackages !== undefined
    ) {
      residentData.canViewPackages =
        data.canViewPackages;
    }

    if (
      Object.keys(residentData).length > 0
    ) {
      await residentRepository.updateById(
        id,
        condominiumId,
        residentData
      );
    }

    const updated =
      await this.findById(
        id,
        condominiumId
      );

    await AuditLogService.logUpdate({
      condominiumId,
      user: authenticatedUser,
      module: "RESIDENT",
      referenceId: id,
      beforeData: before,
      afterData: updated,
      details:
        "Cadastro do morador atualizado.",
      requestContext,
    });

    return updated;
  }

  /**
   * Move o morador para outro apartamento.
   */
  async changeApartment(
    id,
    condominiumId,
    apartmentId,
    authenticatedUser,
    requestContext = null
  ) {
    const before =
      await this.findById(
        id,
        condominiumId
      );

    await this.validateApartment(
      apartmentId,
      condominiumId
    );

    if (before.apartmentId === apartmentId) {
      throw new ApiError(
        "O morador já pertence a este apartamento.",
        400
      );
    }

    if (before.isPrimary) {
      await this.removePreviousPrimary(
        apartmentId,
        condominiumId,
        id
      );
    }

    const updated =
      await residentRepository
        .changeApartment(
          id,
          condominiumId,
          apartmentId
        );

    await AuditLogService.logUpdate({
      condominiumId,
      user: authenticatedUser,
      module: "RESIDENT",
      referenceId: id,
      beforeData: before,
      afterData: updated,
      details:
        "Morador transferido para outro apartamento.",
      requestContext,
    });

    return updated;
  }

  /**
   * Define o morador como principal.
   */
  async markAsPrimary(
    id,
    condominiumId,
    authenticatedUser,
    requestContext = null
  ) {
    const before =
      await this.findById(
        id,
        condominiumId
      );

    await this.removePreviousPrimary(
      before.apartmentId,
      condominiumId,
      id
    );

    const updated =
      await residentRepository
        .markAsPrimary(
          id,
          condominiumId
        );

    await AuditLogService.logUpdate({
      condominiumId,
      user: authenticatedUser,
      module: "RESIDENT",
      referenceId: id,
      beforeData: before,
      afterData: updated,
      details:
        "Morador definido como responsável principal do apartamento.",
      requestContext,
    });

    return updated;
  }

  /**
   * Atualiza permissões específicas.
   */
  async updatePermissions(
    id,
    condominiumId,
    permissions,
    authenticatedUser,
    requestContext = null
  ) {
    const before =
      await this.findById(
        id,
        condominiumId
      );

    const updated =
      await residentRepository
        .updatePermissions(
          id,
          condominiumId,
          permissions
        );

    if (!updated) {
      throw new ApiError(
        "Morador não encontrado.",
        404
      );
    }

    await AuditLogService.logUpdate({
      condominiumId,
      user: authenticatedUser,
      module: "RESIDENT",
      referenceId: id,
      beforeData: before,
      afterData: updated,
      details:
        "Permissões do morador atualizadas.",
      requestContext,
    });

    return updated;
  }

  /**
   * Redefine a senha do morador.
   */
  async resetPassword(
    id,
    condominiumId,
    newPassword,
    authenticatedUser,
    requestContext = null
  ) {
    const resident =
      await this.findById(
        id,
        condominiumId
      );

    const result =
      await UserService.resetPassword(
        resident.userId,
        condominiumId,
        newPassword
      );

    await AuditLogService.createLog({
      condominiumId,
      userId:
        authenticatedUser?.id ?? null,
      userName:
        authenticatedUser?.name ?? null,
      userRole:
        authenticatedUser?.role ?? null,
      action: "RESET_PASSWORD",
      module: "RESIDENT",
      referenceId: id,
      details:
        "Senha do morador redefinida administrativamente.",
      ipAddress:
        requestContext?.ipAddress ?? null,
      userAgent:
        requestContext?.userAgent ?? null,
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
    const before =
      await this.findById(
        id,
        condominiumId
      );

    const deleted =
      await residentRepository.softDelete(
        id,
        condominiumId
      );

    if (!deleted) {
      throw new ApiError(
        "Não foi possível remover o morador.",
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
      module: "RESIDENT",
      referenceId: id,
      beforeData: before,
      details:
        "Morador removido e acesso desativado.",
      requestContext,
    });

    return {
      message:
        "Morador removido com sucesso.",
    };
  }

  /**
   * Estatísticas para dashboard e BI.
   */
  async statistics(condominiumId) {
    return {
      total:
        await residentRepository
          .countByCondominium(
            condominiumId
          ),

      owners:
        await residentRepository
          .countByResidentType(
            condominiumId,
            "OWNER"
          ),

      tenants:
        await residentRepository
          .countByResidentType(
            condominiumId,
            "TENANT"
          ),

      dependents:
        await residentRepository
          .countByResidentType(
            condominiumId,
            "DEPENDENT"
          ),
    };
  }
}

export default new ResidentService();