const origins=new Set(["https://www.facebook.com","https://web.facebook.com"]);
let sdkPromise;
export function loadMetaSDK(config) {
  if(!sdkPromise) sdkPromise=new Promise((resolve,reject)=>{
    const init=()=>{window.FB.init({appId:config.appId,version:config.version,xfbml:false,cookie:false});resolve();};
    if(window.FB) {init();return;}
    const script=document.createElement("script");
    script.src="https://connect.facebook.net/pt_BR/sdk.js";script.async=true;script.crossOrigin="anonymous";
    const timeout=setTimeout(()=>{script.remove();reject(new Error("A Meta não carregou. Verifique a conexão ou bloqueadores do navegador."));},20000);
    script.onload=()=>{clearTimeout(timeout);if(window.FB)init();else reject(new Error("SDK da Meta indisponível."));};
    script.onerror=()=>{clearTimeout(timeout);reject(new Error("Não foi possível carregar a Meta."));};document.head.append(script);
  }).catch(e=>{sdkPromise=null;throw e;});
  return sdkPromise;
}
// Chamar diretamente no clique após preparar a conexão para preservar a abertura do popup.
export function authorizeMeta(config) {
  return new Promise((resolve,reject)=>{
    let code,session;
    const cleanup=()=>{clearTimeout(timeout);window.removeEventListener("message",listener);};
    const fail=message=>{cleanup();reject(new Error(message));};
    const finish=()=>{if(code&&session){cleanup();resolve({code,state:config.state,wabaId:session.waba_id,...(session.phone_number_id?{phoneNumberId:session.phone_number_id}:{}),event:session.event});}};
    function listener(event) {
      if(!origins.has(event.origin))return;
      let data;try {data=typeof event.data==="string"?JSON.parse(event.data):event.data;}catch{return;}
      if(data?.type!=="WA_EMBEDDED_SIGNUP")return;
      if(["CANCEL","ERROR"].includes(data.event))return fail("A conexão não foi concluída na Meta. Tente novamente.");
      if(["FINISH","FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING"].includes(data.event)) {
        if(!/^\d+$/.test(String(data.data?.waba_id))||(data.data?.phone_number_id&&!/^\d+$/.test(String(data.data.phone_number_id))))return fail("A Meta não retornou o número e a conta comercial. Refaça a autorização.");
        session={...data.data,event:data.event};finish();
      }
    }
    const timeout=setTimeout(()=>fail("A conexão expirou. Prepare uma nova conexão e tente novamente."),180000);
    window.addEventListener("message",listener);
    try {
      window.FB.login(response=>{code=response.authResponse?.code;if(!code)return fail("Autorização cancelada ou popup bloqueado. Permita a abertura da Meta e tente novamente.");finish();},{config_id:config.configId,response_type:"code",override_default_response_type:true,extras:{setup:{},sessionInfoVersion:"3"}});
    } catch {fail("Não foi possível abrir a autorização da Meta.");}
  });
}
