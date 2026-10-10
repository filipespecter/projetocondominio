import test from "node:test";
import assert from "node:assert/strict";
import {seal,unseal,normalizeWhatsAppPhone} from "../src/utils/MessagingSecrets.js";
import {TenantMessagingService} from "../src/services/TenantMessagingService.js";
import {PackageCredentialService} from "../src/services/PackageCredentialService.js";
import {WhatsAppProvider} from "../src/services/providers/WhatsAppProvider.js";
import PickupCredential from "../src/utils/PickupCredential.js";
process.env.MESSAGING_ENCRYPTION_KEY="a".repeat(64);
test("criptografia não revela segredo e impede troca entre condomínios",()=>{
 const secret=seal({token:"segredo-de-teste"},"tenant-a");
 assert.ok(!secret.includes("segredo-de-teste"));
 assert.deepEqual(unseal(secret,"tenant-a"),{token:"segredo-de-teste"});
 assert.throws(()=>unseal(secret,"tenant-b"));
 assert.throws(()=>unseal(secret.slice(0,-8)+"xxxxxxxx","tenant-a"));
});
test("telefones brasileiros recebem DDI e internacional é preservado",()=>{
 assert.equal(normalizeWhatsAppPhone("(81) 99999-1234"),"5581999991234");
 assert.equal(normalizeWhatsAppPhone("+55 81 99999-1234"),"5581999991234");
 assert.equal(normalizeWhatsAppPhone("+351 912 345 678"),"351912345678");
 for(const number of ["","123","0".repeat(16)]) assert.throws(()=>normalizeWhatsAppPhone(number));
});
test("provider usa credenciais do condomínio mesmo havendo globais",()=>{
 process.env.WHATSAPP_ACCESS_TOKEN="global-token";
 const provider=new WhatsAppProvider({accessToken:"tenant-token",phoneNumberId:"123",apiVersion:"v23.0"});
 assert.equal(provider.accessToken,"tenant-token");
 assert.equal(provider.phoneNumberId,"123");
});
test("consulta de configurações nunca devolve token ou segredo",()=>{
 const service=new TenantMessagingService({});
 const config=service.publicConfig({secrets:"ciphertext",channel:"WHATSAPP",enabled:true},"a");
 assert.equal(config.hasCredentials,true);assert.equal(config.token,"");assert.equal(config.appSecret,"");assert.equal(config.verifyToken,"");
 assert.ok(!JSON.stringify(config).includes("ciphertext"));
});
test("gerente não pode salvar credenciais",async()=>{
 const service=new TenantMessagingService({});
 await assert.rejects(service.save({role:"MANAGER",condominiumId:"a"},{}),e=>e.statusCode===403);
});
test("nenhum condomínio herda as chaves globais",async()=>{
 const service=new TenantMessagingService({tenantMessagingConfig:{findUnique:async()=>null}});
 await assert.rejects(service.provider("a"),e=>e.statusCode===503);
 await assert.rejects(service.provider(null),e=>e.statusCode===422);
});
test("salvar canal protege segredos e auditoria omite valores",async()=>{
 let stored,audit;
 const service=new TenantMessagingService({tenantMessagingConfig:{findUnique:async()=>null,upsert:async args=>{stored=args.create;return stored;}},auditLog:{create:async args=>{audit=args.data;}}});
 const config=await service.save({id:"user",name:"Síndico",role:"CONDOMINIUM_ADMIN",condominiumId:"a"},{channel:"WHATSAPP",ativo:true,phoneNumberId:"123",templateName:"encomenda_recebida",token:"tenant-secret",appSecret:"b".repeat(32),verifyToken:"verify".repeat(6)});
 assert.ok(!stored.secrets.includes("tenant-secret"));assert.ok(!JSON.stringify(audit).includes("tenant-secret"));
 assert.equal(unseal(stored.secrets,"whatsapp:a").accessToken,"tenant-secret");assert.equal(config.token,"");
});
test("reabrir QR retorna a mesma credencial enviada",async()=>{
 const credential={code:"123456",qrToken:"random-token"};
 const pkg={pickupCodeHash:PickupCredential.hash(credential.code),pickupTokenHash:PickupCredential.hash(credential.qrToken)};
 const tx={$queryRaw:async()=>[],package:{findFirst:async()=>pkg},packagePickupSecret:{findFirst:async()=>({encrypted:seal(credential,"pickup:a:p")})}};
 const service=new PackageCredentialService({$transaction:async fn=>fn(tx)});
 assert.deepEqual(await service.ensure("p","a"),credential);
});
test("encomenda entregue não permite recuperar credencial",async()=>{
 const tx={$queryRaw:async()=>[],package:{findFirst:async()=>null}};
 const service=new PackageCredentialService({$transaction:async fn=>fn(tx)});
 await assert.rejects(service.ensure("p","a"),e=>e.statusCode===409);
});
test("geração persiste hashes e segredo criptografado na mesma transação",async()=>{
 let pkg,stored;
 const tx={$queryRaw:async()=>[],package:{findFirst:async args=>args.where.id?{}:null,update:async args=>{pkg=args.data;}},packagePickupSecret:{findFirst:async()=>null,upsert:async args=>{stored=args.create;}}};
 const service=new PackageCredentialService({$transaction:async fn=>fn(tx)});
 const result=await service.ensure("p","a");
 assert.equal(pkg.pickupCodeHash,PickupCredential.hash(result.code));
 assert.equal(pkg.pickupTokenHash,PickupCredential.hash(result.qrToken));
 assert.equal(unseal(stored.encrypted,"pickup:a:p").code,result.code);
});
import prisma from "../src/config/prisma.js";
import tenantMessaging from "../src/services/TenantMessagingService.js";
import packageCredentials from "../src/services/PackageCredentialService.js";
import communication from "../src/services/CommunicationService.js";
import triggers from "../src/services/CommunicationTriggerService.js";
import packages from "../src/services/PackageService.js";

