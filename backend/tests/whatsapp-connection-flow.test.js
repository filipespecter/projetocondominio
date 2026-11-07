import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { WhatsAppOnboardingService } from "../src/services/WhatsAppOnboardingService.js";
import { unseal } from "../src/utils/MessagingSecrets.js";

const user = {id:"admin-a",name:"Síndico",role:"CONDOMINIUM_ADMIN",condominiumId:"tenant-a"};
const config = {appId:"100",configId:"200",version:"v23.0",state:"a".repeat(64)};
const input = {state:config.state,code:"oauth-code",wabaId:"300",phoneNumberId:"400",event:"FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING"};
const approved = {id:"500",name:"encomenda_recebida",language:"pt_BR",status:"APPROVED",components:[{type:"BODY",text:"{{1}}: encomenda para {{2}}. Retirada: {{3}}."}]};
const projectRoot = process.env.PROJECT_ROOT || fileURLToPath(new URL("../../",import.meta.url));
const scriptPath = path.join(projectRoot,"src/utils/whatsappSignup.js");

async function browser(protocol="https:") {
  const listeners = new Set();
  const timers = new Map();
  let callback, options, timerId=0, calls=0;
  const window = {location:{protocol},addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn),
    FB:{init(){},login(cb,opts){callback=cb;options=opts;calls++;}}};
  const code = (await readFile(scriptPath,"utf8")).replaceAll("export function ","function ");
  const context = vm.createContext({window,document:{},setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id)});
  vm.runInContext(`${code}\nglobalThis.api={loadMetaSDK,authorizeMeta};`,context);
  return {api:context.api,window,listeners,timers,calls:()=>calls,options:()=>options,
    respond:code=>callback({authResponse:{code}}),
    event:(origin="https://www.facebook.com",data={type:"WA_EMBEDDED_SIGNUP",event:input.event,data:{waba_id:"300",phone_number_id:"400"}})=>{for(const fn of [...listeners]) fn({origin,data});}};
}
function harness({phone={},template=approved,templateError=false,encryptionKey="a".repeat(64),duplicate=false,claim=1}={}) {
  Object.assign(process.env,{META_APP_ID:"100",META_SIGNUP_CONFIG_ID:"200",META_APP_SECRET:"b".repeat(32),META_WEBHOOK_VERIFY_TOKEN:"v".repeat(32),META_GRAPH_VERSION:"v23.0",MESSAGING_ENCRYPTION_KEY:encryptionKey});
  const calls=[];let row;
  const db={messagingConnectionAttempt:{updateMany:async()=>({count:claim})},
    tenantMessagingConfig:{findFirst:async()=>duplicate?{condominiumId:"tenant-b"}:null,findUnique:async()=>row,
      upsert:async({create})=>{row=create;return row;},update:async({data})=>{Object.assign(row,data);return row;}},auditLog:{create:async()=>{}}};
  db.$transaction=async fn=>fn(db);
  const transport=async(url,options)=>{
    calls.push({url,options});let data;
    if(url.includes("oauth/access_token")) data={access_token:"private-token"};
    else if(url.includes("debug_token")) data={data:{is_valid:true,app_id:"100",scopes:["whatsapp_business_management","whatsapp_business_messaging"]}};
    else if(url.includes("phone_numbers")) data={data:[{id:"400",display_phone_number:"+55 81 99999-0000",is_on_biz_app:true,platform_type:"CLOUD_API",...phone}]};
    else if(url.includes("message_templates?")) {
      if(templateError) throw new Error("private-provider-error");
      data={data:template?[template]:[]};
    } else if(url.endsWith("/message_templates")) data={id:"500",status:"PENDING"};
    else data={success:true};
    return {ok:true,json:async()=>data};
  };
  return {svc:new WhatsAppOnboardingService(db,transport),calls,row:()=>row};
}

