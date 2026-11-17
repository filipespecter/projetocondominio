import { ApiError } from "./ApiError.js";
import { isOrderId } from "./mercadoPagoOrder.js";

export const cardCheckoutEnabled = () => process.env.MERCADO_PAGO_CARD_CHECKOUT_ENABLED === "true";

export function checkoutUrl(value,id) {
  try {
    const url=new URL(value);
    if(url.origin==="https://www.mercadopago.com.br"&&!url.username&&!url.password&&
      url.pathname==="/checkout/v1/redirect"&&url.searchParams.get("order_id")===id) return url.href;
  } catch { /* Invalid provider response. */ }
  return null;
}

const cents=value=>/^\d+(?:\.\d{1,2})?$/.test(String(value??""))?Math.round(Number(value)*100):NaN;
export function normalizeCardOrder(order,id=order?.id) {
  const fail=()=>new ApiError("A ordem de cartão retornou dados inconsistentes. Nenhuma baixa foi registrada.",409);
  const total=cents(order?.total_amount);
  if(!isOrderId(id)||id!==order?.id||order.type!=="online"||order.processing_mode!=="manual"||
     (order.currency??order.currency_id)!=="BRL"||(order.country_code&&order.country_code!=="BRA")||
     !Number.isSafeInteger(total)||total<=0)throw fail();
  const credited=order.status==="processed"&&order.status_detail==="accredited";
  if(credited){
    const payments=order.transactions?.payments;
    const payment=payments?.[0];
    if(payments?.length!==1||payment?.payment_method?.type!=="credit_card"||
       payment.status!=="processed"||payment.status_detail!=="accredited"||
       cents(payment.amount)!==total||cents(order.total_paid_amount)!==total)throw fail();
  }
  const terminal={canceled:"cancelled",cancelled:"cancelled",expired:"cancelled",failed:"rejected",refunded:"refunded"};
  return {kind:"CARD_ORDERS",provider:"MERCADO_PAGO",providerPaymentId:id,externalReference:order.external_reference,
    status:credited?"approved":terminal[order.status]??"pending",statusDetail:order.status_detail??null,currency:"BRL",
    transactionAmount:total/100,paymentUrl:order.status==="created"?checkoutUrl(order.checkout_url,id):null};
}
