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

    <div>

      <h1 style={styles.title}>
        🏠 Dashboard do Morador
      </h1>

      <p style={styles.subtitle}>
        Bem-vindo ao painel do condomínio
      </p>

      {/* CARDS */}

      <div style={styles.grid}>

        <div style={styles.card}>

          <div style={styles.icon}>
            📢
          </div>

          <h3>Avisos</h3>

          <h1>{dados.avisos}</h1>

        </div>

        <div style={styles.card}>

          <div style={styles.icon}>
            📦
          </div>

          <h3>Encomendas</h3>

          <h1>{dados.encomendas}</h1>

        </div>

        <div style={styles.card}>

          <div style={styles.icon}>
            📅
          </div>

          <h3>Reservas</h3>

          <h1>{dados.reservas}</h1>

        </div>

      </div>

      {/* ÁREA INFORMATIVA */}

      <div style={styles.infoCard}>

        <h2>
          👋 Bem-vindo
        </h2>

        <p style={styles.text}>

          Aqui você pode:
          acompanhar encomendas,
          visualizar avisos do condomínio
          e reservar áreas comuns.

        </p>

      </div>

    </div>

  );

}

const styles = {

  title: {
    fontSize: "32px",
    marginBottom: "8px"
  },

  subtitle: {
    color: "#64748b",
    marginBottom: "30px"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "20px",
    marginBottom: "30px"
  },

  card: {
    background: "white",
    borderRadius: "14px",
    padding: "25px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
  },

  icon: {
    fontSize: "35px",
    marginBottom: "15px"
  },

  infoCard: {
    background: "white",
    borderRadius: "14px",
    padding: "25px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
  },

  text: {
    marginTop: "10px",
    color: "#475569",
    lineHeight: "24px"
  }

};

export default DashboardMorador;