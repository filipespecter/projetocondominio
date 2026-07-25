import {
  FaBrain,
  FaRocket,
  FaTriangleExclamation,
  FaChartLine
} from "react-icons/fa6";

function ExecutiveSummary({ resumo = [] }) {
  function obterTipo(index) {
    const tipos = [
      {
        label: "Insight",
        icon: <FaBrain />,
        color: "#22c55e"
      },
      {
        label: "Oportunidade",
        icon: <FaRocket />,
        color: "#22c55e"
      },
      {
        label: "Atenção",
        icon: <FaTriangleExclamation />,
        color: "#facc15"
      },
      {
        label: "Análise",
        icon: <FaChartLine />,
        color: "#22c55e"
      }
    ];

    return tipos[index % tipos.length];
  }

  return (
    <div style={styles.container}>
      {resumo.map((item, index) => {
        const tipo = obterTipo(index);

        return (
          <div key={index} style={styles.item}>
            <div
              style={{
                ...styles.icon,
                color: tipo.color,
                border: `1px solid ${tipo.color}55`,
                boxShadow: `0 0 18px ${tipo.color}30`
              }}
            >
              {tipo.icon}
            </div>

            <div style={styles.content}>
              <span
                style={{
                  ...styles.badge,
                  color: tipo.color,
                  border: `1px solid ${tipo.color}55`
                }}
              >
                {tipo.label}
              </span>

              <p style={styles.text}>
                {item}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  container: {
    display: "grid",
    gap: "18px"
  },

  item: {
    position: "relative",
    overflow: "hidden",

    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: "18px",

    background:
      "radial-gradient(circle at top right,rgba(168,85,247,.18),transparent 34%),linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.05))",

    border: "1px solid rgba(216,180,254,.22)",

    borderRadius: "24px",

    padding: "18px",

    backdropFilter: "blur(16px)",

    boxShadow:
      "0 20px 50px rgba(88,28,135,.18)"
  },

  icon: {
    width: "54px",

    height: "54px",

    borderRadius: "18px",

    display: "flex",
    flexWrap: "wrap",

    alignItems: "center",

    justifyContent: "center",

    fontSize: "23px",

    background: "rgba(255,255,255,.08)",

    flexShrink: 0
  },

  content: {
    flex: 1
  },

  badge: {
    display: "inline-block",

    padding: "6px 12px",

    borderRadius: "999px",

    background: "rgba(255,255,255,.08)",

    fontSize: "11px",

    fontWeight: "900",

    textTransform: "uppercase",

    letterSpacing: ".8px",

    marginBottom: "10px"
  },

  text: {
    margin: 0,

    color: "#1f2937",

    lineHeight: "1.7",

    fontSize: "14px",

    fontWeight: "700"
  }
};

export default ExecutiveSummary;