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

  useEffect(() => {

    // 🔐 SEM USAR usuarioLogado (evita conflito geral do sistema)
    const usuarioSalvo =
      localStorage.getItem("usuarioPorteiro") ||
      sessionStorage.getItem("usuarioPorteiro");

    let usuario = null;

    try {
      usuario = usuarioSalvo
        ? JSON.parse(usuarioSalvo)
        : null;
    } catch (e) {
      usuario = null;
    }

    setPorteiro(usuario);

    carregarDashboard();

    const interval = setInterval(() => {
      carregarDashboard();
    }, 1000);

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

    window.addEventListener("storage", handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorage);
    };

  }, []);

  function carregarDashboard() {

    const visitantes =
      JSON.parse(localStorage.getItem("visitantes")) || [];

    const encomendas =
      JSON.parse(localStorage.getItem("encomendas")) || [];

    const moradores =
      JSON.parse(localStorage.getItem("moradores")) || [];

    const esperadas =
      JSON.parse(localStorage.getItem("encomendas_esperadas")) || [];

    const pendentes = encomendas.filter(
      (e) => e.status === "pendente"
    );

    setDados({
      visitantes: visitantes.length,
      encomendas: pendentes.length,
      moradores: moradores.length,
      esperadas: esperadas.length
    });

    const movs = buscarMovimentacoes() || [];
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
              <strong>{porteiro.nome}</strong>
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
            <div style={styles.iconGreen}>📦</div>
            <span style={styles.badgeWarning}>Pendentes</span>
          </div>
          <p style={styles.cardLabel}>
            Encomendas aguardando retirada
          </p>
          <h1 style={styles.cardNumber}>{dados.encomendas}</h1>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTop}>
            <div style={styles.iconBlue}>🚶</div>
            <span style={styles.badgeBlue}>Ativos</span>
          </div>
          <p style={styles.cardLabel}>
            Visitantes registrados
          </p>
          <h1 style={styles.cardNumber}>{dados.visitantes}</h1>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTop}>
            <div style={styles.iconDark}>👥</div>
            <span style={styles.badgeGreen}>Cadastrados</span>
          </div>
          <p style={styles.cardLabel}>
            Moradores ativos
          </p>
          <h1 style={styles.cardNumber}>{dados.moradores}</h1>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTop}>
            <div style={styles.iconYellow}>📬</div>
            <span style={styles.badgeYellow}>Esperadas</span>
          </div>
          <p style={styles.cardLabel}>
            Entregas aguardadas
          </p>
          <h1 style={styles.cardNumber}>{dados.esperadas}</h1>
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
            <span style={styles.live}>● AO VIVO</span>
          </div>

          {movimentacoes.length === 0 && (
            <div style={styles.empty}>
              Nenhuma movimentação encontrada
            </div>
          )}

          {movimentacoes.map((item) => (
            <div key={item.id} style={styles.historyItem}>

              <div style={styles.historyIcon}>
                {item.tipo === "encomenda_recebida"
                  ? "📦"
                  : item.tipo === "encomenda_retirada"
                  ? "✅"
                  : item.tipo === "visitante"
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

const styles = {

  container: {
    width: "100%",
    padding: "35px",
    boxSizing: "border-box"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "35px"
  },

  title: {
    margin: 0,
    fontSize: "34px",
    fontWeight: "700",
    color: "#111827"
  },

  subtitle: {
    marginTop: "8px",
    color: "#6b7280",
    fontSize: "15px"
  },

  userInfo: {
    marginTop: "10px",
    color: "#14532d",
    fontSize: "14px"
  },

  dateBox: {
    background: "white",
    padding: "14px 18px",
    borderRadius: "14px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
  },

  dateLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "13px"
  },

  date: {
    marginTop: "5px",
    marginBottom: 0
  },

  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "24px",
    marginBottom: "30px"
  },

  card: {
    background: "white",
    borderRadius: "18px",
    padding: "28px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)"
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px"
  },

  iconGreen: {
    width: "60px",
    height: "60px",
    borderRadius: "16px",
    background: "#dcfce7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px"
  },

  iconBlue: {
    width: "60px",
    height: "60px",
    borderRadius: "16px",
    background: "#dbeafe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px"
  },

  iconDark: {
    width: "60px",
    height: "60px",
    borderRadius: "16px",
    background: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px"
  },

  iconYellow: {
    width: "60px",
    height: "60px",
    borderRadius: "16px",
    background: "#fef3c7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px"
  },

  badgeWarning: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "600"
  },

  badgeBlue: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "600"
  },

  badgeGreen: {
    background: "#dcfce7",
    color: "#166534",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "600"
  },

  badgeYellow: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "600"
  },

  cardLabel: {
    color: "#6b7280",
    marginBottom: "10px",
    fontSize: "14px"
  },

  cardNumber: {
    margin: 0,
    fontSize: "42px",
    color: "#111827"
  },

  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "24px"
  },

  history: {
    background: "white",
    borderRadius: "18px",
    padding: "28px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)"
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px"
  },

  historyTitle: {
    margin: 0,
    color: "#111827"
  },

  live: {
    background: "#dcfce7",
    color: "#166534",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700"
  },

  historyItem: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    padding: "18px 0",
    borderBottom: "1px solid #f3f4f6"
  },

  historyIcon: {
    width: "45px",
    height: "45px",
    borderRadius: "12px",
    background: "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px"
  },

  historyText: {
    margin: 0,
    color: "#111827",
    fontWeight: "500"
  },

  historyTime: {
    color: "#6b7280",
    fontSize: "13px"
  },

  alerts: {
    background: "white",
    borderRadius: "18px",
    padding: "28px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)"
  },

  alertTitle: {
    marginBottom: "25px"
  },

  alertCardWarning: {
    background: "#fef3c7",
    borderRadius: "14px",
    padding: "18px",
    marginBottom: "18px"
  },

  alertCardBlue: {
    background: "#dbeafe",
    borderRadius: "14px",
    padding: "18px",
    marginBottom: "18px"
  },

  alertCardGreen: {
    background: "#dcfce7",
    borderRadius: "14px",
    padding: "18px",
    marginBottom: "18px"
  },

  alertCardNeutral: {
    background: "#f3f4f6",
    borderRadius: "14px",
    padding: "18px"
  },

  alertCardTitle: {
    marginTop: 0,
    marginBottom: "10px",
    fontSize: "15px"
  },

  alertText: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "22px",
    color: "#374151"
  },

  empty: {
    color: "#6b7280",
    textAlign: "center",
    padding: "20px"
  }

};

export default DashboardPorteiro;