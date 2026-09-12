import { useEffect, useState } from "react";
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

function PlatformAudit() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selected, setSelected] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [clearModal, setClearModal] = useState(false);
  const [reason, setReason] = useState("");
  const [backups, setBackups] = useState([]);
  const [backupStats, setBackupStats] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError("");

    const [auditResult, backupResult] = await Promise.allSettled([
      platformApi.audit.list(),
      platformApi.operations.backups(),
    ]);

    if (auditResult.status === "fulfilled") {
      const auditData = auditResult.value;
      setItems(
        Array.isArray(auditData)
          ? auditData
          : auditData?.items ?? auditData?.data ?? []
      );
    } else {
      setItems([]);
      setError(auditResult.reason?.message ?? "Falha ao carregar auditoria.");
    }

    if (backupResult.status === "fulfilled") {
      const backupData = backupResult.value;
      setBackups(backupData?.items ?? []);
      setBackupStats(backupData?.statistics ?? null);
    } else {
      setBackups([]);
      setBackupStats(null);
      if (auditResult.status === "fulfilled") {
        setError(backupResult.reason?.message ?? "Falha ao carregar backups.");
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function history(item) {
    setError("");
    try {
      setSelected(await platformApi.audit.show(item.id));
    } catch (err) {
      setError(err?.message ?? "Falha ao abrir detalhes da auditoria.");
    }
  }

  function openArchive(item) {
    setArchiveTarget(item);
    setClearModal(false);
    setReason("");
    setError("");
    setSuccess("");
  }

  function openClear() {
    setArchiveTarget(null);
    setClearModal(true);
    setReason("");
    setError("");
    setSuccess("");
  }

  function closeActionModal() {
    setArchiveTarget(null);
    setClearModal(false);
    setReason("");
  }

  async function archiveOne(event) {
    event.preventDefault();
    if (!archiveTarget?.id) return;
    if (reason.trim().length < 5) {
      setError("Informe um motivo com pelo menos 5 caracteres.");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await platformApi.audit.remove(archiveTarget.id, reason.trim());
      setSuccess("Registro ocultado da visualização. O conteúdo permanece preservado para rastreabilidade.");
      closeActionModal();
      await load();
    } catch (err) {
      setError(err?.message ?? "Não foi possível ocultar o registro.");
    } finally {
      setBusy(false);
    }
  }

  async function clearVisible(event) {
    event.preventDefault();
    if (reason.trim().length < 5) {
      setError("Informe um motivo com pelo menos 5 caracteres.");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await platformApi.audit.clearView(reason.trim());
      setSuccess(`${result?.count ?? 0} registro(s) ocultado(s). A auditoria não foi apagada fisicamente.`);
      closeActionModal();
      await load();
    } catch (err) {
      setError(err?.message ?? "Não foi possível limpar a visualização da auditoria.");
    } finally {
      setBusy(false);
    }
  }

  async function createBackup() {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await platformApi.operations.createBackup();
      setSuccess("Backup solicitado com sucesso.");
      await load();
    } catch (err) {
      setError(err?.message ?? "Falha ao gerar backup.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <PlatformLoading text="Carregando auditoria e backups..." />;
  }

  return (
    <div>
      <PlatformPageHeader
        eyebrow="RASTREABILIDADE E PROTEÇÃO"
        title="Auditoria global"
        description="Registro histórico das ações realizadas na plataforma. Auditoria documenta fatos; eventos técnicos e SAs possuem seus próprios fluxos de resolução."
        action={
          <div style={styles.actions}>
            <PlatformButton variant="secondary" onClick={openClear} disabled={busy || items.length === 0}>
              Limpar visualização
            </PlatformButton>
            <PlatformButton onClick={createBackup} disabled={busy}>
              Gerar backup agora
            </PlatformButton>
          </div>
        }
      />

      <PlatformError message={error} />
      {success ? <div style={styles.success}>{success}</div> : null}

      <div style={styles.metrics}>
        <div style={styles.metric}>
          <span>Registros visíveis</span>
          <strong>{items.length}</strong>
        </div>
        <div style={styles.metric}>
          <span>Backups verificados</span>
          <strong>{backupStats?.verified ?? 0}</strong>
        </div>
        <div style={styles.metric}>
          <span>Backups recentes</span>
          <strong>{backups.length}</strong>
        </div>
      </div>

      <PlatformCard>
        <div style={styles.cardTitle}>
          <div>
            <strong>Histórico da plataforma</strong>
            <p style={styles.helper}>
              Os registros não possuem ação “Resolver”. Use “Detalhes” para consultar a evidência ou “Ocultar” para retirar um item da visualização normal.
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <PlatformEmpty text="Nenhum registro de auditoria visível." />
        ) : (
          <div style={platformTableStyles.wrapper}>
            <table style={platformTableStyles.table}>
              <thead>
                <tr>
                  <th style={platformTableStyles.th}>Data</th>
                  <th style={platformTableStyles.th}>Usuário</th>
                  <th style={platformTableStyles.th}>Ação</th>
                  <th style={platformTableStyles.th}>Módulo</th>
                  <th style={platformTableStyles.th}>Detalhes</th>
                  <th style={platformTableStyles.th}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td style={platformTableStyles.td}>{formatDate(item.createdAt)}</td>
                    <td style={platformTableStyles.td}>{item.userName ?? item.user?.name ?? "-"}</td>
                    <td style={platformTableStyles.td}>{item.action ?? "-"}</td>
                    <td style={platformTableStyles.td}>{item.module ?? "-"}</td>
                    <td style={platformTableStyles.td}>{item.details ?? "-"}</td>
                    <td style={platformTableStyles.td}>
                      <div style={styles.actions}>
                        <PlatformButton variant="secondary" onClick={() => history(item)}>
                          Detalhes
                        </PlatformButton>
                        <PlatformButton variant="danger" onClick={() => openArchive(item)}>
                          Ocultar
                        </PlatformButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PlatformCard>

      <PlatformCard style={{ marginTop: 18 }}>
        <div style={styles.cardTitle}>
          <div>
            <strong>Backups da plataforma</strong>
            <p style={styles.helper}>Histórico operacional do PostgreSQL e arquivos de backup.</p>
          </div>
          <PlatformButton variant="secondary" onClick={createBackup} disabled={busy}>
            Backup manual
          </PlatformButton>
        </div>

        {backups.length === 0 ? (
          <PlatformEmpty text="Nenhum backup registrado." />
        ) : (
          <div style={platformTableStyles.wrapper}>
            <table style={platformTableStyles.table}>
              <thead>
                <tr>
                  <th style={platformTableStyles.th}>Data</th>
                  <th style={platformTableStyles.th}>Arquivo</th>
                  <th style={platformTableStyles.th}>Status</th>
                  <th style={platformTableStyles.th}>Tipo</th>
                </tr>
              </thead>
              <tbody>
                {backups.slice(0, 10).map((backup) => (
                  <tr key={backup.id}>
                    <td style={platformTableStyles.td}>{formatDate(backup.createdAt)}</td>
                    <td style={platformTableStyles.td}>{backup.fileName ?? "-"}</td>
                    <td style={platformTableStyles.td}>{backup.status ?? "-"}</td>
                    <td style={platformTableStyles.td}>{backup.trigger ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PlatformCard>

      {selected ? (
        <div style={styles.overlay} onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
          <div style={styles.modal}>
            <div style={styles.modalHead}>
              <div>
                <span style={styles.badge}>AUDITORIA</span>
                <h2 style={styles.modalTitle}>Detalhes do registro</h2>
              </div>
              <button type="button" style={styles.close} onClick={() => setSelected(null)}>×</button>
            </div>
            <div style={styles.detailGrid}>
              {[
                ["Data", formatDate(selected.createdAt)],
                ["Usuário", selected.userName ?? selected.user?.name ?? "-"],
                ["Perfil", selected.userRole ?? "-"],
                ["Ação", selected.action ?? "-"],
                ["Módulo", selected.module ?? "-"],
                ["Request ID", selected.requestId ?? "-"],
                ["Referência", selected.referenceId ?? "-"],
                ["IP", selected.ipAddress ?? "-"],
              ].map(([key, value]) => (
                <div style={styles.detail} key={key}>
                  <span>{key}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div style={styles.long}>
              <span>Detalhes</span>
              <p>{selected.details ?? "Sem detalhes adicionais."}</p>
            </div>
            {selected.beforeData ? <div style={styles.code}><b>Antes</b><pre>{JSON.stringify(selected.beforeData, null, 2)}</pre></div> : null}
            {selected.afterData ? <div style={styles.code}><b>Depois</b><pre>{JSON.stringify(selected.afterData, null, 2)}</pre></div> : null}
          </div>
        </div>
      ) : null}

      {archiveTarget || clearModal ? (
        <div style={styles.overlay} onMouseDown={(event) => event.target === event.currentTarget && !busy && closeActionModal()}>
          <form style={{ ...styles.modal, maxWidth: 520 }} onSubmit={clearModal ? clearVisible : archiveOne}>
            <span style={styles.badge}>{clearModal ? "LIMPAR VISUALIZAÇÃO" : "OCULTAR REGISTRO"}</span>
            <h2 style={styles.modalTitle}>{clearModal ? "Limpar o histórico visível?" : "Ocultar este registro?"}</h2>
            <p style={styles.helper}>
              {clearModal
                ? "Os registros visíveis serão arquivados logicamente. Nenhum registro de auditoria será apagado fisicamente, e a própria limpeza ficará registrada."
                : "O registro sairá da visualização normal, mas continuará preservado no banco para rastreabilidade e segurança."}
            </p>
            <label style={styles.field}>
              <span>Motivo obrigatório</span>
              <textarea
                autoFocus
                required
                minLength={5}
                maxLength={500}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Ex.: limpeza dos registros de validação antes do início do piloto."
                style={styles.textarea}
              />
            </label>
            <div style={styles.actionsRight}>
              <PlatformButton variant="secondary" onClick={closeActionModal} disabled={busy}>Cancelar</PlatformButton>
              <PlatformButton variant="danger" type="submit" disabled={busy || reason.trim().length < 5}>
                {busy ? "Processando..." : clearModal ? "Limpar visualização" : "Ocultar registro"}
              </PlatformButton>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  metrics: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginBottom: 18 },
  metric: { padding: 20, borderRadius: 20, background: "linear-gradient(145deg,#170d2d,var(--ic-primary-deep))", color: "white", boxShadow: "0 18px 42px rgb(var(--ic-primary-deep-rgb) / .18)", display: "flex", flexDirection: "column", gap: 8 },
  cardTitle: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 15, marginBottom: 16 },
  helper: { color: "#6b7280", lineHeight: 1.6, margin: "7px 0 0" },
  success: { marginBottom: 16, padding: "12px 14px", borderRadius: 14, background: "#ecfdf5", border: "1px solid #bbf7d0", color: "#166534", fontWeight: 700 },
  actions: { display: "flex", gap: 8, flexWrap: "wrap" },
  actionsRight: { display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap", marginTop: 18 },
  overlay: { position: "fixed", inset: 0, background: "rgba(15,8,30,.65)", backdropFilter: "blur(8px)", display: "grid", placeItems: "center", padding: 20, zIndex: 9999 },
  modal: { width: "min(760px,96vw)", maxHeight: "88vh", overflow: "auto", background: "white", borderRadius: 26, padding: 26, boxShadow: "0 35px 90px rgba(15,8,30,.3)" },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  modalTitle: { margin: "6px 0 0", color: "#24113c" },
  close: { border: 0, background: "#f3f4f6", borderRadius: 12, width: 38, height: 38, fontSize: 24, cursor: "pointer" },
  badge: { fontSize: 11, fontWeight: 800, letterSpacing: 1.4, color: "var(--ic-primary)" },
  detailGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, margin: "18px 0" },
  detail: { padding: 14, border: "1px solid var(--ic-primary-soft-2)", borderRadius: 16, display: "flex", flexDirection: "column", gap: 6 },
  long: { padding: 16, borderRadius: 16, background: "#faf7ff" },
  code: { marginTop: 14, padding: 16, borderRadius: 16, background: "#171026", color: "var(--ic-primary-soft-2)", overflow: "auto" },
  field: { display: "grid", gap: 8, marginTop: 18, color: "#4c3d57", fontSize: 12, fontWeight: 800 },
  textarea: { width: "100%", minHeight: 110, resize: "vertical", border: "1px solid var(--ic-primary-border-soft)", borderRadius: 14, padding: 12, font: "inherit", boxSizing: "border-box" },
};

export default PlatformAudit;
