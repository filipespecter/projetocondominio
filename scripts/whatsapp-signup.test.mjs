import test from "node:test";
import assert from "node:assert/strict";
import { authorizeMeta } from "../src/utils/whatsappSignup.js";

function browser() {
  const listeners=new Set();let callback,options;
  globalThis.window={FB:{login:(cb,opts)=>{callback=cb;options=opts;}},addEventListener:(_type,fn)=>listeners.add(fn),removeEventListener:(_type,fn)=>listeners.delete(fn)};
  return {listeners,callback:value=>callback(value),options:()=>options,emit:(data,origin="https://www.facebook.com")=>listeners.forEach(fn=>fn({origin,data:JSON.stringify(data)}))};
}
const config={state:"nonce",configId:"config"};
test("Meta SDK: popup é aberto no clique; código e sessão podem chegar em qualquer ordem",async()=>{
  const b=browser();const result=authorizeMeta(config);
  assert.equal(b.options().response_type,"code");assert.equal(b.options().config_id,"config");
  b.emit({type:"WA_EMBEDDED_SIGNUP",event:"FINISH",data:{waba_id:"300",phone_number_id:"400"}});
  b.callback({authResponse:{code:"oauth-code"}});
  assert.deepEqual(await result,{code:"oauth-code",state:"nonce",wabaId:"300",phoneNumberId:"400",event:"FINISH"});assert.equal(b.listeners.size,0);
});
test("Meta SDK: mensagem de domínio forjado é ignorada",async()=>{
  const b=browser();const result=authorizeMeta(config);b.callback({authResponse:{code:"code"}});
  b.emit({type:"WA_EMBEDDED_SIGNUP",event:"FINISH",data:{waba_id:"999",phone_number_id:"999"}},"https://www.facebook.com.attacker.invalid");
  b.emit({type:"WA_EMBEDDED_SIGNUP",event:"FINISH",data:{waba_id:"300",phone_number_id:"400"}});
  assert.equal((await result).wabaId,"300");
});
test("Meta SDK: coexistência pode retornar apenas WABA para resolução segura no servidor",async()=>{
  const b=browser();const result=authorizeMeta(config);b.callback({authResponse:{code:"code"}});
  b.emit({type:"WA_EMBEDDED_SIGNUP",event:"FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING",data:{waba_id:"300"}});
  assert.equal((await result).phoneNumberId,undefined);assert.equal(b.listeners.size,0);
});
test("Meta SDK: cancelamento remove listener e não conclui conexão",async()=>{
  const b=browser();const result=authorizeMeta(config);const rejection=assert.rejects(result,/cancelada/);
  b.callback({});await rejection;assert.equal(b.listeners.size,0);
});
