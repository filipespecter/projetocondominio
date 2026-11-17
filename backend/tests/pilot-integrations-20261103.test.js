import test from "node:test";
import assert from "node:assert/strict";
import {requestRecovery,confirmRecovery} from "../src/services/PasswordRecoveryService.js";
import Password from "../src/utils/Password.js";
import {packageEmail} from "../src/utils/packageEmail.js";
import {assertPaymentMatches} from "../src/utils/paymentConsistency.js";
import email from "../src/services/providers/EmailProvider.js";
import mercado from "../src/services/providers/MercadoPagoProvider.js";
import communication from "../src/services/CommunicationService.js";
import logs from "../src/repositories/CommunicationLogRepository.js";
import providers from "../src/services/CommunicationProviderService.js";
import payments from "../src/services/PaymentGatewayOrchestratorService.js";
import gateway from "../src/services/PaymentGatewayService.js";
import charges from "../src/repositories/ChargeRepository.js";
import transactions from "../src/repositories/PaymentTransactionRepository.js";
import audit from "../src/services/AuditLogService.js";
import AuthService from "../src/services/AuthService.js";
import users from "../src/repositories/UserRepository.js";
import authSessions from "../src/services/AuthSessionService.js";
import userSessions from "../src/services/UserSessionService.js";

const input={portalType:"sindico",email:"qa@example.com"};
const password="Frase exclusiva de validacao!726";
function fixture() {
  let state={codes:[],user:{id:"u1",name:"QA",email:input.email,role:"CONDOMINIUM_ADMIN",status:"ACTIVE",condominiumId:"c1",passwordHash:"previous",securityVersion:1},audits:[],revoked:false};
  let queue=Promise.resolve(),failAudit=false;
  const sent=[];
  const match=(c,w)=>Object.entries(w).every(([k,v])=>v&&typeof v==="object"&&!(v instanceof Date)?("gt" in v?c[k]>v.gt:"lt" in v?c[k]<v.lt:true):c[k]===v);
  const db={$transaction:async fn=>{
    const previous=queue;let release;queue=new Promise(r=>{release=r;});await previous;
    const snapshot=structuredClone(state);
    const tx={
      $queryRaw:async (_parts,id)=>{assert.equal(id,"u1");return [{id}];},
      passwordResetCode:{
        updateMany:async ({where,data})=>{let count=0;for(const c of state.codes)if(match(c,where)){Object.assign(c,data);count++;}return {count};},
        create:async ({data})=>{state.codes.push({...data,id:String(state.codes.length),createdAt:new Date(),usedAt:null,attempts:0});},
        findFirst:async ({where})=>state.codes.filter(c=>match(c,where)).at(-1)||null,
        update:async ({where,data})=>{state.codes.find(c=>c.id===where.id).attempts+=data.attempts.increment;},
      },
      user:{update:async ({data})=>{const {securityVersion,...rest}=data;Object.assign(state.user,rest);state.user.securityVersion+=securityVersion.increment;}},
      authSession:{updateMany:async()=>{state.revoked=true;}},
      auditLog:{create:async ({data})=>{if(failAudit)throw Error("AUDIT_FAILURE");state.audits.push(data);}},
    };
    try{return await fn(tx);}catch(e){state=snapshot;throw e;}finally{release();}
  }};
  const deps={db,findUser:async data=>data.email===input.email?state.user:null,validateAccess:()=>{},hashPassword:value=>Password.hash(value),send:async message=>{sent.push(message);}};
  return {deps,sent,state:()=>state,failAudit:value=>{failAudit=value;},code:()=>sent.at(-1).content.match(/é (\d{6})/)[1]};
}
const confirmation=f=>({...input,code:f.code(),newPassword:password,newPasswordConfirmation:password});

