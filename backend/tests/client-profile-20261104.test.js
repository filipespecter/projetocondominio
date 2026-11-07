import test from "node:test";
import assert from "node:assert/strict";
import {readClientProfile,updateClientProfile} from "../src/services/ClientProfileService.js";
const ids={condo:"11111111-1111-4111-8111-111111111111",user:"22222222-2222-4222-8222-222222222222",actor:"33333333-3333-4333-8333-333333333333",subscription:"44444444-4444-4444-8444-444444444444",other:"55555555-5555-4555-8555-555555555555"};
const revision=new Date("2026-11-04T00:00:00Z");
const actor={id:ids.actor,role:"PLATFORM_OWNER",condominiumId:null,name:"Central"};
const projection=(row,select)=>row?Object.fromEntries(Object.entries(row).filter(([key])=>select[key])):null;
function fixture({auditFails=false,duplicate=false}={}){
 let state={condo:{id:ids.condo,name:"Cliente original",legalName:null,document:null,contactName:"Contato",email:"condo@example.com",phone:null,postalCode:null,addressLine:null,addressNumber:null,addressExtra:null,neighborhood:null,city:null,state:null,updatedAt:revision,deletedAt:null,status:"ACTIVE"},
 user:{id:ids.user,condominiumId:ids.condo,name:"Admin original",username:"admin.original",email:"original@example.com",phone:null,document:null,updatedAt:revision,deletedAt:null,role:"CONDOMINIUM_ADMIN",passwordHash:"SECRET-HASH",securityVersion:1,status:"ACTIVE",mustChangePassword:false},
 subscription:{id:ids.subscription,condominiumId:ids.condo,updatedAt:revision,billingContactName:"Financeiro",billingEmail:"financeiro@example.com",billingPhone:null,priceInCents:30000,planId:"unchanged",status:"ACTIVE"},audits:[],sessionsRevoked:false,codesRevoked:false};
 let writes=0;
 const same=(row,where)=>Object.entries(where).every(([key,value])=>value instanceof Date?new Date(row[key]).getTime()===value.getTime():value&&typeof value==="object"&&"in" in value?value.in.includes(row[key]):row[key]===value);
 const update=(key)=>async({where,data})=>{
  if(!same(state[key],where))return {count:0};writes++;
  const {securityVersion,...fields}=data;Object.assign(state[key],fields,{updatedAt:new Date(revision.getTime()+1000)});if(securityVersion)state[key].securityVersion+=securityVersion.increment;
  return {count:1};
 };
 const db={
  condominium:{findFirst:async({where,select})=>same(state.condo,where)?projection(state.condo,select):null,updateMany:update("condo")},
  user:{findFirst:async({where,select})=>where.id?.not?(duplicate?{id:ids.other}:null):same(state.user,where)?projection(state.user,select):null,updateMany:update("user")},
  subscription:{findFirst:async({where,select})=>same(state.subscription,where)?projection(state.subscription,select):null,updateMany:update("subscription")},
  auditLog:{create:async({data})=>{if(auditFails)throw Error("AUDIT_FAILURE");state.audits.push(data);}},
  authSession:{updateMany:async({where})=>{assert.equal(where.userId,ids.user);state.sessionsRevoked=true;}},
  passwordResetCode:{updateMany:async({where})=>{assert.equal(where.userId,ids.user);state.codesRevoked=true;}},
  $transaction:async fn=>{const previous=structuredClone(state);try{return await fn(db);}catch(error){state=previous;throw error;}}
 };
 const data=()=>({condominium:{name:"Nome atualizado",legalName:"Razão atualizada",document:"12345678000199",contactName:"Novo contato",email:"condominio.novo@example.com",phone:"81999990000",postalCode:"52000-000",addressLine:"Rua Nova",addressNumber:"42",addressExtra:"Torre",neighborhood:"Casa Amarela",city:"Recife",state:"pe",expectedUpdatedAt:revision.toISOString()},administrator:{id:ids.user,expectedUpdatedAt:revision.toISOString(),name:"Administrador novo",username:"admin.novo",email:"NOVA@example.com",phone:"81999991111",document:"12345678900"},billingContact:{id:ids.subscription,expectedUpdatedAt:revision.toISOString(),name:"Financeiro novo",email:"novofinanceiro@example.com",phone:"81999992222"}});
 return {db,state:()=>state,data,writes:()=>writes};
}
for(const role of ["PLATFORM_OWNER","PLATFORM_ADMIN"])test(`${role} edita ficha completa e mantém senha, plano, preço e status`,async()=>{
 const f=fixture();const result=await updateClientProfile({actor:{...actor,role},condominiumId:ids.condo,data:f.data()},{db:f.db});
 assert.equal(result.condominium.name,"Nome atualizado");assert.equal(result.condominium.state,"PE");assert.equal(result.administrator.email,"nova@example.com");assert.equal(result.administrator.username,"admin.novo");assert.equal(result.billingContact.email,"novofinanceiro@example.com");
 assert.equal(f.state().user.passwordHash,"SECRET-HASH");assert.equal(f.state().subscription.priceInCents,30000);assert.equal(f.state().subscription.planId,"unchanged");assert.equal(f.state().condo.status,"ACTIVE");assert.equal(f.state().user.mustChangePassword,false);
 assert.equal(f.state().sessionsRevoked,true);assert.equal(f.state().codesRevoked,true);assert.equal(f.state().user.securityVersion,2);
 assert.equal(JSON.stringify(result).includes("SECRET-HASH"),false);assert.equal(JSON.stringify(f.state().audits).includes("SECRET-HASH"),false);assert.equal(f.state().audits[0].condominiumId,ids.condo);
});
for(const badActor of [null,{...actor,role:"PLATFORM_SUPPORT"},{...actor,role:"CONDOMINIUM_ADMIN"},{...actor,role:"DOORMAN"},{...actor,condominiumId:ids.condo}])test(`ficha recusa perfil indevido ${badActor?.role||"anônimo"}`,async()=>{
 const f=fixture();for(const fn of [readClientProfile,updateClientProfile])await assert.rejects(fn({actor:badActor,condominiumId:ids.condo,data:f.data()},{db:f.db}),e=>e.statusCode===403);assert.equal(f.writes(),0);
});
test("ficha recusa usuário pertencente a outro cliente",async()=>{
 const f=fixture(),data=f.data();data.administrator.id=ids.other;
 await assert.rejects(updateClientProfile({actor,condominiumId:ids.condo,data},{db:f.db}),e=>e.statusCode===404);assert.equal(f.writes(),0);
});
test("ficha rejeita campos de privilégio, senha e cobrança sem gravar",async()=>{
 for(const mutation of [data=>{data.role="PLATFORM_OWNER";},data=>{data.administrator.passwordHash="attack";},data=>{data.condominium.status="ACTIVE";},data=>{data.billingContact.priceInCents=1;}]){
  const f=fixture(),data=f.data();mutation(data);await assert.rejects(updateClientProfile({actor,condominiumId:ids.condo,data},{db:f.db}),e=>e.statusCode===422);assert.equal(f.writes(),0);
 }
});
test("ficha rejeita e-mail, usuário, CEP, UF e dados de controle inválidos",async()=>{
 for(const mutation of [data=>{data.administrator.email="invalid";},data=>{data.administrator.username="<script>";},data=>{data.condominium.postalCode="abc";},data=>{data.condominium.state="PEE";},data=>{data.condominium.name="Texto\u0000invalido";}]){
  const f=fixture(),data=f.data();mutation(data);await assert.rejects(updateClientProfile({actor,condominiumId:ids.condo,data},{db:f.db}),e=>e.statusCode===422);assert.equal(f.writes(),0);
 }
});
test("ficha antiga não sobrescreve alterações de outro operador",async()=>{
 const f=fixture();f.state().user.updatedAt=new Date("2026-11-04T01:00:00Z");
 await assert.rejects(updateClientProfile({actor,condominiumId:ids.condo,data:f.data()},{db:f.db}),e=>e.statusCode===409);assert.equal(f.writes(),0);
});
test("mudança do contato financeiro durante gravação reverte condomínio e administrador",async()=>{
 const f=fixture();const original=f.db.subscription.updateMany;f.db.subscription.updateMany=async()=>({count:0});
 await assert.rejects(updateClientProfile({actor,condominiumId:ids.condo,data:f.data()},{db:f.db}),e=>e.statusCode===409);
 assert.equal(f.state().condo.name,"Cliente original");assert.equal(f.state().user.username,"admin.original");f.db.subscription.updateMany=original;
});
test("falha na auditoria reverte todos os dados e revogações",async()=>{
 const f=fixture({auditFails:true});const before=structuredClone(f.state());
 await assert.rejects(updateClientProfile({actor,condominiumId:ids.condo,data:f.data()},{db:f.db}),/AUDIT_FAILURE/);assert.deepEqual(f.state(),before);
});
test("novo identificador ambíguo não impede posteriormente login e recuperação",async()=>{
 const f=fixture({duplicate:true});await assert.rejects(updateClientProfile({actor,condominiumId:ids.condo,data:f.data()},{db:f.db}),e=>e.statusCode===409);assert.equal(f.state().user.email,"original@example.com");
});
test("editar somente nome e endereço não encerra sessões nem muda acesso",async()=>{
 const f=fixture(),data=f.data();data.administrator={...data.administrator,username:"admin.original",email:"original@example.com"};
 await updateClientProfile({actor,condominiumId:ids.condo,data},{db:f.db});assert.equal(f.state().user.securityVersion,1);assert.equal(f.state().sessionsRevoked,false);assert.equal(f.state().codesRevoked,false);
});
test("cliente sem administrador ou assinatura permite atualizar somente seus dados",async()=>{
 const f=fixture(),data=f.data();data.administrator=null;data.billingContact=null;
 f.db.user.findFirst=async()=>null;f.db.subscription.findFirst=async()=>null;
 const result=await updateClientProfile({actor,condominiumId:ids.condo,data},{db:f.db});assert.equal(result.condominium.name,"Nome atualizado");assert.equal(result.administrator,null);assert.equal(result.billingContact,null);
});
