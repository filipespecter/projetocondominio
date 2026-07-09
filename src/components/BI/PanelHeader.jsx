function PanelHeader({ badge, title, gold }) {
  return (
    <div style={styles.panelHeader}>
      <div>
        <span
          style={
            gold
              ? styles.panelBadgeGold
              : styles.panelBadge
          }
        >
          {badge}
        </span>

        <h2 style={styles.panelTitle}>
          {title}
        </h2>
      </div>
    </div>
  );
}

const styles = {
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "14px",
    marginBottom: "22px",
    position: "relative"
  },

  panelBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",

    background:
      "linear-gradient(135deg,rgba(124,255,74,.16),rgba(124,255,74,.08))",

    color: "#7cff4a",

    border: "1px solid rgba(124,255,74,.28)",

    padding: "8px 14px",

    borderRadius: "999px",

    fontWeight: "900",

    fontSize: "11px",

    letterSpacing: ".7px",

    textTransform: "uppercase",

    boxShadow:
      "0 0 18px rgba(124,255,74,.18)"
  },

  panelBadgeGold: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",

    background:
      "linear-gradient(135deg,rgba(250,204,21,.18),rgba(250,204,21,.08))",

    color: "#facc15",

    border: "1px solid rgba(250,204,21,.30)",

    padding: "8px 14px",

    borderRadius: "999px",

    fontWeight: "900",

    fontSize: "11px",

    letterSpacing: ".7px",

    textTransform: "uppercase",

    boxShadow:
      "0 0 18px rgba(250,204,21,.18)"
  },

  panelTitle: {
    margin: "14px 0 0",

    color: "#1f2937",

    fontSize: "30px",

    fontWeight: "900",

    letterSpacing: "-.8px"
  }
};

export default PanelHeader;