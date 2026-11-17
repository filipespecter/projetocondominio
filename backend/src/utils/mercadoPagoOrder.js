import { ApiError } from "./ApiError.js";

export const isOrderId = value => /^ORD[A-Z0-9]{10,60}$/.test(String(value ?? ""));
const currencyAmount = value => /^\d+(?:\.\d{1,2})?$/.test(String(value ?? "")) ? Number(value) : NaN;

export function normalizePixOrder(order, expectedId = order?.id) {
  const payment = order?.transactions?.payments?.[0];
  const method = payment?.payment_method;
  const amount = currencyAmount(order?.total_amount);
  if (!isOrderId(expectedId) || order?.id !== expectedId || order.type !== "online" || !(order.currency_id ? order.currency_id === "BRL" && (!order.country_code || order.country_code === "BRA") : order.country_code === "BRA") ||
      order.transactions?.payments?.length !== 1 || !payment?.id ||
      method?.id !== "pix" || method.type !== "bank_transfer" ||
      !(amount > 0) || currencyAmount(payment.amount) !== amount) {
    throw new ApiError("Ordem Pix divergente. Nenhuma baixa foi autorizada.", 409);
  }
  const credited = order.status === "processed" && order.status_detail === "accredited" &&
    payment.status === "processed" && payment.status_detail === "accredited";
  if (credited && (currencyAmount(order.total_paid_amount) !== amount || currencyAmount(payment.paid_amount) !== amount)) {
    throw new ApiError("Valor recebido divergente. Nenhuma baixa foi autorizada.", 409);
  }
  const terminal = { canceled: "cancelled", cancelled: "cancelled", expired: "cancelled", failed: "rejected", refunded: "refunded" };
  return {
    provider: "MERCADO_PAGO", providerPaymentId: order.id, externalReference: order.external_reference,
    status: credited ? "approved" : terminal[order.status] ?? "pending",
    statusDetail: order.status_detail ?? null, currency: "BRL", transactionAmount: amount,
    paymentMethodId: "pix", paymentTypeId: "bank_transfer",
    pixCopyPaste: method.qr_code ?? null, pixQrCodeBase64: method.qr_code_base64 ?? null,
    paymentUrl: method.ticket_url ?? null,
  };
}
