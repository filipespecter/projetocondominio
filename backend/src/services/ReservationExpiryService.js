import prisma from "../config/prisma.js";

export function expirePendingReservations(condominiumId,db=prisma){
  return db.$executeRaw`
    UPDATE "Reservation" SET status='DENIED', "reviewReason"='Prazo de análise encerrado sem aprovação.', "reviewedAt"=now(), "updatedAt"=now()
    WHERE (${condominiumId ?? null}::uuid IS NULL OR "condominiumId"=${condominiumId ?? null}::uuid)
      AND "deletedAt" IS NULL AND status='PENDING'
      AND ("createdAt"<=now()-interval '24 hours'
      OR ("reservationDate"+"startTime"::time)<=now() AT TIME ZONE 'America/Sao_Paulo')
  `;
}
