import { useEffect, useState } from "react";

function ExpectedPackages() {

  const [esperadas, setEsperadas] = useState([]);

  useEffect(() => {
    carregarEsperadas();
  }, []);

  function carregarEsperadas() {

    const data =
      JSON.parse(
        localStorage.getItem(
          "encomendas_esperadas"
        )
      ) || [];

    setEsperadas(data);

  }

  if (esperadas.length === 0) {
    return null;
  }

  return (

    <div style={styles.container}>

      <div style={styles.header}>

        <h2 style={styles.title}>
          📬 Encomendas Esperadas
        </h2>

        <p style={styles.subtitle}>
          Moradores aguardando entregas
        </p>

      </div>

      <div style={styles.grid}>

        {esperadas.map((item) => (

          <div
            key={item.id}
            style={styles.card}
          >

            <div style={styles.top}>

              <h3 style={styles.packageType}>
                📦 {item.tipo}
              </h3>

              <div style={styles.status}>
                aguardando
              </div>

            </div>

            <p style={styles.description}>
              {item.descricao || "Sem descrição"}
            </p>

            <div style={styles.info}>

              <p>
                🕒 {item.data}
              </p>

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}

const styles = {

  container: {
    marginBottom: "30px"
  },

  header: {
    marginBottom: "18px"
  },

  title: {
    margin: 0,
    fontSize: "22px",
    color: "#111827"
  },

  subtitle: {
    marginTop: "6px",
    color: "#6b7280"
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px"
  },

  card: {
    background: "white",
    borderRadius: "16px",
    padding: "20px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)"
  },

  top: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px"
  },

  packageType: {
    margin: 0,
    color: "#111827"
  },

  status: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700"
  },

  description: {
    color: "#4b5563",
    marginBottom: "16px"
  },

  info: {
    color: "#6b7280",
    fontSize: "14px"
  }

};

export default ExpectedPackages;