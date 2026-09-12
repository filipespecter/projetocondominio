import { useEffect, useMemo, useState } from "react";
import {
  FaBuilding,
  FaCalendarAlt,
  FaClock,
  FaEnvelope,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaPhone,
  FaSearch,
  FaUserShield,
  FaUsers,
  FaTimes,
} from "react-icons/fa";

import platformApi from "../../Services/platformApi.js";
import {
  PlatformCard,
  PlatformEmpty,
  PlatformError,
  PlatformLoading,
  PlatformPageHeader,
} from "../../components/PlatformUi.jsx";

const money = (cents = 0) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(cents || 0) / 100);

const date = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("pt-BR");
};

const dateTime = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("pt-BR");
};

function activeTime(days = 0) {
  const safe = Math.max(0, Number(days) || 0);
  if (safe < 30) return `${safe} dia${safe === 1 ? "" : "s"}`;
  const months = Math.floor(safe / 30);
  const remaining = safe % 30;
  if (months < 12) return `${months} ${months === 1 ? "mês" : "meses"}${remaining ? ` e ${remaining} dias` : ""}`;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  return `${years} ${years === 1 ? "ano" : "anos"}${remMonths ? ` e ${remMonths} meses` : ""}`;
}

function addressOf(address = {}) {
  const first = [address.addressLine, address.addressNumber].filter(Boolean).join(", ");
  const second = [address.neighborhood, address.city, address.state].filter(Boolean).join(" • ");
  return [first, second].filter(Boolean).join(" — ") || "Endereço não informado";
}

function statusLabel(status) {
  const labels = {
    ACTIVE: "Ativo",
    TRIAL: "Teste",
    SUSPENDED: "Suspenso",
    CANCELED: "Cancelado",
    EM_DIA: "Em dia",
    ATRASADO: "Atrasado",
    SUSPENSO: "Suspenso",
    CANCELADO: "Cancelado",
    SEM_ASSINATURA: "Sem assinatura",
  };
  return labels[status] ?? status ?? "—";
}

function badgeStyle(value) {
  if (["ACTIVE", "TRIAL", "EM_DIA"].includes(value)) {
    return { background: "#ecfdf5", color: "#047857", borderColor: "#a7f3d0" };
  }
  if (["ATRASADO"].includes(value)) {
    return { background: "#fff7ed", color: "#c2410c", borderColor: "#fed7aa" };
  }
  if (["SUSPENDED", "SUSPENSO"].includes(value)) {
    return { background: "#fef2f2", color: "#b91c1c", borderColor: "#fecaca" };
  }
  return { background: "#f3f4f6", color: "#4b5563", borderColor: "#e5e7eb" };
}

