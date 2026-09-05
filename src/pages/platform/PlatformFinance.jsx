import {
  useEffect,
  useMemo,
  useState,
} from "react";

import authApi from "../../Services/authApi.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
    allCharges,
    setAllCharges,
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
        platformCharges,
      ] = await Promise.all([
        platformApi.finance
          .chargeStatistics(),
        platformApi.condominiums
          .list(
            "?limit=100&sortBy=name&sortOrder=asc"
          ),
        platformApi.finance.allCharges(),
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
      setAllCharges(Array.isArray(platformCharges) ? platformCharges : []);
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


  const executive = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthCharges = allCharges.filter((item) => new Date(item.paidAt ?? item.createdAt ?? item.dueDate) >= monthStart);
    const paid = allCharges.filter((item) => item.status === "PAID");
    const pending = allCharges.filter((item) => item.status === "PENDING");
    const overdue = allCharges.filter((item) => item.status === "OVERDUE");
    const sum = (list) => list.reduce((acc, item) => acc + Number(item.amountInCents ?? 0), 0);
    const activeClients = condominiums.filter((item) => ["ACTIVE", "TRIAL"].includes(item.status)).length;
    const revenueMonth = sum(monthCharges.filter((item) => item.status === "PAID"));
    const totalPaid = sum(paid);
    const totalPending = sum(pending);
    const totalOverdue = sum(overdue);
    const ticket = activeClients ? Math.round((totalPaid || revenueMonth) / activeClients) : 0;
    return { revenueMonth, totalPaid, totalPending, totalOverdue, activeClients, ticket };
  }, [allCharges, condominiums]);

  const monthlyChart = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`, name: d.toLocaleDateString("pt-BR", { month: "short" }), recebido: 0, pendente: 0 });
    }
    const map = new Map(months.map((m) => [m.key, m]));
    allCharges.forEach((item) => {
      const d = new Date(item.paidAt ?? item.createdAt ?? item.dueDate);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      const row = map.get(key); if (!row) return;
      if (item.status === "PAID") row.recebido += Number(item.amountInCents ?? 0);
      if (["PENDING","OVERDUE"].includes(item.status)) row.pendente += Number(item.amountInCents ?? 0);
    });
    return months;
  }, [allCharges]);

  function exportExecutivePdf() {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("InfinityCondo — Financeiro Star", 14, 18);
    doc.setFontSize(10); doc.text(`Emitido em ${new Date().toLocaleString("pt-BR")}`, 14, 25);
    autoTable(doc, { startY: 31, head: [["Indicador","Valor"]], body: [
      ["Receita recebida no mês", money(executive.revenueMonth)],
      ["Receita recebida acumulada", money(executive.totalPaid)],
      ["Pendente", money(executive.totalPending)],
      ["Inadimplência", money(executive.totalOverdue)],
      ["Clientes ativos", String(executive.activeClients)],
      ["Ticket médio estimado", money(executive.ticket)],
    ]});
    autoTable(doc, { startY: (doc.lastAutoTable?.finalY ?? 70) + 8, head: [["Cliente","Vencimento","Status","Valor","Plano"]], body: allCharges.map((item) => [item.condominium?.name ?? "-", dateLabel(item.dueDate), STATUS_LABELS[item.status] ?? item.status, money(item.amountInCents), item.subscription?.plan?.name ?? "-"]) });
    doc.save(`financeiro-star-${new Date().toISOString().slice(0,10)}.pdf`);
  }

  function exportExecutiveExcel() {
    const wb = XLSX.utils.book_new();
    const summary = XLSX.utils.json_to_sheet([
      { Indicador: "Receita recebida no mês", Valor: executive.revenueMonth / 100 },
      { Indicador: "Receita recebida acumulada", Valor: executive.totalPaid / 100 },
      { Indicador: "Pendente", Valor: executive.totalPending / 100 },
      { Indicador: "Inadimplência", Valor: executive.totalOverdue / 100 },
      { Indicador: "Clientes ativos", Valor: executive.activeClients },
      { Indicador: "Ticket médio estimado", Valor: executive.ticket / 100 },
    ]);
    const rows = allCharges.map((item) => ({ Cliente: item.condominium?.name ?? "", Plano: item.subscription?.plan?.name ?? "", Status: STATUS_LABELS[item.status] ?? item.status, Vencimento: dateLabel(item.dueDate), Valor: Number(item.amountInCents ?? 0) / 100, PagoEm: dateLabel(item.paidAt), Provedor: item.provider ?? "" }));
    XLSX.utils.book_append_sheet(wb, summary, "Resumo");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Cobranças");
    XLSX.writeFile(wb, `financeiro-star-${new Date().toISOString().slice(0,10)}.xlsx`);
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
        description="Gestão executiva de cobranças, recebimentos, PIX, boleto e indicadores financeiros da Star Infinity Code."
        action={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <PlatformButton variant="secondary" onClick={exportExecutivePdf}>Exportar PDF</PlatformButton>
            <PlatformButton variant="secondary" onClick={exportExecutiveExcel}>Exportar Excel</PlatformButton>
            <PlatformButton variant="secondary" onClick={loadBase}>Atualizar</PlatformButton>
          </div>
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

      <div style={styles.executiveGrid}>
        <PlatformCard><span style={styles.label}>Receita no mês</span><strong style={styles.executiveValue}>{money(executive.revenueMonth)}</strong><small style={styles.miniLabel}>recebido</small></PlatformCard>
        <PlatformCard><span style={styles.label}>Pendente</span><strong style={styles.executiveValue}>{money(executive.totalPending)}</strong><small style={styles.miniLabel}>a receber</small></PlatformCard>
        <PlatformCard><span style={styles.label}>Inadimplência</span><strong style={{...styles.executiveValue,color:executive.totalOverdue>0?"#b91c1c":"#4c1d95"}}>{money(executive.totalOverdue)}</strong><small style={styles.miniLabel}>vencido</small></PlatformCard>
        <PlatformCard><span style={styles.label}>Clientes ativos</span><strong style={styles.executiveValue}>{executive.activeClients}</strong><small style={styles.miniLabel}>carteira atual</small></PlatformCard>
        <PlatformCard><span style={styles.label}>Ticket médio</span><strong style={styles.executiveValue}>{money(executive.ticket)}</strong><small style={styles.miniLabel}>estimado</small></PlatformCard>
      </div>

      <PlatformCard style={{ marginTop: 18 }}>
        <div style={styles.sectionHeader}><div><h3 style={styles.sectionTitle}>Evolução financeira</h3><p style={styles.help}>Recebimentos e valores em aberto nos últimos seis meses.</p></div></div>
        <div style={{ height: 280, marginTop: 12 }}>
          <ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyChart}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name"/><YAxis tickFormatter={(v)=>`R$${Math.round(v/100)}`}/><Tooltip formatter={(v)=>money(v)}/><Bar dataKey="recebido" name="Recebido" fill="#6d28d9" radius={[6,6,0,0]}/><Bar dataKey="pendente" name="Pendente" fill="#c4b5fd" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer>
        </div>
      </PlatformCard>

      <div style={{...styles.statsGrid, marginTop: 18}}>
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
            Para boleto, o cadastro do condomínio precisa possuir e-mail, CEP, rua, número, bairro, cidade e estado. Esses dados são validados antes da emissão do boleto.
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
  executiveGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: "14px" },
  executiveValue: { display: "block", marginTop: "9px", color: "#4c1d95", fontSize: "23px" },
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
