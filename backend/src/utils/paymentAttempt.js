import {ApiError} from "./ApiError.js";
// Persist the reservation before calling the gateway. A timeout/crash must not enable another charge.
export async function reservePaymentAttempt(db, charge, key) {
  await db.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "Charge" WHERE "id" = CAST(${charge.id} AS uuid) FOR UPDATE`;
    const current=await tx.charge.findUnique({where:{id:charge.id}});
    if (!current || !["PENDING","OVERDUE","FAILED"].includes(current.status) || current.metadata?.gatewayAttemptPending || current.providerChargeId !== charge.providerChargeId) {
      throw new ApiError("A cobrança está em processamento ou precisa de conferência. Consulte o pagamento antes de tentar novamente.",409);
    }
    await tx.charge.update({where:{id:charge.id},data:{metadata:{...(current.metadata ?? {}),gatewayAttemptPending:true,gatewayAttemptKey:key,gatewayAttemptPriorPaymentId:current.providerChargeId ?? null}}});
  });
}
export async function releaseRejectedAttempt(db, chargeId, key) {
  await db.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "Charge" WHERE "id" = CAST(${chargeId} AS uuid) FOR UPDATE`;
    const current=await tx.charge.findUnique({where:{id:chargeId}});
    if (current?.metadata?.gatewayAttemptKey !== key) return;
    await tx.charge.update({where:{id:chargeId},data:{metadata:{...current.metadata,gatewayAttemptPending:false,gatewayAttemptSequence:(Number(current.metadata.gatewayAttemptSequence)||0)+1}}});
  });
}
