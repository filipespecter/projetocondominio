import BaseService from "./BaseService.js";
import AuditLogService from "./AuditLogService.js";
import NotificationService from "./NotificationService.js";
import CommunicationTriggerService from "./CommunicationTriggerService.js";

import visitorRepository from "../repositories/VisitorRepository.js";
import apartmentRepository from "../repositories/ApartmentRepository.js";
import residentRepository from "../repositories/ResidentRepository.js";

import { ApiError } from "../utils/ApiError.js";
import PickupCredential from "../utils/PickupCredential.js";

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
      "EXITED",
      "DENIED",
      "CANCELED",
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

    await CommunicationTriggerService
      .notifyVisitorStatus({
        condominiumId,
        visitorId,
        residents,
        status,
      });

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
        "EXITED",
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
      status: "EXITED",
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
   * Resolve o perfil de morador a partir do usuário autenticado.
   * Nenhum apartmentId recebido do frontend é utilizado como prova de autorização.
   */
  async getAuthenticatedResident(condominiumId, authenticatedUser) {
    if (authenticatedUser?.role !== "RESIDENT") {
      throw new ApiError("Apenas moradores podem criar ou cancelar convites de visitantes.", 403);
    }

    const resident = await residentRepository.findByUserId(
      authenticatedUser.id,
      condominiumId
    );

    if (!resident || resident.user?.status !== "ACTIVE") {
      throw new ApiError("Perfil de morador não encontrado ou inativo.", 403);
    }

    return resident;
  }

  normalizeInvitationDate(value, label) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new ApiError(`${label} inválida.`, 422);
    }
    return date;
  }

  invitationPublicView(visitor, includeCredential = null) {
    const payload = {
      id: visitor.id,
      name: visitor.name,
      document: visitor.document,
      phone: visitor.phone,
      visitType: visitor.visitType,
      notes: visitor.notes,
      status: visitor.invitationStatus,
      validFrom: visitor.invitationValidFrom,
      validUntil: visitor.invitationValidUntil,
      usedAt: visitor.invitationUsedAt,
      canceledAt: visitor.invitationCanceledAt,
      apartment: visitor.apartment
        ? {
            id: visitor.apartment.id,
            block: visitor.apartment.block,
            number: visitor.apartment.number,
          }
        : null,
      responsibleResident: visitor.invitedBy?.user
        ? {
            id: visitor.invitedBy.id,
            name: visitor.invitedBy.user.name,
          }
        : null,
      createdAt: visitor.createdAt,
    };

    if (includeCredential) {
      payload.credential = includeCredential;
    }

    return payload;
  }

  async listMyInvitations(condominiumId, authenticatedUser) {
    const resident = await this.getAuthenticatedResident(
      condominiumId,
      authenticatedUser
    );

    const invitations = await visitorRepository.findInvitationsForResident(
      condominiumId,
      resident.id
    );

    const now = new Date();
    for (const invitation of invitations) {
      if (
        ["WAITING", "AUTHORIZED"].includes(invitation.invitationStatus) &&
        invitation.invitationValidUntil &&
        invitation.invitationValidUntil < now
      ) {
        await visitorRepository.markInvitationExpired(
          invitation.id,
          condominiumId
        );
        invitation.invitationStatus = "EXPIRED";
      }
    }

    return invitations.map((item) => this.invitationPublicView(item));
  }

  /**
   * Cria uma autorização antecipada e devolve o token bruto somente nesta resposta.
   * No PostgreSQL fica apenas o SHA-256 do token.
   */
  async createInvitation(
    condominiumId,
    data,
    authenticatedUser,
    requestContext = null
  ) {
    const resident = await this.getAuthenticatedResident(
      condominiumId,
      authenticatedUser
    );

    const validFrom = this.normalizeInvitationDate(
      data.validFrom,
      "Data/hora inicial"
    );
    const validUntil = this.normalizeInvitationDate(
      data.validUntil,
      "Data/hora final"
    );
    const now = new Date();

    if (validUntil <= validFrom) {
      throw new ApiError("A validade final deve ser posterior ao início.", 422);
    }
    if (validUntil <= now) {
      throw new ApiError("A validade do convite precisa terminar no futuro.", 422);
    }
    if (validUntil.getTime() - validFrom.getTime() > 30 * 24 * 60 * 60 * 1000) {
      throw new ApiError("O convite pode ter validade máxima de 30 dias.", 422);
    }

    const token = PickupCredential.generateToken();
    const tokenHash = PickupCredential.hash(token);

    const visitor = await visitorRepository.createInvitation(
      condominiumId,
      {
        apartmentId: resident.apartmentId,
        name: data.name,
        document: data.document,
        phone: data.phone,
        visitType: data.visitType,
        notes: data.notes,
        registeredByUserId: authenticatedUser.id,
        invitedByResidentId: resident.id,
        invitationTokenHash: tokenHash,
        invitationValidFrom: validFrom,
        invitationValidUntil: validUntil,
      }
    );

    await Promise.allSettled([
      NotificationService.createForActiveRoleUsers(
        condominiumId,
        "DOORMAN",
        {
          title: "Visitante com autorização antecipada",
          message: `${visitor.name} possui autorização de entrada para o apartamento ${visitor.apartment?.block ?? ""} ${visitor.apartment?.number ?? ""}`.trim(),
          type: "VISITOR_INVITATION",
          origin: "RESIDENT",
          module: "VISITOR",
          referenceId: visitor.id,
          priority: "NORMAL",
        }
      ),
      AuditLogService.logCreate({
        condominiumId,
        user: authenticatedUser,
        module: "VISITOR_INVITATION",
        referenceId: visitor.id,
        afterData: {
          visitorName: visitor.name,
          apartmentId: visitor.apartmentId,
          validFrom,
          validUntil,
          status: visitor.invitationStatus,
        },
        details: "Morador criou convite antecipado de visitante por QR.",
        requestContext,
      }),
    ]);

    return this.invitationPublicView(visitor, {
      qrToken: token,
    });
  }

  async cancelMyInvitation(
    id,
    condominiumId,
    authenticatedUser,
    requestContext = null
  ) {
    const resident = await this.getAuthenticatedResident(
      condominiumId,
      authenticatedUser
    );

    const before = await visitorRepository.findInvitationByIdForResident(
      id,
      condominiumId,
      resident.id
    );

    if (!before) {
      throw new ApiError("Convite de visitante não encontrado.", 404);
    }
    if (before.invitationStatus === "USED") {
      throw new ApiError("Um convite já utilizado não pode ser cancelado.", 409);
    }
    if (before.invitationStatus === "CANCELED") {
      throw new ApiError("Este convite já foi cancelado.", 409);
    }
    if (before.invitationStatus === "EXPIRED") {
      throw new ApiError("Este convite já expirou.", 409);
    }

    const visitor = await visitorRepository.cancelInvitation(
      id,
      condominiumId,
      resident.id
    );

    if (!visitor) {
      throw new ApiError("O convite não pôde ser cancelado.", 409);
    }

    await Promise.allSettled([
      NotificationService.createForActiveRoleUsers(
        condominiumId,
        "DOORMAN",
        {
          title: "Autorização de visitante cancelada",
          message: `${visitor.name} não possui mais autorização antecipada de entrada.`,
          type: "VISITOR_INVITATION_CANCELED",
          origin: "RESIDENT",
          module: "VISITOR",
          referenceId: visitor.id,
          priority: "NORMAL",
        }
      ),
      AuditLogService.logUpdate({
        condominiumId,
        user: authenticatedUser,
        module: "VISITOR_INVITATION",
        referenceId: id,
        beforeData: { status: before.invitationStatus },
        afterData: { status: visitor.invitationStatus },
        details: "Morador cancelou convite antecipado de visitante.",
        requestContext,
      }),
    ]);

    return this.invitationPublicView(visitor);
  }

  /**
   * Valida e consome um QR na portaria. O consumo é atômico para impedir reutilização.
   */
  async validateInvitation(
    condominiumId,
    token,
    authenticatedUser,
    requestContext = null
  ) {
    if (!condominiumId || !authenticatedUser?.id) {
      throw new ApiError("Contexto de autenticação inválido.", 401);
    }

    if (![
      "DOORMAN",
      "CONDOMINIUM_ADMIN",
      "MANAGER",
    ].includes(authenticatedUser.role)) {
      throw new ApiError("Você não possui permissão para validar convites.", 403);
    }

    const normalizedToken = String(token ?? "").trim();
    if (!normalizedToken) {
      throw new ApiError("Informe o QR do visitante.", 422);
    }

    const tokenHash = PickupCredential.hash(normalizedToken);
    const invitation = await visitorRepository.findInvitationByTokenHash(
      condominiumId,
      tokenHash
    );

    // Não diferencia QR inexistente de QR pertencente a outro tenant.
    if (!invitation) {
      throw new ApiError("QR de visitante inválido ou não disponível para este condomínio.", 404);
    }

    if (invitation.invitationStatus === "USED" || invitation.invitationUsedAt) {
      throw new ApiError("Este QR já foi utilizado.", 409);
    }
    if (invitation.invitationStatus === "CANCELED" || invitation.invitationCanceledAt) {
      throw new ApiError("Este QR foi cancelado.", 409);
    }
    if (invitation.invitationStatus === "EXPIRED") {
      throw new ApiError("Este QR está expirado.", 410);
    }

    const now = new Date();
    if (!invitation.invitationValidFrom || !invitation.invitationValidUntil) {
      throw new ApiError("Este QR não possui uma janela de validade utilizável.", 409);
    }
    if (now < invitation.invitationValidFrom) {
      throw new ApiError("Este QR ainda não está dentro do período autorizado.", 409);
    }
    if (now > invitation.invitationValidUntil) {
      await visitorRepository.markInvitationExpired(invitation.id, condominiumId);
      throw new ApiError("Este QR está expirado.", 410);
    }

    const consumed = await visitorRepository.consumeInvitation(
      invitation.id,
      condominiumId,
      tokenHash,
      authenticatedUser.id,
      now
    );

    if (!consumed) {
      throw new ApiError("Este QR não pôde ser utilizado. Atualize a tela e tente novamente.", 409);
    }

    const tasks = [
      AuditLogService.logUpdate({
        condominiumId,
        user: authenticatedUser,
        module: "VISITOR_INVITATION",
        referenceId: consumed.id,
        beforeData: { status: invitation.invitationStatus },
        afterData: { status: consumed.invitationStatus, enteredAt: consumed.enteredAt },
        details: "QR de visitante validado e consumido na portaria.",
        requestContext,
      }),
    ];

    if (consumed.invitedBy?.userId) {
      tasks.push(
        NotificationService.createForUser(
          condominiumId,
          consumed.invitedBy.userId,
          {
            title: "Visitante entrou no condomínio",
            message: `${consumed.name} utilizou a autorização antecipada.`,
            type: "VISITOR_ENTRY",
            origin: authenticatedUser.role,
            module: "VISITOR",
            referenceId: consumed.id,
            priority: "NORMAL",
          }
        )
      );
    }

    await Promise.allSettled(tasks);
    return this.invitationPublicView(consumed);
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
      exited,
      denied,
      canceled,
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
        "EXITED"
      ),

      visitorRepository.countByStatus(
        condominiumId,
        "DENIED"
      ),

      visitorRepository.countByStatus(
        condominiumId,
        "CANCELED"
      ),
    ]);

    return {
      total,
      waiting,
      authorized,
      inside,
      exited,
      denied,
      canceled,
    };
  }
}

export default new VisitorService();