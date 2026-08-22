import CommunicationService from "./CommunicationService.js";

import userRepository from "../repositories/UserRepository.js";
import residentRepository from "../repositories/ResidentRepository.js";

/**
 * =====================================================
 * COMMUNICATION TRIGGER SERVICE
 * =====================================================
 *
 * Centraliza os gatilhos automáticos de comunicação
 * dos módulos operacionais.
 *
 * REGRA CRÍTICA:
 *
 * Falha no WhatsApp nunca pode desfazer a operação
 * principal do condomínio.
 *
 * Exemplo:
 *
 * - a encomenda foi recebida;
 * - o banco confirmou a operação;
 * - o WhatsApp ficou indisponível.
 *
 * Nesse cenário a encomenda continua RECEIVED.
 * A comunicação fica registrada como FAILED e poderá
 * ser reenviada pela Central Star.
 */
class CommunicationTriggerService {
  async safeSend(data) {
    try {
      return await CommunicationService
        .queueAndSend({
          ...data,
          channel: "WHATSAPP",
          provider: "META_CLOUD_API",
        });
    } catch (error) {
      /**
       * CommunicationService já registra FAILED quando
       * a tentativa alcança o provider.
       *
       * O erro não é relançado para não quebrar a
       * transação de negócio que originou a mensagem.
       */
      console.error(
        "[COMMUNICATION_TRIGGER]",
        error?.message ??
        error
      );

      return {
        queued: false,
        failed: true,
        error:
          error?.message ??
          "Falha ao processar comunicação.",
      };
    }
  }

  async sendToUser({
    condominiumId,
    userId,
    content,
    templateCode = null,
    module,
    referenceId,
    requestId = null,
    metadata = null,
  }) {
    if (!userId) {
      return {
        queued: false,
        reason:
          "Usuário destinatário não informado.",
      };
    }

    const eventCode =
      templateCode ??
      metadata?.event ??
      null;

    return this.safeSend({
      condominiumId,
      recipientUserId:
        userId,
      content,
      templateCode:
        eventCode,
      module,
      referenceId,
      requestId,
      metadata,
      preventDuplicate:
        true,
    });
  }

  async notifyPackageArrival({
    condominiumId,
    apartment,
    packageRecord,
    residents,
    requestId = null,
  }) {
    const apartmentLabel =
      `${apartment.block} - ${apartment.number}`;

    const content =
      `InfinityCondo: uma encomenda foi recebida para o apartamento ${apartmentLabel}.`;

    const results =
      await Promise.all(
        residents.map(
          (resident) =>
            this.sendToUser({
              condominiumId,
              userId:
                resident.userId,
              content,
              module:
                "PACKAGE",
              referenceId:
                packageRecord.id,
              requestId,
              metadata: {
                event:
                  "PACKAGE_RECEIVED",
                apartmentId:
                  apartment.id,
              },
            })
        )
      );

    return {
      count:
        results.filter(
          (result) =>
            result?.queued
        ).length,
      results,
    };
  }

  async notifyReservationStatus({
    condominiumId,
    userId,
    reservationId,
    status,
    requestId = null,
  }) {
    const labels = {
      APPROVED:
        "aprovada",
      REJECTED:
        "rejeitada",
      CANCELED:
        "cancelada",
      COMPLETED:
        "concluída",
    };

    const label =
      labels[status] ??
      String(status)
        .toLowerCase();

    return this.sendToUser({
      condominiumId,
      userId,
      content:
        `InfinityCondo: sua reserva foi ${label}.`,
      module:
        "RESERVATION",
      referenceId:
        reservationId,
      requestId,
      metadata: {
        event:
          `RESERVATION_${status}`,
        status,
      },
    });
  }

  async notifyVisitorStatus({
    condominiumId,
    visitorId,
    visitorName = null,
    residents,
    status,
    requestId = null,
  }) {
    const labels = {
      WAITING:
        "está aguardando autorização",
      AUTHORIZED:
        "foi autorizado",
      DENIED:
        "teve o acesso negado",
      INSIDE:
        "entrou no condomínio",
      EXITED:
        "saiu do condomínio",
    };

    const visitorLabel =
      visitorName
        ? `O visitante ${visitorName}`
        : "Seu visitante";

    const statusLabel =
      labels[status] ??
      `teve o status alterado para ${status}`;

    const content =
      `InfinityCondo: ${visitorLabel} ${statusLabel}.`;

    const results =
      await Promise.all(
        residents.map(
          (resident) =>
            this.sendToUser({
              condominiumId,
              userId:
                resident.userId,
              content,
              module:
                "VISITOR",
              referenceId:
                visitorId,
              requestId,
              metadata: {
                event:
                  `VISITOR_${status}`,
                status,
              },
            })
        )
      );

    return {
      count:
        results.filter(
          (result) =>
            result?.queued
        ).length,
      results,
    };
  }

  async getNoticeRecipients(
    notice
  ) {
    if (
      notice.audience ===
      "APARTMENT"
    ) {
      if (!notice.apartmentId) {
        return [];
      }

      const residents =
        await residentRepository
          .findByApartment(
            notice.apartmentId,
            notice.condominiumId
          );

      return residents
        .filter(
          (resident) =>
            resident.user &&
            resident.user.status ===
              "ACTIVE"
        )
        .map(
          (resident) =>
            resident.user
        );
    }

    const rolesByAudience = {
      RESIDENTS: [
        "RESIDENT",
      ],
      DOORMEN: [
        "DOORMAN",
      ],
      MANAGERS: [
        "MANAGER",
        "CONDOMINIUM_ADMIN",
      ],
      ALL: [
        "CONDOMINIUM_ADMIN",
        "MANAGER",
        "DOORMAN",
        "RESIDENT",
      ],
    };

    const roles =
      rolesByAudience[
        notice.audience
      ] ??
      [];

    if (roles.length === 0) {
      return [];
    }

    const groups =
      await Promise.all(
        roles.map(
          (role) =>
            userRepository
              .findActiveByRole(
                notice.condominiumId,
                role
              )
        )
      );

    const users =
      groups.flat();

    const uniqueUsers =
      new Map();

    for (
      const user of users
    ) {
      uniqueUsers.set(
        user.id,
        user
      );
    }

    return [
      ...uniqueUsers.values(),
    ];
  }

  async notifyNotice({
    notice,
    requestId = null,
  }) {
    const users =
      await this.getNoticeRecipients(
        notice
      );

    if (
      users.length === 0
    ) {
      return {
        count: 0,
        results: [],
      };
    }

    const content =
      `InfinityCondo - ${notice.title}: ${notice.message}`;

    const results =
      await Promise.all(
        users.map(
          (user) =>
            this.sendToUser({
              condominiumId:
                notice.condominiumId,
              userId:
                user.id,
              content,
              module:
                "NOTICE",
              referenceId:
                notice.id,
              requestId,
              metadata: {
                event:
                  "NOTICE_PUBLISHED",
                audience:
                  notice.audience,
                priority:
                  notice.priority,
              },
            })
        )
      );

    return {
      count:
        results.filter(
          (result) =>
            result?.queued
        ).length,
      results,
    };
  }
}

export default new CommunicationTriggerService();
