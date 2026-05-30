import { useEffect, useState } from "react";

function DashboardSindico() {

  const [dados, setDados] = useState({
    encomendas: 0,
    visitantes: 0,
    reservas: 0,
    avisos: 0
  });

  const [atividades, setAtividades] = useState([]);

  useEffect(() => {

    carregarDados();

    const interval = setInterval(() => {
      carregarDados();
    }, 1000);

    window.addEventListener(
      "storage",
      carregarDados
    );

    return () => {
      clearInterval(interval);

      window.removeEventListener(
        "storage",
        carregarDados
      );
    };

  }, []);

  function carregarDados() {

    const encomendas =
      JSON.parse(
        localStorage.getItem("encomendas")
      ) || [];

    const visitantes =
      JSON.parse(
        localStorage.getItem("visitantes")
      ) || [];

    const reservas =
      JSON.parse(
        localStorage.getItem("reservas")
      ) || [];

    const avisos =
      JSON.parse(
        localStorage.getItem("avisos")
      ) || [];

    setDados({

      encomendas:
        encomendas.filter(
          (e) =>
            e.status === "pendente" ||
            e.status === "Pendente"
        ).length,

      visitantes: visitantes.length,

      reservas:
        reservas.filter(
          (r) =>
            r.status === "pendente" ||
            r.status === "Pendente"
        ).length,

      avisos: avisos.length

    });

    const historico = [

      ...encomendas.slice(-2).map((e) => ({
        icon: "📦",
        texto:
          `Encomenda recebida - Apto ${
            e.apartamento ||
            e.apto ||
            "N/A"
          }`,
        tempo:
          e.data ||
          e.horario ||
          "Agora"
      })),

      ...reservas.slice(-2).map((r) => ({
        icon: "📅",
        texto:
          `Reserva solicitada - ${
            r.area ||
            r.areaComum ||
            "Área não informada"
          }`,
        tempo:
          r.criadoEm ||
          r.data ||
          "Agora"
      })),

      ...visitantes.slice(-5).map((v) => ({
        icon: "👤",
        texto:
          `Visitante registrado - ${v.nome}`,
        tempo:
          v.horario ||
          v.hora ||
          v.entrada ||
          "Agora"
      }))

    ];

    setAtividades(
      historico.reverse()
    );

  }

  return (

    <div style={styles.container}>

      {/* HEADER */}

      <div style={styles.header}>

        <div>

          <h1 style={styles.title}>
            Dashboard Administrativo
          </h1>

          <p style={styles.subtitle}>
            Controle geral do condomínio
          </p>

        </div>

      </div>

      {/* AÇÕES */}

      <div style={styles.actions}>

        <button style={styles.actionButton}>
          📢 Criar Aviso
        </button>

        <button style={styles.actionButton}>
          📅 Aprovar Reservas
        </button>

      </div>

      {/* CARDS */}

      <div style={styles.cards}>

        <div style={styles.card}>

          <div style={styles.cardTop}>

            <span style={styles.cardIcon}>
              📦
            </span>

            <h2 style={styles.number}>
              {dados.encomendas}
            </h2>

          </div>

          <p style={styles.cardText}>
            Encomendas pendentes
          </p>

        </div>

        <div style={styles.card}>

          <div style={styles.cardTop}>

            <span style={styles.cardIcon}>
              👤
            </span>

            <h2 style={styles.number}>
              {dados.visitantes}
            </h2>

          </div>

          <p style={styles.cardText}>
            Visitantes registrados
          </p>

        </div>

        <div style={styles.card}>

          <div style={styles.cardTop}>

            <span style={styles.cardIcon}>
              📅
            </span>

            <h2 style={styles.number}>
              {dados.reservas}
            </h2>

          </div>

          <p style={styles.cardText}>
            Reservas pendentes
          </p>

        </div>

        <div style={styles.card}>

          <div style={styles.cardTop}>

            <span style={styles.cardIcon}>
              📢
            </span>

            <h2 style={styles.number}>
              {dados.avisos}
            </h2>

          </div>

          <p style={styles.cardText}>
            Avisos ativos
          </p>

        </div>

      </div>

      {/* ATIVIDADES */}

      <div style={styles.activityCard}>

        <div style={styles.activityHeader}>

          <h3 style={styles.activityTitle}>
            Atividades recentes
          </h3>

          <span style={styles.viewAll}>
            Sistema em tempo real
          </span>

        </div>

        {atividades.length === 0 && (

          <div style={styles.empty}>

            Nenhuma atividade recente

          </div>

        )}

        {atividades.map((item, index) => (

          <div
            key={index}
            style={styles.activityItem}
          >

            <div style={styles.activityLeft}>

              <span style={styles.activityIcon}>
                {item.icon}
              </span>

              <div>

                <p style={styles.activityText}>
                  {item.texto}
                </p>

                <small style={styles.time}>
                  {item.tempo}
                </small>

              </div>

            </div>

          </div>

        ))}

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
    color: "#0f3d2e"
  },

  subtitle: {
    marginTop: "8px",
    color: "#6b7280"
  },

  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginBottom: "30px"
  },

  actionButton: {
    background:
      "linear-gradient(135deg,#0f3d2e,#14532d)",
    color: "white",
    border: "none",
    padding: "22px",
    borderRadius: "16px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "700",
    boxShadow:
      "0 4px 12px rgba(0,0,0,0.10)"
  },

  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(240px,1fr))",
    gap: "22px",
    marginBottom: "30px"
  },

  card: {
    background:
      "linear-gradient(135deg,#f0fdf4,#ffffff)",
    padding: "24px",
    borderRadius: "18px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)"
  },

  cardTop: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "15px"
  },

  cardIcon: {
    fontSize: "30px"
  },

  number: {
    margin: 0,
    fontSize: "34px",
    color: "#14532d"
  },

  cardText: {
    color: "#4b5563",
    margin: 0
  },

  activityCard: {
    background: "white",
    borderRadius: "18px",
    padding: "28px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)"
  },

  activityHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "22px"
  },

  activityTitle: {
    margin: 0,
    color: "#111827"
  },

  viewAll: {
    color: "#14532d",
    fontSize: "14px",
    fontWeight: "600"
  },

  activityItem: {
    padding: "16px 0",
    borderBottom: "1px solid #f1f5f9"
  },

  activityLeft: {
    display: "flex",
    gap: "16px",
    alignItems: "center"
  },

  activityIcon: {
    fontSize: "22px"
  },

  activityText: {
    margin: 0,
    color: "#111827"
  },

  time: {
    color: "#6b7280"
  },

  empty: {
    color: "#6b7280"
  }

};

export default DashboardSindico;