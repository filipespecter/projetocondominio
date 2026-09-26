function Header() {
  return (
    <header style={styles.header}>
      <div style={styles.orbOne}></div>
      <div style={styles.orbTwo}></div>

      <div style={styles.content}>
        <span style={styles.badge}>
          👑 Painel Executivo
        </span>

        <h1 style={styles.title}>
          Dashboard Executivo
        </h1>

        <p style={styles.subtitle}>
          Gestão inteligente com identidade Star Infinity Code.
        </p>
      </div>

      <div style={styles.statusBox}>
        <span style={styles.statusDot}></span>
        Sistema online
      </div>
    </header>
  );
}

const styles = {
  header: {
    margin: "28px 34px 26px",
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.16),transparent 32%), linear-gradient(135deg,rgba(255,255,255,0.96),rgba(251,250,255,0.92))",
    border: "1px solid #ede9fe",
    borderRadius: "30px",
    padding: "24px 26px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 18px 45px rgba(88,28,135,0.10)",
    backdropFilter: "blur(16px)",
    position: "relative",
    overflow: "hidden"
  },

  orbOne: {
    position: "absolute",
    width: "180px",
    height: "180px",
    borderRadius: "50%",
    background: "rgba(124,58,237,0.10)",
    filter: "blur(50px)",
    top: "-80px",
    right: "90px"
  },

  orbTwo: {
    position: "absolute",
    width: "150px",
    height: "150px",
    borderRadius: "50%",
    background: "rgba(59,130,246,0.08)",
    filter: "blur(50px)",
    bottom: "-80px",
    left: "140px"
  },

  content: {
    position: "relative",
    zIndex: 2
  },

  badge: {
    display: "inline-block",
    background: "#f3e8ff",
    color: "#6d28d9",
    border: "1px solid #ddd6fe",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    marginBottom: "10px"
  },

  title: {
    margin: 0,
    color: "#2e1065",
    fontSize: "30px",
    letterSpacing: "-0.5px"
  },

  subtitle: {
    margin: "7px 0 0",
    color: "#6b7280",
    fontSize: "14px",
    fontWeight: "700"
  },

  statusBox: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    gap: "9px",
    background: "#ffffff",
    border: "1px solid #ede9fe",
    color: "#6d28d9",
    padding: "10px 14px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "900",
    boxShadow: "0 12px 26px rgba(88,28,135,0.08)"
  },

  statusDot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    background: "#a855f7",
    boxShadow: "0 0 0 5px rgba(168,85,247,0.16)"
  }
};

export default Header;
