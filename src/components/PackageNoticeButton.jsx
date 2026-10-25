import { useEffect, useRef, useState } from "react";
import api from "../Services/api.js";
export default function PackageNoticeButton({
  id
}) {
  const dialog = useRef(null);
  const [preview, setPreview] = useState(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    if (preview && !dialog.current?.open) dialog.current?.showModal();
  }, [preview]);
  async function prepare() {
    setBusy(true);
    setMessage("");
    try {
      const r = await api.get(`/v1/packages/${id}/notice-preview`);
      setPreview(r.data);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function send() {
    if (busy) return;
    setBusy(true);
    try {
      const r = await api.post(`/v1/packages/${id}/notice-confirm`, {
        confirmation: preview.confirmation,
        confirmed: true
      });
      const failed = r.data.results?.some(x => x.failed || x.queued === false);
      setMessage(failed ? "Há avisos não enviados. Confira o histórico antes de repetir." : "Solicitação processada. Consulte o histórico para confirmar o status de entrega.");
      setPreview(null);
    } catch (e) {
      setMessage(e.message);
      setPreview(null);
    } finally {
      setBusy(false);
    }
  }
  return <div className="ic-package-notice"><button type="button" disabled={busy} onClick={prepare}>Enviar aviso WhatsApp / e-mail</button>{preview && <dialog ref={dialog} onCancel={e => {
      if (busy) e.preventDefault();else setPreview(null);
    }} aria-label="Conferir aviso" className="ic-record-dialog"><section className="ic-feature-panel"><h2>Conferir aviso por {preview.channel}</h2><p>Apartamento: {preview.apartment}</p><p>{preview.type} · {preview.description || "Sem descrição"} · {preview.carrier || "Remetente não informado"}</p><p>Recebida: {new Date(preview.receivedAt).toLocaleString("pt-BR")}</p><ul>{preview.recipients.map(x => <li key={x.id}>{x.name} · {x.address}</li>)}</ul><p><strong>Você conferiu os dados da encomenda e do destinatário? Deseja confirmar o envio?</strong></p><button disabled={busy} onClick={() => setPreview(null)}>Cancelar</button><button disabled={busy || !preview.recipients.length} onClick={send}>{busy ? "Processando…" : "Confirmar envio"}</button><p role="status">{message}</p></section></dialog>}<p role="status">{message}</p></div>;
}
