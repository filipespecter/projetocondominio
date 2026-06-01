import { useEffect, useState } from "react";

import {
  buscarMovimentacoes
} from "../../Services/movimentacaoService";

function DashboardPorteiro() {

  const [dados, setDados] = useState({
    visitantes: 0,
    encomendas: 0,
    moradores: 0,
    esperadas: 0
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
      sessionStorage.getItem("sessaoPorteiro");

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
        event.key === "movimentacoes"
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

    const pendentes = encomendas.filter(
      (e) => e.status === "pendente"
    );

    setDados({
      visitantes: visitantes.length,
      encomendas: pendentes.length,
      moradores: moradores.length,
      esperadas: esperadas.length
    });

    const movs =
      buscarMovimentacoes() || [];

    setMovimentacoes(movs);

  }

  return (

    <div style={styles.container}>

      {/* HEADER */}

      <div style={styles.header}>

        <div>

          <h1 style={styles.title}>
            Dashboard
          </h1>

          <p style={styles.subtitle}>
            Central operacional do porteiro
          </p>

          {porteiro && (

            <p style={styles.userInfo}>

              Plantão ativo:{" "}

              <strong>
                {porteiro.nome}
              </strong>

            </p>

          )}

        </div>

        <div style={styles.dateBox}>

          <p style={styles.dateLabel}>
            Hoje
          </p>

          <h3 style={styles.date}>
            {new Date().toLocaleDateString()}
          </h3>

        </div>

      </div>

      {/* CARDS */}

      <div style={styles.cards}>

        <div style={styles.card}>

          <div style={styles.cardTop}>

            <div style={styles.iconGreen}>
              📦
            </div>

            <span style={styles.badgeWarning}>
              Pendentes
            </span>

          </div>

          <p style={styles.cardLabel}>
            Encomendas aguardando retirada
          </p>

          <h1 style={styles.cardNumber}>
            {dados.encomendas}
          </h1>

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

            <div style={styles.iconDark}>
              👥
            </div>

            <span style={styles.badgeGreen}>
              Cadastrados
            </span>

          </div>

          <p style={styles.cardLabel}>
            Moradores ativos
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

      {/* GRID */}

      <div style={styles.bottomGrid}>

        {/* MOVIMENTAÇÕES */}

        <div style={styles.history}>

          <div style={styles.sectionHeader}>

            <h2 style={styles.historyTitle}>
              Movimentações recentes
            </h2>

            <span style={styles.live}>
              ● AO VIVO
            </span>

          </div>

          {movimentacoes.length === 0 && (

            <div style={styles.empty}>
              Nenhuma movimentação encontrada
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

                  {item.data} • {item.porteiro}

                </span>

              </div>

            </div>

          ))}

        </div>

        {/* ALERTAS */}

        <div style={styles.alerts}>

          <h2 style={styles.alertTitle}>
            Alertas do condomínio
          </h2>

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
                🚶 Visitantes ativos
              </h3>

              <p style={styles.alertText}>
                Existem visitantes registrados no sistema.
              </p>

            </div>

          )}

          {dados.encomendas === 0 &&
            dados.visitantes === 0 &&
            dados.esperadas === 0 && (

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
    fontFamily: "Arial"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px"
  },

  title: {
    margin: 0,
    fontSize: "32px",
    color: "#14532d"
  },

  subtitle: {
    marginTop: "8px",
    marginBottom: "8px",
    color: "#6b7280"
  },

  userInfo: {
    margin: 0,
    color: "#374151",
    fontSize: "14px"
  },

  dateBox: {
    background: "white",
    padding: "18px 24px",
    borderRadius: "20px",
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)"
  },

  dateLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px"
  },

  date: {
    margin: "6px 0 0",
    color: "#14532d",
    fontSize: "20px"
  },

  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
    gap: "20px",
    marginBottom: "30px"
  },

  card: {
    background: "white",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)"
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px"
  },

  iconGreen: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    background: "#dcfce7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px"
  },

  iconBlue: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    background: "#dbeafe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px"
  },

  iconDark: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    background: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px"
  },

  iconYellow: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    background: "#fef3c7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px"
  },

  badgeWarning: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "7px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700"
  },

  badgeBlue: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "7px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700"
  },

  badgeGreen: {
    background: "#dcfce7",
    color: "#166534",
    padding: "7px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700"
  },

  badgeYellow: {
    background: "#fef9c3",
    color: "#854d0e",
    padding: "7px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700"
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

  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "24px"
  },

  history: {
    background: "white",
    borderRadius: "24px",
    padding: "25px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)"
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },

  historyTitle: {
    margin: 0,
    color: "#14532d",
    fontSize: "22px"
  },

  live: {
    background: "#dcfce7",
    color: "#166534",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700"
  },

  empty: {
    padding: "30px",
    textAlign: "center",
    color: "#6b7280",
    background: "#f9fafb",
    borderRadius: "16px"
  },

  historyItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    padding: "16px",
    borderRadius: "16px",
    background: "#f9fafb",
    marginBottom: "12px"
  },

  historyIcon: {
    width: "42px",
    height: "42px",
    minWidth: "42px",
    borderRadius: "14px",
    background: "#dcfce7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px"
  },

  historyText: {
    margin: 0,
    color: "#111827",
    fontWeight: "600"
  },

  historyTime: {
    display: "block",
    marginTop: "6px",
    color: "#6b7280",
    fontSize: "13px"
  },

  alerts: {
    background: "white",
    borderRadius: "24px",
    padding: "25px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)"
  },

  alertTitle: {
    margin: "0 0 20px",
    color: "#14532d",
    fontSize: "22px"
  },

  alertCardWarning: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: "18px",
    padding: "18px",
    marginBottom: "14px"
  },

  alertCardBlue: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "18px",
    padding: "18px",
    marginBottom: "14px"
  },

  alertCardGreen: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "18px",
    padding: "18px",
    marginBottom: "14px"
  },

  alertCardNeutral: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
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