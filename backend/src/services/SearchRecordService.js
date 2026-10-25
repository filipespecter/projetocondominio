import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";
export async function searchRecord(db, user, type, id) {
  if (!user?.condominiumId || !["CONDOMINIUM_ADMIN", "MANAGER", "DOORMAN", "RESIDENT"].includes(user.role)) throw new ApiError("Acesso negado.", 403);
  if (!z.string().uuid().safeParse(id).success) throw new ApiError("Registro inválido.", 422);
  if(type === "Passagem de serviço"){
    if(!["CONDOMINIUM_ADMIN","MANAGER"].includes(user.role)) throw new ApiError("Acesso negado.",403);
    const row=await db.shiftHandover.findFirst({where:{id,condominiumId:user.condominiumId},select:{id:true,title:true,notes:true,priority:true,createdAt:true,resolvedAt:true}});
    if(!row) throw new ApiError("Registro não encontrado.",404);
    return row;
  }
  const models = {
      Apartamento: "apartment",
      Morador: "resident",
      Encomenda: "package",
      Visitante: "visitor",
      Reserva: "reservation",
      "Ocorrência": "occurrence"
    },
    model = models[type];
  if (!model) throw new ApiError("Tipo inválido.", 422);
  const common = {
      condominiumId: user.condominiumId,
      deletedAt: null
    },
    where = {
      ...common,
      id
    };
  if (user.role === "RESIDENT") {
    if (!["package", "reservation"].includes(model)) throw new ApiError("Acesso negado.", 403);
    const resident = await db.resident.findFirst({
      where: {
        ...common,
        userId: user.id
      },
      select: {
        apartmentId: true,
        canViewPackages: true
      }
    });
    if (!resident || model === "package" && !resident.canViewPackages) throw new ApiError("Acesso negado.", 403);
    where.apartmentId = resident.apartmentId;
    if (model === "reservation") where.requestedByUserId = user.id;
  }
  if (user.role === "DOORMAN" && model === "reservation") throw new ApiError("Acesso negado.", 403);
  if (user.role === "DOORMAN" && model === "occurrence") where.OR = [{
    createdByUserId: user.id
  }, {
    assignedToUserId: user.id
  }];
  const selects = {
    apartment: {
      id: true,
      number: true,
      block: true,
      floor: true
    },
    resident: {
      id: true,
      apartmentId: true,
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
    package: {
      id: true,
      description: true,
      trackingCode: true,
      status: true,
      receivedAt: true,
      deliveredAt: true,
      apartment: {
        select: {
          block: true,
          number: true
        }
      }
    },
    visitor: {
      id: true,
      name: true,
      status: true,
      enteredAt: true,
      exitedAt: true,
      apartment: {
        select: {
          block: true,
          number: true
        }
      }
    },
    reservation: {
      id: true,
      status: true,
      reservationDate: true,
      startTime: true,
      endTime: true,
      purpose: true,
      reviewReason: true,
      commonArea: {
        select: {
          name: true
        }
      }
    },
    occurrence: {
      id: true,
      title: true,
      description: true,
      category: true,
      status: true,
      createdAt: true,
      resolvedAt: true,
      resolution: true
    }
  };
  const row = await db[model].findFirst({
    where,
    select: selects[model]
  });
  if (!row) throw new ApiError("Registro não encontrado ou sem permissão.", 404);
  let linked = null;
  if (model === "apartment" || model === "resident") {
    const apartmentId = model === "apartment" ? row.id : row.apartmentId;
    const [packages, visitors, reservations] = await Promise.all([db.package.findMany({
      where: {
        ...common,
        apartmentId
      },
      select: {
        id: true,
        description: true,
        status: true
      },
      orderBy: {
        receivedAt: "desc"
      },
      take: 10
    }), db.visitor.findMany({
      where: {
        ...common,
        apartmentId
      },
      select: {
        id: true,
        name: true,
        status: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10
    }), user.role === "DOORMAN" ? [] : db.reservation.findMany({
      where: {
        ...common,
        apartmentId
      },
      select: {
        id: true,
        status: true,
        reservationDate: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10
    })]);
    linked = {
      packages,
      visitors,
      reservations
    };
  }
  return {
    type,
    record: row,
    linked
  };
}
