import {
  FaArrowTrendUp,
  FaArrowTrendDown,
  FaMinus
} from "react-icons/fa6";

function CompareCard({
  title,
  atual,
  anterior,
  variacao
}) {
  const direcao = variacao?.direcao || "estavel";

  const cor =
    direcao === "subiu"
      ? "#22c55e"
      : direcao === "caiu"
      ? "#ef4444"
      : "#facc15";

  const Icon =
    direcao === "subiu"
      ? FaArrowTrendUp
      : direcao === "caiu"
      ? FaArrowTrendDown
      : FaMinus;

  return (
    <div style={styles.compareCard}>
      <div style={styles.topLine}></div>

      <span style={styles.compareLabel}>
        {title}
      </span>

      <h2 style={styles.compareNumber}>
        {atual}
      </h2>

      <p style={styles.compareText}>
        Anterior: {anterior}
      </p>

      <div
        style={{
          ...styles.compareBadge,
          color: cor,
          border: `1px solid ${cor}40`
        }}
      >
        <Icon size={13} />

        {variacao?.texto || "Estável"}
      </div>
    </div>
  );
}

const styles = {
  compareCard: {
    position: "relative",
    overflow: "hidden",

    background:
      "radial-gradient(circle at top right,rgba(168,85,247,.18),transparent 35%),linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.05))",

    border: "1px solid rgba(216,180,254,.22)",

    borderRadius: "28px",

    padding: "22px",

    backdropFilter: "blur(18px)",

    boxShadow:
      "0 22px 55px rgba(88,28,135,.18)"
  },

  topLine: {
    position: "absolute",

    top: 0,

    left: "18px",

    right: "18px",

    height: "3px",

    background:
      "linear-gradient(90deg,transparent,#22c55e,transparent)",

    boxShadow:
      "0 0 18px rgba(34,197,94,.45)"
  },

  compareLabel: {
    display: "inline-block",

    color: "#1f2937",

    fontWeight: "900",

    fontSize: "12px",

    textTransform: "uppercase",

    letterSpacing: "1px"
  },

  compareNumber: {
    margin: "14px 0 6px",

    color: "#22c55e",

    fontSize: "40px",

    fontWeight: "900",

    letterSpacing: "-1px",

    textShadow:
      "0 0 18px rgba(34,197,94,.22)"
  },

  compareText: {
    margin: "0 0 16px",

    color: "#4b5563",

    fontSize: "13px",

    fontWeight: "600"
  },

  compareBadge: {
    display: "inline-flex",

    alignItems: "center",

    gap: "8px",

    background:
      "rgba(255,255,255,.08)",

    padding: "9px 15px",

    borderRadius: "999px",

    fontWeight: "900",

    fontSize: "12px",

    backdropFilter: "blur(10px)"
  }
};

export default CompareCard;