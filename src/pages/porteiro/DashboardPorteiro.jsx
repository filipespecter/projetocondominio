import { useEffect, useState } from "react";

function DashboardPorteiro() {

  const [dados, setDados] = useState({
    visitantes: 0,
    encomendas: 0,
    moradores: 0
  });

  useEffect(() => {

    const visitantes =
      JSON.parse(localStorage.getItem("visitantes")) || [];

    const encomendas =
      JSON.parse(localStorage.getItem("encomendas")) || [];

    const moradores =
      JSON.parse(localStorage.getItem("moradores")) || [];

    setDados({
      visitantes: visitantes.length,
      encomendas: encomendas.length,
      moradores: moradores.length
    });

  }, []);

  return (

    <div style={styles.container}>

      {/* TOPO */}

      <div style={styles.header}>

        <div>

          <h1 style={styles.title}>
            Dashboard
          </h1>

          <p style={styles.subtitle}>
            Painel do Porteiro
          </p>

        </div>

      </div>

      {/* CONTEÚDO */}

      <div style={styles.content}>

        {/* AÇÕES */}

        <div style={styles.actions}>

          <button style={styles.actionButton}>
            📦 Registrar Encomenda
          </button>

          <button style={styles.actionButton}>
            🚶 Registrar Visitante
          </button>

        </div>

        {/* CARDS */}

        <div style={styles.cards}>

          <div style={styles.card}>

            <div style={styles.cardIcon}>
              📦
            </div>

            <div>

              <p style={styles.cardLabel}>
                Encomendas aguardando retirada
              </p>

              <h1 style={styles.cardNumber}>
                {dados.encomendas}
              </h1>

            </div>

          </div>

          <div style={styles.card}>

            <div style={styles.cardIcon}>
              👥
            </div>

            <div>

              <p style={styles.cardLabel}>
                Visitantes no condomínio
              </p>

              <h1 style={styles.cardNumber}>
                {dados.visitantes}
              </h1>

            </div>

          </div>

        </div>

        {/* HISTÓRICO */}

        <div style={styles.history}>

          <h2 style={styles.historyTitle}>
            Histórico recente
          </h2>

          <div style={styles.historyItem}>
            🚶 Visitante liberado para apartamento 101
          </div>

          <div style={styles.historyItem}>
            📦 Encomenda recebida para Maria Oliveira
          </div>

          <div style={styles.historyItem}>
            🚪 Entrada registrada às 09:15
          </div>

          <div style={styles.historyItem}>
            📦 Encomenda entregue ao morador
          </div>

        </div>

      </div>

    </div>

  );

}

const styles = {

  container: {
    width: "100%",
    minHeight: "100%",
    padding: "30px",
    boxSizing: "border-box"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px"
  },

  title: {
    margin: 0,
    fontSize: "32px"
  },

  subtitle: {
    color: "#6b7280",
    marginTop: "6px"
  },

  content: {
    width: "100%",
    maxWidth: "1500px",
  },

  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    marginBottom: "30px",
    width: "100%"
  },

  actionButton: {
    background: "#086329",
    color: "white",
    border: "none",
    padding: "24px",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "17px",
    fontWeight: "600",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    width: "100%"
  },

  cards: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    marginBottom: "30px",
    width: "100%"
  },

  card: {
    background: "white",
    borderRadius: "14px",
    padding: "30px",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    width: "100%"
  },

  cardIcon: {
    fontSize: "40px"
  },

  cardLabel: {
    color: "#6b7280",
    marginBottom: "8px"
  },

  cardNumber: {
    margin: 0,
    fontSize: "34px"
  },

  history: {
    background: "white",
    borderRadius: "14px",
    padding: "30px",
    width: "100%"
  },

  historyTitle: {
    marginBottom: "20px"
  },

  historyItem: {
    padding: "14px 0",
    borderBottom: "1px solid #e5e7eb",
    color: "#374151"
  }

};

export default DashboardPorteiro;