function Header() {
  return (
    <header style={styles.header}>
      <div>
        <span style={styles.badge}>
          👑 Painel Executivo
        </span>

        <h1 style={styles.title}>
          Dashboard Executivo
        </h1>
      </div>
    </header>
  );
}

const styles = {
  header: {
    margin: "28px 34px 26px",
    background:
      "linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,253,244,0.92))",
    border: "1px solid rgba(187,247,208,0.8)",
    borderRadius: "30px",
    padding: "24px 26px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
    backdropFilter: "blur(16px)"
  },

  badge: {
    display: "inline-block",
    background: "#dcfce7",
    color: "#166534",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    marginBottom: "10px"
  },

  title: {
    margin: 0,
    color: "#052e16",
    fontSize: "30px",
    letterSpacing: "-0.5px"
  }
};

export default Header;