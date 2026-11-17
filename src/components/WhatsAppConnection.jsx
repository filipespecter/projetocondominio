import { useEffect, useRef, useState } from "react";
import api from "../Services/api.js";
import "./PackageMessaging.css";
const unwrap = response => response.data?.data ?? response.data;
const labels = { WORKING: "Conectado", SCAN_QR_CODE: "Aguardando leitura do QR", STARTING: "Preparando conexão", STOPPED: "Desconectado", FAILED: "Conexão precisa de atenção", NOT_CONNECTED: "Nenhum número conectado" };
export default function WhatsAppConnection({ onUpdated }) {
  const [state, setState] = useState(null), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const [watchUntil, setWatchUntil] = useState(0);
  const [showQr, setShowQr] = useState(false), [disconnecting, setDisconnecting] = useState(false);
  const [needsTransition, setNeedsTransition] = useState(false), [replaceMeta, setReplaceMeta] = useState(false);
  const dialog = useRef(null), requestRunning = useRef(false), alive = useRef(true);
  const lastPhone = useRef(null);
  function applyStatus(data) {
    setState(data);
    if (!data.connected) { lastPhone.current = null; return; }
    setShowQr(false);
    setWatchUntil(0);
    if (lastPhone.current !== data.phone) {
      lastPhone.current = data.phone;
      Promise.resolve().then(() => onUpdated?.()).catch(() => {});
    }
  }
  async function check(qr = false) {
    if (requestRunning.current) return;
    requestRunning.current = true;
    try {
      const data = unwrap(await api.get(`/v1/configuration/whatsapp/waha/status?qr=${qr}`));
      if (!alive.current) return;
      applyStatus(data); setMessage("");
    } catch (error) { if (alive.current) { setMessage(error.message || "Não foi possível consultar a conexão."); setState(null); } }
    finally { requestRunning.current = false; }
  }
  useEffect(() => { alive.current = true; check(); return () => { alive.current = false; }; }, []);
  useEffect(() => {
    if (!showQr && !watchUntil) return;
    if (showQr && !dialog.current?.open) dialog.current?.showModal();
    const refresh = () => {
      if (!showQr && Date.now() >= watchUntil) { setWatchUntil(0); return; }
      if (!document.hidden) check(showQr);
    };
    const timer = setInterval(refresh, 4000);
    document.addEventListener("visibilitychange", refresh);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
  }, [showQr, watchUntil]);
  async function start() {
    if (busy || requestRunning.current) return;
    requestRunning.current = true;
    setBusy(true); setMessage("");
    try { const data = unwrap(await api.post("/v1/configuration/whatsapp/waha/start", { replaceMetaConfirmed: replaceMeta })); applyStatus(data); if (!data.connected) { setWatchUntil(Date.now() + 120000); setShowQr(true); } }
    catch (error) { setMessage(error.message || "Não foi possível preparar a conexão."); if (error.message?.includes("configuração Meta")) setNeedsTransition(true); }
    finally { requestRunning.current = false; setBusy(false); }
  }
  async function disconnect() {
    if (busy || requestRunning.current) return;
    requestRunning.current = true;
    setBusy(true);
    try { setState(unwrap(await api.post("/v1/configuration/whatsapp/waha/disconnect", { confirmed: true }))); lastPhone.current = null; setWatchUntil(0); setDisconnecting(false); setShowQr(false); await onUpdated?.(); }
    catch (error) { setMessage(error.message || "Não foi possível concluir a desconexão. Consulte novamente."); }
    finally { requestRunning.current = false; setBusy(false); }
  }
  return <section className="ic-package-messaging" aria-busy={busy}>
    <h3>WhatsApp do condomínio</h3>
    <p role="status">{state ? labels[state.status] || "Estado não confirmado" : "Conexão não confirmada"}{state?.phone ? ` · ${state.phone}` : ""}</p>
    <p>Conecte pelo celular em Aparelhos conectados. Os porteiros enviam os avisos pelo InfinityCondo, com seus próprios logins.</p>
    {needsTransition && <label><input type="checkbox" checked={replaceMeta} onChange={e => setReplaceMeta(e.target.checked)}/> Confirmo substituir o envio pela Meta por WAHA neste condomínio, preservando a configuração anterior protegida.</label>}
    <div className="ic-message-actions"><button type="button" disabled={busy} onClick={start}>{busy ? "Aguarde…" : "Conectar WhatsApp do condomínio"}</button><button type="button" className="ic-message-secondary" disabled={busy} onClick={() => check()}>Atualizar estado</button>{state?.connected && <button type="button" className="ic-message-secondary" disabled={busy} onClick={() => setDisconnecting(true)}>Desconectar</button>}</div>
    {disconnecting && <div role="alert"><p>Desconectar interrompe os envios WhatsApp deste condomínio. O e-mail continua independente. Confirma?</p><button type="button" disabled={busy} onClick={disconnect}>Confirmar desconexão</button> <button type="button" className="ic-message-secondary" onClick={() => setDisconnecting(false)}>Cancelar</button></div>}
    {showQr && <dialog ref={dialog} className="ic-message-dialog" aria-label="Conectar WhatsApp" onCancel={() => setShowQr(false)}><h3>Conectar o número do condomínio</h3><p>No celular: WhatsApp → Aparelhos conectados → Conectar aparelho.</p>{state?.qr ? <img className="ic-message-qr" src={state.qr} alt="QR para conectar o WhatsApp do condomínio"/> : <p>{labels[state?.status] || "Preparando QR. Aguarde a atualização."}</p>}<p>Não compartilhe este QR. Ele conecta o número; não é o QR de retirada de encomenda.</p><button type="button" className="ic-message-secondary" onClick={() => setShowQr(false)}>Fechar</button>{message && <p role="alert">{message}</p>}</dialog>}
    {message && <p role="alert">{message}</p>}
    <p>Conexão por QR não oficial. A conexão ativa não comprova a entrega de mensagens; confira o histórico de cada aviso.</p>
  </section>;
}
