import { useEffect, useState } from "react";

import {
  buscarMovimentacoes
} from "../../Services/movimentacaoService";

function DashboardPorteiro() {

  const [dados, setDados] = useState({
    visitantes: 0,
    encomendas: 0,
    moradores: 0,
    esperadas: 0,
    ocorrencias: 0,
    ocorrenciasResolvidas: 0,
    visitantesDentro: 0,
    moradoresPrincipais: 0,
    dependentes: 0
  });

  const [movimentacoes, setMovimentacoes] =
    useState([]);

  const [porteiro, setPorteiro] =
    useState(null);

  /* =========================
     CARREGAR SESSÃO
  ========================= */

  useEffect(() => {

    const sessaoSalva =
      localStorage.getItem("sessaoPorteiro") ||
      sessionStorage.getItem("sessaoPorteiro") ||
      localStorage.getItem("usuarioPorteiro") ||
      sessionStorage.getItem("usuarioPorteiro");

    try {

      const usuario =
        sessaoSalva
          ? JSON.parse(sessaoSalva)
          : null;

      setPorteiro(usuario);

    } catch {

      setPorteiro(null);

    }

  }, []);

  /* =========================
     CARREGAR DASHBOARD
  ========================= */

  useEffect(() => {

    carregarDashboard();

    const handleStorage = (event) => {

      if (
        event.key === "visitantes" ||
        event.key === "encomendas" ||
        event.key === "moradores" ||
        event.key === "encomendas_esperadas" ||
        event.key === "movimentacoes" ||
        event.key === "ocorrencias"
      ) {

        carregarDashboard();

      }

    };

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {

      window.removeEventListener(
        "storage",
        handleStorage
      );

    };

  }, []);

  /* =========================
     FUNÇÃO PRINCIPAL
  ========================= */

  function carregarDashboard() {

    const visitantes =
      JSON.parse(
        localStorage.getItem("visitantes")
      ) || [];

    const encomendas =
      JSON.parse(
        localStorage.getItem("encomendas")
      ) || [];

    const moradores =
      JSON.parse(
        localStorage.getItem("moradores")
      ) || [];

    const esperadas =
      JSON.parse(
        localStorage.getItem("encomendas_esperadas")
      ) || [];

    const ocorrencias =
      JSON.parse(
        localStorage.getItem("ocorrencias")
      ) || [];

    const pendentes = encomendas.filter((e) => {
      const status = String(e.status || "").toLowerCase();

      return (
        status === "pendente" ||
        status === "recebido" ||
        status === "aguardando" ||
        status === "aguardando retirada" ||
        status === "atrasado"
      );
    });

    const ocorrenciasEncaminhadas =
      ocorrencias.filter(
        (item) =>
          !["resolvida", "resolvido"].includes(
            String(item.status || "").toLowerCase()
          )
      );

    const ocorrenciasResolvidas =
      ocorrencias.filter(
        (item) =>
          ["resolvida", "resolvido"].includes(
            String(item.status || "").toLowerCase()
          )
      );

    const visitantesDentro = visitantes.filter(
      (v) => v.status === "Em Visita"
    ).length;

    const moradoresPrincipais = moradores.filter(
      (m) => m.moradorPrincipal
    ).length;

    const dependentes = moradores.filter(
      (m) => !m.moradorPrincipal
    ).length;

    setDados({
      visitantes: visitantes.length,
      visitantesDentro,
      encomendas: pendentes.length,
      moradores: moradores.length,
      moradoresPrincipais,
      dependentes,
      esperadas: esperadas.length,
      ocorrencias: ocorrenciasEncaminhadas.length,
      ocorrenciasResolvidas: ocorrenciasResolvidas.length
    });

    const movs =
      buscarMovimentacoes() || [];

    setMovimentacoes(movs);

  }

  return (

    <div style={styles.container}>

      {/* HERO */}

      <div style={styles.hero}>

        <div>

          <span style={styles.heroBadge}>
            🛡️ Central operacional
          </span>

          <h1 style={styles.title}>
            Dashboard da Portaria
          </h1>

          <p style={styles.subtitle}>
            Acompanhe encomendas, visitantes, moradores,
            movimentações e ocorrências do plantão.
          </p>

          {porteiro && (

            <div style={styles.userLine}>

              <span style={styles.statusDot}></span>

              <span>
                Plantão ativo:{" "}
                <strong>
                  {porteiro.nome}
                </strong>
              </span>

              {porteiro.turno && (
                <span style={styles.turnoBadge}>
                  {porteiro.turno}
                </span>
              )}

            </div>

          )}

        </div>

        <div style={styles.datePanel}>

          <p style={styles.dateLabel}>
            Hoje
          </p>

          <h3 style={styles.date}>
            {new Date().toLocaleDateString()}
          </h3>

          <span style={styles.dateStatus}>
            Operação em andamento
          </span>

        </div>

      </div>

      {/* CARDS */}

      <div style={styles.cards}>

        <div style={styles.cardPrimary}>

          <div>

            <p style={styles.cardLabelLight}>
              Encomendas pendentes
            </p>

            <h1 style={styles.cardNumberLight}>
              {dados.encomendas}
            </h1>

            <span style={styles.cardHintLight}>
              Aguardando retirada
            </span>

          </div>

          <div style={styles.cardIconLight}>
            📦
          </div>

        </div>

        <div style={styles.card}>

          <div style={styles.cardTop}>

            <div style={styles.iconBlue}>
              🚶
            </div>

            <span style={styles.badgeBlue}>
              Ativos
            </span>

          </div>

          <p style={styles.cardLabel}>
            Visitantes registrados
          </p>

          <h1 style={styles.cardNumber}>
            {dados.visitantes}
          </h1>

        </div>

        <div style={styles.card}>

          <div style={styles.cardTop}>

            <div style={styles.iconGreen}>
              👥
            </div>

            <span style={styles.badgeGreen}>
              Base
            </span>

          </div>

          <p style={styles.cardLabel}>
            Moradores cadastrados
          </p>

          <h1 style={styles.cardNumber}>
            {dados.moradores}
          </h1>

        </div>

        <div style={styles.card}>

          <div style={styles.cardTop}>

            <div style={styles.iconYellow}>
              📬
            </div>

            <span style={styles.badgeYellow}>
              Esperadas
            </span>

          </div>

          <p style={styles.cardLabel}>
            Entregas aguardadas
          </p>

          <h1 style={styles.cardNumber}>
            {dados.esperadas}
          </h1>

        </div>

      </div>

      {/* SEGUNDA LINHA */}

      <div style={styles.secondaryGrid}>

        <div style={styles.operationCard}>

          <div>

            <span style={styles.operationBadge}>
              📘 Livro de Ocorrências
            </span>

            <h2 style={styles.operationTitle}>
              Ocorrências encaminhadas
            </h2>

            <p style={styles.operationText}>
              Registros feitos pela portaria ou enviados por moradores
              ficam aguardando resolução do síndico.
            </p>

          </div>

          <div style={styles.operationNumbers}>

            <div>

              <p style={styles.operationLabel}>
                Aguardando síndico
              </p>

              <h1 style={styles.operationNumber}>
                {dados.ocorrencias}
              </h1>

            </div>

            <div style={styles.operationDivider}></div>

            <div>

              <p style={styles.operationLabel}>
                Resolvidas
              </p>

              <h1 style={styles.operationNumberGreen}>
                {dados.ocorrenciasResolvidas}
              </h1>

            </div>

          </div>

        </div>

        <div style={styles.quickStatus}>

          <h2 style={styles.quickTitle}>
            Status do plantão
          </h2>

          <div style={styles.statusList}>

            <div style={styles.statusItem}>
              <span style={styles.statusIconGreen}>
                ●
              </span>
              <span>
                Sistema operacional ativo
              </span>
            </div>

            <div style={styles.statusItem}>
              <span style={styles.statusIconBlue}>
                ●
              </span>
              <span>
                Dados carregados do localStorage
              </span>
            </div>

            <div style={styles.statusItem}>
              <span style={styles.statusIconYellow}>
                ●
              </span>
              <span>
                Ocorrências integradas ao síndico
              </span>
            </div>

            <div style={styles.statusItem}>
              <span style={styles.statusIconGreen}>
                ●
              </span>
              <span>
                Morador principal e dependentes integrados
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* GRID */}

      <div style={styles.bottomGrid}>

        {/* MOVIMENTAÇÕES */}

        <div style={styles.history}>

          <div style={styles.sectionHeader}>

            <div>

              <h2 style={styles.historyTitle}>
                Movimentações recentes
              </h2>

              <p style={styles.sectionSubtitle}>
                Últimos registros operacionais do condomínio
              </p>

            </div>

            <span style={styles.live}>
              ● AO VIVO
            </span>

          </div>

          {movimentacoes.length === 0 && (

            <div style={styles.empty}>

              <div style={styles.emptyIcon}>
                📭
              </div>

              <h3 style={styles.emptyTitle}>
                Nenhuma movimentação encontrada
              </h3>

              <p style={styles.emptyText}>
                As movimentações aparecerão aqui conforme o uso do sistema.
              </p>

            </div>

          )}

          {movimentacoes.map((item) => (

            <div
              key={item.id}
              style={styles.historyItem}
            >

              <div style={styles.historyIcon}>

                {item.tipo ===
                "encomenda_recebida"

                  ? "📦"

                  : item.tipo ===
                    "encomenda_retirada"

                  ? "✅"

                  : item.tipo ===
                    "visitante"

                  ? "🚶"

                  : "📌"}

              </div>

              <div>

                <p style={styles.historyText}>
                  {item.mensagem}
                </p>

                <span style={styles.historyTime}>

                  {item.data || item.criadoEm || "-"} • {item.porteiro || item.responsavel || item.origem || "Sistema"}

                </span>

              </div>

            </div>

          ))}

        </div>

        {/* ALERTAS */}

        <div style={styles.alerts}>

          <h2 style={styles.alertTitle}>
            Alertas operacionais
          </h2>

          <p style={styles.alertSubtitle}>
            Pontos que precisam de atenção no plantão.
          </p>

          {dados.ocorrencias > 0 && (

            <div style={styles.alertCardDark}>

              <h3 style={styles.alertCardTitle}>
                📘 Ocorrências encaminhadas
              </h3>

              <p style={styles.alertText}>
                Existem registros aguardando resolução do síndico.
              </p>

            </div>

          )}

          {dados.encomendas > 0 && (

            <div style={styles.alertCardWarning}>

              <h3 style={styles.alertCardTitle}>
                ⚠️ Encomendas pendentes
              </h3>

              <p style={styles.alertText}>
                Existem encomendas aguardando retirada.
              </p>

            </div>

          )}

          {dados.esperadas > 0 && (

            <div style={styles.alertCardBlue}>

              <h3 style={styles.alertCardTitle}>
                📬 Entregas esperadas
              </h3>

              <p style={styles.alertText}>
                Existem entregas aguardadas pelos moradores.
              </p>

            </div>

          )}

          {dados.visitantes > 0 && (

            <div style={styles.alertCardGreen}>

              <h3 style={styles.alertCardTitle}>
                🚶 Visitantes registrados
              </h3>

              <p style={styles.alertText}>
                Existem visitantes registrados no sistema.
              </p>

            </div>

          )}

          {dados.encomendas === 0 &&
            dados.visitantes === 0 &&
            dados.esperadas === 0 &&
            dados.ocorrencias === 0 && (

            <div style={styles.alertCardNeutral}>

              <h3 style={styles.alertCardTitle}>
                ✅ Operação tranquila
              </h3>

              <p style={styles.alertText}>
                Nenhum alerta operacional no momento.
              </p>

            </div>

          )}

        </div>

      </div>

    </div>

  );

}

