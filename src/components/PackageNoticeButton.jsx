import { useEffect, useRef, useState } from "react";
import api from "../Services/api.js";
import "./PackageMessaging.css";
const unwrap = r => r.data?.data ?? r.data;
export default function PackageNoticeButton({ id, compact = false, icon = null }) {
  const dialog = useRef(null), guard = useRef(false);
  const [preview, setPreview] = useState(null), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const [history,setHistory]=useState([]),[historyError,setHistoryError]=useState(""),[retryId,setRetryId]=useState(null);
  const [observation, setObservation] = useState("");
  const [mode, setMode] = useState("BOTH"), [emailRecipient, setEmailRecipient] = useState(""), [whatsappRecipient, setWhatsappRecipient] = useState("");
  useEffect(() => { if (preview && !dialog.current?.open) dialog.current?.showModal(); }, [preview]);
  async function prepare() {
    if (guard.current) return;
    guard.current = true; setBusy(true); setMessage("");
    try {
      const data = unwrap(await api.get(`/v1/packages/${id}/notice-v2/preview`));
      setHistory([]);setHistoryError("");setRetryId(null);
      setObservation("");
      setMode("BOTH"); setEmailRecipient(data.recipients.find(r => r.email)?.key || ""); setWhatsappRecipient(data.recipients.find(r => r.phone)?.key || ""); setPreview(data);await refreshHistory();
    } catch (error) { setMessage(error.message); }
    finally { guard.current = false; setBusy(false); }
  }
  async function refreshHistory() {
    try {setHistory(unwrap(await api.get(`/v1/packages/${id}/notice-v2/history`)));setHistoryError("");}
    catch(error){setHistoryError(error.message||"Histórico indisponível.");}
  }
  async function handleHistory(row, retry) {
    if(guard.current)return;
    guard.current=true;setBusy(true);setHistoryError("");
    try {
      const endpoint=retry?"retry":"check-delivery";
      const result=unwrap(await api.post(`/v1/configuration/messaging/${row.id}/${endpoint}`,retry?{confirmed:true}:{}));
      setRetryId(null);
      await refreshHistory();
      setMessage(result.message);
    }catch(error){setHistoryError(error.message);}
    finally{guard.current=false;setBusy(false);}
  }
  async function send() {
    if (guard.current) return;
    guard.current = true; setBusy(true);
    try {
      const data = unwrap(await api.post(`/v1/packages/${id}/notice-v2/confirm`, { confirmation: preview.confirmation, confirmed: true, observation, mode, emailRecipient: emailRecipient || null, whatsappRecipient: whatsappRecipient || null }));
      setMessage(data.results.map(r => `${r.channel === "EMAIL" ? "E-mail" : "WhatsApp"}: ${r.failed ? r.message : r.deduplicated ? "aviso existente preservado; confira o histórico" : "solicitação aceita; entrega deve ser conferida no histórico"}`).join(" · ")); setPreview(null);
    } catch (error) { setMessage(error.message); setPreview(null); }
    finally { guard.current = false; setBusy(false); }
  }
  const selected = preview?.recipients || [];
  const previews = preview ? (mode === "BOTH" ? ["EMAIL", "WHATSAPP"] : [mode]).flatMap(channel => {
    const recipient = selected.find(r => r.key === (channel === "EMAIL" ? emailRecipient : whatsappRecipient));
    if (!recipient) return [];
    const received = new Date(preview.receivedAt).toLocaleString("pt-BR", { timeZone: "America/Recife" });
    const lines = [
      preview.condominiumName, `Olá, ${recipient.name}.`, "Encomenda recebida na portaria",
      `Unidade: ${preview.apartment}`, preview.type && `Tipo: ${preview.type}`,
      preview.description && `Descrição: ${preview.description}`,
      preview.carrier && `Remetente / transportadora: ${preview.carrier}`, `Recebimento: ${received}`,
      observation.trim() && `Observação da portaria: ${observation.trim()}`,
      recipient.canPickup ? "O código e o QR de retirada serão incluídos no envio." : "Avise o responsável autorizado pela retirada. Este aviso não autoriza retirar a encomenda.",
      "Aviso enviado pelo InfinityCondo. Em caso de dúvida, procure a administração do condomínio."
    ];
    return [{ channel, text: lines.filter(Boolean).join("\n\n") }];
  }) : [];
  return <div className="ic-package-messaging"><button type="button" disabled={busy} onClick={prepare}>{icon}{busy ? "Aguarde…" : compact ? "Enviar aviso" : "Enviar aviso WhatsApp / e-mail"}</button>
    {preview && <dialog ref={dialog} className="ic-message-dialog" aria-label="Conferir aviso de encomenda" onCancel={event => { if (busy) event.preventDefault(); else setPreview(null); }}>
      <h2>Conferir aviso de encomenda</h2><p><strong>Apartamento:</strong> {preview.apartment}</p><p>{preview.type} · {preview.description || "Sem descrição"} · {preview.carrier || "Remetente não informado"}</p><p>Recebida: {new Date(preview.receivedAt).toLocaleString("pt-BR")}</p>
      <label>Canais de envio<select disabled={busy} value={mode} onChange={e => setMode(e.target.value)}><option value="BOTH">WhatsApp + e-mail</option><option value="EMAIL">Somente e-mail</option><option value="WHATSAPP">Somente WhatsApp</option></select></label>
      {mode !== "WHATSAPP" && <label>Destinatário do e-mail<select disabled={busy} value={emailRecipient} onChange={e => setEmailRecipient(e.target.value)}><option value="">Nenhum e-mail selecionado</option>{selected.filter(r => r.email).map(r => <option key={r.key} value={r.key}>{r.name} · {r.email}{r.canPickup ? "" : " · somente aviso"}</option>)}</select></label>}
      {mode !== "EMAIL" && <label>Contato autorizado no WhatsApp<select disabled={busy} value={whatsappRecipient} onChange={e => setWhatsappRecipient(e.target.value)}><option value="">Nenhum telefone autorizado selecionado</option>{selected.filter(r => r.phone).map(r => <option key={r.key} value={r.key}>{r.name} · {r.phone}{r.canPickup ? "" : " · somente aviso"}</option>)}</select></label>}
      {((mode !== "WHATSAPP" && !emailRecipient) || (mode !== "EMAIL" && !whatsappRecipient)) && <p role="alert">Falta destinatário em um canal. Ao confirmar, esse canal terá falha registrada; o outro será tentado independentemente.</p>}
      <label>Observação da portaria (opcional)<textarea rows={3} maxLength={400} value={observation} disabled={busy} onChange={e => setObservation(e.target.value)} /></label>
      <small>{observation.length}/400 caracteres</small>
      {previews.map(({channel, text}) => <div className="ic-message-preview" key={channel}>
        <strong>Prévia · {channel === "EMAIL" ? "E-mail" : "WhatsApp"}</strong>
        <p>{text}</p>
      </div>)}
      <details className="ic-message-preview">
        <summary>Tentativas desta encomenda ({history.length})</summary>
        <button type="button" className="ic-message-secondary" disabled={busy} onClick={refreshHistory}>Atualizar histórico</button>
        {historyError&&<p role="alert">{historyError}</p>}
        {message&&<p role="status">{message}</p>}
        {history.map(row=><div className="ic-message-preview" key={row.id}>
          <strong>{row.channel==="EMAIL"?"E-mail":"WhatsApp"} · {row.recipient}</strong>
          <p>{row.uncertain?"Resultado incerto · reenvio bloqueado":({FAILED:"Falha no envio",SENT:"Aceito pelo provedor",DELIVERED:"Entregue",PENDING:"Pendente",CANCELED:"Cancelado"})[row.status]}</p>
          {row.canCheck&&<button type="button" disabled={busy} onClick={()=>handleHistory(row,false)}>Conferir entrega</button>}
          {row.canRetry&&retryId!==row.id&&<button type="button" disabled={busy} onClick={()=>setRetryId(row.id)}>Reenviar somente este canal</button>}
          {row.canRetry&&retryId===row.id&&<div>
            <p>Você conferiu os dados? Deseja confirmar o reenvio somente deste canal? O código e o QR válidos serão preservados.</p>
            <button type="button" disabled={busy} onClick={()=>handleHistory(row,true)}>Confirmar reenvio</button>{" "}
            <button type="button" className="ic-message-secondary" disabled={busy} onClick={()=>setRetryId(null)}>Cancelar reenvio</button>
            {row.retryAfter&&new Date(row.retryAfter)>new Date()&&<small> Aguarde um minuto após a última tentativa antes de confirmar.</small>}
          </div>}
        </div>)}
      </details>
      <p>{preview.message}</p><p>A mensagem informa o condomínio, a unidade e os dados da encomenda. O QR e o código serão enviados apenas a destinatários autorizados à retirada.</p>
      <p><strong>Você conferiu os dados? Deseja confirmar o envio?</strong></p><div className="ic-message-actions"><button type="button" className="ic-message-secondary" disabled={busy} onClick={() => setPreview(null)}>Cancelar</button><button type="button" disabled={busy || (mode === "EMAIL" ? !emailRecipient : mode === "WHATSAPP" ? !whatsappRecipient : !emailRecipient && !whatsappRecipient)} onClick={send}>{busy ? "Processando…" : "Confirmar envio"}</button></div>
    </dialog>}{message && <p role="status" aria-live="polite">{message}</p>}</div>;
}