test("conexão no navegador recusa HTTP antes de abrir o Facebook",async()=>{
  const b=await browser("http:");await assert.rejects(b.api.authorizeMeta(config),/HTTPS/);assert.equal(b.calls(),0);
});
test("abertura preserva clique síncrono e pede app Business com sessão 3",async()=>{
  const b=await browser();const promise=b.api.authorizeMeta(config);
  assert.equal(b.calls(),1);assert.equal(b.options().extras.featureType,"whatsapp_business_app_onboarding");
  assert.equal(b.options().extras.sessionInfoVersion,"3");assert.equal(b.options().response_type,"code");
  b.respond("oauth-code");b.event();assert.equal((await promise).wabaId,"300");assert.equal(b.listeners.size,0);assert.equal(b.timers.size,0);
});
test("eventos de domínio forjado não concluem autorização; ordem de retorno é indiferente",async()=>{
  const b=await browser();const promise=b.api.authorizeMeta(config);
  b.event("https://www.facebook.com.evil.test");b.event("https://evil.test");assert.equal(b.listeners.size,1);
  b.event("https://web.facebook.com");b.respond("oauth-code");
  assert.equal((await promise).phoneNumberId,"400");
});
test("cancelamento limpa a tentativa e callback atrasado não interfere na próxima",async()=>{
  const b=await browser();const first=b.api.authorizeMeta(config);
  const rejected=assert.rejects(first,/não foi concluída/);
  b.event(undefined,{type:"WA_EMBEDDED_SIGNUP",event:"CANCEL"});await rejected;
  b.respond("late-code");assert.equal(b.listeners.size,0);
  const next=b.api.authorizeMeta(config);b.event();b.respond("new-code");assert.equal((await next).code,"new-code");
});
test("conta sem número e sessão inválida apresentam erro sem chamar conclusão",async()=>{
  for(const data of [{type:"WA_EMBEDDED_SIGNUP",event:"FINISH_ONLY_WABA",data:{waba_id:"300"}},
    {type:"WA_EMBEDDED_SIGNUP",event:"FINISH",data:{waba_id:"invalid"}}]) {
    const b=await browser();const promise=b.api.authorizeMeta(config);const rejected=assert.rejects(promise);b.event(undefined,data);await rejected;assert.equal(b.listeners.size,0);
  }
});
test("duas janelas simultâneas não compartilham sessão de autorização",async()=>{
  const b=await browser();const first=b.api.authorizeMeta(config);await assert.rejects(b.api.authorizeMeta(config),/andamento/);
  assert.equal(b.calls(),1);b.event();b.respond("oauth-code");await first;
});
test("expiração encerra listeners e permite preparar outra tentativa",async()=>{
  const b=await browser();const promise=b.api.authorizeMeta(config);const rejected=assert.rejects(promise,/expirou/);
  [...b.timers.values()][0]();await rejected;assert.equal(b.listeners.size,0);
});
test("SDK não mistura IDs de aplicativos em uma página já inicializada",async()=>{
  const b=await browser();await b.api.loadMetaSDK(config);await assert.rejects(b.api.loadMetaSDK({...config,appId:"999"}),/configuração mudou/);
});
test("coexistência confirmada pela Meta não chama register mesmo com evento FINISH",async()=>{
  const h=harness();const result=await h.svc.finish(user,{...input,event:"FINISH"});
  assert.equal(result.ready,true);assert.equal(result.connected,true);assert.equal(h.row().enabled,false);
  assert.equal(h.calls.some(c=>c.url.endsWith("/register")),false);
  const secrets=unseal(h.row().secrets,"whatsapp:tenant-a");assert.equal(secrets.accessToken,"private-token");assert.equal("registrationPin" in secrets,false);
  assert.ok(h.calls.some(c=>c.url.includes("is_on_biz_app")));
});
test("modalidade desconhecida, divergente ou incompleta não registra nem salva o número",async()=>{
  for(const phone of [{is_on_biz_app:undefined},{is_on_biz_app:false},{platform_type:"ON_PREMISE"}]) {
    const h=harness({phone});await assert.rejects(h.svc.finish(user,input),e=>e.statusCode===422);
    assert.equal(h.row(),undefined);assert.equal(h.calls.some(c=>c.url.endsWith("/register")),false);
  }
});
test("número novo confirmado pela Meta mantém o fluxo de registro existente",async()=>{
  const h=harness({phone:{is_on_biz_app:false}});await h.svc.finish(user,{...input,event:"FINISH"});
  assert.equal(h.calls.filter(c=>c.url.endsWith("/register")).length,1);
});
test("chave de criptografia inválida bloqueia antes de qualquer chamada à Meta",async()=>{
  const h=harness({encryptionKey:"invalid"});await assert.rejects(h.svc.finish(user,input),e=>e.statusCode===503);assert.equal(h.calls.length,0);
});
test("sessão de outro usuário ou expirada e número de outro condomínio não são vinculados",async()=>{
  for(const options of [{claim:0},{duplicate:true}]) {
    const h=harness(options);await assert.rejects(h.svc.finish(user,input));assert.equal(h.row(),undefined);
    assert.equal(h.calls.some(c=>c.url.endsWith("/register")||c.url.endsWith("/subscribed_apps")),false);
  }
});
test("falha do modelo após autorização preserva conexão e informa etapa pendente",async()=>{
  const h=harness({templateError:true});const result=await h.svc.finish(user,input);
  assert.equal(result.connected,true);assert.equal(result.ready,false);assert.equal(h.row().enabled,false);
  assert.match(result.message,/autorizado e salvo/);assert.ok(!JSON.stringify(result).includes("private-"));
});
test("modelo recusado ou aprovado com conteúdo incompatível não fica pronto",async()=>{
  for(const template of [{...approved,status:"REJECTED"},{...approved,components:[{type:"BODY",text:"Hello world"}]}]) {
    const h=harness({template});const result=await h.svc.finish(user,input);assert.equal(result.ready,false);assert.equal(h.row().enabled,false);
    assert.match(result.message,/suporte/);
  }
});
test("consulta do modelo solicita componentes e não retorna segredos ao navegador",async()=>{
  const h=harness();const result=await h.svc.finish(user,input);
  const query=new URL(h.calls.find(c=>c.url.includes("message_templates?")).url).searchParams;
  assert.equal(query.get("fields"),"id,name,language,status,components");
  assert.ok(!JSON.stringify(result).includes("private-token"));
});
