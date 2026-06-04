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
    gap: "14px",
    alignItems: "flex-start",
    marginBottom: "20px"
  },

  panelBadge: {
    background: "rgba(124,255,74,0.12)",
    color: "#b9ff8a",
    border: "1px solid rgba(124,255,74,0.28)",
    padding: "7px 11px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "11px"
  },

  panelBadgeGold: {
    background: "rgba(250,204,21,0.14)",
    color: "#facc15",
    border: "1px solid rgba(250,204,21,0.28)",
    padding: "7px 11px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "11px"
  },

  panelTitle: {
    margin: "12px 0 0",
    color: "white",
    fontSize: "26px"
  }
};

export default PanelHeader;