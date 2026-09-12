import { useEffect, useMemo, useState } from "react";
import privateServiceRequestApi from "../../Services/privateServiceRequestApi.js";
import "../../styles/infinityModules.css";

const initial = {
  providerName: "",
  providerDocument: "",
  providerPhone: "",
  providerCompany: "",
  serviceType: "",
  description: "",
  scheduledDate: "",
  scheduledStartTime: "",
  scheduledEndTime: "",
  notes: "",
};

const labels = {
  PENDING: "Em análise",
  APPROVED: "Aprovado / agendado",
  REJECTED: "Não aprovado",
  CANCELED: "Cancelado",
};

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export default function ServicosApartamentoMorador() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  async function load() {
    setLoading(true);
    try {
      setItems(await privateServiceRequestApi.list());
    } catch (error) {
      setFeedback({ type: "error", text: error?.message ?? "Não foi possível carregar suas solicitações." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    total: items.length,
    pending: items.filter((item) => item.status === "PENDING").length,
    approved: items.filter((item) => item.status === "APPROVED").length,
  }), [items]);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await privateServiceRequestApi.create({
        ...form,
        providerDocument: form.providerDocument || null,
        providerPhone: form.providerPhone || null,
        providerCompany: form.providerCompany || null,
        scheduledEndTime: form.scheduledEndTime || null,
        notes: form.notes || null,
      });
      setForm(initial);
      setFeedback({ type: "ok", text: "Solicitação enviada ao síndico. Após aprovação, o prestador será liberado para a portaria." });
      await load();
    } catch (error) {
      setFeedback({ type: "error", text: error?.details?.[0]?.message ?? error?.message ?? "Não foi possível enviar a solicitação." });
    } finally {
      setSaving(false);
    }
  }

  async function cancel(id) {
    setFeedback(null);
    try {
      await privateServiceRequestApi.cancel(id);
      setFeedback({ type: "ok", text: "Solicitação cancelada." });
      await load();
    } catch (error) {
      setFeedback({ type: "error", text: error?.message ?? "Não foi possível cancelar a solicitação." });
    }
  }

  return (
    <div className="icm-page">
      <section className="icm-hero icm-hero-professional">
        <div>
          <span className="icm-kicker">🛠️ Acesso programado</span>
          <h1>Serviço no meu apartamento</h1>
          <p>Avise a gestão quando estiver esperando eletricista, técnico de internet, montador, diarista ou outro profissional. O síndico analisa e, quando aprovar, a portaria recebe o agendamento.</p>
        </div>
        <div className="icm-metric-row">
          <div className="icm-metric"><strong>{stats.total}</strong><span>solicitações</span></div>
          <div className="icm-metric"><strong>{stats.pending}</strong><span>em análise</span></div>
          <div className="icm-metric"><strong>{stats.approved}</strong><span>aprovadas</span></div>
        </div>
      </section>

      {feedback && <div className={`icm-message icm-message-${feedback.type}`}>{feedback.text}</div>}

      <form className="icm-card icm-form" onSubmit={submit}>
        <div className="icm-section-heading">
          <div><span className="icm-eyebrow">NOVA SOLICITAÇÃO</span><h2>Quem irá ao apartamento?</h2></div>
          <span className="icm-pill icm-status-neutral">O apartamento é identificado pelo seu login</span>
        </div>
        <div className="icm-form-grid">
          <Field label="Nome do profissional *"><input className="icm-input" required minLength={2} value={form.providerName} onChange={(e) => setForm({ ...form, providerName: e.target.value })} /></Field>
          <Field label="Telefone"><input className="icm-input" value={form.providerPhone} onChange={(e) => setForm({ ...form, providerPhone: e.target.value })} placeholder="(81) 99999-9999" /></Field>
          <Field label="CPF / documento"><input className="icm-input" value={form.providerDocument} onChange={(e) => setForm({ ...form, providerDocument: e.target.value })} /></Field>
          <Field label="Empresa / nome profissional"><input className="icm-input" value={form.providerCompany} onChange={(e) => setForm({ ...form, providerCompany: e.target.value })} placeholder="Opcional — pode ser freelancer" /></Field>
          <Field label="Tipo de serviço *"><input className="icm-input" required minLength={2} value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })} placeholder="Ex.: Elétrica, internet, montagem" /></Field>
          <Field label="Data prevista *"><input className="icm-input" type="date" required value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} /></Field>
          <Field label="Horário inicial *"><input className="icm-input" type="time" required value={form.scheduledStartTime} onChange={(e) => setForm({ ...form, scheduledStartTime: e.target.value })} /></Field>
          <Field label="Horário final estimado"><input className="icm-input" type="time" value={form.scheduledEndTime} onChange={(e) => setForm({ ...form, scheduledEndTime: e.target.value })} /></Field>
          <Field label="Descrição do serviço *" full><textarea className="icm-textarea" required minLength={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Explique o que será realizado no apartamento." /></Field>
          <Field label="Observações para a gestão / portaria" full><textarea className="icm-textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ex.: levará ferramentas, chegará em veículo, precisa acessar garagem..." /></Field>
        </div>
        <div className="icm-actions"><button className="icm-btn icm-btn-primary" disabled={saving}>{saving ? "Enviando..." : "Enviar para aprovação"}</button></div>
      </form>

      <section className="icm-card icm-section-card">
        <div className="icm-section-heading"><div><span className="icm-eyebrow">ACOMPANHAMENTO</span><h2>Minhas solicitações</h2></div></div>
        {loading ? <div className="icm-empty">Carregando...</div> : items.length === 0 ? <div className="icm-empty">Você ainda não informou nenhum serviço particular.</div> : (
          <div className="icm-list">
            {items.map((item) => (
              <article className="icm-list-card" key={item.id}>
                <div className="icm-list-main">
                  <div className="icm-card-title-row"><h3>{item.providerName}</h3><span className={`icm-pill icm-status-${item.status === "APPROVED" ? "ok" : item.status === "PENDING" ? "warning" : item.status === "REJECTED" ? "urgent" : "neutral"}`}>{labels[item.status] ?? item.status}</span></div>
                  <p className="icm-muted">{item.serviceType} · {formatDate(item.scheduledDate)} às {item.scheduledStartTime}{item.scheduledEndTime ? `–${item.scheduledEndTime}` : ""}</p>
                  <p>{item.description}</p>
                  {item.reviewNotes && <div className="icm-note"><strong>Retorno da gestão:</strong> {item.reviewNotes}</div>}
                  {item.providerAccess?.status && <div className="icm-note"><strong>Portaria:</strong> acesso {item.providerAccess.status === "SCHEDULED" ? "agendado" : item.providerAccess.status === "INSIDE" ? "em andamento" : item.providerAccess.status === "EXITED" ? "finalizado" : "cancelado"}.</div>}
                </div>
                {item.status === "PENDING" && <div className="icm-actions"><button type="button" className="icm-btn icm-btn-danger" onClick={() => cancel(item.id)}>Cancelar solicitação</button></div>}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, full = false, children }) {
  return <div className={`icm-field${full ? " icm-field-full" : ""}`}><label>{label}</label>{children}</div>;
}
