import prisma from "../config/prisma.js";

const reason = "Prazo de análise encerrado sem aprovação.";

export function expirePendingReservations(condominiumId, db = prisma) {
  return db.$transaction(async tx => {
    const expired = await tx.$queryRaw`
      UPDATE "Reservation" r SET status='DENIED', "reviewReason"=${reason},
        "reviewedAt"=now(), "updatedAt"=now()
      FROM "Condominium" c
      WHERE c."id"=r."condominiumId" AND c."deletedAt" IS NULL
        AND (${condominiumId ?? null}::uuid IS NULL OR r."condominiumId"=${condominiumId ?? null}::uuid)
        AND r."deletedAt" IS NULL AND r.status='PENDING'
        AND (r."createdAt" <= (now() AT TIME ZONE 'UTC') - interval '24 hours'
          OR CASE WHEN r."startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
            THEN r."reservationDate" + r."startTime"::time <=
              now() AT TIME ZONE COALESCE(
                (SELECT name FROM pg_timezone_names WHERE name=c.timezone),
                'America/Recife')
            ELSE false END)
      RETURNING r."id", r."condominiumId", r."requestedByUserId"
    `;
    if (!expired.length) return 0;
    await tx.auditLog.createMany({ data: expired.map(row => ({
      condominiumId: row.condominiumId, referenceId: row.id,
      action: "UPDATE", module: "RESERVATION", details: reason,
    })) });
    await tx.notification.createMany({ data: expired.map(row => ({
      condominiumId: row.condominiumId, recipientUserId: row.requestedByUserId,
      referenceId: row.id, module: "RESERVATION", type: "RESERVATION_EXPIRED",
      title: "Solicitação de reserva expirada", message: reason,
    })) });
    return expired.length;
  });
}
