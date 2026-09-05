import { confirmDialog, promptDialog } from "../../components/GlobalDialogs.jsx";
import {
  useEffect,
  useState,
} from "react";

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

function PlatformOperations() {
  const [
    jobs,
    setJobs,
  ] = useState([]);

  const [
    scheduler,
    setScheduler,
  ] = useState(null);

  const [
    backups,
    setBackups,
  ] = useState([]);

  const [
    backupStats,
    setBackupStats,
  ] = useState(null);

  const [
    databaseStats,
    setDatabaseStats,
  ] = useState(null);

  const [
    resetting,
    setResetting,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [
        jobData,
        backupData,
        dbData,
      ] = await Promise.all([
        platformApi.operations
          .jobs(),
        platformApi.operations
          .backups(),
        platformApi.operations.databaseStatistics().catch(() => null),
      ]);

      setScheduler(
        jobData?.scheduler ??
        null
      );

      setJobs(
        Array.isArray(
          jobData?.jobs
        )
          ? jobData.jobs
          : []
      );

      setBackups(
        Array.isArray(
          backupData?.items
        )
          ? backupData.items
          : []
      );

      setBackupStats(
        backupData?.statistics ??
        null
      );
      setDatabaseStats(dbData);
    } catch (err) {
      setError(
        err?.message ??
        "Falha ao carregar operações."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function runJob(name) {
    try {
      await platformApi.operations
        .runJob(name);

      await load();
    } catch (err) {
      setError(
        err?.message ??
        "Falha ao executar o job."
      );
    }
  }

  async function toggleJob(job) {
    try {
      if (job.enabled) {
        await platformApi.operations
          .disableJob(job.name);
      } else {
        await platformApi.operations
          .enableJob(job.name);
      }

      await load();
    } catch (err) {
      setError(
        err?.message ??
        "Falha ao alterar o job."
      );
    }
  }

  async function backup() {
    try {
      await platformApi.operations
        .createBackup();

      await load();
    } catch (err) {
      setError(
        err?.message ??
        "Falha ao executar o backup."
      );
    }
  }

  async function resetHomologation() {
    const phrase = await promptDialog(
      "Esta ação apaga os dados operacionais de homologação, preserva a conta proprietária, planos e estrutura do banco. Um backup é criado antes da limpeza. Digite ZERAR HOMOLOGACAO para continuar.",
      { title: "Zerar ambiente de homologação", placeholder: "ZERAR HOMOLOGACAO" }
    );
    if (phrase === null) return;
    if (String(phrase).trim().toUpperCase() !== "ZERAR HOMOLOGACAO") {
      setError("Confirmação inválida. Nenhum dado foi apagado.");
      return;
    }
    const confirmed = await confirmDialog(
      "Tem certeza? O InfinityCondo criará um backup e removerá todos os dados de clientes do ambiente de homologação.",
      { title: "Confirmação final", danger: true }
    );
    if (!confirmed) return;
    setResetting(true); setError("");
    try {
      const result = await platformApi.operations.resetHomologation(phrase);
      setDatabaseStats(result?.statistics ?? null);
      await load();
      alert("Ambiente de homologação zerado com sucesso. O backup de segurança foi preservado.");
    } catch (err) { setError(err?.message ?? "Não foi possível zerar o ambiente de homologação."); }
    finally { setResetting(false); }
  }

  if (loading) {
    return (
      <PlatformLoading text="Carregando operações..." />
    );
  }

  return (
    <div>
      <PlatformPageHeader
        eyebrow="INFRAESTRUTURA"
        title="Jobs e backups"
        description="Monitoramento de rotinas automáticas, integridade operacional e backups da plataforma."
        action={
          <PlatformButton
            onClick={backup}
          >
            Backup manual
          </PlatformButton>
        }
      />

      <PlatformError message={error} />

      <PlatformCard>
        <strong>
          Scheduler
        </strong>

        <p style={styles.text}>
          Status:{" "}
          <b>
            {scheduler?.running
              ? "ATIVO"
              : "INATIVO"}
          </b>
        </p>

        {jobs.length === 0 ? (
          <PlatformEmpty text="Nenhum job registrado." />
        ) : (
          <div style={platformTableStyles.wrapper}>
            <table style={platformTableStyles.table}>
              <thead>
                <tr>
                  <th style={platformTableStyles.th}>
                    Job
                  </th>
                  <th style={platformTableStyles.th}>
                    Habilitado
                  </th>
                  <th style={platformTableStyles.th}>
                    Última execução
                  </th>
                  <th style={platformTableStyles.th}>
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {jobs.map((job) => (
                  <tr key={job.name}>
                    <td style={platformTableStyles.td}>
                      {job.name}
                    </td>

                    <td style={platformTableStyles.td}>
                      {job.enabled
                        ? "SIM"
                        : "NÃO"}
                    </td>

                    <td style={platformTableStyles.td}>
                      {job.lastRunAt
                        ? new Date(
                            job.lastRunAt
                          ).toLocaleString(
                            "pt-BR"
                          )
                        : "-"}
                    </td>

                    <td style={platformTableStyles.td}>
                      <div style={styles.actions}>
                        <PlatformButton
                          variant="secondary"
                          onClick={() =>
                            runJob(
                              job.name
                            )
                          }
                        >
                          Executar
                        </PlatformButton>

                        <PlatformButton
                          variant={
                            job.enabled
                              ? "danger"
                              : "success"
                          }
                          onClick={() =>
                            toggleJob(
                              job
                            )
                          }
                        >
                          {job.enabled
                            ? "Desabilitar"
                            : "Habilitar"}
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

      {databaseStats && (
        <PlatformCard style={{ marginTop: "18px" }}>
          <div style={styles.databaseHeader}>
            <div>
              <strong>Banco / Ambiente de Teste</strong>
              <p style={styles.text}>Visão segura da base de homologação e ferramenta de reinicialização controlada.</p>
            </div>
            <PlatformButton variant="danger" disabled={resetting} onClick={resetHomologation}>
              {resetting ? "Zerando..." : "Zerar homologação"}
            </PlatformButton>
          </div>
          <div style={styles.databaseGrid}>
            {[
              ["Condomínios", databaseStats.condominiums],
              ["Usuários de clientes", databaseStats.users],
              ["Moradores", databaseStats.residents],
              ["Apartamentos", databaseStats.apartments],
              ["Encomendas", databaseStats.packages],
              ["Reservas", databaseStats.reservations],
              ["Despesas", databaseStats.expenses],
              ["SAs", databaseStats.tickets],
              ["Auditoria", databaseStats.auditLogs],
              ["Backups", databaseStats.backups],
            ].map(([label, value]) => (
              <div key={label} style={styles.databaseMetric}><span>{label}</span><strong>{value ?? 0}</strong></div>
            ))}
          </div>
          <p style={styles.dangerNote}>A limpeza só existe fora de produção, exige PLATFORM_OWNER, confirmação textual e backup prévio.</p>
        </PlatformCard>
      )}

      <PlatformCard
        style={{
          marginTop: "18px",
        }}
      >
        <strong>
          Backups
        </strong>

        <p style={styles.text}>
          Verificados:{" "}
          {backupStats?.verified ??
            0}
        </p>

        {backups.length === 0 ? (
          <PlatformEmpty text="Nenhum backup registrado." />
        ) : (
          <div style={platformTableStyles.wrapper}>
            <table style={platformTableStyles.table}>
              <thead>
                <tr>
                  <th style={platformTableStyles.th}>
                    Arquivo
                  </th>
                  <th style={platformTableStyles.th}>
                    Status
                  </th>
                  <th style={platformTableStyles.th}>
                    Data
                  </th>
                </tr>
              </thead>

              <tbody>
                {backups.map((item) => (
                  <tr key={item.id}>
                    <td style={platformTableStyles.td}>
                      {item.fileName ??
                        "-"}
                    </td>
                    <td style={platformTableStyles.td}>
                      {item.status ??
                        "-"}
                    </td>
                    <td style={platformTableStyles.td}>
                      {item.createdAt
                        ? new Date(
                            item.createdAt
                          ).toLocaleString(
                            "pt-BR"
                          )
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PlatformCard>
    </div>
  );
}

const styles = {
  databaseHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" },
  databaseGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "10px", marginTop: "14px" },
  databaseMetric: { padding: "12px", borderRadius: "11px", background: "#faf8fc", border: "1px solid #eee8f5", display: "grid", gap: "5px" },
  dangerNote: { margin: "12px 0 0", padding: "10px 12px", borderRadius: "10px", background: "#fff7ed", color: "#9a3412", border: "1px solid #fed7aa", fontSize: "11px" },
  actions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },

  text: {
    color: "#6e6577",
    fontSize: "13px",
  },
};

export default PlatformOperations;
