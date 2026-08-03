import apartmentRepository from "../repositories/ApartmentRepository.js";
import residentRepository from "../repositories/ResidentRepository.js";
import visitorRepository from "../repositories/VisitorRepository.js";
import packageRepository from "../repositories/PackageRepository.js";
import reservationRepository from "../repositories/ReservationRepository.js";
import commonAreaRepository from "../repositories/CommonAreaRepository.js";
import noticeRepository from "../repositories/NoticeRepository.js";
import occurrenceRepository from "../repositories/OccurrenceRepository.js";
import notificationRepository from "../repositories/NotificationRepository.js";

import { ApiError } from "../utils/ApiError.js";

class DashboardService {
  /**
   * Garante que o condomínio foi identificado.
   */
  validateCondominium(condominiumId) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }
  }

  /**
   * Dashboard principal do síndico ou gestor.
   *
   * Reúne indicadores gerais de todos os módulos.
   */
  async getManagerDashboard(condominiumId) {
    this.validateCondominium(condominiumId);

    const [
      apartmentsTotal,
      apartmentsOccupied,
      apartmentsVacant,
      residentsTotal,
      visitorsTotal,
      visitorsWaiting,
      visitorsInside,
      packagesTotal,
      packagesPending,
      reservationsTotal,
      reservationsPending,
      reservationsApproved,
      commonAreasTotal,
      commonAreasActive,
      noticesPublished,
      occurrencesTotal,
      occurrencesActive,
    ] = await Promise.all([
      apartmentRepository.countByCondominium(
        condominiumId
      ),

      apartmentRepository.countByStatus(
        condominiumId,
        "OCCUPIED"
      ),

      apartmentRepository.countByStatus(
        condominiumId,
        "VACANT"
      ),

      residentRepository.countByCondominium(
        condominiumId
      ),

      visitorRepository.countByCondominium(
        condominiumId
      ),

      visitorRepository.countByStatus(
        condominiumId,
        "WAITING"
      ),

      visitorRepository.countByStatus(
        condominiumId,
        "INSIDE"
      ),

      packageRepository.countByCondominium(
        condominiumId
      ),

      packageRepository.countPending(
        condominiumId
      ),

      reservationRepository.countByCondominium(
        condominiumId
      ),

      reservationRepository.countByStatus(
        condominiumId,
        "PENDING"
      ),

      reservationRepository.countByStatus(
        condominiumId,
        "APPROVED"
      ),

      commonAreaRepository.countByCondominium(
        condominiumId
      ),

      commonAreaRepository.countActiveByCondominium(
        condominiumId
      ),

      noticeRepository.countPublished(
        condominiumId
      ),

      occurrenceRepository.countByCondominium(
        condominiumId
      ),

      occurrenceRepository.countActive(
        condominiumId
      ),
    ]);

    return {
      apartments: {
        total: apartmentsTotal,
        occupied: apartmentsOccupied,
        vacant: apartmentsVacant,
      },

      residents: {
        total: residentsTotal,
      },

      visitors: {
        total: visitorsTotal,
        waiting: visitorsWaiting,
        inside: visitorsInside,
      },

      packages: {
        total: packagesTotal,
        pending: packagesPending,
      },

      reservations: {
        total: reservationsTotal,
        pending: reservationsPending,
        approved: reservationsApproved,
      },

      commonAreas: {
        total: commonAreasTotal,
        active: commonAreasActive,
      },

      notices: {
        published: noticesPublished,
      },

      occurrences: {
        total: occurrencesTotal,
        active: occurrencesActive,
      },
    };
  }

  /**
   * Dashboard operacional do porteiro.
   */
  async getDoormanDashboard(condominiumId) {
    this.validateCondominium(condominiumId);

    const [
      visitorsWaiting,
      visitorsAuthorized,
      visitorsInside,
      packagesPending,
      occurrencesNew,
      occurrencesInProgress,
    ] = await Promise.all([
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

      packageRepository.countPending(
        condominiumId
      ),

      occurrenceRepository.countByStatus(
        condominiumId,
        "NEW"
      ),

      occurrenceRepository.countByStatus(
        condominiumId,
        "IN_PROGRESS"
      ),
    ]);

    const [
      recentVisitors,
      recentPackages,
      activeOccurrences,
    ] = await Promise.all([
      visitorRepository.findByCondominium(
        condominiumId
      ),

      packageRepository.findByCondominium(
        condominiumId
      ),

      occurrenceRepository.findActive(
        condominiumId
      ),
    ]);

    return {
      indicators: {
        visitorsWaiting,
        visitorsAuthorized,
        visitorsInside,
        packagesPending,
        occurrencesNew,
        occurrencesInProgress,
      },

      recentVisitors:
        recentVisitors.slice(0, 5),

      recentPackages:
        recentPackages.slice(0, 5),

      activeOccurrences:
        activeOccurrences.slice(0, 5),
    };
  }

  /**
   * Dashboard do morador.
   *
   * O apartmentId e userId devem vir do usuário
   * autenticado, e nunca livremente do frontend.
   */
  async getResidentDashboard({
    condominiumId,
    apartmentId,
    userId,
  }) {
    this.validateCondominium(condominiumId);

    if (!apartmentId) {
      throw new ApiError(
        "Apartamento do morador não identificado.",
        400
      );
    }

    if (!userId) {
      throw new ApiError(
        "Usuário não identificado.",
        400
      );
    }

    const [
      apartment,
      packages,
      reservations,
      visitors,
      publishedNotices,
      unreadNotifications,
    ] = await Promise.all([
      apartmentRepository.findById(
        apartmentId,
        condominiumId
      ),

      packageRepository.findByApartment(
        apartmentId,
        condominiumId
      ),

      reservationRepository.findByRequestedUser(
        userId,
        condominiumId
      ),

      visitorRepository.findByApartment(
        apartmentId,
        condominiumId
      ),

      noticeRepository.findPublished(
        condominiumId
      ),

      notificationRepository.countUnreadByUser(
        userId,
        condominiumId
      ),
    ]);

    if (!apartment) {
      throw new ApiError(
        "Apartamento não encontrado.",
        404
      );
    }

    const pendingPackages =
      packages.filter(
        (packageRecord) =>
          packageRecord.status === "RECEIVED"
      );

    const activeReservations =
      reservations.filter((reservation) =>
        [
          "PENDING",
          "APPROVED",
        ].includes(reservation.status)
      );

    const activeVisitors =
      visitors.filter((visitor) =>
        [
          "WAITING",
          "AUTHORIZED",
          "INSIDE",
        ].includes(visitor.status)
      );

    const apartmentNotices =
      publishedNotices.filter(
        (notice) =>
          !notice.apartmentId ||
          notice.apartmentId === apartmentId
      );

    return {
      apartment,

      indicators: {
        pendingPackages:
          pendingPackages.length,

        activeReservations:
          activeReservations.length,

        activeVisitors:
          activeVisitors.length,

        unreadNotifications,
      },

      recentPackages:
        packages.slice(0, 5),

      recentReservations:
        reservations.slice(0, 5),

      recentVisitors:
        visitors.slice(0, 5),

      recentNotices:
        apartmentNotices.slice(0, 5),
    };
  }

  /**
   * Indicadores compactos para o cabeçalho
   * ou cards globais da interface.
   */
  async getSummary(condominiumId) {
    this.validateCondominium(condominiumId);

    const [
      residents,
      apartments,
      pendingPackages,
      pendingReservations,
      waitingVisitors,
      activeOccurrences,
    ] = await Promise.all([
      residentRepository.countByCondominium(
        condominiumId
      ),

      apartmentRepository.countByCondominium(
        condominiumId
      ),

      packageRepository.countPending(
        condominiumId
      ),

      reservationRepository.countPending(
        condominiumId
      ),

      visitorRepository.countByStatus(
        condominiumId,
        "WAITING"
      ),

      occurrenceRepository.countActive(
        condominiumId
      ),
    ]);

    return {
      residents,
      apartments,
      pendingPackages,
      pendingReservations,
      waitingVisitors,
      activeOccurrences,
    };
  }
}

export default new DashboardService();