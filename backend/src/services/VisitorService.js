import BaseService from "./BaseService.js";
import AuditLogService from "./AuditLogService.js";
import NotificationService from "./NotificationService.js";

import visitorRepository from "../repositories/VisitorRepository.js";
import apartmentRepository from "../repositories/ApartmentRepository.js";
import residentRepository from "../repositories/ResidentRepository.js";

import { ApiError } from "../utils/ApiError.js";

class VisitorService extends BaseService {
  constructor() {
    super(visitorRepository);
  }

  /**
   * Status existentes no schema.
   */
  validateStatus(status) {
    const allowedStatuses = [
      "WAITING",
      "AUTHORIZED",
      "INSIDE",
      "LEFT",
      "DENIED",
    ];

    if (!allowedStatuses.includes(status)) {
      throw new ApiError(
        "Status de visitante inválido.",
        400
      );
    }
  }

  /**
   * Normaliza uma data opcional.
   */
  normalizeOptionalDate(value, fieldName) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return null;
    }

    const date =
      value instanceof Date
        ? new Date(value)
        : new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new ApiError(
        `${fieldName} inválida.`,
        400
      );
    }

    return date;
  }

  /**
   * Busca visitante pelo ID.
   */
  async findById(id, condominiumId) {
    const visitor =
      await visitorRepository.findById(
        id,
        condominiumId
      );

    if (!visitor) {
      throw new ApiError(
        "Visitante não encontrado.",
        404
      );
    }

    return visitor;
  }

  /**
   * Lista visitantes do condomínio.
   */
  async findAll(condominiumId) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    return visitorRepository
      .findByCondominium(
        condominiumId
      );
  }

  /**
   * Lista visitantes por status.
   */
  async findByStatus(
    condominiumId,
    status
  ) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    this.validateStatus(status);

    return visitorRepository.findByStatus(
      condominiumId,
      status
    );
  }

  /**
   * Lista visitantes de um apartamento.
   */
  async findByApartment(
    apartmentId,
    condominiumId
  ) {
    await this.validateApartment(
      apartmentId,
      condominiumId
    );

    return visitorRepository
      .findByApartment(
        apartmentId,
        condominiumId
      );
  }

  /**
   * Confere se o apartamento existe, pertence
   * ao condomínio e está disponível para uso.
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
        "Não é possível cadastrar visitante para um apartamento inativo.",
        400
      );
    }

    return apartment;
  }

  /**
   * Retorna os moradores ativos do apartamento
   * que receberão notificações.
   */
  async getApartmentResidents(
    apartmentId,
    condominiumId
  ) {
    const residents =
      await residentRepository.findByApartment(
        apartmentId,
        condominiumId
      );

    return residents.filter(
      (resident) =>
        resident.user &&
        resident.user.status === "ACTIVE"
    );
  }

  /**
   * Envia uma notificação individual para cada
   * morador ativo do apartamento.
   */
  async notifyApartmentResidents({
    apartmentId,
    condominiumId,
    visitorId,
    status,
  }) {
    const residents =
      await this.getApartmentResidents(
        apartmentId,
        condominiumId
      );

    if (residents.length === 0) {
      return {
        count: 0,
      };
    }

    await Promise.all(
      residents.map((resident) =>
        NotificationService
          .notifyVisitorStatus({
            condominiumId,
            recipientUserId:
              resident.userId,
            visitorId,
            status,
          })
      )
    );

    return {
      count: residents.length,
    };
  }

  /**
   * Cadastra um visitante.
   *
   * O status inicial será WAITING, definido
   * pelo próprio schema/repository.
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

    if (!authenticatedUser?.id) {
      throw new ApiError(
        "Usuário autenticado não identificado.",
        401
      );
    }

    if (!data.name) {
      throw new ApiError(
        "O nome do visitante é obrigatório.",
        400
      );
    }

    const apartment =
      await this.validateApartment(
        data.apartmentId,
        condominiumId
      );

    const expectedAt =
      this.normalizeOptionalDate(
        data.expectedAt,
        "Data prevista da visita"
      );

    const visitor =
      await visitorRepository
        .createForCondominium(
          condominiumId,
          {
            apartmentId:
              apartment.id,

            name:
              String(data.name).trim(),

            document:
              data.document
                ? String(
                    data.document
                  ).trim()
                : null,

            phone:
              data.phone
                ? String(
                    data.phone
                  ).trim()
                : null,

            visitType:
              data.visitType
                ? String(
                    data.visitType
                  ).trim()
                : null,

            vehicle:
              data.vehicle
                ? String(
                    data.vehicle
                  ).trim()
                : null,

            plate:
              data.plate
                ? String(data.plate)
                    .trim()
                    .toUpperCase()
                : null,

            notes:
              data.notes ?? null,

            expectedAt,

            registeredByUserId:
              authenticatedUser.id,
          }
        );

    const residents =
      await this.getApartmentResidents(
        apartment.id,
        condominiumId
      );

    await Promise.all(
      residents.map((resident) =>
        NotificationService.createForUser(
          condominiumId,
          resident.userId,
          {
            title:
              "Novo visitante aguardando autorização",

            message:
              `${visitor.name} está aguardando autorização para entrar.`,

            type:
              "VISITOR_REQUEST",

            origin:
              authenticatedUser.role ??
              "DOORMAN",

            module:
              "VISITOR",

            referenceId:
              visitor.id,

            apartmentLabel:
              `${apartment.block} - ${apartment.number}`,

            priority:
              "HIGH",
          }
        )
      )
    );

    await AuditLogService.logCreate({
      condominiumId,
      user: authenticatedUser,
      module: "VISITOR",
      referenceId: visitor.id,
      afterData: visitor,
      details:
        "Visitante cadastrado e encaminhado para autorização.",
      requestContext,
    });

    return visitor;
  }

  /**
   * Atualiza os dados cadastrais do visitante.
   *
   * Visitantes que já entraram, saíram ou tiveram
   * acesso negado não poderão ser editados.
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
      [
        "INSIDE",
        "LEFT",
        "DENIED",
      ].includes(before.status)
    ) {
      throw new ApiError(
        "Este visitante não pode mais ser editado.",
        409
      );
    }

    if (
      data.apartmentId !== undefined
    ) {
      await this.validateApartment(
        data.apartmentId,
        condominiumId
      );
    }

    const updateData = {
      ...data,
    };

    if (data.name !== undefined) {
      if (!data.name) {
        throw new ApiError(
          "O nome do visitante é obrigatório.",
          400
        );
      }

      updateData.name =
        String(data.name).trim();
    }

    if (data.document !== undefined) {
      updateData.document =
        data.document
          ? String(
              data.document
            ).trim()
          : null;
    }

    if (data.phone !== undefined) {
      updateData.phone =
        data.phone
          ? String(data.phone).trim()
          : null;
    }

    if (data.visitType !== undefined) {
      updateData.visitType =
        data.visitType
          ? String(
              data.visitType
            ).trim()
          : null;
    }

    if (data.vehicle !== undefined) {
      updateData.vehicle =
        data.vehicle
          ? String(
              data.vehicle
            ).trim()
          : null;
    }

    if (data.plate !== undefined) {
      updateData.plate =
        data.plate
          ? String(data.plate)
              .trim()
              .toUpperCase()
          : null;
    }

    if (data.expectedAt !== undefined) {
      updateData.expectedAt =
        this.normalizeOptionalDate(
          data.expectedAt,
          "Data prevista da visita"
        );
    }

    delete updateData.status;
    delete updateData.registeredByUserId;
    delete updateData.authorizedByUserId;
    delete updateData.authorizedAt;
    delete updateData.enteredAt;
    delete updateData.exitedAt;
    delete updateData.deniedAt;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.deletedAt;

    const updated =
      await visitorRepository.updateById(
        id,
        condominiumId,
        updateData
      );

    if (!updated) {
      throw new ApiError(
        "Visitante não encontrado.",
        404
      );
    }

    await AuditLogService.logUpdate({
      condominiumId,
      user: authenticatedUser,
      module: "VISITOR",
      referenceId: id,
      beforeData: before,
      afterData: updated,
      details:
        "Dados do visitante atualizados.",
      requestContext,
    });

    return updated;
  }

  /**
   * Autoriza o visitante.
   */
  async authorize(
    id,
    condominiumId,
    authenticatedUser,
    requestContext = null
  ) {
    if (!authenticatedUser?.id) {
      throw new ApiError(
        "Usuário responsável pela autorização não identificado.",
        401
      );
    }

    const before =
      await this.findById(
        id,
        condominiumId
      );

    if (before.status !== "WAITING") {
      throw new ApiError(
        "Somente visitantes aguardando autorização podem ser autorizados.",
        409
      );
    }

    const visitor =
      await visitorRepository.authorize(
        id,
        condominiumId,
        authenticatedUser.id
      );

    if (!visitor) {
      throw new ApiError(
        "Visitante não encontrado.",
        404
      );
    }

    await this.notifyApartmentResidents({
      apartmentId:
        before.apartmentId,
      condominiumId,
      visitorId: id,
      status: "AUTHORIZED",
    });

    await AuditLogService
      .logStatusChange({
        condominiumId,
        user: authenticatedUser,
        module: "VISITOR",
        referenceId: id,
        previousStatus:
          before.status,
        newStatus:
          visitor.status,
        details:
          "Visitante autorizado.",
        requestContext,
      });

    return visitor;
  }

  /**
   * Nega a entrada do visitante.
   */
  async deny(
    id,
    condominiumId,
    authenticatedUser,
    requestContext = null
  ) {
    if (!authenticatedUser?.id) {
      throw new ApiError(
        "Usuário responsável pela decisão não identificado.",
        401
      );
    }

    const before =
      await this.findById(
        id,
        condominiumId
      );

    if (before.status !== "WAITING") {
      throw new ApiError(
        "Somente visitantes aguardando autorização podem ter o acesso negado.",
        409
      );
    }

    const visitor =
      await visitorRepository.deny(
        id,
        condominiumId,
        authenticatedUser.id
      );

    if (!visitor) {
      throw new ApiError(
        "Visitante não encontrado.",
        404
      );
    }

    await this.notifyApartmentResidents({
      apartmentId:
        before.apartmentId,
      condominiumId,
      visitorId: id,
      status: "DENIED",
    });

    await AuditLogService
      .logStatusChange({
        condominiumId,
        user: authenticatedUser,
        module: "VISITOR",
        referenceId: id,
        previousStatus:
          before.status,
        newStatus:
          visitor.status,
        details:
          "Entrada do visitante negada.",
        requestContext,
      });

    return visitor;
  }

  /**
   * Registra a entrada do visitante.
   */
  async registerEntry(
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

    if (before.status !== "AUTHORIZED") {
      throw new ApiError(
        "Somente visitantes autorizados podem registrar entrada.",
        409
      );
    }

    const visitor =
      await visitorRepository
        .registerEntry(
          id,
          condominiumId
        );

    if (!visitor) {
      throw new ApiError(
        "Visitante não encontrado.",
        404
      );
    }

    await this.notifyApartmentResidents({
      apartmentId:
        before.apartmentId,
      condominiumId,
      visitorId: id,
      status: "INSIDE",
    });

    await AuditLogService
      .logStatusChange({
        condominiumId,
        user: authenticatedUser,
        module: "VISITOR",
        referenceId: id,
        previousStatus:
          before.status,
        newStatus:
          visitor.status,
        details:
          "Entrada do visitante registrada.",
        requestContext,
      });

    return visitor;
  }

  /**
   * Registra a saída do visitante.
   */
  async registerExit(
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

    if (before.status !== "INSIDE") {
      throw new ApiError(
        "Somente visitantes que estão dentro do condomínio podem registrar saída.",
        409
      );
    }

    const visitor =
      await visitorRepository
        .registerExit(
          id,
          condominiumId
        );

    if (!visitor) {
      throw new ApiError(
        "Visitante não encontrado.",
        404
      );
    }

    await this.notifyApartmentResidents({
      apartmentId:
        before.apartmentId,
      condominiumId,
      visitorId: id,
      status: "LEFT",
    });

    await AuditLogService
      .logStatusChange({
        condominiumId,
        user: authenticatedUser,
        module: "VISITOR",
        referenceId: id,
        previousStatus:
          before.status,
        newStatus:
          visitor.status,
        details:
          "Saída do visitante registrada.",
        requestContext,
      });

    return visitor;
  }

  /**
   * Exclusão lógica.
   *
   * Visitantes atualmente dentro do condomínio
   * não podem ser removidos.
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

    if (before.status === "INSIDE") {
      throw new ApiError(
        "Não é possível remover um visitante que ainda está dentro do condomínio.",
        409
      );
    }

    const deleted =
      await visitorRepository.softDelete(
        id,
        condominiumId
      );

    if (!deleted) {
      throw new ApiError(
        "Não foi possível remover o visitante.",
        400
      );
    }

    await AuditLogService.logDelete({
      condominiumId,
      user: authenticatedUser,
      module: "VISITOR",
      referenceId: id,
      beforeData: before,
      details:
        "Visitante removido logicamente.",
      requestContext,
    });

    return {
      message:
        "Visitante removido com sucesso.",
    };
  }

  /**
   * Estatísticas para dashboard e BI.
   */
  async statistics(condominiumId) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    const [
      total,
      waiting,
      authorized,
      inside,
      left,
      denied,
    ] = await Promise.all([
      visitorRepository
        .countByCondominium(
          condominiumId
        ),

      visitorRepository.countByStatus(
        condominiumId,
        "WAITING"
      ),

      visitorRepository.countByStatus(
        condominiumId,
        "AUTHORIZED"
      ),

      visitorRepository.countByStatus(
        condominiumId,
        "INSIDE"
      ),

      visitorRepository.countByStatus(
        condominiumId,
        "LEFT"
      ),

      visitorRepository.countByStatus(
        condominiumId,
        "DENIED"
      ),
    ]);

    return {
      total,
      waiting,
      authorized,
      inside,
      left,
      denied,
    };
  }
}

export default new VisitorService();