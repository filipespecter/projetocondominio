import { ApiError } from "./ApiError.js";
export function assertPaymentMatches(charge, payment, expectedPaymentId = null) {
  const amount=Number(payment.transactionAmount);
  if (!payment.providerPaymentId || (expectedPaymentId !== null && String(payment.providerPaymentId)!==String(expectedPaymentId)) ||
      payment.externalReference !== charge.id || payment.currency !== "BRL" || !Number.isFinite(amount) || amount <= 0 ||
      !Number.isSafeInteger(charge.amountInCents) || Math.abs(amount*100-charge.amountInCents)>0.00001) {
    throw new ApiError("Pagamento divergente da cobrança. Nenhuma baixa foi autorizada; solicite conferência à Central.",409);
  }
}
