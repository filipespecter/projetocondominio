import test from "node:test";
import assert from "node:assert/strict";
import service from "../src/services/PaymentGatewayOrchestratorService.js";
import charges from "../src/services/ChargeService.js";

for(const outcome of ["cancelled","pending","approved"]) test("troca Pix por boleto: "+outcome,async t=>{
 const id="charge", prior="ORD01J49MMW3SSBK5PSV3DFR32959", condominiumId="condo";
 const row={id,condominiumId,provider:"MERCADO_PAGO",providerChargeId:prior,amountInCents:40000,status:"PENDING",metadata:{},pixCopyPaste:"pix"};
 const calls=[];
 t.mock.method(charges,"findById",async()=>row);
 t.mock.method(service,"processCharge",async(...args)=>{assert.equal(args[0],id);assert.equal(args[4].portalPayment.type,"BOLETO");calls.push("boleto");});
 t.mock.method(service,"applyPixOrder",async()=>calls.push("baixa"));
 const tx={$queryRaw:async()=>[],charge:{findUnique:async()=>row,update:async({data})=>{assert.equal(data.providerChargeId,null);assert.equal(data.pixCopyPaste,null);calls.push("limpa");}},paymentTransaction:{updateMany:async()=>{}},auditLog:{create:async()=>{}}};
 const db={$transaction:fn=>fn(tx),condominium:{findUnique:async()=>({id:condominiumId})}};
 let readings=0;
 const gateway={ensureConfigured(){},ensureWebhookConfigured(){},buildBoletoOrder(){calls.push("valida");},getPixOrder:async()=>({providerPaymentId:prior,externalReference:id,transactionAmount:400,currency:"BRL",status:readings++?outcome:"pending"}),cancelPixOrder:async()=>{calls.push("cancela");throw Error("timeout");}};
 const work=service.switchPixToBoleto(id,{id:"admin",condominiumId},null,db,gateway);
 if(outcome==="cancelled")await work;else await assert.rejects(work,e=>e.statusCode===409);
 assert.deepEqual(calls,outcome==="cancelled"?["valida","cancela","limpa","boleto"]:outcome==="approved"?["valida","cancela","baixa"]:["valida","cancela"]);
});
