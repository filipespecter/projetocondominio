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

  const [approvalTarget, setApprovalTarget] = useState(null);
  const [approvalForm, setApprovalForm] = useState(null);
  const [approvedAccess, setApprovedAccess] = useState(null);

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

  function approve(item) {
    const activePlan =
      plans.find((plan) => plan.active === true) ??
      plans.find((plan) => plan.status === "ACTIVE") ??
      plans[0];

    if (!activePlan?.id) {
      setError("Nenhum plano disponível para aprovação.");
      return;
    }

    const baseUsername = String(
      item.contactName ?? item.name ?? "sindico"
    )
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.|\.$/g, "")
      .slice(0, 40) || "sindico";

    setApprovalTarget(item);
    setApprovedAccess(null);
    setApprovalForm({
      planId: activePlan.id,
      username: baseUsername,
      password: "",
      passwordConfirmation: "",
      gracePeriodDays: 5,
      initialStatus: "ACTIVE",
      billingCycle: activePlan.billingCycle ?? "MONTHLY",
      priceInCents: activePlan.monthlyPriceInCents ?? 0,
      adminName: item.contactName ?? item.name ?? "",
      adminEmail: item.email ?? "",
      adminPhone: item.phone ?? "",
      billingContactName: item.contactName ?? item.name ?? "",
      billingEmail: item.email ?? "",
      billingPhone: item.phone ?? "",
    });
    setError("");
  }

  function updateApproval(field, value) {
    setApprovalForm((current) => ({ ...current, [field]: value }));
  }

  async function submitApproval(event) {
    event.preventDefault();
    if (!approvalTarget?.id || !approvalForm) return;

    if (approvalForm.password.length < 8) {
      setError("A senha temporária deve possuir pelo menos 8 caracteres.");
      return;
    }
    if (approvalForm.password !== approvalForm.passwordConfirmation) {
      setError("A confirmação da senha não corresponde.");
      return;
    }

    setBusyId(approvalTarget.id);
    setError("");
    try {
      const result = await platformApi.condominiums.approve(
        approvalTarget.id,
        {
          ...approvalForm,
          gracePeriodDays: Number(approvalForm.gracePeriodDays),
          priceInCents: Number(approvalForm.priceInCents),
        }
      );
      setApprovedAccess({
        username: result?.administrator?.username ?? approvalForm.username,
        password: approvalForm.password,
      });
      await load();
    } catch (err) {
      setError(err?.message ?? "Não foi possível aprovar o condomínio.");
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

      {approvalTarget && approvalForm && (
        <div style={styles.overlay}>
          <form style={styles.modalWide} onSubmit={submitApproval}>
            <div style={styles.modalHeader}>
              <div>
                <span style={styles.modalEyebrow}>LIBERAÇÃO COMERCIAL</span>
                <h2 style={styles.modalTitle}>Aprovar condomínio</h2>
                <p style={styles.modalText}>
                  {approvalTarget.name ?? approvalTarget.code} — defina plano e credenciais temporárias.
                </p>
              </div>
              <button type="button" style={styles.close} onClick={() => setApprovalTarget(null)}>×</button>
            </div>

            {approvedAccess ? (
              <div style={styles.modalBody}>
                <div style={styles.successBox}>
                  <strong>Acesso liberado com sucesso.</strong>
                  <span>Usuário: {approvedAccess.username}</span>
                  <span>Senha temporária: {approvedAccess.password}</span>
                  <small>Entregue usuário e senha temporária ao síndico. O login não exige código do condomínio e, no primeiro acesso, a troca de senha é obrigatória.</small>
                </div>
              </div>
            ) : (
              <div style={styles.modalBody}>
                <div style={styles.billingNotice}>
                  <strong>Ciclo individual de cobrança</strong>
                  <span>O dia em que você confirmar a aprovação será o primeiro dia da assinatura. A próxima cobrança será calculada automaticamente um ciclo depois.</span>
                </div>
                <div style={styles.formGrid}>
                  <label style={styles.field}><span style={styles.label}>Plano *</span>
                    <select style={styles.input} value={approvalForm.planId} onChange={(e) => {
                      const plan = plans.find((p) => p.id === e.target.value);
                      updateApproval("planId", e.target.value);
                      if (plan) { updateApproval("billingCycle", plan.billingCycle ?? "MONTHLY"); updateApproval("priceInCents", plan.monthlyPriceInCents ?? 0); }
                    }}>
                      {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} — R$ {((plan.monthlyPriceInCents ?? 0)/100).toFixed(2)}</option>)}
                    </select>
                  </label>
                  <label style={styles.field}><span style={styles.label}>Status inicial</span>
                    <select style={styles.input} value={approvalForm.initialStatus} onChange={(e)=>updateApproval("initialStatus",e.target.value)}><option value="ACTIVE">Ativo</option><option value="TRIAL">Teste</option></select>
                  </label>
                  <label style={styles.field}><span style={styles.label}>Usuário *</span><input style={styles.input} value={approvalForm.username} onChange={(e)=>updateApproval("username",e.target.value)} required minLength={3}/></label>
                  <label style={styles.field}><span style={styles.label}>Tolerância após vencimento (dias)</span><input style={styles.input} type="number" min="0" max="30" value={approvalForm.gracePeriodDays} onChange={(e)=>updateApproval("gracePeriodDays",e.target.value)}/></label>
                  <label style={styles.field}><span style={styles.label}>Senha temporária *</span><input style={styles.input} type="password" value={approvalForm.password} onChange={(e)=>updateApproval("password",e.target.value)} required minLength={8}/></label>
                  <label style={styles.field}><span style={styles.label}>Confirmar senha *</span><input style={styles.input} type="password" value={approvalForm.passwordConfirmation} onChange={(e)=>updateApproval("passwordConfirmation",e.target.value)} required minLength={8}/></label>
                  <label style={styles.field}><span style={styles.label}>Administrador *</span><input style={styles.input} value={approvalForm.adminName} onChange={(e)=>updateApproval("adminName",e.target.value)} required/></label>
                  <label style={styles.field}><span style={styles.label}>E-mail *</span><input style={styles.input} type="email" value={approvalForm.adminEmail} onChange={(e)=>{updateApproval("adminEmail",e.target.value); updateApproval("billingEmail",e.target.value)}} required/></label>
                  <label style={styles.field}><span style={styles.label}>WhatsApp *</span><input style={styles.input} value={approvalForm.adminPhone} onChange={(e)=>{updateApproval("adminPhone",e.target.value); updateApproval("billingPhone",e.target.value)}} required/></label>
                  <label style={styles.field}><span style={styles.label}>Valor mensal (centavos)</span><input style={styles.input} type="number" min="0" value={approvalForm.priceInCents} onChange={(e)=>updateApproval("priceInCents",e.target.value)}/></label>
                </div>
              </div>
            )}

            <div style={styles.modalFooter}>
              <PlatformButton variant="secondary" onClick={() => setApprovalTarget(null)}>{approvedAccess ? "Fechar" : "Cancelar"}</PlatformButton>
              {!approvedAccess && <PlatformButton type="submit" variant="success" disabled={busyId === approvalTarget.id}>Confirmar aprovação</PlatformButton>}
            </div>
          </form>
        </div>
      )}

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

  modalWide: {
    width: "min(860px,96vw)",
    maxHeight: "92vh",
    overflowY: "auto",
    background: "#ffffff",
    borderRadius: "22px",
    border: "1px solid rgba(200,168,92,0.55)",
    boxShadow: "0 30px 90px rgba(15,8,22,0.35)",
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

  billingNotice: {
    display: "grid",
    gap: "6px",
    padding: "14px 16px",
    marginBottom: "16px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, rgb(var(--ic-primary-rgb) / 0.10), rgb(var(--ic-primary-bright-rgb) / 0.06))",
    border: "1px solid rgb(var(--ic-primary-rgb) / 0.18)",
    color: "var(--ic-primary-deep)",
    fontSize: "13px",
    lineHeight: 1.45,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
    gap: "14px",
  },

  field: {
    display: "grid",
    gap: "7px",
  },

  input: {
    minHeight: "44px",
    border: "1px solid #dcd3e5",
    borderRadius: "12px",
    padding: "0 12px",
    outline: "none",
    fontFamily: "inherit",
    fontSize: "14px",
    color: "#271b31",
    background: "#fff",
  },

  successBox: {
    display: "grid",
    gap: "9px",
    padding: "18px",
    borderRadius: "14px",
    background: "#f5fbf7",
    border: "1px solid #bfe2ca",
    color: "#234e31",
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
