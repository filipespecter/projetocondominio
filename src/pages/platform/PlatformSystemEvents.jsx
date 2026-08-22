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

function PlatformSystemEvents() {
  const [
    items,
    setItems,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    resolutionTarget,
    setResolutionTarget,
  ] = useState(null);

  const [
    resolutionNotes,
    setResolutionNotes,
  ] = useState("");

  async function load() {
    setLoading(true);

    try {
      const data =
        await platformApi.events
          .list();

      setItems(
        Array.isArray(data)
          ? data
          : (
              data?.items ??
              data?.data ??
              []
            )
      );
    } catch (err) {
      setError(
        err?.message ??
        "Falha ao carregar eventos."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(item) {
    if (
      item.status === "RESOLVED" ||
      item.resolvedAt
    ) {
      try {
        await platformApi.events.reopen(item.id);
        await load();
      } catch (err) {
        setError(
          err?.message ??
          "Não foi possível reabrir o evento."
        );
      }
      return;
    }

    setResolutionTarget(item);
    setResolutionNotes("");
    setError("");
  }

  async function submitResolution(event) {
    event.preventDefault();

    if (!resolutionTarget?.id) return;

    try {
      await platformApi.events.resolve(
        resolutionTarget.id,
        resolutionNotes.trim()
      );
      setResolutionTarget(null);
      setResolutionNotes("");
      await load();
    } catch (err) {
      setError(
        err?.message ??
        "Não foi possível resolver o evento."
      );
    }
  }

  if (loading) {
    return (
      <PlatformLoading text="Carregando eventos do sistema..." />
    );
  }

  return (
    <div>
      <PlatformPageHeader
        eyebrow="OPERAÇÃO"
        title="Eventos do sistema"
        description="Eventos técnicos registrados pelo backend."
      />

      <PlatformError message={error} />

      <PlatformCard>
        {items.length === 0 ? (
          <PlatformEmpty />
        ) : (
          <div style={platformTableStyles.wrapper}>
            <table style={platformTableStyles.table}>
              <thead>
                <tr>
                  <th style={platformTableStyles.th}>
                    Data
                  </th>
                  <th style={platformTableStyles.th}>
                    Tipo
                  </th>
                  <th style={platformTableStyles.th}>
                    Severidade
                  </th>
                  <th style={platformTableStyles.th}>
                    Status
                  </th>
                  <th style={platformTableStyles.th}>
                    Ação
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td style={platformTableStyles.td}>
                      {item.createdAt
                        ? new Date(
                            item.createdAt
                          ).toLocaleString(
                            "pt-BR"
                          )
                        : "-"}
                    </td>
                    <td style={platformTableStyles.td}>
                      {item.type ??
                        item.eventType ??
                        "-"}
                    </td>
                    <td style={platformTableStyles.td}>
                      {item.severity ?? "-"}
                    </td>
                    <td style={platformTableStyles.td}>
                      {item.status ??
                        (
                          item.resolvedAt
                            ? "RESOLVED"
                            : "OPEN"
                        )}
                    </td>
                    <td style={platformTableStyles.td}>
                      <PlatformButton
                        variant="secondary"
                        onClick={() =>
                          toggle(item)
                        }
                      >
                        {item.status ===
                          "RESOLVED" ||
                        item.resolvedAt
                          ? "Reabrir"
                          : "Resolver"}
                      </PlatformButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PlatformCard>

      {resolutionTarget && (
        <div
          style={styles.overlay}
          onMouseDown={(event) =>
            event.target === event.currentTarget &&
            setResolutionTarget(null)
          }
        >
          <form
            style={styles.modal}
            onSubmit={submitResolution}
          >
            <div style={styles.header}>
              <div>
                <span style={styles.eyebrow}>
                  TRATAMENTO DE EVENTO
                </span>
                <h2 style={styles.title}>
                  Registrar resolução
                </h2>
                <p style={styles.subtitle}>
                  Documente a ação realizada antes de encerrar o evento técnico.
                </p>
              </div>
              <button
                type="button"
                style={styles.close}
                onClick={() =>
                  setResolutionTarget(null)
                }
              >
                ×
              </button>
            </div>

            <div style={styles.body}>
              <div style={styles.eventBox}>
                <strong>
                  {resolutionTarget.type ??
                    resolutionTarget.eventType ??
                    "Evento"}
                </strong>
                <span>
                  {resolutionTarget.message ??
                    resolutionTarget.details ??
                    "Sem descrição adicional."}
                </span>
              </div>

              <label style={styles.field}>
                <span style={styles.label}>
                  Observação da resolução
                </span>
                <textarea
                  autoFocus
                  style={styles.textarea}
                  value={resolutionNotes}
                  maxLength={2000}
                  onChange={(event) =>
                    setResolutionNotes(
                      event.target.value
                    )
                  }
                  placeholder="Ex.: serviço reiniciado e operação normalizada."
                />
              </label>
            </div>

            <div style={styles.footer}>
              <PlatformButton
                variant="secondary"
                onClick={() =>
                  setResolutionTarget(null)
                }
              >
                Cancelar
              </PlatformButton>
              <PlatformButton type="submit">
                Resolver evento
              </PlatformButton>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    display: "grid",
    placeItems: "center",
    padding: "16px",
    background: "rgba(20,11,29,0.62)",
    backdropFilter: "blur(5px)",
  },
  modal: {
    width: "min(650px,96vw)",
    background: "#ffffff",
    borderRadius: "22px",
    overflow: "hidden",
    border: "1px solid rgba(200,168,92,0.55)",
    boxShadow: "0 30px 90px rgba(15,8,22,0.35)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    padding: "22px 24px 17px",
    borderBottom: "1px solid #eee8f2",
  },
  eyebrow: {
    color: "#a17a28",
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "1.3px",
  },
  title: {
    margin: "5px 0 0",
    color: "#21172d",
    fontSize: "26px",
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#766b7d",
    fontSize: "13px",
    lineHeight: 1.5,
  },
  close: {
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    border: "1px solid #e6dde9",
    background: "#ffffff",
    color: "#66536d",
    fontSize: "24px",
    cursor: "pointer",
  },
  body: {
    padding: "22px",
    display: "grid",
    gap: "16px",
  },
  eventBox: {
    display: "grid",
    gap: "5px",
    padding: "13px",
    borderRadius: "13px",
    background: "#f8f4ff",
    color: "#5f5068",
    fontSize: "13px",
  },
  field: {
    display: "grid",
    gap: "7px",
  },
  label: {
    color: "#63566c",
    fontSize: "11px",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  textarea: {
    minHeight: "120px",
    resize: "vertical",
    border: "1px solid #dcd3e5",
    borderRadius: "12px",
    padding: "12px",
    outline: "none",
    fontFamily: "inherit",
    fontSize: "14px",
    color: "#271b31",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    padding: "15px 22px",
    borderTop: "1px solid #eee8f2",
  },
};

export default PlatformSystemEvents;
