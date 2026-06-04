function IndicatorCard({ icon, title, value, detail }) {
  return (
    <div style={styles.indicatorCard}>
      <div style={styles.indicatorIcon}>
        {icon}
      </div>

      <div>
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
    background:
      "linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.035))",
    border: "1px solid rgba(124,255,74,0.14)",
    borderRadius: "28px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    boxShadow: "0 14px 35px rgba(0,0,0,0.18)",
    backdropFilter: "blur(14px)"
  },

  indicatorIcon: {
    width: "58px",
    height: "58px",
    borderRadius: "20px",
    background: "linear-gradient(135deg,#07130d,#7cff4a)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    color: "white",
    boxShadow: "0 0 30px rgba(124,255,74,0.18)"
  },

  indicatorLabel: {
    margin: 0,
    color: "rgba(255,255,255,0.58)",
    fontSize: "13px",
    fontWeight: "900"
  },

  indicatorValue: {
    margin: "4px 0",
    color: "#7cff4a",
    fontSize: "34px",
    textShadow: "0 0 20px rgba(124,255,74,0.20)"
  },

  indicatorDetail: {
    color: "#b9ff8a",
    fontSize: "12px"
  }
};

export default IndicatorCard;