test("recuperação: pedido, troca e login pelo AuthService com a nova senha",async t=>{
  const f=fixture();await requestRecovery(input,null,f.deps);const data=confirmation(f);
  await confirmRecovery(data,null,f.deps);
  assert.equal(await Password.compare(password,f.state().user.passwordHash),true);
  assert.equal(await Password.compare("previous",f.state().user.passwordHash),false);
  assert.equal(f.state().revoked,true);assert.equal(f.state().user.securityVersion,2);
  assert.ok(f.state().audits.some(a=>a.action==="PASSWORD_RESET_CONFIRMED"));
  const current=()=>({...f.state().user,loginEnabled:true,condominium:{status:"ACTIVE"}});
  t.mock.method(users,"findLoginCandidates",async()=>[current()]);
  t.mock.method(users,"registerSuccessfulLogin",async()=>{});
  t.mock.method(users,"findById",async()=>current());
  t.mock.method(authSessions,"create",async()=>({sessionId:"qa",accessToken:"test-session"}));
  t.mock.method(userSessions,"start",async()=>{});
  t.mock.method(audit,"logLogin",async()=>{});
  const result=await AuthService.login({portalType:"sindico",username:"qa",password});
  assert.equal(result.user.id,"u1");assert.equal("passwordHash" in result.user,false);
  await assert.rejects(confirmRecovery(data,null,f.deps),e=>e.statusCode===400);
});
test("recuperação: auditoria falha causa rollback, código continua utilizável e senha anterior é mantida",async()=>{
  const f=fixture();await requestRecovery(input,null,f.deps);f.failAudit(true);
  await assert.rejects(confirmRecovery(confirmation(f),null,f.deps),/AUDIT_FAILURE/);
  assert.equal(f.state().user.passwordHash,"previous");assert.equal(f.state().revoked,false);assert.equal(f.state().codes[0].usedAt,null);
  f.failAudit(false);await confirmRecovery(confirmation(f),null,f.deps);
});
test("recuperação: duas confirmações simultâneas só permitem um sucesso",async()=>{
  const f=fixture();await requestRecovery(input,null,f.deps);
  const results=await Promise.allSettled([confirmRecovery(confirmation(f),null,f.deps),confirmRecovery(confirmation(f),null,f.deps)]);
  assert.equal(results.filter(r=>r.status==="fulfilled").length,1);assert.equal(f.state().user.securityVersion,2);
});
test("recuperação: pedidos concorrentes deixam só um código vigente",async()=>{
  const f=fixture();await Promise.all([requestRecovery(input,null,f.deps),requestRecovery(input,null,f.deps)]);
  assert.equal(f.state().codes.filter(c=>c.usedAt===null).length,1);
});
test("recuperação: cinco tentativas erradas persistem e impedem o código correto",async()=>{
  const f=fixture();await requestRecovery(input,null,f.deps);const data=confirmation(f);const wrong=data.code==="000000"?"000001":"000000";
  for(let i=0;i<5;i++)await assert.rejects(confirmRecovery({...data,code:wrong},null,f.deps));
  assert.equal(f.state().codes[0].attempts,5);await assert.rejects(confirmRecovery(data,null,f.deps));
});
test("recuperação: código expirado, curto e senhas comuns não alteram a senha",async()=>{
  const f=fixture();await requestRecovery(input,null,f.deps);const data=confirmation(f);
  for(const p of ["curta","123456789012"])await assert.rejects(confirmRecovery({...data,newPassword:p,newPasswordConfirmation:p},null,f.deps));
  f.state().codes[0].expiresAt=new Date(0);await assert.rejects(confirmRecovery(data,null,f.deps));assert.equal(f.state().user.passwordHash,"previous");
});
test("recuperação: pedido não revela existência do e-mail nem falha do provedor",async()=>{
  const f=fixture();const absent=await requestRecovery({...input,email:"ausente@example.com"},null,f.deps);
  const failed=await requestRecovery(input,null,{...f.deps,send:async()=>{throw Error("private-key");}});
  assert.deepEqual(failed,absent);assert.equal(f.state().codes.filter(c=>c.usedAt===null).length,0);
});
test("Central recusa os dois endpoints antes de consultar usuário e mantém mapa de login",async()=>{
  for(const fn of [requestRecovery,confirmRecovery])await assert.rejects(fn({portalType:"platform"},null,{}),e=>e.statusCode===403);
  assert.ok(AuthService.rolesForPortal("platform").includes("PLATFORM_OWNER"));
});
test("e-mail de encomenda: HTML escapa dados, tem texto, fuso e não inventa autorização",()=>{
  const result=packageEmail({condominiumName:'<script>empresa</script>',recipientName:'<img src=x onerror="alert(1)">',apartmentLabel:"Bloco A, Apto 101",packageRecord:{type:"Caixa",description:"<b>frágil</b>",carrier:"A&B",receivedAt:"2026-11-03T15:30:00Z"},instructions:"Avise o responsável autorizado. Este aviso não autoriza retirar a encomenda."});
  assert.match(result.subject,/Bloco A, Apto 101/);assert.match(result.content,/12:30:00/);assert.match(result.html,/&lt;script&gt;/);assert.match(result.html,/A&amp;B/);assert.doesNotMatch(result.html,/<script|<img/);assert.doesNotMatch(result.content,/Código de retirada/);
});
test("Resend envia HTML e texto e não considera resposta sem identificador um sucesso",async t=>{
  const previous={...process.env};
  try {
    Object.assign(process.env,{EMAIL_PROVIDER:"RESEND",EMAIL_API_KEY:"test-placeholder",EMAIL_FROM:"qa@example.com"});
    let body;t.mock.method(globalThis,"fetch",async(_url,options)=>{body=JSON.parse(options.body);return {ok:true,json:async()=>({id:"mail-1"})};});
    await email.send({recipient:"qa@example.com",content:"Texto",html:"<p>Texto</p>"});assert.equal(body.text,"Texto");assert.equal(body.html,"<p>Texto</p>");
    globalThis.fetch=async()=>({ok:true,json:async()=>({})});await assert.rejects(email.send({recipient:"qa@example.com",content:"Texto"}),e=>e.statusCode===502);
  } finally {for(const k of ["EMAIL_PROVIDER","EMAIL_API_KEY","EMAIL_FROM"])if(previous[k]===undefined)delete process.env[k];else process.env[k]=previous[k];}
});
const charge={id:"charge-a",amountInCents:30000};
const payment={providerPaymentId:"p1",externalReference:charge.id,currency:"BRL",transactionAmount:300,status:"approved"};
test("pagamento: valor, moeda, referência e identificador divergentes impedem a baixa",()=>{
  assert.doesNotThrow(()=>assertPaymentMatches(charge,payment,"p1"));
  for(const change of [{transactionAmount:1},{currency:"USD"},{externalReference:"other"},{providerPaymentId:"other"},{transactionAmount:300.001},{transactionAmount:null}])assert.throws(()=>assertPaymentMatches(charge,{...payment,...change},"p1"),e=>e.statusCode===409);
});
test("sincronização recusa divergência antes de criar transação ou baixar cobrança",async t=>{
  let writes=0;t.mock.method(gateway,"getPayment",async()=>({...payment,transactionAmount:1}));
  t.mock.method(charges,"findByProviderChargeId",async()=>charge);
  t.mock.method(transactions,"findByProviderPaymentId",async()=>{writes++;});
  t.mock.method(charges,"markPaid",async()=>{writes++;});
  await assert.rejects(payments.synchronizeProviderPayment({provider:"MERCADO_PAGO",providerPaymentId:"p1"}),e=>e.statusCode===409);assert.equal(writes,0);
});
test("Mercado Pago aplica timeout e preserva a chave de idempotência no transporte",async t=>{
  const prev=process.env.MERCADO_PAGO_ACCESS_TOKEN, enabled=process.env.MERCADO_PAGO_ENABLED;process.env.MERCADO_PAGO_ACCESS_TOKEN="test-placeholder";process.env.MERCADO_PAGO_ENABLED="true";
  try {let options;t.mock.method(globalThis,"fetch",async(_u,o)=>{options=o;throw Error("private-token");});
    await assert.rejects(mercado.request("/v1/payments",{method:"POST",body:{},idempotencyKey:"stable-key"}),e=>e.statusCode===502&&!e.message.includes("private-token"));
    assert.ok(options.signal);assert.equal(options.headers["X-Idempotency-Key"],"stable-key");
  }finally{if(enabled===undefined)delete process.env.MERCADO_PAGO_ENABLED;else process.env.MERCADO_PAGO_ENABLED=enabled;if(prev===undefined)delete process.env.MERCADO_PAGO_ACCESS_TOKEN;else process.env.MERCADO_PAGO_ACCESS_TOKEN=prev;}
});
test("exceção local não sobrescreve entrega confirmada durante o envio",async t=>{
  let reads=0,failed=0;
  t.mock.method(communication,"findById",async()=>++reads===1?{id:"log",status:"PENDING",contentSnapshot:"Aviso",channel:"EMAIL"}:{id:"log",status:"DELIVERED"});
  t.mock.method(logs,"markAttempt",async()=>({id:"log"}));t.mock.method(providers,"send",async()=>({provider:"RESEND",providerMessageId:"mail"}));
  t.mock.method(logs,"markSent",async()=>{throw Error("DB_FAILURE");});t.mock.method(logs,"markFailed",async()=>{failed++;});
  assert.equal((await communication.send("log")).status,"DELIVERED");assert.equal(failed,0);
});
test("repositório protege DELIVERED e diferencia falha local de falha autenticada do provedor",async t=>{
  let query;t.mock.method(logs,"updateMany",async where=>{query=where;return {count:0};});
  await logs.markFailed("id","error");assert.deepEqual(query.status.in,["PENDING","FAILED"]);
  await logs.markFailed("id","error",{},true);assert.deepEqual(query.status.in,["PENDING","FAILED","SENT"]);assert.equal(query.status.in.includes("DELIVERED"),false);
});