function PlatformClients() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [planCode, setPlanCode] = useState("");
  const [selected, setSelected] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);
      if (planCode) params.set("planCode", planCode);
      params.set("limit", "100");
      const result = await platformApi.condominiums.clients(`?${params.toString()}`);
      setData(result ?? { items: [], summary: {} });
    } catch (err) {
      setError(err?.message ?? "Não foi possível carregar os clientes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // primeira carga intencional; filtros são aplicados pelo botão/Enter
  }, []);

  const items = useMemo(() => data?.items ?? [], [data]);
  const summary = data?.summary ?? {};

  if (loading && !data) return <PlatformLoading text="Carregando carteira de clientes..." />;

  return (
    <div style={styles.page}>
      <PlatformPageHeader
        eyebrow="CENTRAL STAR INFINITY CODE"
        title="Clientes"
        description="Carteira comercial e operacional dos condomínios que já tiveram acesso liberado."
      />

      {error && <PlatformError>{error}</PlatformError>}

      <div style={styles.hero}>
        <div>
          <span style={styles.heroEyebrow}>CARTEIRA DE CLIENTES</span>
          <h2 style={styles.heroTitle}>Visão completa de cada contrato</h2>
          <p style={styles.heroText}>
            Plano, tempo ativo, responsável, contato, endereço, cobrança e último acesso em um único lugar.
          </p>
        </div>
        <div style={styles.heroIcon}><FaBuilding /></div>
      </div>

      <div style={styles.cards}>
        <Metric icon={<FaBuilding />} label="Clientes ativos" value={summary.activeClients ?? 0} />
        <Metric icon={<FaUsers />} label="Plano Básico" value={summary.basicClients ?? 0} />
        <Metric icon={<FaUserShield />} label="Plano Completo" value={summary.completeClients ?? 0} />
        <Metric icon={<FaMoneyBillWave />} label="Receita mensal estimada" value={money(summary.estimatedMonthlyRevenueInCents)} />
        <Metric icon={<FaCalendarAlt />} label="Novos neste mês" value={summary.newThisMonth ?? 0} />
      </div>

      <PlatformCard>
        <div style={styles.filters}>
          <div style={styles.searchWrap}>
            <FaSearch style={styles.searchIcon} />
            <input
              style={styles.search}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && load()}
              placeholder="Buscar por condomínio, responsável, e-mail, telefone ou endereço"
            />
          </div>
          <select style={styles.select} value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todos os status</option>
            <option value="ACTIVE">Ativos</option>
            <option value="TRIAL">Teste</option>
            <option value="SUSPENDED">Suspensos</option>
            <option value="CANCELED">Cancelados</option>
          </select>
          <select style={styles.select} value={planCode} onChange={(event) => setPlanCode(event.target.value)}>
            <option value="">Todos os planos</option>
            <option value="BASICO">Básico</option>
            <option value="COMPLETO">Completo</option>
          </select>
          <button style={styles.filterButton} type="button" onClick={load} disabled={loading}>
            {loading ? "Atualizando..." : "Aplicar filtros"}
          </button>
        </div>

        {items.length === 0 ? (
          <PlatformEmpty title="Nenhum cliente encontrado" description="Ajuste os filtros ou aprove uma solicitação de condomínio." />
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Cliente</th>
                  <th style={styles.th}>Plano</th>
                  <th style={styles.th}>Tempo ativo</th>
                  <th style={styles.th}>Responsável</th>
                  <th style={styles.th}>Próxima cobrança</th>
                  <th style={styles.th}>Situação</th>
                  <th style={styles.th}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {items.map((client) => (
                  <tr key={client.id} style={styles.row}>
                    <td style={styles.td}>
                      <strong style={styles.clientName}>{client.name}</strong>
                      <span style={styles.muted}>{client.address?.city ?? "—"}{client.address?.state ? `/${client.address.state}` : ""}</span>
                    </td>
                    <td style={styles.td}><strong>{client.subscription?.plan?.name ?? "—"}</strong></td>
                    <td style={styles.td}>
                      <span>{activeTime(client.activeDays)}</span>
                      <small style={styles.small}>desde {date(client.clientSince)}</small>
                    </td>
                    <td style={styles.td}>
                      <span>{client.contactName || client.administrator?.name || "—"}</span>
                      <small style={styles.small}>{client.email || client.administrator?.email || "—"}</small>
                    </td>
                    <td style={styles.td}>
                      <strong>{date(client.subscription?.nextDueDate)}</strong>
                      <small style={styles.small}>{money(client.subscription?.priceInCents)}</small>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...badgeStyle(client.subscription?.billingStatus) }}>
                        {statusLabel(client.subscription?.billingStatus)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button type="button" style={styles.detailsButton} onClick={() => setSelected(client)}>Ver ficha</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PlatformCard>

      {selected && (
        <div style={styles.overlay} onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <span style={styles.heroEyebrow}>FICHA DO CLIENTE</span>
                <h2 style={styles.modalTitle}>{selected.name}</h2>
                <p style={styles.muted}>{statusLabel(selected.status)} • {selected.subscription?.plan?.name ?? "Sem plano"}</p>
              </div>
              <button type="button" style={styles.close} onClick={() => setSelected(null)} aria-label="Fechar"><FaTimes /></button>
            </div>

            <div style={styles.detailGrid}>
              <Detail title="Contrato" icon={<FaClock />} rows={[
                ["Cliente desde", date(selected.clientSince)],
                ["Tempo de plano", activeTime(selected.activeDays)],
                ["Próxima cobrança", date(selected.subscription?.nextDueDate)],
                ["Valor", money(selected.subscription?.priceInCents)],
                ["Tolerância", `${selected.subscription?.gracePeriodDays ?? 0} dias`],
                ["Situação", statusLabel(selected.subscription?.billingStatus)],
              ]} />
              <Detail title="Responsável" icon={<FaUserShield />} rows={[
                ["Contato principal", selected.contactName || "—"],
                ["Administrador", selected.administrator?.name || "—"],
                ["Usuário", selected.administrator?.username || "—"],
                ["E-mail", selected.administrator?.email || selected.email || "—"],
                ["Telefone", selected.administrator?.phone || selected.phone || "—"],
                ["Último acesso", dateTime(selected.lastLoginAt)],
              ]} />
              <Detail title="Condomínio" icon={<FaMapMarkerAlt />} rows={[
                ["Endereço", addressOf(selected.address)],
                ["CEP", selected.address?.postalCode || "—"],
                ["Documento", selected.document || "—"],
                ["Usuários cadastrados", selected.usersCount ?? 0],
              ]} />
              <Detail title="Contato financeiro" icon={<FaEnvelope />} rows={[
                ["Responsável", selected.subscription?.billingContactName || selected.contactName || "—"],
                ["E-mail", selected.subscription?.billingEmail || selected.email || "—"],
                ["WhatsApp", selected.subscription?.billingPhone || selected.phone || "—"],
                ["Ciclo", selected.subscription?.billingCycle || "—"],
              ]} />
            </div>

            <div style={styles.modalFooter}>
              <span><FaPhone /> Central mantém controle de plano, acesso e cobrança deste cliente.</span>
              <button type="button" style={styles.filterButton} onClick={() => setSelected(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div style={styles.metric}>
      <div style={styles.metricIcon}>{icon}</div>
      <div><span style={styles.metricLabel}>{label}</span><strong style={styles.metricValue}>{value}</strong></div>
    </div>
  );
}

function Detail({ title, icon, rows }) {
  return (
    <section style={styles.detailCard}>
      <h3 style={styles.detailTitle}><span style={styles.detailIcon}>{icon}</span>{title}</h3>
      <div style={styles.detailRows}>
        {rows.map(([label, value]) => (
          <div key={label} style={styles.detailRow}>
            <span style={styles.detailLabel}>{label}</span>
            <strong style={styles.detailValue}>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

const styles = {
  page: { display: "grid", gap: "20px" },
  hero: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", padding: "28px", borderRadius: "26px", background: "linear-gradient(135deg,#241047,var(--ic-primary-dark) 55%,var(--ic-primary-light))", color: "white", boxShadow: "0 24px 60px rgb(var(--ic-primary-dark-rgb) / .22)" },
  heroEyebrow: { fontSize: "11px", letterSpacing: "1.8px", fontWeight: 900, opacity: .82 },
  heroTitle: { margin: "8px 0 6px", fontSize: "clamp(22px,3vw,34px)", lineHeight: 1.08 },
  heroText: { margin: 0, maxWidth: "720px", color: "rgba(255,255,255,.82)", lineHeight: 1.6 },
  heroIcon: { width: "72px", height: "72px", borderRadius: "22px", display: "grid", placeItems: "center", flexShrink: 0, fontSize: "30px", background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.18)" },
  cards: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: "14px" },
  metric: { display: "flex", alignItems: "center", gap: "14px", padding: "18px", borderRadius: "20px", background: "white", border: "1px solid var(--ic-primary-soft-2)", boxShadow: "0 10px 30px rgb(var(--ic-primary-deep-rgb) / .07)" },
  metricIcon: { width: "42px", height: "42px", borderRadius: "14px", display: "grid", placeItems: "center", color: "var(--ic-primary-strong)", background: "var(--ic-primary-soft-4)" },
  metricLabel: { display: "block", color: "#6b7280", fontSize: "12px", fontWeight: 700, marginBottom: "4px" },
  metricValue: { display: "block", color: "#26134d", fontSize: "19px" },
  filters: { display: "grid", gridTemplateColumns: "minmax(260px,1fr) 170px 160px auto", gap: "10px", alignItems: "center", marginBottom: "18px" },
  searchWrap: { position: "relative" },
  searchIcon: { position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--ic-primary-light)" },
  search: { width: "100%", boxSizing: "border-box", padding: "12px 14px 12px 40px", borderRadius: "13px", border: "1px solid var(--ic-primary-border-soft)", outline: "none", fontSize: "13px" },
  select: { padding: "12px", borderRadius: "13px", border: "1px solid var(--ic-primary-border-soft)", background: "white", color: "var(--ic-primary-deep)" },
  filterButton: { border: 0, borderRadius: "13px", padding: "12px 16px", background: "linear-gradient(135deg,var(--ic-primary-strong),var(--ic-primary-light))", color: "white", fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: "0 8px", minWidth: "980px" },
  th: { padding: "0 12px 8px", textAlign: "left", color: "#7c6b95", fontSize: "11px", textTransform: "uppercase", letterSpacing: ".7px" },
  row: { background: "#faf9ff" },
  td: { padding: "14px 12px", color: "#35264c", fontSize: "13px", verticalAlign: "middle", borderTop: "1px solid #f0ecfb", borderBottom: "1px solid #f0ecfb" },
  clientName: { display: "block", color: "#2e174f", marginBottom: "4px" },
  muted: { display: "block", color: "#80738f", fontSize: "12px" },
  small: { display: "block", color: "#8b8098", marginTop: "4px", fontSize: "11px" },
  badge: { display: "inline-flex", padding: "6px 9px", borderRadius: "999px", border: "1px solid", fontSize: "11px", fontWeight: 900 },
  detailsButton: { border: "1px solid var(--ic-primary-border-soft)", borderRadius: "10px", padding: "8px 10px", background: "white", color: "var(--ic-primary-strong)", fontWeight: 800, cursor: "pointer" },
  overlay: { position: "fixed", inset: 0, zIndex: 999, background: "rgba(22,10,40,.58)", backdropFilter: "blur(5px)", display: "grid", placeItems: "center", padding: "18px" },
  modal: { width: "min(1000px,100%)", maxHeight: "90vh", overflowY: "auto", borderRadius: "26px", background: "#fbfaff", boxShadow: "0 35px 100px rgba(17,7,35,.34)", border: "1px solid rgba(255,255,255,.8)" },
  modalHeader: { display: "flex", justifyContent: "space-between", gap: "20px", padding: "24px 26px", borderBottom: "1px solid #eee9f8" },
  modalTitle: { margin: "6px 0", color: "#2b164d", fontSize: "26px" },
  close: { width: "40px", height: "40px", borderRadius: "12px", border: "1px solid #e9e3f5", background: "white", color: "var(--ic-primary-strong)", cursor: "pointer" },
  detailGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "14px", padding: "22px 26px" },
  detailCard: { padding: "18px", borderRadius: "18px", background: "white", border: "1px solid #eee9f8" },
  detailTitle: { margin: "0 0 14px", display: "flex", alignItems: "center", gap: "9px", color: "#3c1f66", fontSize: "15px" },
  detailIcon: { color: "var(--ic-primary)" },
  detailRows: { display: "grid", gap: "10px" },
  detailRow: { display: "grid", gap: "3px", paddingBottom: "9px", borderBottom: "1px dashed #eee9f8" },
  detailLabel: { color: "#8b8098", fontSize: "11px", fontWeight: 700 },
  detailValue: { color: "#382552", fontSize: "13px", overflowWrap: "anywhere" },
  modalFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", padding: "18px 26px", borderTop: "1px solid #eee9f8", color: "#7a6a8b", fontSize: "12px" },
};

export default PlatformClients;
