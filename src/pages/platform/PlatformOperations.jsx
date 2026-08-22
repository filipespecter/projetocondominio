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
      ] = await Promise.all([
        platformApi.operations
          .jobs(),
        platformApi.operations
          .backups(),
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
        description="Operações do Bloco 9 consumidas diretamente pelo frontend da Central."
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