test("pagamento: reserva persistente impede concorrência e repetição após resultado incerto",async()=>{
  const {reservePaymentAttempt,releaseRejectedAttempt}=await import("../src/utils/paymentAttempt.js");
  const current={id:"charge-a",status:"PENDING",providerChargeId:null,metadata:{keep:"preserve"}};
  let queue=Promise.resolve();
  const db={$transaction:async fn=>{const previous=queue;let release;queue=new Promise(r=>{release=r;});await previous;
    try{return await fn({$queryRaw:async()=>[],charge:{findUnique:async()=>current,update:async({data})=>Object.assign(current,data)}});}finally{release();}}};
  const snapshot={...current};
  const results=await Promise.allSettled([reservePaymentAttempt(db,snapshot,"key"),reservePaymentAttempt(db,snapshot,"key")]);
  assert.equal(results.filter(r=>r.status==="fulfilled").length,1);assert.equal(current.metadata.gatewayAttemptPending,true);
  await assert.rejects(reservePaymentAttempt(db,snapshot,"key"),e=>e.statusCode===409);
  await releaseRejectedAttempt(db,current.id,"another-key");assert.equal(current.metadata.gatewayAttemptPending,true);
  await releaseRejectedAttempt(db,current.id,"key");assert.equal(current.metadata.gatewayAttemptPending,false);assert.equal(current.metadata.keep,"preserve");
});