test("sem WhatsApp conectado, aviso usa e-mail sem gravar código no histórico",async()=>{
 const original=[tenantMessaging.get,prisma.condominium.findUnique,packageCredentials.ensure,communication.queueAndSend];let queued;
 try {
  tenantMessaging.get=async()=>({channel:"EMAIL",ativo:false});prisma.condominium.findUnique=async()=>({name:"Condomínio A"});packageCredentials.ensure=async()=>({code:"123456",qrToken:"secret"});communication.queueAndSend=async data=>{queued=data;return {queued:true};};
  const result=await triggers.notifyPackageArrival({condominiumId:"a",apartment:{id:"apt",block:"B",number:"10"},packageRecord:{id:"parcel"},residents:[{userId:"resident"}]});
  assert.equal(queued.channel,"EMAIL");assert.equal(queued.recipientUserId,"resident");assert.equal(queued.condominiumId,"a");assert.equal(queued.metadata.pickupCredential,true);assert.ok(!JSON.stringify(queued).includes("123456"));assert.equal(result.count,1);
 } finally {[tenantMessaging.get,prisma.condominium.findUnique,packageCredentials.ensure,communication.queueAndSend]=original;}
});
test("WhatsApp exige autorização individual e usa modelo do condomínio",async()=>{
 const original=[tenantMessaging.get,prisma.condominium.findUnique,packageCredentials.ensure,communication.queueAndSend];const queued=[];
 try {
  tenantMessaging.get=async()=>({channel:"WHATSAPP",ativo:true,templateName:"encomenda_a",languageCode:"pt_BR"});prisma.condominium.findUnique=async()=>({name:"A"});packageCredentials.ensure=async()=>({code:"123456"});communication.queueAndSend=async data=>{queued.push(data);return {queued:true};};
  const result=await triggers.notifyPackageArrival({condominiumId:"a",apartment:{id:"apt",block:"B",number:"10"},packageRecord:{id:"parcel"},residents:[{userId:"allowed",whatsappOptIn:true},{userId:"blocked",whatsappOptIn:false}]});
  assert.equal(queued.length,1);assert.equal(queued[0].recipientUserId,"allowed");assert.equal(queued[0].templateCode,"encomenda_a");assert.equal(result.results[1].queued,false);
 } finally {[tenantMessaging.get,prisma.condominium.findUnique,packageCredentials.ensure,communication.queueAndSend]=original;}
});
test("falha externa não interrompe avisos dos outros destinatários",async()=>{
 const original=[tenantMessaging.get,prisma.condominium.findUnique,packageCredentials.ensure,communication.queueAndSend];let count=0;
 try {
  tenantMessaging.get=async()=>({channel:"EMAIL"});prisma.condominium.findUnique=async()=>({name:"A"});packageCredentials.ensure=async()=>{throw new Error("unavailable");};communication.queueAndSend=async()=>{count++;throw new Error("unavailable");};
  const result=await triggers.notifyPackageArrival({condominiumId:"a",apartment:{id:"apt",block:"B",number:"10"},packageRecord:{id:"parcel"},residents:[{userId:"one"},{userId:"two"}]});
  assert.equal(count,2);assert.equal(result.results.length,2);assert.ok(result.results.every(r=>r.failed));
 } finally {[tenantMessaging.get,prisma.condominium.findUnique,packageCredentials.ensure,communication.queueAndSend]=original;}
});
test("envio monta modelo aprovado e retorna identificador da Meta",async()=>{
 const original=global.fetch;let request;
 try {
  global.fetch=async(url,options)=>{request={url,...options};return {ok:true,text:async()=>JSON.stringify({messages:[{id:"wamid.test"}]})};};
  const provider=new WhatsAppProvider({accessToken:"tenant-token",phoneNumberId:"123",apiVersion:"v23.0"});
  const result=await provider.send({recipient:"(81) 99999-1234",templateCode:"encomenda_recebida",metadata:{components:[{type:"body",parameters:["A","B - 10","123456"].map(text=>({type:"text",text}))}]}});
  const payload=JSON.parse(request.body);assert.equal(payload.to,"5581999991234");assert.equal(payload.template.components[0].parameters.length,3);assert.equal(payload.template.name,"encomenda_recebida");assert.equal(result.providerMessageId,"wamid.test");assert.ok(request.signal);
 } finally {global.fetch=original;}
});
test("retirada manual sem credencial é recusada",async()=>{
 await assert.rejects(packages.deliver("p","a","Morador",{id:"porteiro"}),e=>e.statusCode===422);
});
