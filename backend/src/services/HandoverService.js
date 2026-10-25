import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";
const idSchema = z.string().uuid();
export const handoverSchema = z.object({
  title: z.string().trim().min(3).max(160),
  notes: z.string().trim().min(3).max(4000),
  priority: z.enum(["NORMAL", "HIGH"]).default("NORMAL")
}).strict();
export function handoverActor(user) {
  if (!user?.condominiumId || !["CONDOMINIUM_ADMIN", "MANAGER", "DOORMAN"].includes(user.role)) throw new ApiError("Acesso restrito à operação do condomínio.", 403);
  return user.condominiumId;
}
function handoverOperator(user) {
  const condominiumId = handoverActor(user);
  if (user.role !== "DOORMAN") throw new ApiError("Somente porteiros podem registrar, confirmar ciência ou resolver passagens. A gestão tem acesso de acompanhamento.", 403);
  return condominiumId;
}
const include = {
  resolvedBy: { select: { id: true, name: true } },
  createdBy: {
    select: {
      id: true,
      name: true
    }
  },
  acknowledgements: {
    select: {
      userId: true,
      acknowledgedAt: true,
      user: {
        select: {
          name: true
        }
      }
    }
  }
};
export async function listHandovers(db, user, page = 1) {
  const condominiumId = handoverActor(user);
  return db.shiftHandover.findMany({
    where: {
      condominiumId
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 30,
    skip: (page - 1) * 30,
    include
  });
}
export async function writeHandover(db, user, input) {
  const condominiumId = handoverOperator(user),
    parsed = handoverSchema.safeParse(input);
  if (!parsed.success) throw new ApiError("Informe título, observações e prioridade válidos.", 422);
  return db.$transaction(async tx => {
    const row = await tx.shiftHandover.create({
      data: {
        ...parsed.data,
        condominiumId,
        createdByUserId: user.id
      }
    });
    await tx.auditLog.create({
      data: {
        condominiumId,
        userId: user.id,
        userRole: user.role,
        action: "CREATE",
        module: "SHIFT_HANDOVER",
        referenceId: row.id,
        details: "Pendência registrada na passagem de serviço."
      }
    });
    return row;
  });
}
export async function acknowledgeHandover(db, user, id) {
  const condominiumId = handoverOperator(user);
  if (!idSchema.safeParse(id).success) throw new ApiError("Identificador inválido.", 422);
  return db.$transaction(async tx => {
    const row = await tx.shiftHandover.findFirst({
      where: {
        id,
        condominiumId
      }
    });
    if (!row) throw new ApiError("Passagem de serviço não encontrada.", 404);
    if (row.createdByUserId === user.id) throw new ApiError("A ciência deve ser confirmada por outro operador.", 409);
    const ack = await tx.shiftHandoverAck.upsert({
      where: {
        handoverId_userId: {
          handoverId: id,
          userId: user.id
        }
      },
      create: {
        handoverId: id,
        userId: user.id
      },
      update: {}
    });
    return ack;
  });
}
export async function resolveHandover(db, user, id) {
  const condominiumId = handoverOperator(user);
  if (!idSchema.safeParse(id).success) throw new ApiError("Identificador inválido.", 422);
  return db.$transaction(async tx => {
    const changed = await tx.shiftHandover.updateMany({
      where: {
        id,
        condominiumId,
        resolvedAt: null
      },
      data: {
        resolvedAt: new Date(),
        resolvedByUserId: user.id
      }
    });
    if (changed.count !== 1) throw new ApiError("Pendência não encontrada ou já resolvida.", 409);
    await tx.auditLog.create({
      data: {
        condominiumId,
        userId: user.id,
        userRole: user.role,
        action: "UPDATE",
        module: "SHIFT_HANDOVER",
        referenceId: id,
        details: "Pendência resolvida; ciência dos operadores preservada."
      }
    });
    return {
      resolved: true
    };
  });
}
