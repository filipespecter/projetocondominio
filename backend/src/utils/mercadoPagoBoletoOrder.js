import { ApiError } from "./ApiError.js";
import { isOrderId } from "./mercadoPagoOrder.js";

export function normalizeBoletoOrder(order, id=order?.id) {
  const payment=order?.transactions?.payments?.[0], method=payment?.payment_method;
  const amount=value=>/^\d+(\.\d{1,2})?$/.test(String(value??""))?Number(value):NaN;
  const total=amount(order?.total_amount);
  const fail=()=>new ApiError("Ordem de boleto divergente. Nenhuma baixa foi registrada.",409);
  if(!isOrderId(id)||order?.id!==id||order.type!=="online"||order.processing_mode!=="automatic"||
    (order.currency??order.currency_id??(order.country_code==="BRA"?"BRL":null))!=="BRL"||
    (order.country_code&&order.country_code!=="BRA")||order.transactions?.payments?.length!==1||
    !payment?.id||method?.id!=="boleto"||method.type!=="ticket"||!(total>0)||amount(payment.amount)!==total)throw fail();
  const credited=order.status==="processed"&&order.status_detail==="accredited"&&payment.status==="processed"&&payment.status_detail==="accredited";
  if(credited&&amount(order.total_paid_amount)!==total)throw fail();
  let paymentUrl=null;
  try{
    const url=new URL(method.ticket_url);
    if(url.protocol==="https:"&&!url.username&&!url.password&&["www.mercadopago.com.br","www.mercadopago.com.ar","www.mercadopago.com"].includes(url.hostname)&&!url.port)paymentUrl=url.href;
  }catch{}
  const line=String(method.digitable_line??"").replace(/[ .-]/g,"");
  const terminal={canceled:"cancelled",cancelled:"cancelled",expired:"cancelled",failed:"rejected",refunded:"refunded"};
  return {kind:"BOLETO_ORDERS",provider:"MERCADO_PAGO",providerPaymentId:id,externalReference:order.external_reference,currency:"BRL",
    transactionAmount:total,status:credited?"approved":terminal[order.status]??"pending",statusDetail:order.status_detail??null,
    paymentUrl,boletoBarcode:/^\d{47,48}$/.test(line)?line:null};
}
