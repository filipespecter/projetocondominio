import test from "node:test";
import assert from "node:assert/strict";
import {writeHandover,acknowledgeHandover,resolveHandover,listHandovers} from "../src/services/HandoverService.js";
const id="11111111-1111-4111-8111-111111111111";
const actor=role=>({id,role,condominiumId:"tenant-a"});
test("gestão acompanha passagens mas não registra, confirma ciência nem resolve",async()=>{
 for(const role of ["CONDOMINIUM_ADMIN","MANAGER"]){
  const user=actor(role);let writes=0;const db={$transaction:()=>{writes++;},shiftHandover:{findMany:async q=>{assert.equal(q.where.condominiumId,"tenant-a");assert.ok(q.include.resolvedBy);return [];}}};
  assert.deepEqual(await listHandovers(db,user),[]);
  for(const [fn,input] of [[writeHandover,{title:"Pendência",notes:"Observação de turno"}],[acknowledgeHandover,id],[resolveHandover,id]])await assert.rejects(fn(db,user,input),e=>e.statusCode===403);
  assert.equal(writes,0);
 }
});
test("porteiro resolve pendência somente no próprio condomínio e preserva auditoria",async()=>{
 let update,audit;const db={$transaction:fn=>fn({shiftHandover:{updateMany:async q=>{update=q;return {count:1};}},auditLog:{create:async q=>{audit=q;}}})};
 assert.deepEqual(await resolveHandover(db,actor("DOORMAN"),id),{resolved:true});assert.equal(update.where.condominiumId,"tenant-a");assert.equal(update.data.resolvedByUserId,id);assert.equal(audit.data.userRole,"DOORMAN");
});
