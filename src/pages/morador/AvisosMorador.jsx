import { useEffect, useState } from "react";

function AvisosMorador() {

  const [avisos, setAvisos] = useState([]);

  useEffect(() => {

    carregarAvisos();

  }, []);

  function carregarAvisos() {

    const data =
      JSON.parse(localStorage.getItem("avisos")) || [];

    setAvisos(data);

  }

  const urgentes = avisos.filter(
    (a) => a.prioridade === "urgente"
  );

  const importantes = avisos.filter(
    (a) => a.prioridade === "importante"
  );

  return (

    <div style={styles.container}>

      {/* HEADER */}

      <div style={styles.header}>

        <h1 style={styles.title}>
          Avisos do Condomínio
        </h1>

        <p style={styles.subtitle}>
          Comunicados e informações importantes
        </p>

      </div>

      {/* RESUMO */}

      <div style={styles.resumeGrid}>

        <div style={styles.resumeCard}>

          <div style={styles.resumeIcon}>
            📢
          </div>

          <div>

            <p style={styles.resumeLabel}>
              Total de avisos
            </p>

            <h2 style={styles.resumeNumber}>
              {avisos.length}
            </h2>

          </div>

        </div>

        <div style={styles.resumeCard}>

          <div style={styles.resumeIcon}>
            ⚠️
          </div>

          <div>

            <p style={styles.resumeLabel}>
              Importantes
            </p>

            <h2 style={styles.resumeNumber}>
              {importantes.length}
            </h2>

          </div>

        </div>

        <div style={styles.resumeCard}>

          <div style={styles.resumeIcon}>
            🚨
          </div>

          <div>

            <p style={styles.resumeLabel}>
              Urgentes
            </p>

            <h2 style={styles.resumeNumber}>
              {urgentes.length}
            </h2>

          </div>

        </div>

      </div>

      {/* LISTA */}

      <div style={styles.list}>

        {avisos.length === 0 && (

          <div style={styles.empty}>

            <h3>
              Nenhum aviso encontrado
            </h3>

            <p>
              Não existem avisos cadastrados no momento.
            </p>

          </div>

        )}

        {avisos.map((item) => (

          <div
            key={item.id}
            style={styles.card}
          >

            <div style={styles.cardTop}>

              <div>

                <h2 style={styles.cardTitle}>
                  📢 {item.titulo}
                </h2>

                <p style={styles.cardDate}>
                  {item.data}
                </p>

              </div>

              <div
                style={{
                  ...styles.priority,

                  background:
                    item.prioridade === "urgente"
                      ? "#fee2e2"
                      : item.prioridade === "importante"
                      ? "#fef3c7"
                      : "#dcfce7",

                  color:
                    item.prioridade === "urgente"
                      ? "#991b1b"
                      : item.prioridade === "importante"
                      ? "#92400e"
                      : "#166534"
                }}
              >

                {item.prioridade || "normal"}

              </div>

            </div>

            <p style={styles.description}>
              {item.descricao}
            </p>

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
    color: "#14532d"
  },

  subtitle: {
    marginTop: "8px",
    color: "#6b7280"
  },

  resumeGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "20px",
    marginBottom: "30px"
  },

  resumeCard: {
    background:
      "linear-gradient(135deg,#dcfce7,#ffffff)",
    borderRadius: "18px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)"
  },

  resumeIcon: {
    fontSize: "42px"
  },

  resumeLabel: {
    color: "#6b7280",
    marginBottom: "6px"
  },

  resumeNumber: {
    margin: 0,
    fontSize: "32px",
    color: "#14532d"
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "18px"
  },

  empty: {
    background: "white",
    borderRadius: "18px",
    padding: "40px",
    textAlign: "center",
    color: "#6b7280",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)"
  },

  card: {
    background: "white",
    borderRadius: "18px",
    padding: "24px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)"
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "18px"
  },

  cardTitle: {
    margin: 0,
    color: "#111827"
  },

  cardDate: {
    marginTop: "8px",
    color: "#6b7280",
    fontSize: "14px"
  },

  priority: {
    padding: "8px 14px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "700"
  },

  description: {
    color: "#374151",
    lineHeight: "24px"
  }

};

export default AvisosMorador;