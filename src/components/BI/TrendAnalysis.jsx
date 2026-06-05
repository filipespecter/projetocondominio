function TrendAnalysis({ comparativos = {} }) {
  function obterPercentual(item) {
    const variacao = item?.variacao;

    if (typeof variacao === "number") {
      return variacao;
    }

    if (typeof variacao === "object" && variacao !== null) {
      return Number(variacao.percentual || 0);
    }

    return 0;
  }

  function obterTexto(item) {
    const variacao = item?.variacao;

    if (typeof variacao === "object" && variacao !== null) {
      return variacao.texto || `${variacao.percentual || 0}%`;
    }

    return `${variacao || 0}%`;
  }

  const itens = [
    {
      nome: "Visitantes",
      percentual: obterPercentual(comparativos.visitantes),
      texto: obterTexto(comparativos.visitantes)
    },
    {
      nome: "Encomendas",
      percentual: obterPercentual(comparativos.encomendas),
      texto: obterTexto(comparativos.encomendas)
    },
    {
      nome: "Reservas",
      percentual: obterPercentual(comparativos.reservas),
      texto: obterTexto(comparativos.reservas)
    },
    {
      nome: "Ocorrências",
      percentual: obterPercentual(comparativos.ocorrencias),
      texto: obterTexto(comparativos.ocorrencias)
    }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.badge}>
          📈 Tendências
        </span>

        <h3 style={styles.title}>
          Evolução dos indicadores
        </h3>
      </div>

      <div style={styles.grid}>
        {itens.map((item, index) => {
          const positivo = item.percentual >= 0;

          return (
            <div key={index} style={styles.card}>
              <strong>{item.nome}</strong>

              <div
                style={{
                  ...styles.value,
                  color: positivo ? "#7cff4a" : "#ef4444"
                }}
              >
                {positivo ? "↗" : "↘"} {item.texto}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "rgba(7,19,13,0.95)",
    border: "1px solid rgba(124,255,74,0.14)",
    borderRadius: "24px",
    padding: "22px"
  },

  header: {
    marginBottom: "20px"
  },

  badge: {
    background: "rgba(124,255,74,0.12)",
    color: "#b9ff8a",
    padding: "7px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  title: {
    color: "white",
    marginTop: "12px"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
    gap: "15px"
  },

  card: {
    background: "rgba(255,255,255,0.05)",
    borderRadius: "18px",
    padding: "16px",
    border: "1px solid rgba(124,255,74,0.12)"
  },

  value: {
    marginTop: "12px",
    fontSize: "26px",
    fontWeight: "800"
  }
};

export default TrendAnalysis;