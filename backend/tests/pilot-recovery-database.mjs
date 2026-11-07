// Explicit, isolated Homolog check. No email sent; every fixture is rolled back.
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import prisma from "../src/config/prisma.js";
import Password from "../src/utils/Password.js";
import {requestRecovery,confirmRecovery} from "../src/services/PasswordRecoveryService.js";
const url=new URL(process.env.DATABASE_URL||"http://invalid");
if(url.hostname!=="postgres"||url.pathname!=="/infinitycondo_homolog"||process.env.NODE_ENV==="production"||process.env.PILOT_RECOVERY_TEST!=="true")throw Error("Teste permitido somente na Homolog local explicitamente autorizada.");
const rollback=new Error("QA_ROLLBACK");
let checks=0;
try{
 await prisma.$transaction(async tx=>{
  const condo=await tx.condominium.create({data:{code:`QA-RECOVERY-${randomUUID()}`,name:"QA recuperação transacional",status:"ACTIVE"}});
  const oldPassword="Senha anterior exclusiva!2468",newPassword="Nova frase exclusiva!8642";
  const user=await tx.user.create({data:{condominiumId:condo.id,name:"QA recuperação",username:randomUUID(),email:`qa-${randomUUID()}@example.com`,passwordHash:await Password.hash(oldPassword),role:"CONDOMINIUM_ADMIN",status:"ACTIVE"}});
  const session=await tx.authSession.create({data:{userId:user.id,tokenFamilyId:randomUUID(),refreshTokenHash:randomUUID(),expiresAt:new Date(Date.now()+600000)}});
  let failAudit=false;
  const db=new Proxy(tx,{get(target,key){
   if(key==="$transaction")return async fn=>{
    await tx.$executeRaw`SAVEPOINT qa_password_recovery`;
    try{const result=await fn(db);await tx.$executeRaw`RELEASE SAVEPOINT qa_password_recovery`;return result;}
    catch(error){await tx.$executeRaw`ROLLBACK TO SAVEPOINT qa_password_recovery`;await tx.$executeRaw`RELEASE SAVEPOINT qa_password_recovery`;throw error;}
   };
   if(key==="auditLog"&&failAudit)return {create:async()=>{throw Error("QA_AUDIT_FAILURE");}};
   return Reflect.get(target,key);
  }});
  let code;
  const deps={db,findUser:async data=>data.email===user.email?user:null,validateAccess:()=>{},hashPassword:value=>Password.hash(value),send:async message=>{code=message.content.match(/é (\d{6})/)[1];}};
  const data={portalType:"sindico",email:user.email};
  await requestRecovery(data,null,deps);
  assert.equal(await tx.passwordResetCode.count({where:{userId:user.id,usedAt:null}}),1);checks++;
  const confirmation={...data,code,newPassword,newPasswordConfirmation:newPassword};
  failAudit=true;
  await assert.rejects(confirmRecovery(confirmation,null,deps),/QA_AUDIT_FAILURE/);
  let saved=await tx.user.findUnique({where:{id:user.id}});
  assert.equal(await Password.compare(oldPassword,saved.passwordHash),true);
  assert.equal(await tx.passwordResetCode.count({where:{userId:user.id,usedAt:null}}),1);checks++;
  failAudit=false;await confirmRecovery(confirmation,null,deps);
  saved=await tx.user.findUnique({where:{id:user.id}});
  assert.equal(await Password.compare(newPassword,saved.passwordHash),true);
  assert.equal(await Password.compare(oldPassword,saved.passwordHash),false);
  assert.equal((await tx.authSession.findUnique({where:{id:session.id}})).revokeReason,"PASSWORD_RESET");checks++;
  assert.equal(saved.mustChangePassword,false);assert.equal(saved.securityVersion,user.securityVersion+1);checks++;
  await assert.rejects(confirmRecovery(confirmation,null,deps),e=>e.statusCode===400);checks++;
  assert.equal(await tx.auditLog.count({where:{userId:user.id,action:"PASSWORD_RESET_CONFIRMED"}}),1);checks++;
  throw rollback;
 },{timeout:60000,maxWait:10000});
}catch(error){if(error!==rollback)throw error;}
finally{await prisma.$disconnect();}
console.log(`RECUPERACAO_BANCO_OK: ${checks} verificações; fixtures revertidas, sem envios externos.`);
