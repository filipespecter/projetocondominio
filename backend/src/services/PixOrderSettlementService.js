import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { assertPaymentMatches } from "../utils/paymentConsistency.js";

const PIX_STATES = { approved: "APPROVED", pending: "PENDING", cancelled: "CANCELED", refunded: "REFUNDED", rejected: "REJECTED" };
const terminal = ["PAID", "CANCELED", "REFUNDED"];

// Both the issuance response and the signed webhook can arrive first.
export async function persistPixOrder({ id, payment, paymentMethodId, attemptKey, user, requestId }, db = prisma) {
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "Charge" WHERE "id" = CAST(${id} AS uuid) FOR UPDATE`;
    const charge = await tx.charge.findUnique({ where: { id } });
    if (!charge) return { ignored: true };
    const metadata = charge.metadata ?? {};
    if (metadata.retiredPixOrderId === payment.providerPaymentId) return { ignored: true };
    const kind=payment.kind??"PIX_ORDERS";
    const knownKind=metadata.gatewayAttemptKind??"PIX_ORDERS";
    const knownOrder = knownKind===kind && charge.provider === "MERCADO_PAGO" && charge.providerChargeId === payment.providerPaymentId;
    const reserved = metadata.gatewayAttemptPending && metadata.gatewayAttemptKind === kind &&
      (charge.providerChargeId ?? null) === (metadata.gatewayAttemptPriorPaymentId ?? null) &&
      (!attemptKey || metadata.gatewayAttemptKey === attemptKey);
    // A notification about the previous order must not clear a replacement reservation.
    if ((metadata.gatewayAttemptPending && knownOrder && !attemptKey) || (!knownOrder && !reserved)) {
      if (attemptKey) throw new ApiError("A tentativa de Pix não corresponde à cobrança atual.", 409);
      return { ignored: true };
    }

    assertPaymentMatches(charge, payment);
    if (terminal.includes(charge.status) && !(charge.status === "PAID" && payment.status === "refunded")) {
      return { charge, providerPayment: payment, ignored: true };
    }
    const previous = await tx.paymentTransaction.findFirst({
      where: { chargeId: id, provider: payment.provider, providerPaymentId: payment.providerPaymentId },
    });
    const status = PIX_STATES[payment.status];
    if (previous?.status === status && knownOrder && !reserved && !(payment.pixCopyPaste && !charge.pixCopyPaste) && !(payment.boletoBarcode && !charge.boletoBarcode) && !(payment.paymentUrl && !charge.paymentUrl) && !(payment.paymentUrl && payment.paymentUrl!==charge.paymentUrl)) return { charge, transaction: previous, providerPayment: payment, ignored: true };
    if (previous && previous.status !== "PENDING" && status === "PENDING") {
      return { charge, transaction: previous, providerPayment: payment, ignored: true };
    }
    const processedAt = new Date();
    const transactionData = {
      status, amountInCents: charge.amountInCents, provider: payment.provider,
      providerPaymentId: payment.providerPaymentId, processedAt,
      metadata: { providerStatus: payment.status, providerStatusDetail: payment.statusDetail },
    };
    const transaction = previous
      ? await tx.paymentTransaction.update({ where: { id: previous.id }, data: transactionData })
      : await tx.paymentTransaction.create({ data: { ...transactionData, chargeId: id, requestId } });

    const approved = status === "APPROVED";
    const failed = status === "CANCELED" || status === "REJECTED";
    const updated = await tx.charge.update({ where: { id }, data: {
      provider: payment.provider, providerChargeId: payment.providerPaymentId,
      ...(paymentMethodId !== undefined ? { paymentMethodId } : {}),
      paymentUrl: kind==="CARD_ORDERS" ? payment.paymentUrl : payment.paymentUrl ?? (knownOrder ? charge.paymentUrl : null),
      ...(kind==="BOLETO_ORDERS"?{boletoBarcode:payment.boletoBarcode??(knownOrder?charge.boletoBarcode:null),expiresAt:null}:{}),
      pixCopyPaste: payment.pixCopyPaste ?? (knownOrder ? charge.pixCopyPaste : null),
      metadata: {
        ...metadata, gatewayAttemptPending: false, gatewayAttemptKind: kind,
        pixQrCodeBase64: payment.pixQrCodeBase64 || (knownOrder ? metadata.pixQrCodeBase64 : null) || null,
        providerStatus: payment.status, providerStatusDetail: payment.statusDetail,
      },
      ...(status === "PENDING" && charge.status === "FAILED" ? { status: "PENDING", failedAt: null, failureReason: null } : {}),
      ...(approved ? { status: "PAID", paidAt: processedAt, failedAt: null, failureReason: null } : {}),
      ...(failed ? { status: "FAILED", failedAt: processedAt, failureReason: payment.statusDetail } : {}),
      ...(status === "REFUNDED" ? { status: "REFUNDED", refundedAt: processedAt } : {}),
    } });
    if (!knownOrder || approved || status === "REFUNDED") {
      await tx.auditLog.create({ data: {
        condominiumId: charge.condominiumId, userId: user?.id, userName: user?.name, userRole: user?.role,
        module: "PAYMENT", action: approved ? "GATEWAY_APPROVED" : status === "REFUNDED" ? "GATEWAY_REFUND" : "GATEWAY_PROCESS",
        referenceId: id, requestId, details: approved ? "Pagamento confirmado pelo Mercado Pago." : "Ordem de pagamento registrada no Mercado Pago.",
        afterData: { providerOrderId: payment.providerPaymentId, status },
      } });
    }
    return { charge: updated, transaction, providerPayment: payment, newlyPaid: approved };
  });
}
