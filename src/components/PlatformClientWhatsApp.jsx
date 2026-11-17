import { useEffect, useState } from "react";
import api from "../Services/api.js";
import "./PlatformClientWhatsApp.css";
const labels = { NOT_ENABLED: "Não habilitado", QUEUED: "Na fila de preparação", PREPARING: "Preparando conexão", READY: "Pronto para conectar", WAITING_CAPACITY: "Aguardando capacidade", FAILED: "Preparação não concluída" };
export default function PlatformClientWhatsApp({ client }) {
  const [data, setData] = useState(null), [busy, setBusy] = useState(false), [confirm, setConfirm] = useState(false), [error, setError] = useState("");
  const path = `/v1/platform/condominiums/${client.id}/whatsapp/provisioning`;
  useEffect(() => {
    let alive = true, loading = false;
    async function refresh() {
      if (loading || document.hidden) return;
      loading = true;
      try { const response = await api.get(path); if (alive) { setData(response.data?.data ?? response.data); setError(""); } }
      catch (e) { if (alive) setError(e.message || "Não foi possível consultar a conexão."); }
      finally { loading = false; }
    }
    refresh(); const timer = setInterval(refresh, 7000);
    return () => { alive = false; clearInterval(timer); };
  }, [path]);
  async function prepare() {
    if (busy) return;
    setBusy(true); setError("");
    try { const response = await api.post(path, { confirmed: true }); setData(response.data?.data ?? response.data); setConfirm(false); }
    catch (e) { setError(e.message || "Não foi possível preparar a conexão."); }
    finally { setBusy(false); }
  }
  const pending = ["QUEUED", "PREPARING", "WAITING_CAPACITY"].includes(data?.state);
  return <section className="ic-wa-provision" aria-label="Preparação do WhatsApp">
    <div className="ic-wa-provision-heading"><div><span className="ic-wa-provision-eyebrow">COMUNICAÇÃO DO CONDOMÍNIO</span><h3>Conexão WhatsApp</h3></div><span className={`ic-wa-provision-status ${data?.state === "READY" ? "is-ready" : ""}`}>{data ? labels[data.state] || "Indisponível" : "Consultando…"}</span></div>
    <p>Prepare uma conexão exclusiva para <strong>{client.name}</strong>. Depois, o síndico conecta o número pelo QR em <strong>Configurações › WhatsApp</strong>.</p>
    <div className="ic-wa-provision-note">O e-mail funciona de forma independente. Preparar a conexão não vincula um número e não envia mensagens.</div>
    {data?.state === "READY" && <p className="ic-wa-provision-success">Preparação concluída. O síndico já pode conectar o WhatsApp do condomínio.</p>}
    {pending && <p role="status">{data.message || "A preparação está em andamento. O estado será atualizado automaticamente."}</p>}
    {data && !data.infrastructureReady && <p>Serviço de preparação indisponível. A equipe deve verificar a infraestrutura antes de continuar.</p>}
    {data?.state === "FAILED" && <p>{data.message}</p>}
    {data?.canPrepare && !pending && data.state !== "READY" && !confirm && <button type="button" onClick={() => setConfirm(true)}>Habilitar e preparar conexão</button>}
    {confirm && <div className="ic-wa-provision-confirm"><strong>Preparar para {client.name}?</strong><p>Será reservada uma instância exclusiva para este condomínio. O número será escolhido pelo síndico no pareamento.</p><div><button type="button" disabled={busy} onClick={prepare}>{busy ? "Solicitando…" : "Confirmar preparação"}</button><button type="button" className="ic-wa-provision-secondary" disabled={busy} onClick={() => setConfirm(false)}>Cancelar</button></div></div>}
    {error && <p className="ic-wa-provision-error" role="alert">{error}</p>}
  </section>;
}
