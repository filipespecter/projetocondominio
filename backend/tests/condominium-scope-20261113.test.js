import test from "node:test";
import assert from "node:assert/strict";
import { configurationRequest } from "../src/services/CondominiumRequestsService.js";
import { expirePendingReservations } from "../src/services/ReservationExpiryService.js";

const user={id:"actor",condominiumId:"condo",role:"CONDOMINIUM_ADMIN"};
test("pedido de antecipação não é emitido se já existe cobrança do período",async()=>{
 let writes=0;
 const tx={$queryRaw:async()=>[],condominium:{findUnique:async()=>({name:"Teste"})},subscription:{findFirst:async()=>({id:"sub",condominium:{timezone:"America/Recife"},nextDueDate:new Date("2099-01-01"),billingCycle:"MONTHLY",lastPaymentAt:new Date()})},supportTicket:{findFirst:async()=>null,create:async()=>{writes++;}},charge:{findFirst:async({where})=>{assert.equal(where.condominiumId,"condo");assert.ok(where.dueDate.gte<where.dueDate.lt);return {id:"charge"};}}};
 await assert.rejects(configurationRequest(user,{kind:"PAY",method:"PIX"},{$transaction:fn=>fn(tx)}),/Já existe cobrança/);
 assert.equal(writes,0);
});
test("pedido de reinício recusa outro usuário sem gravar solicitação",async()=>{
 await assert.rejects(configurationRequest(user,{kind:"RESET",username:"outro",password:"senha",confirmation:"REINICIAR Teste"},{user:{findFirst:async({where})=>{assert.equal(where.condominiumId,"condo");return {username:"síndico"};}}}),/Credenciais não confirmadas/);
});
test("expiração na consulta restringe o condomínio e só afeta pendências",async()=>{
 const db={$executeRaw:async(parts,...values)=>{assert.deepEqual(values,["condo","condo"]);assert.match(parts.join("?"),/status='PENDING'/);return 1;}};
 assert.equal(await expirePendingReservations("condo",db),1);
});
