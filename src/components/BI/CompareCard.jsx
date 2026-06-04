function CompareCard({ title, atual, anterior, variacao }) {
  const direcao = variacao?.direcao || "estavel";

  return (
    <div style={styles.compareCard}>
      <span style={styles.compareLabel}>
        {title}
      </span>

      <h2 style={styles.compareNumber}>
        {atual}
      </h2>

      <p style={styles.compareText}>
        Anterior: {anterior}
      </p>

      <strong
        style={{
          ...styles.compareBadge,
          color:
            direcao === "subiu"
              ? "#7cff4a"
              : direcao === "caiu"
              ? "#ef4444"
              : "#facc15"
        }}
      >
        {direcao === "subiu" && "▲ "}
        {direcao === "caiu" && "▼ "}
        {direcao === "estavel" && "● "}
        {variacao?.texto || "Estável"}
      </strong>
    </div>
  );
}

const styles = {
  compareCard: {
    background:
      "linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.035))",
    border: "1px solid rgba(124,255,74,0.14)",
    borderRadius: "26px",
    padding: "20px",
    boxShadow: "0 14px 35px rgba(0,0,0,0.18)"
  },

  compareLabel: {
    color: "rgba(255,255,255,0.58)",
    fontSize: "13px",
    fontWeight: "900"
  },

  compareNumber: {
    margin: "10px 0 4px",
    color: "#7cff4a",
    fontSize: "34px",
    textShadow: "0 0 20px rgba(124,255,74,0.20)"
  },

  compareText: {
    margin: "0 0 10px",
    color: "rgba(255,255,255,0.56)",
    fontSize: "13px"
  },

  compareBadge: {
    display: "inline-block",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.10)",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  }
};

export default CompareCard;