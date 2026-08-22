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

function PlatformCondominiums() {
  const [
    items,
    setItems,
  ] = useState([]);

  const [
    plans,
    setPlans,
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
    busyId,
    setBusyId,
  ] = useState(null);

  const [
    rejectTarget,
    setRejectTarget,
  ] = useState(null);

  const [
    rejectionReason,
    setRejectionReason,
  ] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [
        pendingResponse,
        planItems,
      ] = await Promise.all([
        platformApi.condominiums
          .pending(),
        platformApi.plans
          .list(),
      ]);

      setItems(
        Array.isArray(
          pendingResponse
        )
          ? pendingResponse
          : (
              pendingResponse?.items ??
              pendingResponse?.data ??
              []
            )
      );

      setPlans(planItems);
    } catch (err) {
      setError(
        err?.message ??
        "Falha ao carregar solicitações."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(item) {
    const activePlan =
      plans.find(
        (plan) =>
          plan.status ===
            "ACTIVE" ||
          plan.isActive ===
            true
      ) ??
      plans[0];

    if (!activePlan?.id) {
      setError(
        "Nenhum plano disponível para aprovação."
      );

      return;
    }

    const dueDate =
      new Date();

    dueDate.setMonth(
      dueDate.getMonth() + 1
    );

    setBusyId(item.id);
    setError("");

    try {
      await platformApi.condominiums
        .approve(
          item.id,
          {
            planId:
              activePlan.id,
            dueDate:
              dueDate.toISOString(),
          }
        );

      await load();
    } catch (err) {
      setError(
        err?.message ??
        "Não foi possível aprovar o condomínio."
      );
    } finally {
      setBusyId(null);
    }
  }

  function reject(item) {
    setRejectTarget(item);
    setRejectionReason("");
    setError("");
  }

  async function submitRejection(event) {
    event.preventDefault();

    if (!rejectTarget?.id) return;

    if (rejectionReason.trim().length < 5) {
      setError("Informe um motivo de rejeição com pelo menos 5 caracteres.");
      return;
    }

    setBusyId(rejectTarget.id);
    setError("");

    try {
      await platformApi.condominiums.reject(
        rejectTarget.id,
        {
          rejectionReason:
            rejectionReason.trim(),
        }
      );

      setRejectTarget(null);
      setRejectionReason("");
      await load();
    } catch (err) {
      setError(
        err?.message ??
        "Não foi possível rejeitar o condomínio."
      );
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <PlatformLoading text="Carregando solicitações..." />
    );
  }

  return (
    <div>
      <PlatformPageHeader
        eyebrow="CLIENTES"
        title="Solicitações de condomínios"
        description="Solicitações PENDING carregadas diretamente do PostgreSQL."
        action={
          <PlatformButton
            variant="secondary"
            onClick={load}
          >
            Atualizar
          </PlatformButton>
        }
      />

      <PlatformError
        message={error}
      />

      <PlatformCard>
        {items.length === 0 ? (
          <PlatformEmpty text="Nenhuma solicitação pendente." />
        ) : (
          <div
            style={
              platformTableStyles.wrapper
            }
          >
            <table
              style={
                platformTableStyles.table
              }
            >
              <thead>
                <tr>
                  <th style={platformTableStyles.th}>
                    Condomínio
                  </th>

                  <th style={platformTableStyles.th}>
                    Código
                  </th>

                  <th style={platformTableStyles.th}>
                    Responsável
                  </th>

                  <th style={platformTableStyles.th}>
                    Status
                  </th>

                  <th style={platformTableStyles.th}>
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td style={platformTableStyles.td}>
                      <strong>
                        {item.name ??
                          item.nome ??
                          "-"}
                      </strong>
                    </td>

                    <td style={platformTableStyles.td}>
                      {item.code ??
                        item.codigo ??
                        "-"}
                    </td>

                    <td style={platformTableStyles.td}>
                      {item.contactName ??
                        item.responsibleName ??
                        item.responsavel ??
                        "-"}
                    </td>

                    <td style={platformTableStyles.td}>
                      {item.status ??
                        "PENDING"}
                    </td>

                    <td style={platformTableStyles.td}>
                      <div style={styles.actions}>
                        <PlatformButton
                          variant="success"
                          disabled={
                            busyId ===
                            item.id
                          }
                          onClick={() =>
                            approve(item)
                          }
                        >
                          Aprovar
                        </PlatformButton>

                        <PlatformButton
                          variant="danger"
                          disabled={
                            busyId ===
                            item.id
                          }
                          onClick={() =>
                            reject(item)
                          }
                        >
                          Rejeitar
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

      {rejectTarget && (
        <div
          style={styles.overlay}
          onMouseDown={(event) =>
            event.target === event.currentTarget &&
            setRejectTarget(null)
          }
        >
          <form
            style={styles.modal}
            onSubmit={submitRejection}
          >
            <div style={styles.modalHeader}>
              <div>
                <span style={styles.modalEyebrow}>
                  ANÁLISE DE SOLICITAÇÃO
                </span>
                <h2 style={styles.modalTitle}>
                  Rejeitar condomínio
                </h2>
                <p style={styles.modalText}>
                  Registre o motivo da rejeição de{" "}
                  <strong>
                    {rejectTarget.name ??
                      rejectTarget.legalName ??
                      rejectTarget.code}
                  </strong>.
                </p>
              </div>
              <button
                type="button"
                style={styles.close}
                onClick={() =>
                  setRejectTarget(null)
                }
              >
                ×
              </button>
            </div>

            <div style={styles.modalBody}>
              <label style={styles.field}>
                <span style={styles.label}>
                  Motivo da rejeição *
                </span>
                <textarea
                  autoFocus
                  style={styles.textarea}
                  value={rejectionReason}
                  maxLength={1000}
                  onChange={(event) =>
                    setRejectionReason(
                      event.target.value
                    )
                  }
                  required
                />
              </label>
            </div>

            <div style={styles.modalFooter}>
              <PlatformButton
                variant="secondary"
                onClick={() =>
                  setRejectTarget(null)
                }
              >
                Cancelar
              </PlatformButton>
              <PlatformButton
                type="submit"
                variant="danger"
                disabled={
                  busyId === rejectTarget.id
                }
              >
                Confirmar rejeição
              </PlatformButton>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const styles = {
  actions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },

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
    width: "min(620px,96vw)",
    background: "#ffffff",
    borderRadius: "22px",
    overflow: "hidden",
    border: "1px solid rgba(200,168,92,0.55)",
    boxShadow: "0 30px 90px rgba(15,8,22,0.35)",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    padding: "22px 24px 17px",
    borderBottom: "1px solid #eee8f2",
  },

  modalEyebrow: {
    color: "#a17a28",
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "1.3px",
  },

  modalTitle: {
    margin: "5px 0 0",
    fontSize: "26px",
    color: "#21172d",
  },

  modalText: {
    margin: "6px 0 0",
    color: "#766b7d",
    lineHeight: 1.5,
    fontSize: "13px",
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

  modalBody: {
    padding: "22px",
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
    minHeight: "130px",
    resize: "vertical",
    border: "1px solid #dcd3e5",
    borderRadius: "12px",
    padding: "12px",
    outline: "none",
    fontFamily: "inherit",
    fontSize: "14px",
    color: "#271b31",
  },

  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    padding: "15px 22px",
    borderTop: "1px solid #eee8f2",
  },
};

export default PlatformCondominiums;
