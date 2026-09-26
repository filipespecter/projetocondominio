import { useEffect, useMemo, useState } from "react";
import platformApi from "../../Services/platformApi.js";
import {
  PlatformButton,
  PlatformCard,
  PlatformEmpty,
  PlatformError,
  PlatformLoading,
  PlatformPageHeader,
} from "../../components/PlatformUi.jsx";

const STATUS = {
  OPEN: "Aberta",
  IN_PROGRESS: "Em atendimento",
  WAITING_CUSTOMER: "Aguardando cliente",
  RESOLVED: "Resolvida",
  CLOSED: "Encerrada",
};
const PRIORITY = { LOW: "Baixa", MEDIUM: "Média", HIGH: "Alta", CRITICAL: "Crítica" };
const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function listOf(data) {
  return Array.isArray(data) ? data : data?.items ?? data?.data ?? [];
}

export default function PlatformSupport() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [condos, setCondos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("OPEN");
  const [sessionModal, setSessionModal] = useState(false);
  const [resolutionTarget, setResolutionTarget] = useState(null);
  const [resolution, setResolution] = useState("");
  const [form, setForm] = useState({ condominiumId: "", reason: "" });

  async function load() {
    setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      platformApi.support.tickets(),
      platformApi.support.ticketStatistics(),
      platformApi.support.current(),
      platformApi.support.history(),
      platformApi.condominiums.list("?limit=100&sortBy=name&sortOrder=asc"),
    ]);

    const [ticketsResult, statsResult, currentResult, historyResult, condosResult] = results;
    if (ticketsResult.status === "fulfilled") setTickets(listOf(ticketsResult.value));
    else setTickets([]);
    if (statsResult.status === "fulfilled") setStats(statsResult.value);
    else setStats(null);
    if (currentResult.status === "fulfilled") setCurrent(currentResult.value);
    else setCurrent(null);
    if (historyResult.status === "fulfilled") setHistory(listOf(historyResult.value));
    else setHistory([]);
    if (condosResult.status === "fulfilled") setCondos(listOf(condosResult.value));
    else setCondos([]);

    const firstFailure = results.find((result) => result.status === "rejected");
    if (firstFailure?.status === "rejected") {
      setError(firstFailure.reason?.message ?? "Falha ao carregar a Central de Suporte.");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return tickets
      .filter((ticket) => {
        if (filter === "ALL") return true;
        if (filter === "OPEN") return ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"].includes(ticket.status);
        if (filter === "CRITICAL") return ticket.priority === "CRITICAL" && !["RESOLVED", "CLOSED"].includes(ticket.status);
        return ticket.status === filter;
      })
      .sort(
        (a, b) =>
          (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9) ||
          new Date(a.openedAt) - new Date(b.openedAt)
      );
  }, [tickets, filter]);

  async function update(id, payload) {
    setSaving(true);
    setError("");
    try {
      await platformApi.support.updateTicket(id, payload);
      await load();
    } catch (err) {
      setError(err?.message ?? "Não foi possível atualizar a solicitação.");
    } finally {
      setSaving(false);
    }
  }

  function openResolution(ticket) {
    setResolutionTarget(ticket);
    setResolution("");
    setError("");
  }

  async function resolveTicket(event) {
    event.preventDefault();
    if (!resolutionTarget?.id) return;
    if (resolution.trim().length < 5) {
      setError("Descreva a solução aplicada com pelo menos 5 caracteres.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await platformApi.support.updateTicket(resolutionTarget.id, {
        status: "RESOLVED",
        resolution: resolution.trim(),
      });
      setResolutionTarget(null);
      setResolution("");
      await load();
    } catch (err) {
      setError(err?.message ?? "Não foi possível resolver a solicitação.");
    } finally {
      setSaving(false);
    }
  }

  async function startSession(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await platformApi.support.start({
        condominiumId: form.condominiumId,
        reason: form.reason.trim(),
      });
      setSessionModal(false);
      setForm({ condominiumId: "", reason: "" });
      await load();
    } catch (err) {
      setError(err?.message ?? "Não foi possível iniciar o atendimento.");
    } finally {
      setSaving(false);
    }
  }

  async function closeSession() {
    if (!current?.id) return;
    setSaving(true);
    setError("");
    try {
      await platformApi.support.close(current.id);
      await load();
    } catch (err) {
      setError(err?.message ?? "Não foi possível encerrar a sessão.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PlatformLoading text="Carregando Central de Suporte..." />;

  return (
    <div>
      <style>{css}</style>
      <PlatformPageHeader
        eyebrow="SUPORTE E OPERAÇÃO"
        title="Solicitações de Atendimento"
        description="Fila centralizada de SAs com classificação, prioridade, responsável, solução registrada e histórico."
        action={<PlatformButton variant="secondary" onClick={load}>Atualizar</PlatformButton>}
      />
      <PlatformError message={error} />

      <div className="support-stats">
        {[
          ["Abertas", stats?.open ?? 0],
          ["Críticas", stats?.critical ?? 0],
          ["Altas", stats?.high ?? 0],
          ["Aguardando cliente", stats?.waiting ?? 0],
          ["Resolvidas", stats?.resolved ?? 0],
        ].map(([label, value]) => (
          <PlatformCard key={label}>
            <span className="eyebrow">{label}</span>
            <strong className="big">{value}</strong>
          </PlatformCard>
        ))}
      </div>

      <PlatformCard style={{ marginTop: 18 }}>
        <div className="bar">
          <div>
            <span className="eyebrow">FILA DE ATENDIMENTO</span>
            <h3>Solicitações dos clientes</h3>
          </div>
          <select value={filter} onChange={(event) => setFilter(event.target.value)} className="select">
            <option value="OPEN">Em aberto</option>
            <option value="CRITICAL">Críticas</option>
            <option value="RESOLVED">Resolvidas</option>
            <option value="CLOSED">Encerradas</option>
            <option value="ALL">Todas</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <PlatformEmpty text="Nenhuma solicitação neste filtro." />
        ) : (
          <div className="tickets">
            {filtered.map((ticket) => (
              <div key={ticket.id} className="ticket">
                <div className="ticket-main">
                  <div className="ticket-title">
                    SA-{String(ticket.ticketNumber).padStart(5, "0")} · {ticket.title}
                  </div>
                  <div className="meta">
                    {ticket.condominium?.name ?? "Condomínio"} · {ticket.category} · aberta em {formatDate(ticket.openedAt)}
                  </div>
                  <p>{ticket.description}</p>
                  <div className="chips">
                    <span className={`priority p-${ticket.priority}`}>{PRIORITY[ticket.priority] ?? ticket.priority}</span>
                    <span className="status">{STATUS[ticket.status] ?? ticket.status}</span>
                    {ticket.assignedTo?.name ? <span className="assignee">Responsável: {ticket.assignedTo.name}</span> : null}
                  </div>
                  {ticket.resolution ? (
                    <div className="resolution">
                      <strong>Solução aplicada</strong>
                      <span>{ticket.resolution}</span>
                      {ticket.resolvedAt ? <small>Resolvida em {formatDate(ticket.resolvedAt)}</small> : null}
                    </div>
                  ) : null}
                </div>

                <div className="actions">
                  {!ticket.assignedTo?.id && !["RESOLVED", "CLOSED"].includes(ticket.status) ? (
                    <button disabled={saving} onClick={() => update(ticket.id, { assignToMe: true, status: "IN_PROGRESS" })}>Assumir</button>
                  ) : null}
                  {!["RESOLVED", "CLOSED"].includes(ticket.status) ? (
                    <button disabled={saving} onClick={() => update(ticket.id, { status: "WAITING_CUSTOMER" })}>Aguardar cliente</button>
                  ) : null}
                  {!["RESOLVED", "CLOSED"].includes(ticket.status) ? (
                    <button disabled={saving} onClick={() => openResolution(ticket)}>Resolver</button>
                  ) : null}
                  {ticket.status === "RESOLVED" ? (
                    <button disabled={saving} onClick={() => update(ticket.id, { status: "CLOSED" })}>Encerrar</button>
                  ) : null}
                  {ticket.status !== "CLOSED" ? (
                    <select value={ticket.priority} onChange={(event) => update(ticket.id, { priority: event.target.value })}>
                      <option value="LOW">Baixa</option>
                      <option value="MEDIUM">Média</option>
                      <option value="HIGH">Alta</option>
                      <option value="CRITICAL">Crítica</option>
                    </select>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </PlatformCard>

      <div className="support-grid">
        <PlatformCard>
          <div className="bar">
            <div>
              <span className="eyebrow">ACESSO ASSISTIDO</span>
              <h3>Sessão administrativa</h3>
            </div>
            {current?.id ? (
              <PlatformButton variant="danger" onClick={closeSession} disabled={saving}>Encerrar sessão</PlatformButton>
            ) : (
              <PlatformButton onClick={() => setSessionModal(true)}>Iniciar sessão</PlatformButton>
            )}
          </div>
          {current?.id ? (
            <div>
              <strong>{current.condominium?.name ?? current.condominiumId}</strong>
              <p>{current.reason}</p>
              <small>Início: {formatDate(current.startedAt)}</small>
            </div>
          ) : (
            <PlatformEmpty text="Nenhuma sessão administrativa ativa." />
          )}
        </PlatformCard>

        <PlatformCard>
          <span className="eyebrow">HISTÓRICO DE ACESSOS</span>
          <h3>{history.length} sessões registradas</h3>
          <p className="muted">As sessões administrativas são auditadas separadamente das solicitações de atendimento.</p>
        </PlatformCard>
      </div>

      {resolutionTarget ? (
        <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && !saving && setResolutionTarget(null)}>
          <form className="modal" onSubmit={resolveTicket}>
            <span className="eyebrow">RESOLUÇÃO DA SA</span>
            <h2>Registrar solução aplicada</h2>
            <p className="muted">A SA será marcada como resolvida e ficará com responsável, data/hora e solução documentada.</p>
            <div className="ticket-summary">
              <strong>SA-{String(resolutionTarget.ticketNumber).padStart(5, "0")} · {resolutionTarget.title}</strong>
              <span>{resolutionTarget.condominium?.name ?? "Condomínio"}</span>
            </div>
            <label>
              Solução aplicada *
              <textarea
                autoFocus
                required
                minLength={5}
                maxLength={2000}
                value={resolution}
                onChange={(event) => setResolution(event.target.value)}
                placeholder="Ex.: acesso normalizado após correção da configuração e validação com o cliente."
              />
            </label>
            <div className="modal-actions">
              <button type="button" disabled={saving} onClick={() => setResolutionTarget(null)}>Cancelar</button>
              <button disabled={saving || resolution.trim().length < 5}>{saving ? "Registrando..." : "Resolver SA"}</button>
            </div>
          </form>
        </div>
      ) : null}

      {sessionModal ? (
        <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && setSessionModal(false)}>
          <form className="modal" onSubmit={startSession}>
            <h2>Iniciar sessão administrativa</h2>
            <label>
              Condomínio
              <select required value={form.condominiumId} onChange={(event) => setForm({ ...form, condominiumId: event.target.value })}>
                <option value="">Selecione...</option>
                {condos.filter((condo) => !["CANCELED", "REJECTED"].includes(condo.status)).map((condo) => (
                  <option key={condo.id} value={condo.id}>{condo.name}</option>
                ))}
              </select>
            </label>
            <label>
              Motivo
              <textarea required minLength={5} value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} />
            </label>
            <div className="modal-actions">
              <button type="button" onClick={() => setSessionModal(false)}>Cancelar</button>
              <button disabled={saving}>Iniciar</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

const css = `.support-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px}.eyebrow{display:block;font-size:10px;font-weight:900;letter-spacing:.8px;color:#7c6d87}.big{display:block;margin-top:8px;font-size:28px;color:var(--ic-primary-dark)}.bar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.bar h3{margin:4px 0 0;color:#2f1d3a}.select,.actions select,.modal select,.modal textarea{border:1px solid #ddd4e8;border-radius:10px;padding:9px 10px;background:#fff}.tickets{display:grid;gap:10px;margin-top:14px}.ticket{display:flex;justify-content:space-between;gap:16px;padding:15px;border:1px solid #eee8f5;border-radius:14px;background:#fcfaff;flex-wrap:wrap}.ticket-main{min-width:0;flex:1}.ticket-title{font-weight:900;color:#352044}.meta,.muted{font-size:11px;color:#8a7c94;margin-top:4px}.ticket p{color:#605269;font-size:12px;line-height:1.55}.chips{display:flex;gap:6px;flex-wrap:wrap}.priority,.status,.assignee{padding:5px 8px;border-radius:999px;font-size:10px;font-weight:900}.p-CRITICAL{background:#fee2e2;color:#991b1b}.p-HIGH{background:#ffedd5;color:#9a3412}.p-MEDIUM{background:#fef3c7;color:#92400e}.p-LOW{background:var(--ic-primary-soft-2);color:var(--ic-primary-dark)}.status{background:var(--ic-primary-soft-2);color:var(--ic-primary-dark)}.assignee{background:#ecfdf5;color:#166534}.resolution{display:grid;gap:4px;margin-top:12px;padding:11px;border-radius:12px;background:#ecfdf5;color:#166534;font-size:11px}.actions{display:flex;gap:6px;align-items:flex-start;flex-wrap:wrap;max-width:360px}.actions button,.modal-actions button{border:1px solid #ddd4e8;border-radius:9px;padding:8px 10px;background:#fff;color:var(--ic-primary-dark);font-weight:800;cursor:pointer}.support-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:14px;margin-top:18px}.overlay{position:fixed;inset:0;background:rgba(35,18,48,.55);display:grid;place-items:center;padding:18px;z-index:10000}.modal{width:min(520px,100%);background:#fff;border-radius:18px;padding:20px;display:grid;gap:14px}.modal label{display:grid;gap:6px;font-size:12px;font-weight:800;color:#55475f}.modal textarea{min-height:110px;resize:vertical}.ticket-summary{display:grid;gap:4px;padding:12px;border-radius:12px;background:#faf7ff;color:#55475f}.modal-actions{display:flex;justify-content:flex-end;gap:8px}@media(max-width:700px){.ticket{display:block}.actions{margin-top:12px;max-width:none}.actions button,.actions select{flex:1 1 130px}}`;
