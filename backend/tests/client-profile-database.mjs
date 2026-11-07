// Explicit isolated Homolog check. All fixtures roll back; transport is simulated.
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import prisma from "../src/config/prisma.js";
import {readClientProfile,updateClientProfile} from "../src/services/ClientProfileService.js";
import {requestRecovery} from "../src/services/PasswordRecoveryService.js";
const url=new URL(process.env.DATABASE_URL||"http://invalid");
if(url.hostname!=="postgres"||url.pathname!=="/infinitycondo_homolog"||process.env.NODE_ENV==="production"||process.env.PILOT_CLIENT_PROFILE_TEST!=="true")throw Error("Teste permitido somente na Homolog local explicitamente autorizada.");
const rollback=new Error("QA_CLIENT_PROFILE_ROLLBACK");let checks=0;
try{
 await prisma.$transaction(async tx=>{
  const tag=randomUUID();
  const condo=await tx.condominium.create({data:{code:`QA-PROFILE-${tag}`,name:"QA ficha anterior",status:"ACTIVE"}});
  const actor=await tx.user.create({data:{name:"QA proprietário",username:`qa-owner-${tag}`,role:"PLATFORM_OWNER",passwordHash:"not-a-login-hash",mustChangePassword:false}});
  const admin=await tx.user.create({data:{condominiumId:condo.id,name:"QA administrador",username:`qa-admin-${tag}`,email:`qa-old-${tag}@example.com`,role:"CONDOMINIUM_ADMIN",passwordHash:"preserve-this-hash",mustChangePassword:false}});
  const plan=await tx.plan.create({data:{code:`QA-PROFILE-${tag}`,name:"QA plano",monthlyPriceInCents:30000}});
  const subscription=await tx.subscription.create({data:{condominiumId:condo.id,planId:plan.id,priceInCents:30000,currentPeriodStart:new Date(),currentPeriodEnd:new Date(Date.now()+86400000),billingEmail:`qa-billing-${tag}@example.com`}});
  const session=await tx.authSession.create({data:{userId:admin.id,tokenFamilyId:randomUUID(),refreshTokenHash:randomUUID(),expiresAt:new Date(Date.now()+600000)}});
  const reset=await tx.passwordResetCode.create({data:{userId:admin.id,codeHash:"qa-old-code",expiresAt:new Date(Date.now()+600000)}});
  let failAudit=false;
  const db=new Proxy(tx,{get(target,key){
   if(key==="$transaction")return async fn=>{
    await tx.$executeRaw`SAVEPOINT qa_client_profile`;
    try{const result=await fn(db);await tx.$executeRaw`RELEASE SAVEPOINT qa_client_profile`;return result;}
    catch(error){await tx.$executeRaw`ROLLBACK TO SAVEPOINT qa_client_profile`;await tx.$executeRaw`RELEASE SAVEPOINT qa_client_profile`;throw error;}
   };
   if(key==="auditLog"&&failAudit)return {create:async()=>{throw Error("QA_PROFILE_AUDIT_FAILURE");}};
   return Reflect.get(target,key);
  }});
  const before=await readClientProfile({actor,condominiumId:condo.id,administratorId:admin.id},{db});
  const {updatedAt:condoVersion,id:_condoId,...fields}=before.condominium;
  const {updatedAt:adminVersion,...adminFields}=before.administrator;
  const data={condominium:{...Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,v??""])),name:"QA nome atualizado",city:"Recife",state:"PE",expectedUpdatedAt:condoVersion.toISOString()},administrator:{...Object.fromEntries(Object.entries(adminFields).map(([k,v])=>[k,v??""])),username:`qa-new-${tag}`,email:`qa-new-${tag}@example.com`,expectedUpdatedAt:adminVersion.toISOString()},billingContact:{id:subscription.id,expectedUpdatedAt:before.billingContact.updatedAt.toISOString(),name:"Novo financeiro",email:`qa-new-billing-${tag}@example.com`,phone:"81999990000"}};
  failAudit=true;await assert.rejects(updateClientProfile({actor,condominiumId:condo.id,data},{db}),/QA_PROFILE_AUDIT_FAILURE/);
  assert.equal((await tx.condominium.findUnique({where:{id:condo.id}})).name,condo.name);
  assert.equal((await tx.user.findUnique({where:{id:admin.id}})).email,admin.email);
  assert.equal((await tx.authSession.findUnique({where:{id:session.id}})).revokedAt,null);checks++;
  failAudit=false;
  const saved=await updateClientProfile({actor,condominiumId:condo.id,data},{db});
  assert.equal(saved.condominium.name,"QA nome atualizado");assert.equal(saved.administrator.email,data.administrator.email);checks++;
  const actualAdmin=await tx.user.findUnique({where:{id:admin.id}}),actualSubscription=await tx.subscription.findUnique({where:{id:subscription.id}});
  assert.equal(actualAdmin.passwordHash,admin.passwordHash);assert.equal(actualAdmin.mustChangePassword,false);assert.equal(actualSubscription.priceInCents,30000);assert.equal(actualSubscription.planId,plan.id);assert.equal(actualSubscription.billingEmail,data.billingContact.email);checks++;
  assert.equal((await tx.authSession.findUnique({where:{id:session.id}})).revokeReason,"CLIENT_PROFILE_ACCESS_CHANGED");assert.ok((await tx.passwordResetCode.findUnique({where:{id:reset.id}})).usedAt);checks++;
  await assert.rejects(updateClientProfile({actor,condominiumId:condo.id,data},{db}),e=>e.statusCode===409);checks++;
  let recipient;
  await requestRecovery({portalType:"sindico",email:saved.administrator.email},null,{db,findUser:async input=>tx.user.findFirst({where:{id:admin.id,email:input.email,role:"CONDOMINIUM_ADMIN"}}),validateAccess:()=>{},send:async message=>{recipient=message.recipient;}});
  assert.equal(recipient,data.administrator.email);checks++;
  assert.equal(await tx.auditLog.count({where:{condominiumId:condo.id,module:"PLATFORM_CLIENT_PROFILE"}}),1);checks++;
  throw rollback;
 },{timeout:60000,maxWait:10000});
}catch(error){if(error!==rollback)throw error;}
finally{await prisma.$disconnect();}
console.log(`FICHA_CLIENTE_BANCO_OK: ${checks} verificações; fixtures revertidas, sem envios externos.`);
