import test from "node:test";
import assert from "node:assert/strict";
import { configurationRequest } from "../src/services/CondominiumRequestsService.js";

test("pedido de antecipação registra cartão para a Central sem emitir pagamento",async ()=>{
 let saved;
 const tx={$queryRaw:async()=>{},condominium:{findUnique:async()=>({name:"Teste"})},
 subscription:{findFirst:async()=>({id:"sub",priceInCents:40000,nextDueDate:new Date("2099-01-01T12:00:00Z"),condominium:{}})},
 charge:{findFirst:async()=>null},supportTicket:{findFirst:async()=>null,create:async({data})=>{saved=data;return {ticketNumber:1,status:"OPEN"};}}};
 const result=await configurationRequest({id:"user",condominiumId:"condo",role:"CONDOMINIUM_ADMIN"},{kind:"PAY",method:"CARD"},{$transaction:fn=>fn(tx)});
 assert.equal(result.status,"OPEN");
 assert.equal(saved.category,"PAGAMENTO_ANTECIPADO");
 assert.equal(saved.metadata.preferredMethod,"CARD");
 assert.match(saved.description,/Cartão de crédito/);
});
