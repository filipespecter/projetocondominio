import test from "node:test";
import assert from "node:assert/strict";
import service from "../src/services/PaymentGatewayOrchestratorService.js";
import charges from "../src/services/ChargeService.js";

for(const outcome of ["cancelled","pending","approved","other-tenant","disabled","processing","no-card"])test("troca boleto por cartão: "+outcome,async t=>{
 const old=process.env.MERCADO_PAGO_CARD_CHECKOUT_ENABLED;
 process.env.MERCADO_PAGO_CARD_CHECKOUT_ENABLED=outcome==="disabled"?"false":"true";
 t.after(()=>old===undefined?delete process.env.MERCADO_PAGO_CARD_CHECKOUT_ENABLED:process.env.MERCADO_PAGO_CARD_CHECKOUT_ENABLED=old);
 const prior="ORD01J6TC8BYRR0T4ZKY0QR39WGYE",id="charge",condominiumId="condo";
 const row={id,condominiumId,provider:"MERCADO_PAGO",providerChargeId:prior,amountInCents:40000,status:"PENDING",metadata:{gatewayAttemptKind:"BOLETO_ORDERS"}};
 const calls=[];
 t.mock.method(charges,"findById",async()=>row);
 t.mock.method(service,"applyPixOrder",async()=>calls.push("baixa"));
 t.mock.method(service,"openCardCheckout",async chargeId=>{assert.equal(chargeId,id);calls.push("cartão");return {url:"checkout"};});
 const tx={$queryRaw:async()=>[],charge:{findUnique:async()=>row,update:async({data})=>{assert.equal(data.providerChargeId,null);assert.equal(data.boletoBarcode,null);calls.push("limpa");}},paymentTransaction:{updateMany:async()=>{}},auditLog:{create:async()=>{}}};
 let reads=0;
 const gateway={ensureConfigured(){},ensureWebhookConfigured(){},async cardOrderBody(){calls.push("valida");if(outcome==="no-card")throw Object.assign(Error("Cartão indisponível"),{statusCode:503});},
 getOrderPayment:async()=>({providerPaymentId:prior,externalReference:id,transactionAmount:400,currency:"BRL",kind:"BOLETO_ORDERS",status:reads++?outcome:"pending",statusDetail:outcome==="processing"?"in_process":"waiting_payment"}),
 cancelOrder:async()=>{calls.push("cancela");throw Error("timeout");}};
 const work=service.switchBoletoToCard(id,{id:"admin",condominiumId:outcome==="other-tenant"?"other":condominiumId},null,{$transaction:fn=>fn(tx)},gateway);
 if(outcome==="cancelled")assert.deepEqual(await work,{url:"checkout"});
 else await assert.rejects(work,e=>e.statusCode===({disabled:503,"no-card":503,"other-tenant":404}[outcome]??409));
 assert.deepEqual(calls,({cancelled:["valida","cancela","limpa","cartão"],approved:["valida","cancela","baixa"],pending:["valida","cancela"],processing:["valida"],"no-card":["valida"]})[outcome]??[]);
});
