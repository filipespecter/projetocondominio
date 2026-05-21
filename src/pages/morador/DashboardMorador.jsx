import { useEffect, useState } from "react";

function DashboardMorador() {

  const [dados, setDados] = useState({
    avisos: 0,
    encomendas: 0,
    reservas: 0
  });

  useEffect(() => {

    const avisos =
      JSON.parse(localStorage.getItem("avisos")) || [];

    const encomendas =
      JSON.parse(localStorage.getItem("encomendas")) || [];

    const reservas =
      JSON.parse(localStorage.getItem("reservas")) || [];

    setDados({
      avisos: avisos.length,
      encomendas: encomendas.length,
      reservas: reservas.length
    });

  }, []);

  return (

    <div style={styles.container}>

      {/* TOPO */}

      <div style={styles.header}>

        <div>

          <h1 style={styles.title}>
            Olá, Morador 👋
          </h1>

          <p style={styles.subtitle}>
            Bem-vindo ao painel do condomínio
          </p>

        </div>

      </div>

      {/* AÇÕES RÁPIDAS */}

      <div style={styles.actions}>

        <button style={styles.actionButton}>
          📦 Minhas Encomendas
        </button>

        <button style={styles.actionButton}>
          📅 Fazer Reserva
        </button>

      </div>

      {/* CARDS */}

      <div style={styles.cards}>

        <div style={styles.card}>

          <div style={styles.cardIcon}>
            📢
          </div>

          <div>

            <p style={styles.cardLabel}>
              Avisos do condomínio
            </p>

            <h1 style={styles.cardNumber}>
              {dados.avisos}
            </h1>

          </div>

        </div>

        <div style={styles.card}>

          <div style={styles.cardIcon}>
            📦
          </div>

          <div>

            <p style={styles.cardLabel}>
              Encomendas pendentes
            </p>

            <h1 style={styles.cardNumber}>
              {dados.encomendas}
            </h1>

          </div>

        </div>

        <div style={styles.card}>

          <div style={styles.cardIcon}>
            📅
          </div>

          <div>

            <p style={styles.cardLabel}>
              Reservas realizadas
            </p>

            <h1 style={styles.cardNumber}>
              {dados.reservas}
            </h1>

          </div>

        </div>

      </div>

      {/* HISTÓRICO */}

      <div style={styles.history}>

        <h2 style={styles.historyTitle}>
          Atividades recentes
        </h2>

        <div style={styles.historyItem}>
          📦 Você possui encomendas aguardando retirada
        </div>

        <div style={styles.historyItem}>
          📢 Novo aviso publicado pelo condomínio
        </div>

        <div style={styles.historyItem}>
          📅 Reserva confirmada para área comum
        </div>

        <div style={styles.historyItem}>
          🏢 Bem-vindo ao sistema do condomínio
        </div>

      </div>

    </div>

  );

}

const styles = {

  container: {
    width: "100%",
    padding: "30px",
    boxSizing: "border-box"
  },

  header: {
    marginBottom: "30px"
  },

  title: {
    margin: 0,
    fontSize: "34px",
    color: "#111827"
  },

  subtitle: {
    marginTop: "8px",
    color: "#6b7280",
    fontSize: "15px"
  },

  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginBottom: "30px"
  },

  actionButton: {
    background: "#0f766e",
    color: "white",
    border: "none",
    padding: "22px",
    borderRadius: "14px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px"
  },

  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: "20px",
    marginBottom: "30px"
  },

  card: {
    background: "white",
    borderRadius: "16px",
    padding: "28px",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
  },

  cardIcon: {
    fontSize: "42px"
  },

  cardLabel: {
    color: "#6b7280",
    marginBottom: "8px"
  },

  cardNumber: {
    margin: 0,
    fontSize: "34px",
    color: "#111827"
  },

  history: {
    background: "white",
    borderRadius: "16px",
    padding: "28px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
  },

  historyTitle: {
    marginBottom: "20px",
    color: "#111827"
  },

  historyItem: {
    padding: "14px 0",
    borderBottom: "1px solid #e5e7eb",
    color: "#374151"
  }

};

export default DashboardMorador;