function IndicatorCard({ icon, title, value, detail }) {
  return (
    <div style={styles.indicatorCard}>
      <div style={styles.topLine}></div>

      <div style={styles.indicatorIcon}>
        {icon}
      </div>

      <div style={styles.content}>
        <p style={styles.indicatorLabel}>
          {title}
        </p>

        <h2 style={styles.indicatorValue}>
          {value}
        </h2>

        <span style={styles.indicatorDetail}>
          {detail}
        </span>
      </div>
    </div>
  );
}

const styles = {
  indicatorCard: {
    position: "relative",
    overflow: "hidden",

    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "18px",

    background:
      "radial-gradient(circle at top right,rgba(168,85,247,.18),transparent 35%),linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.05))",

    border: "1px solid rgba(216,180,254,.22)",

    borderRadius: "28px",

    padding: "22px",

    backdropFilter: "blur(18px)",

    boxShadow:
      "0 24px 55px rgba(88,28,135,.18)"
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
      "0 0 20px rgba(34,197,94,.45)"
  },

  indicatorIcon: {
    width: "64px",

    height: "64px",

    borderRadius: "20px",

    display: "flex",
    flexWrap: "wrap",

    alignItems: "center",

    justifyContent: "center",

    fontSize: "28px",

    color: "#052e16",

    background:
      "linear-gradient(135deg,#7cff4a,#22c55e)",

    boxShadow:
      "0 0 22px rgba(124,255,74,.30)"
  },

  content: {
    flex: 1
  },

  indicatorLabel: {
    margin: 0,

    color: "#1f2937",

    fontSize: "12px",

    fontWeight: "900",

    textTransform: "uppercase",

    letterSpacing: "1px"
  },

  indicatorValue: {
    margin: "8px 0",

    color: "#7cff4a",

    fontSize: "40px",

    fontWeight: "900",

    textShadow:
      "0 0 18px rgba(124,255,74,.22)"
  },

  indicatorDetail: {
    display: "inline-block",

    marginTop: "2px",

    padding: "6px 12px",

    borderRadius: "999px",

    background:
      "rgba(124,255,74,.10)",

    border:
      "1px solid rgba(124,255,74,.22)",

    color: "#4b5563",

    fontSize: "12px",

    fontWeight: "700"
  }
};

export default IndicatorCard;