/* =========================
   STYLES
========================= */

const styles = {

  container: {
    width: "100%",
    fontFamily: "Arial",
    color: "#111827",
    position: "relative"
  },

  hero: {
    background:
      "linear-gradient(135deg,#4c1d95,#6d28d9,#7c3aed)",
    borderRadius: "30px",
    padding: "32px",
    color: "white",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "28px",
    marginBottom: "26px",
    boxShadow: "0 22px 55px rgba(124,58,237,0.24), 0 0 38px rgba(168,85,247,0.12)",
    border: "1px solid rgba(255,255,255,0.18)"
  },

  heroBadge: {
    background: "rgba(255,255,255,0.14)",
    padding: "10px 14px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "800",
    display: "inline-block",
    marginBottom: "15px"
  },

  title: {
    margin: 0,
    fontSize: "36px",
    letterSpacing: "-0.5px"
  },

  subtitle: {
    margin: "10px 0 0",
    color: "rgba(255,255,255,0.78)",
    maxWidth: "680px",
    lineHeight: "1.5"
  },

  userLine: {
    marginTop: "18px",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "10px",
    color: "#f3e8ff",
    fontSize: "14px",
    fontWeight: "600"
  },

  statusDot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    background: "#a855f7",
    boxShadow: "0 0 0 5px rgba(168,85,247,0.18)"
  },

  turnoBadge: {
    background: "rgba(255,255,255,0.14)",
    padding: "7px 11px",
    borderRadius: "999px",
    color: "white",
    fontWeight: "800",
    fontSize: "12px"
  },

  datePanel: {
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: "24px",
    padding: "22px",
    width: "100%",
    maxWidth: "240px",
    textAlign: "center",
    backdropFilter: "blur(12px)"
  },

  dateLabel: {
    margin: 0,
    color: "rgba(255,255,255,0.68)",
    fontSize: "13px"
  },

  date: {
    margin: "8px 0 14px",
    color: "white",
    fontSize: "22px"
  },

  dateStatus: {
    background: "#f3e8ff",
    color: "#7c3aed",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(min(230px,100%),1fr))",
    gap: "18px",
    marginBottom: "24px"
  },

  cardPrimary: {
    background:
      "linear-gradient(135deg,#6d28d9,#8b5cf6)",
    borderRadius: "24px",
    padding: "24px",
    color: "white",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 14px 35px rgba(124,58,237,0.18)"
  },

  card: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.08),transparent 34%), white",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 16px 40px rgba(88,28,135,0.08)",
    border: "1px solid #ede9fe"
  },

  cardTop: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px"
  },

  cardLabelLight: {
    margin: 0,
    color: "rgba(255,255,255,0.75)",
    fontSize: "14px"
  },

  cardNumberLight: {
    margin: "10px 0 2px",
    color: "white",
    fontSize: "38px"
  },

  cardHintLight: {
    color: "rgba(255,255,255,0.72)",
    fontSize: "13px"
  },

  cardIconLight: {
    width: "58px",
    height: "58px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.16)",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "29px"
  },

  iconGreen: {
    width: "50px",
    height: "50px",
    borderRadius: "17px",
    background: "#f3e8ff",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px"
  },

  iconBlue: {
    width: "50px",
    height: "50px",
    borderRadius: "17px",
    background: "#ede9fe",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px"
  },

  iconYellow: {
    width: "50px",
    height: "50px",
    borderRadius: "17px",
    background: "#fef3c7",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px"
  },

  badgeBlue: {
    background: "#ede9fe",
    color: "#6d28d9",
    padding: "7px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  badgeGreen: {
    background: "#f3e8ff",
    color: "#7c3aed",
    padding: "7px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  badgeYellow: {
    background: "#fef9c3",
    color: "#854d0e",
    padding: "7px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  cardLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px"
  },

  cardNumber: {
    margin: "12px 0 0",
    fontSize: "38px",
    color: "#111827"
  },

  secondaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(320px,100%),1fr))",
    gap: "24px",
    marginBottom: "24px"
  },

  operationCard: {
    background: "white",
    borderRadius: "28px",
    padding: "26px",
    boxShadow: "0 14px 40px rgba(15,23,42,0.08)",
    border: "1px solid #ede9fe",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "24px"
  },

  operationBadge: {
    display: "inline-block",
    background: "#faf5ff",
    color: "#7c3aed",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    marginBottom: "14px"
  },

  operationTitle: {
    margin: 0,
    color: "#6d28d9",
    fontSize: "24px"
  },

  operationText: {
    margin: "9px 0 0",
    color: "#6b7280",
    lineHeight: "1.5",
    maxWidth: "560px"
  },

  operationNumbers: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "22px",
    background: "#fbfaff",
    padding: "18px",
    borderRadius: "22px"
  },

  operationLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "13px",
    whiteSpace: "nowrap"
  },

  operationNumber: {
    margin: "8px 0 0",
    color: "#92400e",
    fontSize: "34px"
  },

  operationNumberGreen: {
    margin: "8px 0 0",
    color: "#7c3aed",
    fontSize: "34px"
  },

  operationDivider: {
    width: "1px",
    height: "54px",
    background: "#ddd6fe"
  },

  quickStatus: {
    background:
      "linear-gradient(135deg,#ffffff,#fbfaff)",
    borderRadius: "28px",
    padding: "26px",
    boxShadow: "0 14px 40px rgba(15,23,42,0.08)",
    border: "1px solid #ede9fe"
  },

  quickTitle: {
    margin: "0 0 18px",
    color: "#6d28d9",
    fontSize: "22px"
  },

  statusList: {
    display: "flex",
    flexDirection: "column",
    gap: "13px"
  },

  statusItem: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "10px",
    color: "#374151",
    fontSize: "14px",
    fontWeight: "600"
  },

  statusIconGreen: {
    color: "#8b5cf6"
  },

  statusIconBlue: {
    color: "#7c3aed"
  },

  statusIconYellow: {
    color: "#d97706"
  },

  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(320px,100%),1fr))",
    gap: "24px"
  },

  history: {
    background: "white",
    borderRadius: "28px",
    padding: "26px",
    boxShadow: "0 14px 40px rgba(15,23,42,0.08)",
    border: "1px solid #ede9fe"
  },

  sectionHeader: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "22px",
    gap: "16px"
  },

  historyTitle: {
    margin: 0,
    color: "#6d28d9",
    fontSize: "23px"
  },

  sectionSubtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "14px"
  },

  live: {
    background: "#f3e8ff",
    color: "#7c3aed",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  empty: {
    padding: "45px",
    textAlign: "center",
    color: "#6b7280",
    background: "#fbfaff",
    borderRadius: "22px",
    border: "1px dashed #d1d5db"
  },

  emptyIcon: {
    fontSize: "42px",
    marginBottom: "12px"
  },

  emptyTitle: {
    margin: 0,
    color: "#111827"
  },

  emptyText: {
    margin: "8px 0 0",
    color: "#6b7280"
  },

  historyItem: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: "14px",
    padding: "17px",
    borderRadius: "18px",
    background: "#fbfaff",
    marginBottom: "12px",
    border: "1px solid #ede9fe"
  },

  historyIcon: {
    width: "44px",
    height: "44px",
    minWidth: "44px",
    borderRadius: "15px",
    background: "#f3e8ff",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "21px"
  },

  historyText: {
    margin: 0,
    color: "#111827",
    fontWeight: "700",
    lineHeight: "1.4"
  },

  historyTime: {
    display: "block",
    marginTop: "7px",
    color: "#6b7280",
    fontSize: "13px"
  },

  alerts: {
    background: "white",
    borderRadius: "28px",
    padding: "26px",
    boxShadow: "0 14px 40px rgba(15,23,42,0.08)",
    border: "1px solid #ede9fe"
  },

  alertTitle: {
    margin: 0,
    color: "#6d28d9",
    fontSize: "23px"
  },

  alertSubtitle: {
    margin: "6px 0 18px",
    color: "#6b7280",
    fontSize: "14px"
  },

  alertCardDark: {
    background: "#faf5ff",
    border: "1px solid #ddd6fe",
    borderRadius: "18px",
    padding: "18px",
    marginBottom: "14px"
  },

  alertCardWarning: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: "18px",
    padding: "18px",
    marginBottom: "14px"
  },

  alertCardBlue: {
    background: "#faf5ff",
    border: "1px solid #ddd6fe",
    borderRadius: "18px",
    padding: "18px",
    marginBottom: "14px"
  },

  alertCardGreen: {
    background: "#faf5ff",
    border: "1px solid #ddd6fe",
    borderRadius: "18px",
    padding: "18px",
    marginBottom: "14px"
  },

  alertCardNeutral: {
    background: "#fbfaff",
    border: "1px solid #ddd6fe",
    borderRadius: "18px",
    padding: "18px"
  },

  alertCardTitle: {
    margin: "0 0 8px",
    color: "#111827",
    fontSize: "16px"
  },

  alertText: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "1.5"
  }

};

export default DashboardPorteiro;