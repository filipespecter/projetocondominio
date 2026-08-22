import apartmentRepository from "../repositories/ApartmentRepository.js";
import residentRepository from "../repositories/ResidentRepository.js";
import visitorRepository from "../repositories/VisitorRepository.js";
import packageRepository from "../repositories/PackageRepository.js";
import reservationRepository from "../repositories/ReservationRepository.js";
import noticeRepository from "../repositories/NoticeRepository.js";
import occurrenceRepository from "../repositories/OccurrenceRepository.js";

import { ApiError } from "../utils/ApiError.js";

class AnalyticsService {
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
   * Converte um valor em Date e valida o resultado.
   */
  parseDate(value, fieldName) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new ApiError(
        `${fieldName} inválida.`,
        400
      );
    }

    return date;
  }

  /**
   * Define o intervalo utilizado pelas análises.
   *
   * Quando nenhuma data é enviada, utiliza os
   * últimos 30 dias.
   */
  resolvePeriod(startDate = null, endDate = null) {
    const end = endDate
      ? this.parseDate(endDate, "Data final")
      : new Date();

    const start = startDate
      ? this.parseDate(startDate, "Data inicial")
      : new Date(
          end.getTime() -
            29 * 24 * 60 * 60 * 1000
        );

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (start > end) {
      throw new ApiError(
        "A data inicial não pode ser posterior à data final.",
        400
      );
    }

    return {
      start,
      end,
    };
  }

  /**
   * Confere se uma data pertence ao período.
   */
  isDateWithinPeriod(
    value,
    start,
    end
  ) {
    if (!value) {
      return false;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return false;
    }

    return date >= start && date <= end;
  }

  /**
   * Formata uma data como YYYY-MM-DD.
   *
   * Essa chave será utilizada nos gráficos diários.
   */
  formatDateKey(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  /**
   * Formata uma data como YYYY-MM.
   *
   * Essa chave será utilizada nos gráficos mensais.
   */
  formatMonthKey(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    return `${year}-${month}`;
  }

  /**
   * Gera uma lista com todos os dias do intervalo.
   *
   * Isso garante que dias sem movimentação também
   * apareçam no gráfico com valor zero.
   */
  buildDailyRange(start, end) {
    const range = [];

    const current = new Date(start);

    current.setHours(0, 0, 0, 0);

    while (current <= end) {
      range.push(
        this.formatDateKey(current)
      );

      current.setDate(
        current.getDate() + 1
      );
    }

    return range;
  }

  /**
   * Gera uma lista dos meses do intervalo.
   */
  buildMonthlyRange(start, end) {
    const range = [];

    const current = new Date(
      start.getFullYear(),
      start.getMonth(),
      1
    );

    const finalMonth = new Date(
      end.getFullYear(),
      end.getMonth(),
      1
    );

    while (current <= finalMonth) {
      range.push(
        this.formatMonthKey(current)
      );

      current.setMonth(
        current.getMonth() + 1
      );
    }

    return range;
  }

  /**
   * Conta registros agrupados por uma propriedade.
   */
  groupByField(records, fieldName) {
    return records.reduce(
      (result, record) => {
        const key =
          record[fieldName] ??
          "NOT_INFORMED";

        result[key] =
          (result[key] ?? 0) + 1;

        return result;
      },
      {}
    );
  }

  /**
   * Transforma um objeto agrupado em lista pronta
   * para gráficos de barras ou pizza.
   */
  mapGroupToChart(groupedData) {
    return Object.entries(
      groupedData
    ).map(([name, value]) => ({
      name,
      value,
    }));
  }

  /**
   * Calcula média com duas casas decimais.
   */
  calculateAverage(total, divisor) {
    if (!divisor || divisor <= 0) {
      return 0;
    }

    return Number(
      (total / divisor).toFixed(2)
    );
  }

  /**
   * Retorna uma visão geral dos módulos.
   */
  async getOverview(
    condominiumId,
    filters = {}
  ) {
    this.validateCondominium(
      condominiumId
    );

    const { start, end } =
      this.resolvePeriod(
        filters.startDate,
        filters.endDate
      );

    const [
      apartments,
      residents,
      visitors,
      packages,
      reservations,
      notices,
      occurrences,
    ] = await Promise.all([
      apartmentRepository
        .findByCondominium(
          condominiumId
        ),

      residentRepository
        .findByCondominium(
          condominiumId
        ),

      visitorRepository
        .findByCondominium(
          condominiumId
        ),

      packageRepository
        .findByCondominium(
          condominiumId
        ),

      reservationRepository
        .findByCondominium(
          condominiumId
        ),

      noticeRepository
        .findByCondominium(
          condominiumId
        ),

      occurrenceRepository
        .findByCondominium(
          condominiumId
        ),
    ]);

    const visitorsInPeriod =
      visitors.filter((visitor) =>
        this.isDateWithinPeriod(
          visitor.createdAt,
          start,
          end
        )
      );

    const packagesInPeriod =
      packages.filter((packageRecord) =>
        this.isDateWithinPeriod(
          packageRecord.createdAt,
          start,
          end
        )
      );

    const reservationsInPeriod =
      reservations.filter(
        (reservation) =>
          this.isDateWithinPeriod(
            reservation.createdAt,
            start,
            end
          )
      );

    const noticesInPeriod =
      notices.filter((notice) =>
        this.isDateWithinPeriod(
          notice.createdAt,
          start,
          end
        )
      );

    const occurrencesInPeriod =
      occurrences.filter(
        (occurrence) =>
          this.isDateWithinPeriod(
            occurrence.createdAt,
            start,
            end
          )
      );

    const totalDays =
      Math.floor(
        (end.getTime() -
          start.getTime()) /
          (24 * 60 * 60 * 1000)
      ) + 1;

    const totalMovements =
      visitorsInPeriod.length +
      packagesInPeriod.length +
      reservationsInPeriod.length +
      noticesInPeriod.length +
      occurrencesInPeriod.length;

    return {
      period: {
        startDate: start,
        endDate: end,
        totalDays,
      },

      totals: {
        apartments:
          apartments.length,

        residents:
          residents.length,

        visitors:
          visitorsInPeriod.length,

        packages:
          packagesInPeriod.length,

        reservations:
          reservationsInPeriod.length,

        notices:
          noticesInPeriod.length,

        occurrences:
          occurrencesInPeriod.length,

        movements:
          totalMovements,
      },

      averages: {
        dailyVisitors:
          this.calculateAverage(
            visitorsInPeriod.length,
            totalDays
          ),

        dailyPackages:
          this.calculateAverage(
            packagesInPeriod.length,
            totalDays
          ),

        dailyReservations:
          this.calculateAverage(
            reservationsInPeriod.length,
            totalDays
          ),

        dailyOccurrences:
          this.calculateAverage(
            occurrencesInPeriod.length,
            totalDays
          ),

        dailyMovements:
          this.calculateAverage(
            totalMovements,
            totalDays
          ),
      },
    };
  }

  /**
   * Gera a movimentação diária dos módulos.
   */
  async getDailyMovement(
    condominiumId,
    filters = {}
  ) {
    this.validateCondominium(
      condominiumId
    );

    const { start, end } =
      this.resolvePeriod(
        filters.startDate,
        filters.endDate
      );

    const [
      visitors,
      packages,
      reservations,
      occurrences,
    ] = await Promise.all([
      visitorRepository
        .findByCondominium(
          condominiumId
        ),

      packageRepository
        .findByCondominium(
          condominiumId
        ),

      reservationRepository
        .findByCondominium(
          condominiumId
        ),

      occurrenceRepository
        .findByCondominium(
          condominiumId
        ),
    ]);

    const dailyMap = {};

    this.buildDailyRange(
      start,
      end
    ).forEach((date) => {
      dailyMap[date] = {
        date,
        visitors: 0,
        packages: 0,
        reservations: 0,
        occurrences: 0,
        total: 0,
      };
    });

    const increment = (
      records,
      fieldName,
      dateField = "createdAt"
    ) => {
      records.forEach((record) => {
        if (
          !this.isDateWithinPeriod(
            record[dateField],
            start,
            end
          )
        ) {
          return;
        }

        const dateKey =
          this.formatDateKey(
            record[dateField]
          );

        if (!dailyMap[dateKey]) {
          return;
        }

        dailyMap[dateKey][fieldName] += 1;
        dailyMap[dateKey].total += 1;
      });
    };

    increment(
      visitors,
      "visitors"
    );

    increment(
      packages,
      "packages"
    );

    increment(
      reservations,
      "reservations"
    );

    increment(
      occurrences,
      "occurrences"
    );

    return Object.values(dailyMap);
  }

  /**
   * Gera a movimentação mensal dos módulos.
   */
  async getMonthlyMovement(
    condominiumId,
    filters = {}
  ) {
    this.validateCondominium(
      condominiumId
    );

    const { start, end } =
      this.resolvePeriod(
        filters.startDate,
        filters.endDate
      );

    const [
      visitors,
      packages,
      reservations,
      occurrences,
    ] = await Promise.all([
      visitorRepository
        .findByCondominium(
          condominiumId
        ),

      packageRepository
        .findByCondominium(
          condominiumId
        ),

      reservationRepository
        .findByCondominium(
          condominiumId
        ),

      occurrenceRepository
        .findByCondominium(
          condominiumId
        ),
    ]);

    const monthlyMap = {};

    this.buildMonthlyRange(
      start,
      end
    ).forEach((month) => {
      monthlyMap[month] = {
        month,
        visitors: 0,
        packages: 0,
        reservations: 0,
        occurrences: 0,
        total: 0,
      };
    });

    const increment = (
      records,
      fieldName
    ) => {
      records.forEach((record) => {
        if (
          !this.isDateWithinPeriod(
            record.createdAt,
            start,
            end
          )
        ) {
          return;
        }

        const monthKey =
          this.formatMonthKey(
            record.createdAt
          );

        if (!monthlyMap[monthKey]) {
          return;
        }

        monthlyMap[monthKey][fieldName] += 1;
        monthlyMap[monthKey].total += 1;
      });
    };

    increment(
      visitors,
      "visitors"
    );

    increment(
      packages,
      "packages"
    );

    increment(
      reservations,
      "reservations"
    );

    increment(
      occurrences,
      "occurrences"
    );

    return Object.values(monthlyMap);
  }

  /**
   * Indicadores e gráficos de visitantes.
   */
  async getVisitorAnalytics(
    condominiumId,
    filters = {}
  ) {
    this.validateCondominium(
      condominiumId
    );

    const { start, end } =
      this.resolvePeriod(
        filters.startDate,
        filters.endDate
      );

    const visitors =
      await visitorRepository
        .findByCondominium(
          condominiumId
        );

    const filteredVisitors =
      visitors.filter((visitor) =>
        this.isDateWithinPeriod(
          visitor.createdAt,
          start,
          end
        )
      );

    return {
      total:
        filteredVisitors.length,

      byStatus:
        this.mapGroupToChart(
          this.groupByField(
            filteredVisitors,
            "status"
          )
        ),

      byVisitType:
        this.mapGroupToChart(
          this.groupByField(
            filteredVisitors,
            "visitType"
          )
        ),

      withVehicle:
        filteredVisitors.filter(
          (visitor) =>
            visitor.vehicle ||
            visitor.plate
        ).length,

      entered:
        filteredVisitors.filter(
          (visitor) =>
            visitor.enteredAt
        ).length,

      exited:
        filteredVisitors.filter(
          (visitor) =>
            visitor.exitedAt
        ).length,
    };
  }

  /**
   * Indicadores e gráficos de encomendas.
   */
  async getPackageAnalytics(
    condominiumId,
    filters = {}
  ) {
    this.validateCondominium(
      condominiumId
    );

    const { start, end } =
      this.resolvePeriod(
        filters.startDate,
        filters.endDate
      );

    const packages =
      await packageRepository
        .findByCondominium(
          condominiumId
        );

    const filteredPackages =
      packages.filter(
        (packageRecord) =>
          this.isDateWithinPeriod(
            packageRecord.createdAt,
            start,
            end
          )
      );

    return {
      total:
        filteredPackages.length,

      byStatus:
        this.mapGroupToChart(
          this.groupByField(
            filteredPackages,
            "status"
          )
        ),

      byType:
        this.mapGroupToChart(
          this.groupByField(
            filteredPackages,
            "type"
          )
        ),

      byCarrier:
        this.mapGroupToChart(
          this.groupByField(
            filteredPackages,
            "carrier"
          )
        ),

      received:
        filteredPackages.filter(
          (packageRecord) =>
            packageRecord.status ===
            "RECEIVED"
        ).length,

      delivered:
        filteredPackages.filter(
          (packageRecord) =>
            packageRecord.status ===
            "DELIVERED"
        ).length,

      canceled:
        filteredPackages.filter(
          (packageRecord) =>
            packageRecord.status ===
            "CANCELED"
        ).length,
    };
  }

  /**
   * Indicadores e gráficos de reservas.
   */
  async getReservationAnalytics(
    condominiumId,
    filters = {}
  ) {
    this.validateCondominium(
      condominiumId
    );

    const { start, end } =
      this.resolvePeriod(
        filters.startDate,
        filters.endDate
      );

    const reservations =
      await reservationRepository
        .findByCondominium(
          condominiumId
        );

    const filteredReservations =
      reservations.filter(
        (reservation) =>
          this.isDateWithinPeriod(
            reservation.createdAt,
            start,
            end
          )
      );

    const byCommonArea =
      filteredReservations.reduce(
        (result, reservation) => {
          const areaName =
            reservation.commonArea
              ?.name ??
            "Área não identificada";

          result[areaName] =
            (result[areaName] ?? 0) +
            1;

          return result;
        },
        {}
      );

    const totalGuests =
      filteredReservations.reduce(
        (total, reservation) =>
          total +
          (reservation.guestsCount ??
            0),
        0
      );

    return {
      total:
        filteredReservations.length,

      byStatus:
        this.mapGroupToChart(
          this.groupByField(
            filteredReservations,
            "status"
          )
        ),

      byCommonArea:
        this.mapGroupToChart(
          byCommonArea
        ),

      totalGuests,

      averageGuests:
        this.calculateAverage(
          totalGuests,
          filteredReservations.length
        ),
    };
  }

  /**
   * Indicadores e gráficos de ocorrências.
   */
  async getOccurrenceAnalytics(
    condominiumId,
    filters = {}
  ) {
    this.validateCondominium(
      condominiumId
    );

    const { start, end } =
      this.resolvePeriod(
        filters.startDate,
        filters.endDate
      );

    const occurrences =
      await occurrenceRepository
        .findByCondominium(
          condominiumId
        );

    const filteredOccurrences =
      occurrences.filter(
        (occurrence) =>
          this.isDateWithinPeriod(
            occurrence.createdAt,
            start,
            end
          )
      );

    return {
      total:
        filteredOccurrences.length,

      byStatus:
        this.mapGroupToChart(
          this.groupByField(
            filteredOccurrences,
            "status"
          )
        ),

      byType:
        this.mapGroupToChart(
          this.groupByField(
            filteredOccurrences,
            "type"
          )
        ),

      byOrigin:
        this.mapGroupToChart(
          this.groupByField(
            filteredOccurrences,
            "origin"
          )
        ),

      byPriority:
        this.mapGroupToChart(
          this.groupByField(
            filteredOccurrences,
            "priority"
          )
        ),

      byCategory:
        this.mapGroupToChart(
          this.groupByField(
            filteredOccurrences,
            "category"
          )
        ),

      resolved:
        filteredOccurrences.filter(
          (occurrence) =>
            occurrence.status ===
              "RESOLVED" ||
            occurrence.status ===
              "CLOSED"
        ).length,

      active:
        filteredOccurrences.filter(
          (occurrence) =>
            [
              "NEW",
              "FORWARDED",
              "IN_REVIEW",
              "IN_PROGRESS",
            ].includes(
              occurrence.status
            )
        ).length,
    };
  }

  /**
   * Indicadores dos apartamentos e moradores.
   */
  async getOccupancyAnalytics(
    condominiumId
  ) {
    this.validateCondominium(
      condominiumId
    );

    const [
      apartments,
      residents,
    ] = await Promise.all([
      apartmentRepository
        .findByCondominium(
          condominiumId
        ),

      residentRepository
        .findByCondominium(
          condominiumId
        ),
    ]);

    const occupiedApartments =
      apartments.filter(
        (apartment) =>
          apartment.status ===
          "OCCUPIED"
      ).length;

    const occupancyRate =
      apartments.length > 0
        ? Number(
            (
              (occupiedApartments /
                apartments.length) *
              100
            ).toFixed(2)
          )
        : 0;

    return {
      apartments: {
        total:
          apartments.length,

        byStatus:
          this.mapGroupToChart(
            this.groupByField(
              apartments,
              "status"
            )
          ),

        occupancyRate,
      },

      residents: {
        total:
          residents.length,

        byType:
          this.mapGroupToChart(
            this.groupByField(
              residents,
              "residentType"
            )
          ),

        primary:
          residents.filter(
            (resident) =>
              resident.isPrimary
          ).length,
      },

      averageResidentsPerApartment:
        this.calculateAverage(
          residents.length,
          apartments.length
        ),
    };
  }

  /**
   * Retorna todo o conteúdo do BI em uma chamada.
   *
   * Pode ser utilizado pela tela principal do
   * BI Analytics.
   */
  async getFullAnalytics(
    condominiumId,
    filters = {}
  ) {
    this.validateCondominium(
      condominiumId
    );

    const [
      overview,
      dailyMovement,
      monthlyMovement,
      visitors,
      packages,
      reservations,
      occurrences,
      occupancy,
    ] = await Promise.all([
      this.getOverview(
        condominiumId,
        filters
      ),

      this.getDailyMovement(
        condominiumId,
        filters
      ),

      this.getMonthlyMovement(
        condominiumId,
        filters
      ),

      this.getVisitorAnalytics(
        condominiumId,
        filters
      ),

      this.getPackageAnalytics(
        condominiumId,
        filters
      ),

      this.getReservationAnalytics(
        condominiumId,
        filters
      ),

      this.getOccurrenceAnalytics(
        condominiumId,
        filters
      ),

      this.getOccupancyAnalytics(
        condominiumId
      ),
    ]);

    return {
      overview,
      charts: {
        dailyMovement,
        monthlyMovement,
      },
      modules: {
        visitors,
        packages,
        reservations,
        occurrences,
        occupancy,
      },
    };
  }
}

export default new AnalyticsService();