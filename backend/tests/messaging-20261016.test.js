import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { ApartmentContactService,validateContacts } from "../src/services/ApartmentContactService.js";
import { WhatsAppOnboardingService,approvedTemplate } from "../src/services/WhatsAppOnboardingService.js";
import { TenantMessagingService } from "../src/services/TenantMessagingService.js";
import { unseal,seal } from "../src/utils/MessagingSecrets.js";
import prisma from "../src/config/prisma.js";
import contactsService from "../src/services/ApartmentContactService.js";
import communication from "../src/services/CommunicationService.js";
import repository from "../src/repositories/CommunicationLogRepository.js";
import provider from "../src/services/CommunicationProviderService.js";
import credentials from "../src/services/PackageCredentialService.js";
import audit from "../src/services/AuditLogService.js";
import webhook from "../src/services/WhatsAppWebhookService.js";
import tenantMessaging from "../src/services/TenantMessagingService.js";
import triggers from "../src/services/CommunicationTriggerService.js";

const apt="11111111-1111-4111-8111-111111111111";
const user={id:"user-a",name:"Síndico A",role:"CONDOMINIUM_ADMIN",condominiumId:"tenant-a"};
const person=(n=1)=>({name:`Pessoa ${n}`,email:`pessoa${n}@example.com`,phone:`8199999000${n}`,relationship:"Familiar",receiveNotices:true,whatsappOptIn:true,canPickup:false});
const template={name:"encomenda_recebida",language:"pt_BR",status:"APPROVED",components:[{type:"BODY",text:"{{1}}: encomenda para {{2}}. Informação de retirada: {{3}}."}]};
process.env.MESSAGING_ENCRYPTION_KEY="a".repeat(64);
function settings() {Object.assign(process.env,{META_APP_ID:"100",META_SIGNUP_CONFIG_ID:"200",META_APP_SECRET:"b".repeat(32),META_WEBHOOK_VERIFY_TOKEN:"v".repeat(32)});}

