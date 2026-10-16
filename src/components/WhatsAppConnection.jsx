import { useState } from "react";
import api from "../Services/api.js";
import { loadMetaSDK,authorizeMeta } from "../utils/whatsappSignup.js";
const unwrap=r=>r.data?.data??r.data;
export default function WhatsAppConnection({ config,onUpdated }) {
  const [prepared,setPrepared]=useState(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  async function prepare() {
    setBusy(true);setMessage("");
    try {const data=unwrap(await api.post("/v1/configuration/whatsapp/connect/start",{}));await loadMetaSDK(data);setPrepared(data);setMessage("Clique em Autorizar na Meta para escolher o número do condomínio.");}
    catch(e){setMessage(e.message||"Não foi possível preparar a conexão.");}finally{setBusy(false);}
  }
  function authorize() {
    setBusy(true);setMessage("Conclua a autorização na janela da Meta.");
    // authorizeMeta abre o popup sincronamente neste clique, antes de qualquer await.
    authorizeMeta(prepared).then(data=>api.post("/v1/configuration/whatsapp/connect/finish",data)).then(async response=>{setMessage(unwrap(response).message);await onUpdated();}).catch(e=>setMessage(e.message||"Não foi possível concluir a conexão.")).finally(()=>{setPrepared(null);setBusy(false);});
  }
  async function check() {
    setBusy(true);
    try {const result=unwrap(await api.post("/v1/configuration/whatsapp/connect/check",{}));setMessage(result.message);await onUpdated();}
    catch(e){setMessage(e.message||"Não foi possível verificar a conexão.");}finally{setBusy(false);}
  }
  return <section style={{border:"1px solid #ddd",borderRadius:16,padding:16,marginBottom:20}}>
    <h3>WhatsApp do condomínio</h3>
    <p>{config.numeroEmpresa?`Número: ${config.numeroEmpresa}`:"Nenhum número conectado pela conexão guiada."}</p>
    <p>Autorize o número comercial na Meta. Os porteiros usarão seus próprios logins, sem acesso às credenciais. O modelo de aviso precisa ser aprovado antes da ativação.</p>
    <button disabled={busy} type="button" onClick={prepared?authorize:prepare}>{busy?"Aguarde…":prepared?"Autorizar na Meta":"Conectar WhatsApp do condomínio"}</button>{" "}
    {config.onboardingStatus!=="MANUAL"&&<button disabled={busy} type="button" onClick={check}>Verificar aprovação da conexão</button>}
    <p>Estado: {({MANUAL:"Configuração técnica existente",READY:"Conexão e modelo verificados",PENDING_TEMPLATE:"Aguardando aprovação do modelo"})[config.onboardingStatus]||"Não conectado"}. Envio real: teste pendente.</p>
    <p role="status">{message}</p>
  </section>;
}
