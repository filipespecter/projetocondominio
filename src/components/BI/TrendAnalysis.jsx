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
            <div
              key={index}
              style={{
                ...styles.card,
                border: positivo
                  ? "1px solid rgba(124,255,74,.22)"
                  : "1px solid rgba(239,68,68,.20)"
              }}
            >
              <div
                style={{
                  ...styles.topLine,
                  background: positivo
                    ? "linear-gradient(90deg,transparent,#7cff4a,transparent)"
                    : "linear-gradient(90deg,transparent,#ef4444,transparent)"
                }}
              />

              <span style={styles.label}>
                {item.nome}
              </span>

              <div
                style={{
                  ...styles.value,
                  color: positivo ? "#7cff4a" : "#ef4444"
                }}
              >
                {positivo ? "↗" : "↘"} {item.texto}
              </div>

              <span style={styles.footer}>
                {positivo
                  ? "Tendência positiva"
                  : "Tendência negativa"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,.18),transparent 35%),linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.05))",

    border: "1px solid rgba(216,180,254,.22)",

    borderRadius: "28px",

    padding: "24px",

    boxShadow:
      "0 22px 55px rgba(88,28,135,.20)",

    backdropFilter: "blur(18px)"
  },

  header: {
    marginBottom: "22px"
  },

  badge: {
    display: "inline-block",

    background:
      "rgba(124,255,74,.12)",

    color: "#7cff4a",

    border: "1px solid rgba(124,255,74,.25)",

    padding: "8px 13px",

    borderRadius: "999px",

    fontSize: "12px",

    fontWeight: "900"
  },

  title: {
    color: "#1f2937",

    marginTop: "14px",

    fontSize: "28px"
  },

  grid: {
    display: "grid",

    gridTemplateColumns:
      "repeat(auto-fit,minmax(min(190px,100%),1fr))",

    gap: "18px"
  },

  card: {
    position: "relative",

    overflow: "hidden",

    background:
      "rgba(255,255,255,.08)",

    borderRadius: "22px",

    padding: "18px",

    backdropFilter: "blur(12px)"
  },

  topLine: {
    position: "absolute",

    top: 0,

    left: "14px",

    right: "14px",

    height: "3px"
  },

  label: {
    display: "block",

    color: "#1f2937",

    fontWeight: "900",

    textTransform: "uppercase",

    letterSpacing: ".8px",

    fontSize: "12px"
  },

  value: {
    marginTop: "16px",

    fontSize: "30px",

    fontWeight: "900"
  },

  footer: {
    display: "block",

    marginTop: "12px",

    color: "#4b5563",

    fontSize: "12px",

    fontWeight: "600"
  }
};

export default TrendAnalysis;