test("pagamento incerto é reconciliado pelo webhook usando referência e valor conferidos",async t=>{
  const candidate={...charge,providerChargeId:null,metadata:{gatewayAttemptPending:true,gatewayAttemptPriorPaymentId:null}};
  let attached,paid=0;
  t.mock.method(gateway,"getPayment",async()=>({...payment,status:"pending"}));
  t.mock.method(charges,"findByProviderChargeId",async()=>null);
  t.mock.method(charges,"findById",async()=>candidate);
  t.mock.method(charges,"updateProviderData",async(_id,data)=>{attached=data;});
  t.mock.method(transactions,"findByProviderPaymentId",async()=>({id:"tx"}));
  t.mock.method(transactions,"updateStatus",async()=>({id:"tx",status:"PENDING"}));
  t.mock.method(charges,"markPaid",async()=>{paid++;});
  const result=await payments.synchronizeProviderPayment({provider:"MERCADO_PAGO",providerPaymentId:"p1"});
  assert.equal(result.ignored,false);assert.equal(attached.providerChargeId,"p1");assert.equal(attached.metadata.gatewayAttemptPending,false);assert.equal(paid,0);
});

test("processamento bloqueia nova chamada ao gateway depois de timeout",async t=>{
  const {default:prisma}=await import("../src/config/prisma.js");
  const current={...charge,condominiumId:"c1",providerChargeId:null,status:"PENDING",metadata:{}};
  t.mock.method(payments,"getChargeContext",async()=>({charge:{...current},condominium:{email:"qa@example.com"},paymentMethod:{provider:"MERCADO_PAGO",type:"PIX"}}));
  const originalTransaction=prisma.$transaction;
  prisma.$transaction=async fn=>fn({$queryRaw:async()=>[],charge:{findUnique:async()=>current,update:async({data})=>Object.assign(current,data)}});
  t.after(()=>{prisma.$transaction=originalTransaction;});
  let calls=0;
  t.mock.method(mercado,"ensureConfigured",()=>{});
  t.mock.method(mercado,"ensureWebhookConfigured",()=>{});
  t.mock.method(mercado,"createPixOrder",async args=>{calls++;assert.match(args.idempotencyKey,/^[a-f0-9]{64}$/);throw Object.assign(Error("timeout"),{statusCode:502});});
  await assert.rejects(payments.processCharge(charge.id,{},null,{requestId:"first"}),e=>e.statusCode===502);
  await assert.rejects(payments.processCharge(charge.id,{},null,{requestId:"second"}),e=>e.statusCode===409);
  assert.equal(calls,1);assert.equal(current.metadata.gatewayAttemptPending,true);
});
