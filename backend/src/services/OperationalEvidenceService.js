import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";
const idSchema = z.string().uuid();
export const maintenanceSchema = z.object({
  description: z.string().trim().min(3).max(2000),
  scheduledAt: z.string().datetime({
    offset: true
  }),
  completedAt: z.string().datetime({
    offset: true
  }).nullable().optional(),
  costInCents: z.number().int().min(0).max(2147483647).nullable().optional()
}).strict().refine(x => !x.completedAt || new Date(x.completedAt) >= new Date(x.scheduledAt), {
  message: "Conclusão não pode ser anterior à data agendada."
}).refine(x => !x.completedAt || new Date(x.completedAt) <= new Date(), {
  message: "Conclusão não pode ser futura."
});
export const assemblySchema = z.object({
  apartmentId: idSchema,
  present: z.boolean(),
  topic: z.string().trim().min(2).max(160),
  vote: z.enum(["YES", "NO", "ABSTAIN"]).nullable().optional(),
  evidence: z.string().trim().min(3).max(1000),
  voteFinalized: z.boolean().default(false),
  eligibleUnits: z.number().int().min(1).max(100000).nullable().optional()
}).strict().refine(x => x.present || !x.vote, {
  message: "Voto exige presença registrada."
});
export function evidenceActor(user) {
  if (!user?.condominiumId || !["CONDOMINIUM_ADMIN", "MANAGER"].includes(user.role)) throw new ApiError("Registro restrito à gestão do condomínio.", 403);
  return user.condominiumId;
}
const parse = (schema, value) => {
  const p = schema.safeParse(value);
  if (!p.success) throw new ApiError(p.error.issues[0].message, 422);
  return p.data;
};
export async function evidence(db, user, kind, id, body = null) {
  const condominiumId = evidenceActor(user);
  parse(idSchema, id);
  const maintenance = kind === "maintenance";
  if (!maintenance && kind !== "assembly") throw new ApiError("Registro inválido.", 422);
  return db.$transaction(async tx => {
    const parent = await tx[maintenance ? "asset" : "notice"].findFirst({
      where: {
        id,
        condominiumId,
        deletedAt: null,
        ...(!maintenance && {
          type: "ASSEMBLY"
        })
      }
    });
    if (!parent) throw new ApiError("Registro não encontrado neste condomínio.", 404);
    const model = tx[maintenance ? "assetMaintenance" : "assemblyRecord"],
      foreign = maintenance ? {
        assetId: id
      } : {
        noticeId: id
      };
    if (body === null) return model.findMany({
      where: {
        condominiumId,
        ...foreign
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 500
    });
    const data = parse(maintenance ? maintenanceSchema : assemblySchema, body);
    if (!maintenance) {
      const apt = await tx.apartment.findFirst({
        where: {
          id: data.apartmentId,
          condominiumId,
          deletedAt: null
        }
      });
      if (!apt) throw new ApiError("Apartamento não encontrado neste condomínio.", 404);
      const existing = await model.findFirst({
        where: {
          noticeId: id,
          apartmentId: data.apartmentId,
          topic: data.topic,
          condominiumId
        }
      });
      if (existing) throw new ApiError("Participação desta unidade/pauta já registrada. Correções devem ser registradas pela gestão com suporte, preservando a evidência.", 409);
    }
    if (maintenance) {
      data.scheduledAt = new Date(data.scheduledAt);
      if (data.completedAt) data.completedAt = new Date(data.completedAt);
    }
    const row = await model.create({
      data: {
        ...data,
        ...foreign,
        condominiumId,
        recordedByUserId: user.id
      }
    });
    await tx.auditLog.create({
      data: {
        condominiumId,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        module: maintenance ? "ASSET_MAINTENANCE" : "ASSEMBLY_RECORD",
        action: "CREATE",
        referenceId: row.id,
        details: maintenance ? "Manutenção documentada." : "Participação/voto documentado pela gestão (não votação eletrônica)."
      }
    });
    return row;
  });
}
export async function completeMaintenance(db, user, id, body) {
  const condominiumId = evidenceActor(user);
  parse(idSchema, id);
  const data = parse(z.object({
    completedAt: z.string().datetime({
      offset: true
    }),
    costInCents: z.number().int().min(0).max(2147483647).nullable().optional()
  }).strict(), body);
  return db.$transaction(async tx => {
    const old = await tx.assetMaintenance.findFirst({
      where: {
        id,
        condominiumId,
        asset: {
          condominiumId,
          deletedAt: null
        }
      }
    });
    if (!old) throw new ApiError("Manutenção não encontrada.", 404);
    if (old.completedAt) throw new ApiError("Manutenção já concluída.", 409);
    if (new Date(data.completedAt) < old.scheduledAt || new Date(data.completedAt) > new Date()) throw new ApiError("Data de conclusão inválida.", 422);
    const changed = await tx.assetMaintenance.updateMany({
      where: {
        id,
        condominiumId,
        completedAt: null
      },
      data: {
        ...data,
        completedAt: new Date(data.completedAt)
      }
    });
    if (changed.count !== 1) throw new ApiError("Registro já alterado. Atualize a tela.", 409);
    await tx.auditLog.create({
      data: {
        condominiumId,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        module: "ASSET_MAINTENANCE",
        action: "COMPLETE",
        referenceId: id,
        details: "Conclusão de manutenção registrada."
      }
    });
    return {
      id,
      completed: true
    };
  });
}
