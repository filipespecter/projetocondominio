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

function listOf(data) {
  if (Array.isArray(data)) return data;
  return data?.items ?? data?.data ?? [];
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function PlatformSupport() {
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [condominiums, setCondominiums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ condominiumId: "", reason: "" });

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [currentData, historyData, condoData] = await Promise.all([
        platformApi.support.current(),
        platformApi.support.history(),
        platformApi.condominiums.list("?limit=100&sortBy=name&sortOrder=asc"),
      ]);
      setCurrent(currentData);
      setHistory(listOf(historyData));
      setCondominiums(listOf(condoData));
    } catch (err) {
      setError(err?.message ?? "Falha ao carregar suporte.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const availableCondominiums = useMemo(
    () => condominiums.filter((item) => !["CANCELED", "REJECTED"].includes(item.status)),
    [condominiums]
  );

  async function start(event) {
    event.preventDefault();
    if (!form.condominiumId) {
      setError("Selecione o condomínio.");
      return;
    }
    if (form.reason.trim().length < 5) {
      setError("Descreva o motivo do atendimento com pelo menos 5 caracteres.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await platformApi.support.start({
        condominiumId: form.condominiumId,
        reason: form.reason.trim(),
      });
      setModalOpen(false);
      setForm({ condominiumId: "", reason: "" });
      await load();
    } catch (err) {
      setError(err?.message ?? "Não foi possível iniciar a sessão.");
    } finally {
      setSaving(false);
    }
  }

  async function close() {
    if (!current?.id) return;
    setSaving(true);
    try {
      await platformApi.support.close(current.id);
      await load();
    } catch (err) {
      setError(err?.message ?? "Não foi possível encerrar a sessão.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <PlatformLoading text="Carregando Central de Suporte..." />;
  }

  return (
    <div>
      <style>{responsiveCss}</style>
      <PlatformPageHeader
        eyebrow="ATENDIMENTO CONTROLADO"
        title="Central de Suporte"
        description="Sessões rastreáveis de atendimento aos condomínios, sem compartilhamento de senha do cliente."
        action={
          current?.id ? (
            <PlatformButton variant="danger" onClick={close} disabled={saving}>
              Encerrar sessão
            </PlatformButton>
          ) : (
            <PlatformButton onClick={() => setModalOpen(true)}>
              Novo atendimento
            </PlatformButton>
          )
        }
      />

      <PlatformError message={error} />

      <div style={styles.grid} className="support-grid">
        <PlatformCard style={styles.currentCard}>
          <span style={styles.eyebrow}>SESSÃO ATUAL</span>
          {!current?.id ? (
            <PlatformEmpty text="Nenhuma sessão ativa." />
          ) : (
            <div style={styles.current}>
              <div style={styles.liveBadge}>● EM ATENDIMENTO</div>
              <h3 style={styles.condoName}>
                {current.condominium?.name ?? current.condominiumId}
              </h3>
              <div style={styles.infoGrid}>
                <Info label="Início" value={formatDate(current.startedAt)} />
                <Info label="Última atividade" value={formatDate(current.lastActivityAt)} />
                <Info label="Status" value={current.status ?? "ACTIVE"} />
              </div>
              <div style={styles.reason}>
                <span style={styles.label}>MOTIVO DO ACESSO</span>
                <p>{current.reason}</p>
              </div>
            </div>
          )}
        </PlatformCard>

        <PlatformCard>
          <span style={styles.eyebrow}>RASTREABILIDADE</span>
          <h3 style={styles.cardTitle}>Regras do atendimento</h3>
          <div style={styles.rules}>
            <Rule text="Identidade do colaborador permanece registrada." />
            <Rule text="Acesso vinculado ao condomínio e ao motivo informado." />
            <Rule text="Ações realizadas durante a sessão ficam na auditoria." />
            <Rule text="Sessões inativas expiram automaticamente." />
          </div>
        </PlatformCard>
      </div>

      <PlatformCard style={{ marginTop: 18 }}>
        <div style={styles.historyHeader}>
          <div>
            <span style={styles.eyebrow}>HISTÓRICO</span>
            <h3 style={styles.cardTitle}>Atendimentos realizados</h3>
          </div>
          <span style={styles.counter}>{history.length} registros</span>
        </div>

        {history.length === 0 ? (
          <PlatformEmpty text="Nenhuma sessão anterior." />
        ) : (
          <div style={styles.history}>
            {history.map((item) => (
              <div key={item.id} style={styles.row}>
                <div>
                  <strong style={styles.rowTitle}>
                    {item.condominium?.name ?? item.condominiumId ?? "Condomínio"}
                  </strong>
                  <div style={styles.rowReason}>{item.reason ?? "Sem motivo informado."}</div>
                </div>
                <div style={styles.rowMeta}>
                  <span>{formatDate(item.startedAt)}</span>
                  <strong>{item.status ?? (item.endedAt ? "CLOSED" : "ACTIVE")}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </PlatformCard>

      {modalOpen && (
        <div style={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <form style={styles.modal} onSubmit={start}>
            <div style={styles.modalHeader}>
              <div>
                <span style={styles.eyebrow}>NOVO ATENDIMENTO</span>
                <h2 style={styles.modalTitle}>Iniciar sessão de suporte</h2>
                <p style={styles.modalSubtitle}>
                  Escolha o cliente e registre o motivo antes de entrar no contexto do condomínio.
                </p>
              </div>
              <button type="button" style={styles.close} onClick={() => setModalOpen(false)}>×</button>
            </div>

            <div style={styles.form}>
              <label style={styles.field}>
                <span style={styles.label}>Condomínio *</span>
                <select
                  style={styles.input}
                  value={form.condominiumId}
                  onChange={(e) => setForm((prev) => ({ ...prev, condominiumId: e.target.value }))}
                  required
                >
                  <option value="">Selecione...</option>
                  {availableCondominiums.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name ?? item.legalName ?? item.code} {item.code ? `• ${item.code}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Motivo do atendimento *</span>
                <textarea
                  style={{ ...styles.input, minHeight: 120, resize: "vertical" }}
                  value={form.reason}
                  maxLength={1000}
                  onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Ex.: análise de falha relatada no módulo de encomendas..."
                  required
                />
              </label>
            </div>

            <div style={styles.footer}>
              <button type="button" style={styles.cancel} onClick={() => setModalOpen(false)}>Cancelar</button>
              <button type="submit" style={styles.submit} disabled={saving}>
                {saving ? "Iniciando..." : "Iniciar atendimento"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return <div><span style={styles.label}>{label}</span><strong style={styles.value}>{value}</strong></div>;
}

function Rule({ text }) {
  return <div style={styles.rule}><span style={styles.ruleIcon}>✓</span><span>{text}</span></div>;
}

const responsiveCss = `
  @media (max-width: 860px) {
    .support-grid { grid-template-columns: 1fr !important; }
  }
`;

const styles = {
  grid: { display: "grid", gridTemplateColumns: "1.25fr .75fr", gap: 18 },
  currentCard: { borderColor: "rgba(200,168,92,.45)" },
  eyebrow: { display: "block", color: "#a17a28", fontSize: 10.5, fontWeight: 900, letterSpacing: 1.35, marginBottom: 7 },
  cardTitle: { margin: "4px 0 15px", fontSize: 20, color: "#21172d" },
  current: { marginTop: 8 },
  liveBadge: { display: "inline-block", color: "#047857", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 999, padding: "6px 10px", fontSize: 10, fontWeight: 900 },
  condoName: { margin: "14px 0 12px", fontSize: 24, color: "#271a32" },
  infoGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 14 },
  label: { display: "block", fontSize: 10.5, color: "#897b90", fontWeight: 900, textTransform: "uppercase", letterSpacing: .55, marginBottom: 4 },
  value: { color: "#31263a", fontSize: 13 },
  reason: { marginTop: 16, padding: 14, background: "#f8f4ff", borderRadius: 14, border: "1px solid #e8ddf3", color: "#5b4d66", lineHeight: 1.55 },
  rules: { display: "grid", gap: 10 },
  rule: { display: "flex", gap: 10, alignItems: "flex-start", color: "#62566b", lineHeight: 1.45, fontSize: 13 },
  ruleIcon: { width: 22, height: 22, borderRadius: 8, display: "grid", placeItems: "center", background: "#f6eed9", color: "#8a681f", fontWeight: 900, flexShrink: 0 },
  historyHeader: { display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", marginBottom: 12 },
  counter: { color: "#8c7e93", fontSize: 12, fontWeight: 800 },
  history: { display: "grid" },
  row: { display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center", padding: "14px 2px", borderBottom: "1px solid #eee8f2" },
  rowTitle: { color: "#33263d", fontSize: 14 },
  rowReason: { marginTop: 4, color: "#807386", fontSize: 12.5 },
  rowMeta: { display: "grid", textAlign: "right", gap: 4, color: "#8e8294", fontSize: 11.5 },
  overlay: { position: "fixed", inset: 0, zIndex: 9999, display: "grid", placeItems: "center", padding: 16, background: "rgba(20,11,29,.62)", backdropFilter: "blur(5px)" },
  modal: { width: "min(650px,96vw)", background: "white", borderRadius: 23, overflow: "hidden", border: "1px solid rgba(200,168,92,.55)", boxShadow: "0 30px 90px rgba(15,8,22,.35)" },
  modalHeader: { display: "flex", justifyContent: "space-between", gap: 18, padding: "22px 24px 17px", borderBottom: "1px solid #eee8f2" },
  modalTitle: { margin: "5px 0 0", fontSize: 26, color: "#21172d" },
  modalSubtitle: { margin: "6px 0 0", fontSize: 13, lineHeight: 1.5, color: "#756a7c" },
  close: { width: 38, height: 38, border: "1px solid #e6dde9", borderRadius: 12, background: "white", fontSize: 24, color: "#66536d", cursor: "pointer" },
  form: { padding: 22, display: "grid", gap: 16 },
  field: { display: "grid", gap: 6 },
  input: { width: "100%", boxSizing: "border-box", borderRadius: 12, border: "1px solid #dcd3e5", background: "#fefcff", padding: "12px 13px", outline: "none", color: "#271b31", fontSize: 14 },
  footer: { display: "flex", justifyContent: "flex-end", gap: 10, padding: "15px 22px", borderTop: "1px solid #eee8f2" },
  cancel: { border: "1px solid #ddd5e7", background: "white", color: "#554761", borderRadius: 12, padding: "11px 14px", fontWeight: 800, cursor: "pointer" },
  submit: { border: "1px solid #c8a85c", background: "linear-gradient(135deg,#6d28d9,#4c1d95)", color: "white", borderRadius: 12, padding: "11px 15px", fontWeight: 900, cursor: "pointer" },
};

export default PlatformSupport;
