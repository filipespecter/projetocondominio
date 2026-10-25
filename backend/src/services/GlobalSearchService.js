import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";
export async function globalSearch(db, user, query) {
  const condominiumId = user?.condominiumId;
  if (!condominiumId || !["CONDOMINIUM_ADMIN", "MANAGER", "DOORMAN", "RESIDENT"].includes(user.role)) throw new ApiError("Busca indisponível para este perfil.", 403);
  const parsed = z.string().trim().min(2).max(80).safeParse(query);
  if (!parsed.success) throw new ApiError("Digite de 2 a 80 caracteres.", 422);
  const contains = {
    contains: parsed.data,
    mode: "insensitive"
  };
  if (user.role === "RESIDENT") {
    const resident = await db.resident.findFirst({
      where: {
        userId: user.id,
        condominiumId,
        deletedAt: null
      },
      select: {
        apartmentId: true,
        canViewPackages: true
      }
    });
    if (!resident) throw new ApiError("Apartamento não identificado.", 403);
    const apartmentId = resident.apartmentId;
    const common = {
      condominiumId,
      apartmentId,
      deletedAt: null
    };
    const [packages, reservations] = await Promise.all([resident.canViewPackages ? db.package.findMany({
      where: {
        ...common,
        OR: [{
          description: contains
        }, {
          trackingCode: contains
        }, {
          apartment: {
            OR: [{
              number: contains
            }, {
              block: contains
            }]
          }
        }]
      },
      select: {
        id: true,
        description: true,
        status: true
      },
      take: 5
    }) : [], db.reservation.findMany({
      where: {
        ...common,
        requestedByUserId: user.id,
        OR: [{
          purpose: contains
        }, {
          commonArea: {
            name: contains
          }
        }, {
          apartment: {
            OR: [{
              number: contains
            }, {
              block: contains
            }]
          }
        }]
      },
      select: {
        id: true,
        status: true,
        commonArea: {
          select: {
            name: true
          }
        }
      },
      take: 5
    })]);
    return [...packages.map(x => ({
      id: x.id,
      type: "Encomenda",
      title: x.description || "Encomenda",
      subtitle: x.status,
      to: "/dashboard/morador/encomendas"
    })), ...reservations.map(x => ({
      id: x.id,
      type: "Reserva",
      title: x.commonArea.name,
      subtitle: x.status,
      to: "/dashboard/morador/reservas"
    }))];
  }
  const root = user.role === "DOORMAN" ? "/dashboard/porteiro" : "/dashboard";
  const apartmentMatch = {
    OR: [{
      number: contains
    }, {
      block: contains
    }]
  };
  const common = {
    condominiumId,
    deletedAt: null
  };
  const [apartments, packages, visitors, reservations, residents, occurrences] = await Promise.all([db.apartment.findMany({
    where: {
      ...common,
      ...apartmentMatch
    },
    select: {
      id: true,
      block: true,
      number: true
    },
    take: 5
  }), db.package.findMany({
    where: {
      ...common,
      OR: [{
        description: contains
      }, {
        trackingCode: contains
      }, {
        apartment: apartmentMatch
      }]
    },
    select: {
      id: true,
      description: true,
      status: true,
      apartment: {
        select: {
          block: true,
          number: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 5
  }), db.visitor.findMany({
    where: {
      ...common,
      OR: [{
        name: contains
      }, {
        apartment: apartmentMatch
      }]
    },
    select: {
      id: true,
      name: true,
      status: true,
      apartment: {
        select: {
          block: true,
          number: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 5
  }), user.role === "DOORMAN" ? [] : db.reservation.findMany({
    where: {
      ...common,
      apartment: apartmentMatch
    },
    select: {
      id: true,
      status: true,
      apartment: {
        select: {
          block: true,
          number: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 5
  }), db.resident.findMany({
    where: {
      ...common,
      user: {
        deletedAt: null,
        status: "ACTIVE"
      },
      OR: [{
        user: {
          name: contains
        }
      }, {
        apartment: apartmentMatch
      }]
    },
    select: {
      id: true,
      user: {
        select: {
          name: true
        }
      },
      apartment: {
        select: {
          block: true,
          number: true
        }
      }
    },
    take: 5
  }), db.occurrence.findMany({
    where: {
      ...common,
      ...(user.role === "DOORMAN" ? {
        OR: [{
          createdByUserId: user.id
        }, {
          assignedToUserId: user.id
        }]
      } : {}),
      AND: [{
        OR: [{
          title: contains
        }, {
          category: contains
        }, {
          apartment: apartmentMatch
        }]
      }]
    },
    select: {
      id: true,
      title: true,
      status: true
    },
    take: 5
  })]);
  const label = a => `${a?.block || ""} / ${a?.number || ""}`;
  return [...residents.map(x => ({
    id: x.id,
    type: "Morador",
    title: x.user.name,
    subtitle: label(x.apartment),
    to: `${root}/moradores`
  })), ...occurrences.map(x => ({
    id: x.id,
    type: "Ocorrência",
    title: x.title,
    subtitle: x.status,
    to: user.role === "DOORMAN" ? `${root}/ocorrencias` : `${root}/ocorrencias`
  })), ...apartments.map(x => ({
    id: x.id,
    type: "Apartamento",
    title: label(x),
    subtitle: "Apartamento",
    to: user.role === "DOORMAN" ? `${root}/moradores` : `${root}/apartamentos`
  })), ...packages.map(x => ({
    id: x.id,
    type: "Encomenda",
    title: x.description || "Encomenda",
    subtitle: `${label(x.apartment)} · ${x.status}`,
    to: `${root}/encomendas`
  })), ...visitors.map(x => ({
    id: x.id,
    type: "Visitante",
    title: x.name,
    subtitle: label(x.apartment),
    to: `${root}/visitantes`
  })), ...reservations.map(x => ({
    id: x.id,
    type: "Reserva",
    title: label(x.apartment),
    subtitle: x.status,
    to: `${root}/reservas`
  }))].slice(0, 30);
}
