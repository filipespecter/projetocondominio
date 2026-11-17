import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import gateway from "../src/services/providers/MercadoPagoProvider.js";
import webhook from "../src/services/PaymentWebhookService.js";
import orchestrator from "../src/services/PaymentGatewayOrchestratorService.js";
import { normalizePixOrder } from "../src/utils/mercadoPagoOrder.js";
import { persistPixOrder } from "../src/services/PixOrderSettlementService.js";

const id = "efc5fb75-9928-472f-a289-464f55eb2352";
const orderId = "ORD01JP84C939T20S0P1DN382FQ6K";
function order(approved = false) {
  const status = approved ? "processed" : "action_required";
  const status_detail = approved ? "accredited" : "waiting_transfer";
  return { id: orderId, type: "online", country_code: "BRA", external_reference: id, total_amount: "400.00",
    status, status_detail, ...(approved ? {total_paid_amount:"400.00"} : {}),
    transactions:{payments:[{id:"PAY01TESTPAYMENT",amount:"400.00",status,status_detail,
      ...(approved ? {paid_amount:"400.00"} : {}),
      payment_method:{id:"pix",type:"bank_transfer",qr_code:"codigo-teste"}}]},
  };
}

test("Pix envia a referência e o total da cobrança via Orders com idempotência", async t => {
  t.mock.method(gateway,"request",async (path, options) => {
    assert.equal(path,"/v1/orders");
    assert.equal(options.method,"POST");
    assert.equal(options.idempotencyKey,"same-key");
    assert.equal(options.body.total_amount,"400.00");
    assert.equal(options.body.external_reference,id);
    assert.equal(options.body.transactions.payments[0].payment_method.id,"pix");
    return order();
  });
  const payment = await gateway.createPixOrder({charge:{id,amountInCents:40000},customer:{email:"qa@example.com"},idempotencyKey:"same-key"});
  assert.equal(payment.status,"pending");
  assert.equal(payment.pixCopyPaste,"codigo-teste");
});

test("Pix só fica aprovado com ordem e transação creditadas pelo valor total", () => {
  assert.equal(normalizePixOrder(order()).status,"pending");
  assert.equal(normalizePixOrder(order(true)).status,"approved");
  const wrong = order(true);
  wrong.transactions.payments[0].paid_amount = "300";
  assert.throws(()=>normalizePixOrder(wrong), {statusCode:409});
  const partial = order(true);
  partial.status_detail = "partially_refunded";
  assert.notEqual(normalizePixOrder(partial).status,"approved");
});

test("webhook de Orders verifica assinatura e encaminha o ID original",async t=>{
  t.mock.method(gateway,"ensureWebhookConfigured",()=>{});
  t.mock.getter(gateway,"webhookSecret",()=>"secret-for-tests");
  let received = 0;
  t.mock.method(orchestrator,"synchronizePixOrder",async input=>{
    assert.equal(input.providerOrderId,orderId);
    received++;
    return {ignored:false};
  });
  const ts=String(Math.floor(Date.now()/1000));
  const hash=createHmac("sha256","secret-for-tests").update(`id:${orderId.toLowerCase()};request-id:req;ts:${ts};`).digest("hex");
  const input={payload:{type:"order",data:{id:orderId}},query:{"data.id":orderId},headers:{"x-signature":`ts=${ts},v1=${hash}`,"x-request-id":"req"}};
  await assert.rejects(webhook.handleMercadoPago({...input,headers:{}}),{statusCode:401});
  assert.equal((await webhook.handleMercadoPago(input)).received,true);
  assert.equal(received,1);
});

test("reentrega não duplica baixa, transação ou auditoria; valor divergente é recusado", async () => {
  let charge={id, status:"PENDING",amountInCents:40000, metadata:{gatewayAttemptPending:true,gatewayAttemptKind:"PIX_ORDERS",gatewayAttemptKey:"key"}};
  let entry;let audits=0;let creates=0;
  const tx={$queryRaw:async()=>[],charge:{findUnique:async()=>charge,update:async({data})=>(charge={...charge,...data})},
    paymentTransaction:{findFirst:async()=>entry,create:async({data})=>{creates++;return entry={id:"record",...data};},update:async({data})=>(entry={...entry,...data})},
    auditLog:{create:async()=>{audits++;}}};
  const db={$transaction:fn=>fn(tx)};
  const input={id,payment:normalizePixOrder(order()),attemptKey:"key"};
  await assert.rejects(persistPixOrder({...input,payment:{...input.payment,transactionAmount:1}},db),{statusCode:409});
  await persistPixOrder(input,db);
  assert.equal(charge.status,"PENDING");
  const approved={id,payment:normalizePixOrder(order(true))};
  assert.equal((await persistPixOrder(approved,db)).newlyPaid,true);
  assert.equal((await persistPixOrder(approved,db)).ignored,true);
  assert.equal(charge.status,"PAID");
  assert.equal(audits,2);
  assert.equal(creates,1);
});