test("contatos: duas pessoas distintas e dados obrigatórios, sem login",()=>{
  const result=validateContacts([person(),person(2)]);
  assert.equal(result[0].phone,"5581999990001");assert.ok(!("password" in result[0]));
  for(const invalid of [[person()], [person(),person()], [person(),{...person(2),email:""}], [person(),{...person(2),phone:"123"}], [person(),{...person(2),name:""}]]) assert.throws(()=>validateContacts(invalid));
});
test("contatos: porteiro não pode alterar autorizações",async()=>{
  await assert.rejects(new ApartmentContactService({}).save({...user,role:"DOORMAN"},apt,[person(),person(2)]),e=>e.statusCode===403);
});
test("contatos: apartamento de outro condomínio não pode ser consultado",async()=>{
  let filter;
  const svc=new ApartmentContactService({apartment:{findFirst:async a=>{filter=a.where;return null;}}});
  await assert.rejects(svc.list(apt,user.condominiumId),e=>e.statusCode===404);
  assert.equal(filter.condominiumId,user.condominiumId);
});
test("contatos: mínimo bloqueia cadastro novo, sem exigir excluir ou alterar moradores existentes",async()=>{
  const svc=new ApartmentContactService({apartmentContact:{count:async()=>1}});
  await assert.rejects(svc.requireComplete(apt,user.condominiumId),e=>e.statusCode===422);
  svc.db.apartmentContact.count=async()=>2;
  await svc.requireComplete(apt,user.condominiumId);
});
test("contatos: ID de outro apartamento é recusado dentro da transação",async()=>{
  let changed=false;
  const tx={apartment:{findFirst:async()=>({id:apt})},$queryRaw:async()=>[],apartmentContact:{findMany:async()=>[],updateMany:async()=>{changed=true;}}};
  const svc=new ApartmentContactService({$transaction:async fn=>fn(tx)});
  await assert.rejects(svc.save(user,apt,[{...person(),id:apt},person(2)]),e=>e.statusCode===422);
  assert.equal(changed,false);
});
test("contatos: gravação conserva condomínio e apartamento e audita sem dados pessoais",async()=>{
  const rows=[];let event;
  const tx={apartment:{findFirst:async()=>({id:apt})},$queryRaw:async()=>[],apartmentContact:{findMany:async()=>[],updateMany:async()=>({count:0}),create:async({data})=>rows.push(data)},auditLog:{create:async({data})=>{event=data;}}};
  const svc=new ApartmentContactService({$transaction:async fn=>fn(tx),apartment:tx.apartment,apartmentContact:{findMany:async()=>rows}});
  assert.equal((await svc.save(user,apt,[person(),person(2)])).complete,true);
  assert.ok(rows.every(r=>r.apartmentId===apt&&r.condominiumId===user.condominiumId));
  assert.ok(!JSON.stringify(event).includes("example.com"));
});
test("contatos: revogação, troca de telefone e isolamento são conferidos no reenvio",async()=>{
  let filter;
  const svc=new ApartmentContactService({apartmentContact:{findFirst:async({where})=>{filter=where;return {...person(),phone:"5581999990001"};}}});
  const message={metadata:{contactId:"contact-a"},condominiumId:user.condominiumId,channel:"WHATSAPP",recipient:"5581999990001"};
  assert.equal((await svc.eligibleForMessage(message,{apartmentId:apt})).canPickup,false);
  assert.equal(filter.condominiumId,user.condominiumId);assert.equal(filter.apartmentId,apt);assert.equal(filter.deletedAt,null);
  await assert.rejects(svc.eligibleForMessage({...message,recipient:"5581999999999"},{apartmentId:apt}),e=>e.statusCode===409);
  svc.db.apartmentContact.findFirst=async()=>null;
  await assert.rejects(svc.eligibleForMessage(message,{apartmentId:apt}),e=>e.statusCode===409);
});
test("modelo: apenas aprovado, idioma correto e três parâmetros compatíveis",()=>{
  assert.equal(approvedTemplate(template,"encomenda_recebida","pt_BR"),true);
  for(const t of [{...template,status:"PENDING"},{...template,language:"en_US"},{...template,components:[...template.components,{type:"BUTTONS"}]},{...template,components:[{type:"BODY",text:"{{1}} {{2}}"}]}]) assert.equal(approvedTemplate(t,"encomenda_recebida","pt_BR"),false);
});
test("onboarding: aplicativo ausente retorna pendência, nunca conexão falsa",async()=>{
  const svc=new WhatsAppOnboardingService({});svc.publicSettings=()=>({configured:false});
  await assert.rejects(svc.start(user),e=>e.statusCode===503);
  await assert.rejects(svc.start({...user,role:"DOORMAN"}),e=>e.statusCode===403);
});
test("onboarding: estado aleatório tem validade, vínculo de usuário e só persiste hash",async()=>{
  settings();let saved;
  const svc=new WhatsAppOnboardingService({messagingConnectionAttempt:{deleteMany:async()=>{},create:async a=>{saved=a.data;}}});
  const result=await svc.start(user);
  assert.match(result.state,/^[a-f0-9]{64}$/);assert.notEqual(saved.stateHash,result.state);
  assert.equal(saved.userId,user.id);assert.equal(saved.condominiumId,user.condominiumId);
  assert.ok(saved.expiresAt>Date.now());assert.ok(!JSON.stringify(result).includes(process.env.META_APP_SECRET));
});
test("onboarding: autorização vencida/reutilizada ou de outro usuário não chama a Meta",async()=>{
  settings();let where,calls=0;
  const svc=new WhatsAppOnboardingService({messagingConnectionAttempt:{updateMany:async a=>{where=a.where;return {count:0};}}},async()=>{calls++;});
  await assert.rejects(svc.finish(user,{state:"a".repeat(64),code:"oauth-code",wabaId:"300",phoneNumberId:"400",event:"FINISH"}),e=>e.statusCode===409);
  assert.equal(calls,0);assert.equal(where.userId,user.id);assert.equal(where.condominiumId,user.condominiumId);assert.equal(where.consumedAt,null);
});
function onboardingHarness({duplicate=false,phone="400",coexistence=false,approved=true}={}) {
  settings();const calls=[];let row,event;
  const db={messagingConnectionAttempt:{updateMany:async()=>({count:1})},tenantMessagingConfig:{findFirst:async()=>duplicate?{condominiumId:"other"}:null,upsert:async a=>{row=a.create;return row;},findUnique:async()=>row,update:async({data})=>{row={...row,...data};return row;}},auditLog:{create:async a=>{event=a.data;}}};db.$transaction=async fn=>fn(db);
  const transport=async(url,options)=>{
    calls.push({url,options});let data;
    if(url.includes("oauth/access_token"))data={access_token:"private-access"};
    else if(url.includes("debug_token"))data={data:{is_valid:true,app_id:"100",scopes:["whatsapp_business_management","whatsapp_business_messaging"]}};
    else if(url.includes("phone_numbers"))data={data:[{id:phone,display_phone_number:"+55 81 99999-0000"}]};
    else if(url.includes("message_templates?")&&approved)data={data:[template]};
    else if(url.includes("message_templates?"))data={data:[]};
    else if(url.endsWith("/message_templates"))data={id:"template-id",status:"PENDING"};
    else data={success:true};
    return {ok:true,json:async()=>data};
  };
  const svc=new WhatsAppOnboardingService(db,transport);
  const input={state:"a".repeat(64),code:"oauth-code",wabaId:"300",...(coexistence?{}:{phoneNumberId:"400"}),event:coexistence?"FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING":"FINISH"};
  return {svc,input,calls,row:()=>row,event:()=>event};
}
test("onboarding: confirma número na Meta, registra, assina webhook e armazena token criptografado",async()=>{
  const h=onboardingHarness();const result=await h.svc.finish(user,h.input);
  assert.equal(result.ready,true);assert.equal(h.row().enabled,false);assert.equal(h.row().onboardingStatus,"READY");
  assert.ok(h.calls.some(c=>c.url.endsWith("400/register")));assert.ok(h.calls.some(c=>c.url.endsWith("300/subscribed_apps")));
  assert.equal(unseal(h.row().secrets,`whatsapp:${user.condominiumId}`).accessToken,"private-access");
  assert.ok(!JSON.stringify(h.row()).includes("private-access"));assert.ok(!JSON.stringify(h.event()).includes("private-access"));
});
test("onboarding: coexistência aceita único número retornado pela Meta e não registra de novo",async()=>{
  const h=onboardingHarness({coexistence:true});await h.svc.finish(user,h.input);
  assert.ok(!h.calls.some(c=>c.url.endsWith("/register")));assert.equal(h.row().phoneNumberId,"400");
});
test("onboarding: telefone forjado ou já conectado a outro condomínio é bloqueado",async()=>{
  for(const options of [{phone:"999"},{duplicate:true}]) {
    const h=onboardingHarness(options);await assert.rejects(h.svc.finish(user,h.input));
    assert.equal(h.row(),undefined);assert.ok(!h.calls.some(c=>c.url.endsWith("/register")));
  }
});
test("onboarding: modelo ausente é solicitado e canal permanece desativado",async()=>{
  const h=onboardingHarness({approved:false});const result=await h.svc.finish(user,h.input);
  assert.equal(result.ready,false);assert.equal(h.row().enabled,false);assert.equal(h.row().onboardingStatus,"PENDING_TEMPLATE");
  assert.ok(h.calls.some(c=>c.url.endsWith("/message_templates")&&c.options.method==="POST"));
});
test("onboarding: resposta HTTP 200 sem confirmação de registro não cria conexão",async()=>{
  const h=onboardingHarness();const transport=h.svc.transport;
  h.svc.transport=async(...args)=>args[0].endsWith("/register")?{ok:true,json:async()=>({success:false})}:transport(...args);
  await assert.rejects(h.svc.finish(user,h.input),e=>e.statusCode===422);
  assert.equal(h.row(),undefined);
});
test("onboarding: token de outro aplicativo não pode conectar um número",async()=>{
  const h=onboardingHarness();const transport=h.svc.transport;
  h.svc.transport=async(...args)=>args[0].includes("debug_token")?{ok:true,json:async()=>({data:{is_valid:true,app_id:"other-app",scopes:["whatsapp_business_management","whatsapp_business_messaging"]}})}:transport(...args);
  await assert.rejects(h.svc.finish(user,h.input),e=>e.statusCode===403);
  assert.equal(h.row(),undefined);
});
test("ativação: conexão guiada pendente não pode ativar o envio",async()=>{
  const svc=new TenantMessagingService({tenantMessagingConfig:{findUnique:async()=>({onboardingStatus:"PENDING_TEMPLATE"})}});
  await assert.rejects(svc.save(user,{channel:"WHATSAPP",ativo:true}),e=>e.statusCode===422);
});
test("status da portaria não expõe chaves e informa falta de configuração",async()=>{
  const svc=new TenantMessagingService({tenantMessagingConfig:{findUnique:async()=>({enabled:true,channel:"WHATSAPP",secrets:"ciphertext",verifiedAt:new Date(),onboardingStatus:"READY",displayPhone:"+5581999990000"})}});
  const result=await svc.operationalStatus("a");assert.equal(result.channel,"WHATSAPP");assert.equal(result.ready,true);assert.ok(!JSON.stringify(result).includes("ciphertext"));
});
test("contato sem retirada recebe aviso sem código; revogar retirada remove código no reenvio",async()=>{
  const original=[communication.findById,repository.markAttempt,repository.markSent,prisma.package.findFirst,contactsService.eligibleForMessage,provider.send,credentials.ensure,audit.createLog];let sent,generated=0;
  try {
    communication.findById=async()=>({id:"log",condominiumId:"a",referenceId:"p",status:"PENDING",module:"PACKAGE",channel:"EMAIL",recipient:"pessoa1@example.com",contentSnapshot:"Encomenda recebida.",metadata:{contactId:"c",contactNotice:true,pickupCredential:true,condominiumName:"A",apartmentLabel:"101"}});
    repository.markAttempt=async()=>({id:"log"});repository.markSent=async()=>({status:"SENT"});
    prisma.package.findFirst=async()=>({apartmentId:apt});contactsService.eligibleForMessage=async()=>({canPickup:false});
    provider.send=async data=>{sent=data;return {provider:"RESEND",providerMessageId:"id"};};
    credentials.ensure=async()=>{generated++;return {code:"123456"};};audit.createLog=async()=>{};
    await communication.send("log",user);
    assert.equal(generated,0);assert.ok(!JSON.stringify(sent).includes("123456"));assert.match(sent.content,/não autoriza retirar/);
    contactsService.eligibleForMessage=async()=>({canPickup:true});await communication.send("log",user);
    assert.equal(generated,1);assert.match(sent.content,/123456/);
  } finally {[communication.findById,repository.markAttempt,repository.markSent,prisma.package.findFirst,contactsService.eligibleForMessage,provider.send,credentials.ensure,audit.createLog]=original;}
});
test("reenvio concorrente sem aquisição da tentativa não chama o provedor",async()=>{
  const original=[communication.findById,repository.markAttempt,provider.send];let called=false;
  try {communication.findById=async()=>({status:"PENDING"});repository.markAttempt=async()=>null;provider.send=async()=>{called=true;};await assert.rejects(communication.send("id"),e=>e.statusCode===409);assert.equal(called,false);}
  finally {[communication.findById,repository.markAttempt,provider.send]=original;}
});
test("webhook único valida assinatura antes de procurar qualquer condomínio",async()=>{
  settings();let looked=false;const original=prisma.tenantMessagingConfig.findUnique;
  try {prisma.tenantMessagingConfig.findUnique=async()=>{looked=true;};await assert.rejects(webhook.processStatusWebhook({payload:{},rawBody:Buffer.from("{}"),signature:"sha256=invalid"}),e=>e.statusCode===401);assert.equal(looked,false);}
  finally {prisma.tenantMessagingConfig.findUnique=original;}
});
test("webhook único encontra condomínio pelo número autenticado e conta comercial",async()=>{
  settings();const payload={entry:[{id:"300",changes:[{value:{metadata:{phone_number_id:"400"},statuses:[]}}]}]};const rawBody=Buffer.from(JSON.stringify(payload));
  const signature="sha256="+crypto.createHmac("sha256",process.env.META_APP_SECRET).update(rawBody).digest("hex");
  const original=[prisma.tenantMessagingConfig.findUnique,tenantMessaging.provider];let selected;
  try {
    prisma.tenantMessagingConfig.findUnique=async()=>({condominiumId:"tenant-a",wabaId:"300"});
    tenantMessaging.provider=async id=>{selected=id;return {verifyWebhookSignature:()=>{}};};
    const result=await webhook.processStatusWebhook({payload,rawBody,signature});assert.equal(selected,"tenant-a");assert.equal(result.processed.length,1);
  } finally {[prisma.tenantMessagingConfig.findUnique,tenantMessaging.provider]=original;}
});
test("contatos sem login participam do aviso e respeitam consentimento",async()=>{
  const original=[tenantMessaging.get,prisma.condominium.findUnique,credentials.ensure,communication.queueAndSend];const calls=[];
  try {
    tenantMessaging.get=async()=>({channel:"WHATSAPP",ativo:true,templateName:"encomenda_recebida"});prisma.condominium.findUnique=async()=>({name:"A"});credentials.ensure=async()=>({code:"123456"});communication.queueAndSend=async data=>{calls.push(data);return {queued:true};};
    const result=await triggers.notifyPackageArrival({condominiumId:"a",apartment:{id:apt,block:"A",number:"1"},packageRecord:{id:"p"},residents:[],contacts:[{id:"c",...person()},{id:"d",...person(2),whatsappOptIn:false}]});
    assert.equal(result.count,1);assert.equal(calls[0].metadata.contactId,"c");assert.equal(calls[0].recipientUserId,undefined);assert.ok(!JSON.stringify(calls).includes("123456"));
  } finally {[tenantMessaging.get,prisma.condominium.findUnique,credentials.ensure,communication.queueAndSend]=original;}
});
