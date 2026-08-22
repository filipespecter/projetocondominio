import {
  useEffect,
  useMemo,
  useState,
} from "react";

import authApi from "../../Services/authApi.js";
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

const STATUS_LABELS = {
  PENDING: "Pendente",
  PAID: "Pago",
  OVERDUE: "Vencido",
  FAILED: "Falhou",
  CANCELED: "Cancelado",
  REFUNDED: "Reembolsado",
};

function money(valueInCents) {
  const value =
    Number(valueInCents ?? 0) / 100;

  return value.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}

function dateLabel(value) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleDateString(
    "pt-BR"
  );
}

function getActiveSubscription(
  condominium
) {
  const subscriptions =
    condominium?.subscriptions ??
    [];

  return (
    subscriptions.find(
      (item) =>
        item.status === "ACTIVE" ||
        item.status === "TRIAL"
    ) ??
    subscriptions[0] ??
    null
  );
}

function PlatformFinance() {
  const [
    stats,
    setStats,
  ] = useState(null);

  const [
    condominiums,
    setCondominiums,
  ] = useState([]);

  const [
    selectedId,
    setSelectedId,
  ] = useState("");

  const [
    charges,
    setCharges,
  ] = useState([]);

  const [
    paymentMethods,
    setPaymentMethods,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadingDetails,
    setLoadingDetails,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    busyId,
    setBusyId,
  ] = useState(null);

  const [
    generatedPayment,
    setGeneratedPayment,
  ] = useState(null);

  const [
    methodType,
    setMethodType,
  ] = useState("PIX");

  const [
    dueDate,
    setDueDate,
  ] = useState("");

  const [
    amount,
    setAmount,
  ] = useState("");

  const selectedCondominium =
    useMemo(
      () =>
        condominiums.find(
          (item) =>
            item.id === selectedId
        ) ?? null,
      [
        condominiums,
        selectedId,
      ]
    );

  const activeSubscription =
    useMemo(
      () =>
        getActiveSubscription(
          selectedCondominium
        ),
      [selectedCondominium]
    );

  const primaryMethod =
    useMemo(
      () =>
        paymentMethods.find(
          (item) =>
            item.priority ===
            "PRIMARY"
        ) ?? null,
      [paymentMethods]
    );

  const activePrimaryMethod =
    primaryMethod?.status ===
      "ACTIVE"
      ? primaryMethod
      : null;

  async function loadBase() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const user =
        await authApi.me();

      if (
        user?.role !==
        "PLATFORM_OWNER"
      ) {
        throw new Error(
          "Acesso financeiro exclusivo do PLATFORM_OWNER."
        );
      }

      const [
        statistics,
        condominiumResponse,
      ] = await Promise.all([
        platformApi.finance
          .chargeStatistics(),
        platformApi.condominiums
          .list(
            "?limit=100&sortBy=name&sortOrder=asc"
          ),
      ]);

      const fallbackItems =
        Array.isArray(
          condominiumResponse
        )
          ? condominiumResponse
          : (
              condominiumResponse
                ?.items ??
              condominiumResponse
                ?.data ??
              []
            );

      setStats(statistics);
      setCondominiums(
        Array.isArray(
          fallbackItems
        )
          ? fallbackItems
          : []
      );

      setSelectedId(
        (current) =>
          current ||
          fallbackItems?.[0]?.id ||
          ""
      );
    } catch (err) {
      setError(
        err?.message ??
        "Falha ao carregar financeiro."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadDetails(
    condominiumId = selectedId
  ) {
    if (!condominiumId) {
      setCharges([]);
      setPaymentMethods([]);

      return;
    }

    setLoadingDetails(true);
    setError("");

    try {
      const [
        chargeItems,
        methods,
      ] = await Promise.all([
        platformApi.finance
          .condominiumCharges(
            condominiumId
          ),
        platformApi.finance
          .paymentMethods(
            condominiumId
          ),
      ]);

      setCharges(
        Array.isArray(chargeItems)
          ? chargeItems
          : []
      );

      setPaymentMethods(
        Array.isArray(methods)
          ? methods
          : []
      );
    } catch (err) {
      setError(
        err?.message ??
        "Falha ao carregar dados financeiros do condomínio."
      );
    } finally {
      setLoadingDetails(false);
    }
  }

  useEffect(() => {
    loadBase();
  }, []);

  useEffect(() => {
    setSuccess("");
    setGeneratedPayment(null);

    if (selectedId) {
      loadDetails(selectedId);
    }
  }, [selectedId]);

  useEffect(() => {
    if (!activeSubscription) {
      setAmount("");

      return;
    }

    const value =
      Number(
        activeSubscription
          .priceInCents ??
        activeSubscription
          .plan
          ?.monthlyPriceInCents ??
        0
      ) / 100;

    if (value > 0) {
      setAmount(
        value.toFixed(2)
      );
    }

    const next =
      activeSubscription
        .nextDueDate
        ? new Date(
            activeSubscription
              .nextDueDate
          )
        : new Date();

    if (
      !activeSubscription
        .nextDueDate
    ) {
      next.setMonth(
        next.getMonth() + 1
      );
    }

    setDueDate(
      next
        .toISOString()
        .slice(0, 10)
    );
  }, [activeSubscription]);

  async function configurePrimaryMethod() {
    if (!selectedId) {
      return;
    }

    setBusyId("method");
    setError("");
    setSuccess("");
    setGeneratedPayment(null);

    try {
      if (
        primaryMethod
      ) {
        await platformApi.finance
          .updatePaymentMethod(
            selectedId,
            primaryMethod.id,
            {
              type: methodType,
              provider:
                "MERCADO_PAGO",
              priority:
                "PRIMARY",
            }
          );

        if (
          primaryMethod.status !==
          "ACTIVE"
        ) {
          await platformApi.finance
            .changePaymentMethodStatus(
              selectedId,
              primaryMethod.id,
              "ACTIVE"
            );
        }
      } else {
        await platformApi.finance
          .createPaymentMethod(
            selectedId,
            {
              type: methodType,
              provider:
                "MERCADO_PAGO",
              priority:
                "PRIMARY",
            }
          );
      }

      setSuccess(
        `Método principal ${methodType} configurado.`
      );

      await loadDetails(
        selectedId
      );
    } catch (err) {
      setError(
        err?.message ??
        "Não foi possível configurar o método de pagamento."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function createCharge() {
    if (
      !selectedId ||
      !activeSubscription?.id
    ) {
      setError(
        "O condomínio selecionado não possui assinatura disponível."
      );

      return;
    }

    const numericAmount =
      Number(
        String(amount)
          .replace(",", ".")
      );

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      setError(
        "Informe um valor válido para a cobrança."
      );

      return;
    }

    if (!dueDate) {
      setError(
        "Informe a data de vencimento."
      );

      return;
    }

    setBusyId("create");
    setError("");
    setSuccess("");
    setGeneratedPayment(null);

    try {
      await platformApi.finance
        .createCharge({
          condominiumId:
            selectedId,
          subscriptionId:
            activeSubscription.id,
          paymentMethodId:
            activePrimaryMethod
              ?.id ??
            undefined,
          amountInCents:
            Math.round(
              numericAmount * 100
            ),
          dueDate:
            new Date(
              `${dueDate}T12:00:00`
            ).toISOString(),
        });

      setSuccess(
        "Cobrança criada no InfinityCondo."
      );

      await Promise.all([
        loadDetails(selectedId),
        platformApi.finance
          .chargeStatistics()
          .then(setStats),
      ]);
    } catch (err) {
      setError(
        err?.message ??
        "Não foi possível criar a cobrança."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function processCharge(
    charge
  ) {
    setBusyId(charge.id);
    setError("");
    setSuccess("");
    setGeneratedPayment(null);

    try {
      const result =
        await platformApi.finance
          .processCharge(
            charge.id,
            {
              identificationType:
                String(
                  selectedCondominium
                    ?.document ??
                  ""
                )
                  .replace(
                    /\D/g,
                    ""
                  )
                  .length === 14
                  ? "CNPJ"
                  : "CPF",
            }
          );

      setGeneratedPayment(
        result
      );

      setSuccess(
        "Cobrança enviada ao Mercado Pago. Dados de pagamento recebidos."
      );

      await Promise.all([
        loadDetails(selectedId),
        platformApi.finance
          .chargeStatistics()
          .then(setStats),
      ]);
    } catch (err) {
      setError(
        err?.message ??
        "Não foi possível processar a cobrança no Mercado Pago."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function copyValue(
    value,
    label
  ) {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard
        .writeText(value);

      setSuccess(
        `${label} copiado.`
      );
    } catch {
      setError(
        `Não foi possível copiar ${label.toLowerCase()}.`
      );
    }
  }

  if (loading) {
    return (
      <PlatformLoading text="Carregando financeiro..." />
    );
  }

  return (
    <div>
      <PlatformPageHeader
        eyebrow="OWNER ONLY"
        title="Financeiro da Star Infinity Code"
        description="Cobranças, PIX e boleto processados pelo backend. A integração externa depende das credenciais do Mercado Pago no ambiente."
        action={
          <PlatformButton
            variant="secondary"
            onClick={loadBase}
          >
            Atualizar
          </PlatformButton>
        }
      />

      <PlatformError
        message={error}
      />

      {success && (
        <div style={styles.success}>
          {success}
        </div>
      )}

      <div style={styles.statsGrid}>
        {Object.entries(
          stats ?? {}
        ).map(
          ([
            key,
            value,
          ]) => (
            <PlatformCard
              key={key}
            >
              <span style={styles.label}>
                {STATUS_LABELS[
                  key.toUpperCase()
                ] ??
                  key}
              </span>

              <strong style={styles.value}>
                {String(value)}
              </strong>
            </PlatformCard>
          )
        )}
      </div>

      <PlatformCard
        style={{
          marginTop: "18px",
        }}
      >
        <div style={styles.sectionHeader}>
          <div>
            <h3 style={styles.sectionTitle}>
              Operação financeira
            </h3>

            <p style={styles.help}>
              Selecione um condomínio aprovado para configurar o método principal, criar a cobrança e solicitar PIX ou boleto.
            </p>
          </div>
        </div>

        <label style={styles.field}>
          <span style={styles.fieldLabel}>
            Condomínio
          </span>

          <select
            value={selectedId}
            onChange={(event) =>
              setSelectedId(
                event.target.value
              )
            }
            style={styles.input}
          >
            <option value="">
              Selecione
            </option>

            {condominiums.map(
              (item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name} — {item.status}
                </option>
              )
            )}
          </select>
        </label>

        {selectedCondominium && (
          <div style={styles.infoGrid}>
            <div>
              <span style={styles.miniLabel}>
                Assinatura
              </span>
              <strong style={styles.miniValue}>
                {activeSubscription
                  ?.plan?.name ??
                  activeSubscription
                    ?.status ??
                  "Não encontrada"}
              </strong>
            </div>

            <div>
              <span style={styles.miniLabel}>
                E-mail financeiro
              </span>
              <strong style={styles.miniValue}>
                {selectedCondominium
                  .email ??
                  "-"}
              </strong>
            </div>

            <div>
              <span style={styles.miniLabel}>
                Documento
              </span>
              <strong style={styles.miniValue}>
                {selectedCondominium
                  .document ??
                  "-"}
              </strong>
            </div>

            <div>
              <span style={styles.miniLabel}>
                Método principal
              </span>
              <strong style={styles.miniValue}>
                {activePrimaryMethod
                  ?.type ??
                  "Não configurado"}
              </strong>
            </div>
          </div>
        )}

        <div style={styles.formGrid}>
          <label style={styles.field}>
            <span style={styles.fieldLabel}>
              Método principal
            </span>

            <select
              value={methodType}
              onChange={(event) =>
                setMethodType(
                  event.target.value
                )
              }
              style={styles.input}
              disabled={!selectedId}
            >
              <option value="PIX">
                PIX
              </option>
              <option value="BOLETO">
                Boleto
              </option>
            </select>
          </label>

          <div style={styles.fieldAction}>
            <PlatformButton
              disabled={
                !selectedId ||
                busyId === "method"
              }
              onClick={
                configurePrimaryMethod
              }
            >
              {busyId === "method"
                ? "Salvando..."
                : "Salvar método"}
            </PlatformButton>
          </div>
        </div>

        <div style={styles.formGrid}>
          <label style={styles.field}>
            <span style={styles.fieldLabel}>
              Valor da cobrança (R$)
            </span>

            <input
              value={amount}
              onChange={(event) =>
                setAmount(
                  event.target.value
                )
              }
              placeholder="350.00"
              style={styles.input}
              inputMode="decimal"
            />
          </label>

          <label style={styles.field}>
            <span style={styles.fieldLabel}>
              Vencimento
            </span>

            <input
              type="date"
              value={dueDate}
              onChange={(event) =>
                setDueDate(
                  event.target.value
                )
              }
              style={styles.input}
            />
          </label>

          <div style={styles.fieldAction}>
            <PlatformButton
              variant="success"
              disabled={
                !activeSubscription ||
                busyId === "create"
              }
              onClick={createCharge}
            >
              {busyId === "create"
                ? "Criando..."
                : "Criar cobrança"}
            </PlatformButton>
          </div>
        </div>

        {methodType === "BOLETO" && (
          <p style={styles.warning}>
            Para boleto, o cadastro do condomínio precisa possuir e-mail, CEP, rua, número, bairro, cidade e estado. O backend valida esses dados antes de chamar o Mercado Pago.
          </p>
        )}
      </PlatformCard>

      {generatedPayment && (
        <PlatformCard
          style={{
            marginTop: "18px",
          }}
        >
          <h3 style={styles.sectionTitle}>
            Pagamento gerado
          </h3>

          <div style={styles.paymentBox}>
            <span style={styles.miniLabel}>
              Status do gateway
            </span>
            <strong style={styles.miniValue}>
              {generatedPayment
                ?.providerPayment
                ?.status ??
                "-"}
            </strong>

            {generatedPayment
              ?.providerPayment
              ?.pixCopyPaste && (
              <>
                <span style={styles.miniLabel}>
                  PIX copia e cola
                </span>

                <code style={styles.code}>
                  {
                    generatedPayment
                      .providerPayment
                      .pixCopyPaste
                  }
                </code>

                <PlatformButton
                  variant="secondary"
                  onClick={() =>
                    copyValue(
                      generatedPayment
                        .providerPayment
                        .pixCopyPaste,
                      "PIX"
                    )
                  }
                >
                  Copiar PIX
                </PlatformButton>
              </>
            )}

            {generatedPayment
              ?.providerPayment
              ?.boletoBarcode && (
              <>
                <span style={styles.miniLabel}>
                  Código do boleto
                </span>

                <code style={styles.code}>
                  {
                    generatedPayment
                      .providerPayment
                      .boletoBarcode
                  }
                </code>

                <PlatformButton
                  variant="secondary"
                  onClick={() =>
                    copyValue(
                      generatedPayment
                        .providerPayment
                        .boletoBarcode,
                      "Código do boleto"
                    )
                  }
                >
                  Copiar código
                </PlatformButton>
              </>
            )}

            {generatedPayment
              ?.providerPayment
              ?.paymentUrl && (
              <a
                href={
                  generatedPayment
                    .providerPayment
                    .paymentUrl
                }
                target="_blank"
                rel="noreferrer"
                style={styles.link}
              >
                Abrir página de pagamento
              </a>
            )}

            {generatedPayment
              ?.providerPayment
              ?.pixQrCodeBase64 && (
              <img
                alt="QR Code PIX"
                src={`data:image/png;base64,${
                  generatedPayment
                    .providerPayment
                    .pixQrCodeBase64
                }`}
                style={styles.pixQr}
              />
            )}
          </div>
        </PlatformCard>
      )}

      <PlatformCard
        style={{
          marginTop: "18px",
        }}
      >
        <div style={styles.sectionHeader}>
          <div>
            <h3 style={styles.sectionTitle}>
              Cobranças do condomínio
            </h3>

            <p style={styles.help}>
              Uma cobrança PENDING pode ser enviada ao gateway. O método usado é o método principal ativo configurado acima.
            </p>
          </div>

          <PlatformButton
            variant="secondary"
            disabled={
              !selectedId ||
              loadingDetails
            }
            onClick={() =>
              loadDetails(
                selectedId
              )
            }
          >
            Atualizar lista
          </PlatformButton>
        </div>

        {loadingDetails ? (
          <PlatformLoading text="Carregando cobranças..." />
        ) : charges.length === 0 ? (
          <PlatformEmpty text="Nenhuma cobrança encontrada para este condomínio." />
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
                    Vencimento
                  </th>
                  <th style={platformTableStyles.th}>
                    Valor
                  </th>
                  <th style={platformTableStyles.th}>
                    Status
                  </th>
                  <th style={platformTableStyles.th}>
                    Método
                  </th>
                  <th style={platformTableStyles.th}>
                    Gateway
                  </th>
                  <th style={platformTableStyles.th}>
                    Ação
                  </th>
                </tr>
              </thead>

              <tbody>
                {charges.map(
                  (charge) => (
                    <tr
                      key={charge.id}
                    >
                      <td style={platformTableStyles.td}>
                        {dateLabel(
                          charge.dueDate
                        )}
                      </td>

                      <td style={platformTableStyles.td}>
                        {money(
                          charge.amountInCents
                        )}
                      </td>

                      <td style={platformTableStyles.td}>
                        {STATUS_LABELS[
                          charge.status
                        ] ??
                          charge.status}
                      </td>

                      <td style={platformTableStyles.td}>
                        {charge
                          .paymentMethod
                          ?.type ??
                          activePrimaryMethod
                            ?.type ??
                          "-"}
                      </td>

                      <td style={platformTableStyles.td}>
                        {charge.provider ??
                          "-"}
                      </td>

                      <td style={platformTableStyles.td}>
                        {charge.status ===
                        "PENDING" ? (
                          <PlatformButton
                            disabled={
                              busyId ===
                                charge.id ||
                              !activePrimaryMethod
                            }
                            onClick={() =>
                              processCharge(
                                charge
                              )
                            }
                          >
                            {busyId ===
                            charge.id
                              ? "Processando..."
                              : activePrimaryMethod
                                  ?.type ===
                                "BOLETO"
                                ? "Gerar boleto"
                                : "Gerar PIX"}
                          </PlatformButton>
                        ) : charge.paymentUrl ? (
                          <a
                            href={
                              charge.paymentUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            style={
                              styles.link
                            }
                          >
                            Abrir pagamento
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </PlatformCard>
    </div>
  );
}

const styles = {
  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(150px,1fr))",
    gap: "14px",
  },

  label: {
    display: "block",
    color: "#776d80",
    fontSize: "11px",
    textTransform: "uppercase",
  },

  value: {
    display: "block",
    marginTop: "9px",
    color: "#4c1d95",
    fontSize: "25px",
  },

  success: {
    marginBottom: "18px",
    padding: "12px 14px",
    borderRadius: "12px",
    background: "#f0fdf4",
    color: "#166534",
    border: "1px solid #bbf7d0",
    fontSize: "13px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
  },

  sectionTitle: {
    margin: "0 0 5px",
    color: "#2d2039",
    fontSize: "17px",
  },

  help: {
    margin: 0,
    color: "#776d80",
    fontSize: "12px",
    lineHeight: 1.55,
    maxWidth: "760px",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(170px,1fr))",
    gap: "12px",
    padding: "14px",
    marginTop: "16px",
    borderRadius: "12px",
    background: "#faf8ff",
    border: "1px solid #eee9f7",
  },

  miniLabel: {
    display: "block",
    color: "#81768d",
    fontSize: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.45px",
    marginBottom: "5px",
  },

  miniValue: {
    display: "block",
    color: "#352640",
    fontSize: "13px",
    overflowWrap: "anywhere",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(190px,1fr))",
    alignItems: "end",
    gap: "12px",
    marginTop: "16px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  fieldLabel: {
    color: "#55475f",
    fontSize: "11px",
    fontWeight: "800",
  },

  input: {
    width: "100%",
    minHeight: "40px",
    boxSizing: "border-box",
    padding: "0 11px",
    borderRadius: "10px",
    border: "1px solid #ddd6e8",
    background: "#ffffff",
    color: "#30243a",
    outline: "none",
  },

  fieldAction: {
    display: "flex",
    alignItems: "flex-end",
  },

  warning: {
    margin: "14px 0 0",
    padding: "10px 12px",
    background: "#fffbeb",
    color: "#92400e",
    border: "1px solid #fde68a",
    borderRadius: "10px",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  paymentBox: {
    display: "grid",
    gap: "10px",
    maxWidth: "760px",
  },

  code: {
    display: "block",
    padding: "11px",
    borderRadius: "9px",
    background: "#f7f5fa",
    color: "#342b40",
    overflowWrap: "anywhere",
    whiteSpace: "pre-wrap",
    fontSize: "12px",
  },

  link: {
    color: "#6d28d9",
    fontWeight: "800",
    fontSize: "12px",
    textDecoration: "none",
  },

  pixQr: {
    width: "220px",
    maxWidth: "100%",
    borderRadius: "12px",
    border: "1px solid #ece7f3",
  },
};

export default PlatformFinance;
