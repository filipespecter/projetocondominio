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
  return <section style={{background:"white",borderRadius:16,padding:16,marginBottom:20}}>
    <strong>Canal de avisos: {status?.channel==="WHATSAPP"?"WhatsApp do condomínio":"E-mail"}</strong>
    <p>{status?.displayPhone&&`Número: ${status.displayPhone} — `}{status?.ready?"Canal configurado. Confira o resultado de cada envio no histórico.":"Canal indisponível ou não configurado. Solicite a configuração ao síndico."}</p>
    <p>Registrar a encomenda aciona os avisos aos destinatários autorizados. Uma falha de envio não apaga o recebimento.</p>
    <button type="button" disabled={busy} onClick={refresh}>Atualizar avisos</button>
    <p role="status">{error}</p>
    <details><summary>Últimos avisos de encomendas</summary><div style={{overflowX:"auto"}}><table><thead><tr><th>Data</th><th>Canal</th><th>Destinatário</th><th>Resultado</th><th>Ação</th></tr></thead><tbody>{history.map(h=><tr key={h.id}><td>{new Date(h.createdAt).toLocaleString("pt-BR")}</td><td>{h.channel}</td><td>{h.recipient}</td><td>{labels[h.status]||h.status}</td><td>{["FAILED","PENDING"].includes(h.status)&&<button disabled={busy} onClick={()=>retry(h.id)}>Reenviar aviso</button>}</td></tr>)}</tbody></table></div></details>
  </section>;
}
