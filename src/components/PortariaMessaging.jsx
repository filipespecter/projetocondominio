import { useEffect,useState } from "react";
import api from "../Services/api.js";
const unwrap=r=>r.data?.data??r.data;
const labels={PENDING:"Aguardando envio",SENT:"Enviado ao provedor",DELIVERED:"Entregue",FAILED:"Falhou",CANCELED:"Cancelado"};
export default function PortariaMessaging() {
  const [status,setStatus]=useState(null);
  const [history,setHistory]=useState([]);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  async function refresh() {
    setBusy(true);setError("");
    try {const [s,h]=await Promise.all([api.get("/v1/configuration/messaging/status"),api.get("/v1/configuration/messaging/history")]);setStatus(unwrap(s));setHistory(unwrap(h));}
    catch(e){setError(e.message||"Não foi possível consultar os avisos.");}finally{setBusy(false);}
  }
  useEffect(()=>{refresh();const timer=setInterval(refresh,60000);return()=>clearInterval(timer);},[]);
  async function retry(id) {
    setBusy(true);setError("");
    try {await api.post(`/v1/configuration/messaging/${id}/retry`,{});await refresh();}
    catch(e){setError(e.message||"Não foi possível reenviar o aviso.");}finally{setBusy(false);}
  }
  const pronto=status?.ready===true;
  return <section className="ic-por-channel">
    <div className="ic-por-channel-head">
      <div>
        <span className={`ic-por-chip ${pronto?"is-ok":"is-warn"}`}>{pronto?"● Canal ativo":"● Canal indisponível"}</span>
        <h3>Canal de avisos: {status?.channel==="WHATSAPP"?"WhatsApp do condomínio":"E-mail"}</h3>
        <p>{status?.displayPhone&&`Número: ${status.displayPhone} — `}{pronto?"Canal configurado. Confira o resultado de cada envio no histórico.":"Canal indisponível ou não configurado. Solicite a configuração ao síndico."}</p>
        <p className="ic-por-channel-note">Registrar a encomenda aciona os avisos aos destinatários autorizados. Uma falha de envio não apaga o recebimento.</p>
      </div>
      <button type="button" className="ic-por-btn-secondary" disabled={busy} onClick={refresh}>{busy?"Atualizando…":"Atualizar avisos"}</button>
    </div>
    {error&&<p role="status" className="ic-por-channel-error">{error}</p>}
    <details><summary>Últimos avisos de encomendas ({history.length})</summary>{history.length===0?<p className="ic-por-channel-note">Nenhum aviso enviado ainda.</p>:<div className="ic-por-table-wrap"><table><thead><tr><th>Data</th><th>Canal</th><th>Destinatário</th><th>Resultado</th><th>Ação</th></tr></thead><tbody>{history.map(h=><tr key={h.id}><td>{new Date(h.createdAt).toLocaleString("pt-BR")}</td><td>{h.channel==="EMAIL"?"E-mail":h.channel==="WHATSAPP"?"WhatsApp":h.channel}</td><td>{h.recipient}</td><td>{labels[h.status]||h.status}</td><td>{["FAILED","PENDING"].includes(h.status)&&<button className="ic-por-btn-secondary" disabled={busy} onClick={()=>retry(h.id)}>Reenviar aviso</button>}</td></tr>)}</tbody></table></div>}</details>
  </section>;
}
