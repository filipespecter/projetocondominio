import test from "node:test";
import assert from "node:assert/strict";
import { normalizeBoletoOrder } from "../src/utils/mercadoPagoBoletoOrder.js";
import { persistPixOrder } from "../src/services/PixOrderSettlementService.js";
import provider from "../src/services/providers/MercadoPagoProvider.js";

const id="ORD01J6TC8BYRR0T4ZKY0QR39WGYE", line="23793380296060054351030006333303799140000020000";
const order={id,type:"online",processing_mode:"automatic",country_code:"BRA",external_reference:"charge",total_amount:"400.00",status:"action_required",
 transactions:{payments:[{id:"pay",amount:"400.00",status:"action_required",payment_method:{id:"boleto",type:"ticket",digitable_line:line,ticket_url:"https://www.mercadopago.com.br/payments/1/ticket"}}]}};
test("boleto usa POST Orders com dados e chave da própria cobrança",async t=>{
 let parsed;
 t.mock.method(provider,"request",async(path,options)=>{assert.equal(path,"/v1/orders");assert.equal(options.idempotencyKey,"key");parsed=options.body;return order;});
 const customer={email:"teste@example.com",name:"Pessoa Teste",identificationType:"CPF",identificationNumber:"99999999999",address:{zipCode:"06233903",streetName:"Rua A",streetNumber:"1",neighborhood:"Centro",city:"Osasco",state:"SP"}};
 const data=await provider.createBoletoOrder({charge:{id:"charge",amountInCents:40000},customer,idempotencyKey:"key"});
 assert.deepEqual(parsed.transactions.payments[0],{amount:"400.00",payment_method:{id:"boleto",type:"ticket"}});
 assert.equal(parsed.payer.address.state,"SP");
 assert.equal(data.boletoBarcode,line);
 assert.equal(data.status,"pending");
});
test("webhook da ordem preserva linha digitável e exige confirmação do valor",async()=>{
 let row={id:"charge",status:"PENDING",amountInCents:40000,metadata:{gatewayAttemptPending:true,gatewayAttemptKind:"BOLETO_ORDERS"}},txn;
 const tx={$queryRaw:async()=>[],charge:{findUnique:async()=>row,update:async({data})=>row={...row,...data}},
 paymentTransaction:{findFirst:async()=>txn,create:async({data})=>txn={...data,id:"txn"},update:async({data})=>txn={...txn,...data}},auditLog:{create:async()=>{}}};
 const db={$transaction:fn=>fn(tx)};
 await persistPixOrder({id:"charge",payment:normalizeBoletoOrder(order)},db);
 assert.equal(row.boletoBarcode,line);assert.equal(row.status,"PENDING");
 const paid=structuredClone(order);Object.assign(paid,{status:"processed",status_detail:"accredited",total_paid_amount:"399.00"});
 Object.assign(paid.transactions.payments[0],{status:"processed",status_detail:"accredited"});
 assert.throws(()=>normalizeBoletoOrder(paid),/divergente/);
 paid.total_paid_amount="400.00";
 assert.equal((await persistPixOrder({id:"charge",payment:normalizeBoletoOrder(paid)},db)).newlyPaid,true);
 assert.equal((await persistPixOrder({id:"charge",payment:normalizeBoletoOrder(paid)},db)).ignored,true);
});
