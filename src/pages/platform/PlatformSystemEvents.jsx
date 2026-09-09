import { useEffect, useMemo, useState } from "react";
import platformApi from "../../Services/platformApi.js";
import {
  PlatformButton,
  PlatformCard,
  PlatformEmpty,
  PlatformError,
  PlatformLoading,
  PlatformPageHeader,
  platformTableStyles,
} from "../../components/PlatformUi.jsx";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("pt-BR");
}

function PlatformSystemEvents() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("OPEN");
  const [resolutionTarget, setResolutionTarget] = useState(null);
  const [resolutionAction, setResolutionAction] = useState("");
  const [resolutionComment, setResolutionComment] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await platformApi.events.list();
      setItems(Array.isArray(data) ? data : data?.items ?? data?.data ?? []);
    } catch (err) {
      setError(err?.message ?? "Falha ao carregar eventos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const visibleItems = useMemo(() => {
    if (filter === "ALL") return items;
    if (filter === "RESOLVED") return items.filter((item) => Boolean(item.resolvedAt));
    return items.filter((item) => !item.resolvedAt);
  }, [items, filter]);

  function openResolution(item) {
    setResolutionTarget(item);
    setResolutionAction("");
    setResolutionComment("");
    setError("");
  }

  async function reopen(item) {
    setBusy(true);
    setError("");
    try {
      await platformApi.events.reopen(item.id);
      await load();
    } catch (err) {
      setError(err?.message ?? "Não foi possível reabrir o evento.");
    } finally {
      setBusy(false);
    }
  }

  async function submitResolution(event) {
    event.preventDefault();
    if (!resolutionTarget?.id) return;
    if (resolutionAction.trim().length < 5) {
      setError("Descreva a ação tomada com pelo menos 5 caracteres.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await platformApi.events.resolve(resolutionTarget.id, {
        resolutionAction: resolutionAction.trim(),
        resolutionComment: resolutionComment.trim() || null,
      });
      setResolutionTarget(null);
      setResolutionAction("");
      setResolutionComment("");
      await load();
    } catch (err) {
      setError(err?.message ?? "Não foi possível resolver o evento.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <PlatformLoading text="Carregando eventos do sistema..." />;
  }

  return (
    <div>
      <PlatformPageHeader
        eyebrow="OPERAÇÃO"
        title="Eventos do sistema"
        description="Ocorrências técnicas da plataforma que exigem acompanhamento operacional até a normalização."
        action={<PlatformButton variant="secondary" onClick={load}>Atualizar</PlatformButton>}
      />

      <PlatformError message={error} />

      <div style={styles.filters}>
        {[
          ["OPEN", "Em aberto"],
          ["RESOLVED", "Resolvidos"],
          ["ALL", "Todos"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            style={{ ...styles.filter, ...(filter === value ? styles.filterActive : {}) }}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <PlatformCard>
        {visibleItems.length === 0 ? (
          <PlatformEmpty text={filter === "RESOLVED" ? "Nenhum evento resolvido." : "Nenhum evento em aberto."} />
        ) : (
          <div style={platformTableStyles.wrapper}>
            <table style={platformTableStyles.table}>
              <thead>
                <tr>
                  <th style={platformTableStyles.th}>Data</th>
                  <th style={platformTableStyles.th}>Evento</th>
                  <th style={platformTableStyles.th}>Severidade</th>
                  <th style={platformTableStyles.th}>Status</th>
                  <th style={platformTableStyles.th}>Tratamento</th>
                  <th style={platformTableStyles.th}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item) => (
                  <tr key={item.id}>
                    <td style={platformTableStyles.td}>{formatDate(item.occurredAt ?? item.createdAt)}</td>
                    <td style={platformTableStyles.td}>
                      <strong>{item.type ?? item.eventType ?? "Evento"}</strong>
                      <div style={styles.small}>{item.message ?? "Sem descrição."}</div>
                      {item.route ? <div style={styles.small}>{item.httpMethod ?? ""} {item.route}</div> : null}
                    </td>
                    <td style={platformTableStyles.td}>{item.severity ?? "-"}</td>
                    <td style={platformTableStyles.td}>{item.resolvedAt ? "RESOLVIDO" : "EM ABERTO"}</td>
                    <td style={platformTableStyles.td}>
                      {item.resolvedAt ? (
                        <div style={styles.resolutionBox}>
                          <strong>{item.resolutionAction ?? item.resolutionNotes ?? "Ação registrada"}</strong>
                          <span>Por: {item.resolvedBy?.name ?? "Usuário da plataforma"}</span>
                          <span>Em: {formatDate(item.resolvedAt)}</span>
                          {item.resolutionComment ? <span>Obs.: {item.resolutionComment}</span> : null}
                        </div>
                      ) : (
                        <span style={styles.pending}>Aguardando tratamento</span>
                      )}
                    </td>
                    <td style={platformTableStyles.td}>
                      {item.resolvedAt ? (
                        <PlatformButton variant="secondary" disabled={busy} onClick={() => reopen(item)}>
                          Reabrir
                        </PlatformButton>
                      ) : (
                        <PlatformButton variant="secondary" disabled={busy} onClick={() => openResolution(item)}>
                          Resolver
                        </PlatformButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PlatformCard>

      {resolutionTarget ? (
        <div
          style={styles.overlay}
          onMouseDown={(event) => event.target === event.currentTarget && !busy && setResolutionTarget(null)}
        >
          <form style={styles.modal} onSubmit={submitResolution}>
            <div style={styles.header}>
              <div>
                <span style={styles.eyebrow}>TRATAMENTO DE EVENTO</span>
                <h2 style={styles.title}>Registrar resolução</h2>
                <p style={styles.subtitle}>
                  A resolução registra responsável, data/hora, ação tomada e uma observação opcional.
                </p>
              </div>
              <button type="button" style={styles.close} disabled={busy} onClick={() => setResolutionTarget(null)}>×</button>
            </div>

            <div style={styles.body}>
              <div style={styles.eventBox}>
                <strong>{resolutionTarget.type ?? resolutionTarget.eventType ?? "Evento"}</strong>
                <span>{resolutionTarget.message ?? resolutionTarget.details ?? "Sem descrição adicional."}</span>
              </div>

              <label style={styles.field}>
                <span style={styles.label}>Ação tomada *</span>
                <textarea
                  autoFocus
                  required
                  minLength={5}
                  maxLength={1000}
                  style={styles.textarea}
                  value={resolutionAction}
                  onChange={(event) => setResolutionAction(event.target.value)}
                  placeholder="Ex.: configuração corrigida e serviço validado novamente."
                />
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Observação</span>
                <textarea
                  maxLength={2000}
                  style={styles.textarea}
                  value={resolutionComment}
                  onChange={(event) => setResolutionComment(event.target.value)}
                  placeholder="Informação complementar, quando necessário."
                />
              </label>
            </div>

            <div style={styles.footer}>
              <PlatformButton variant="secondary" disabled={busy} onClick={() => setResolutionTarget(null)}>
                Cancelar
              </PlatformButton>
              <PlatformButton type="submit" disabled={busy || resolutionAction.trim().length < 5}>
                {busy ? "Registrando..." : "Resolver evento"}
              </PlatformButton>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  filters: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 },
  filter: { border: "1px solid #ddd6fe", background: "#fff", color: "#5b21b6", borderRadius: 999, padding: "8px 13px", fontWeight: 800, cursor: "pointer" },
  filterActive: { background: "#5b21b6", color: "#fff", borderColor: "#5b21b6" },
  small: { color: "#75667e", fontSize: 11, marginTop: 4, maxWidth: 420, lineHeight: 1.4 },
  pending: { color: "#92400e", fontWeight: 800, fontSize: 11 },
  resolutionBox: { display: "grid", gap: 3, minWidth: 210, color: "#4b3d54", fontSize: 11, lineHeight: 1.4 },
  overlay: { position: "fixed", inset: 0, zIndex: 9999, display: "grid", placeItems: "center", padding: 16, background: "rgba(20,11,29,0.62)", backdropFilter: "blur(5px)" },
  modal: { width: "min(650px,96vw)", background: "#ffffff", borderRadius: 22, overflow: "hidden", border: "1px solid rgba(200,168,92,0.55)", boxShadow: "0 30px 90px rgba(15,8,22,0.35)" },
  header: { display: "flex", justifyContent: "space-between", gap: 18, padding: "22px 24px 17px", borderBottom: "1px solid #eee8f2" },
  eyebrow: { color: "#a17a28", fontSize: 10, fontWeight: 900, letterSpacing: 1.3 },
  title: { margin: "5px 0 0", color: "#21172d", fontSize: 26 },
  subtitle: { margin: "6px 0 0", color: "#766b7d", fontSize: 13, lineHeight: 1.5 },
  close: { width: 38, height: 38, borderRadius: 12, border: "1px solid #e6dde9", background: "#ffffff", color: "#66536d", fontSize: 24, cursor: "pointer" },
  body: { padding: 22, display: "grid", gap: 16 },
  eventBox: { display: "grid", gap: 5, padding: 13, borderRadius: 13, background: "#faf7ff", border: "1px solid #ede9fe", color: "#4b3d54" },
  field: { display: "grid", gap: 7 },
  label: { fontSize: 12, fontWeight: 900, color: "#55475f" },
  textarea: { width: "100%", minHeight: 100, boxSizing: "border-box", border: "1px solid #ddd4e8", borderRadius: 12, padding: 11, resize: "vertical", font: "inherit" },
  footer: { display: "flex", justifyContent: "flex-end", gap: 8, padding: "0 22px 22px" },
};

export default PlatformSystemEvents;
