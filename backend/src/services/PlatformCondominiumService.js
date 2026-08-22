import condominiumRepository from "../repositories/CondominiumRepository.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * =====================================================
 * PLATFORM CONDOMINIUM SERVICE
 * =====================================================
 *
 * Regras de consulta administrativa da Central
 * Star Infinity Code.
 *
 * Este Service não duplica o CRUD normal do condomínio.
 * Ele utiliza o mesmo CondominiumRepository e concentra
 * apenas operações específicas do PLATFORM_ADMIN.
 */
class PlatformCondominiumService {
  normalizeStatus(status) {
    if (!status) {
      return null;
    }

    const normalized =
      String(status)
        .trim()
        .toUpperCase();

    const allowed = [
      "PENDING",
      "TRIAL",
      "ACTIVE",
      "SUSPENDED",
      "CANCELED",
      "REJECTED",
    ];

    if (!allowed.includes(normalized)) {
      throw new ApiError(
        "Status de condomínio inválido.",
        400
      );
    }

    return normalized;
  }

  normalizeDate(
    value,
    endOfDay = false
  ) {
    if (!value) {
      return null;
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      throw new ApiError(
        "Data de filtro inválida.",
        400
      );
    }

    if (endOfDay) {
      date.setHours(
        23,
        59,
        59,
        999
      );
    } else {
      date.setHours(
        0,
        0,
        0,
        0
      );
    }

    return date;
  }

  normalizeFilters(query = {}) {
    const page =
      Math.max(
        Number(query.page) || 1,
        1
      );

    const limit =
      Math.min(
        Math.max(
          Number(query.limit) || 20,
          1
        ),
        100
      );

    return {
      search:
        query.search
          ? String(query.search).trim()
          : "",

      status:
        this.normalizeStatus(
          query.status
        ),

      city:
        query.city
          ? String(query.city).trim()
          : null,

      state:
        query.state
          ? String(query.state)
              .trim()
              .toUpperCase()
          : null,

      createdFrom:
        this.normalizeDate(
          query.createdFrom
        ),

      createdTo:
        this.normalizeDate(
          query.createdTo,
          true
        ),

      page,

      limit,

      sortBy:
        query.sortBy
          ? String(query.sortBy).trim()
          : "createdAt",

      sortOrder:
        String(
          query.sortOrder ?? "desc"
        )
          .trim()
          .toLowerCase() === "asc"
          ? "asc"
          : "desc",
    };
  }

  /**
   * Lista condomínios com filtros e paginação.
   */
  async list(query = {}) {
    const filters =
      this.normalizeFilters(
        query
      );

    const [
      items,
      total,
    ] = await Promise.all([
      condominiumRepository
        .findPlatformPage(
          filters
        ),

      condominiumRepository
        .countPlatform(
          filters
        ),
    ]);

    const totalPages =
      Math.max(
        Math.ceil(
          total /
          filters.limit
        ),
        1
      );

    return {
      items,

      pagination: {
        page:
          filters.page,

        limit:
          filters.limit,

        total,

        totalPages,

        hasPreviousPage:
          filters.page > 1,

        hasNextPage:
          filters.page <
          totalPages,
      },

      filters: {
        search:
          filters.search ||
          null,

        status:
          filters.status,

        city:
          filters.city,

        state:
          filters.state,

        createdFrom:
          filters.createdFrom,

        createdTo:
          filters.createdTo,

        sortBy:
          filters.sortBy,

        sortOrder:
          filters.sortOrder,
      },
    };
  }

  /**
   * Atalho para solicitações pendentes.
   */
  async listPending(
    query = {}
  ) {
    return this.list({
      ...query,
      status:
        "PENDING",
    });
  }

  /**
   * Detalhes administrativos completos.
   */
  async findById(id) {
    if (!id) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

    const condominium =
      await condominiumRepository
        .findPlatformDetailsById(
          id
        );

    if (!condominium) {
      throw new ApiError(
        "Condomínio não encontrado.",
        404
      );
    }

    return condominium;
  }

  /**
   * Estatísticas rápidas para a Central.
   */
  async statistics() {
    const [
      total,
      pending,
      trial,
      active,
      suspended,
      canceled,
      rejected,
    ] = await Promise.all([
      condominiumRepository.countAll(),

      condominiumRepository
        .countByStatus(
          "PENDING"
        ),

      condominiumRepository
        .countByStatus(
          "TRIAL"
        ),

      condominiumRepository
        .countByStatus(
          "ACTIVE"
        ),

      condominiumRepository
        .countByStatus(
          "SUSPENDED"
        ),

      condominiumRepository
        .countByStatus(
          "CANCELED"
        ),

      condominiumRepository
        .countByStatus(
          "REJECTED"
        ),
    ]);

    return {
      total,
      pending,
      trial,
      active,
      suspended,
      canceled,
      rejected,
    };
  }
}

export default new PlatformCondominiumService();
