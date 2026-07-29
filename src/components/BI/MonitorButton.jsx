import { FaDesktop, FaArrowRight } from "react-icons/fa";

function MonitorButton() {
  function abrirMonitor() {
    window.open("/bi-monitor", "_blank");
  }

  return (
    <button
      onClick={abrirMonitor}
      style={styles.button}
    >
      <div style={styles.topLine}></div>

      <div style={styles.icon}>
        <FaDesktop />
      </div>

      <div style={styles.content}>
        <span style={styles.title}>
          Central de Monitoramento
        </span>

        <span style={styles.subtitle}>
          Abrir painel executivo em tempo real
        </span>
      </div>

      <div style={styles.arrow}>
        <FaArrowRight />
      </div>
    </button>
  );
}

const styles = {
  button: {
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "20px",
    width: "100%",
    padding: "20px 24px",
    cursor: "pointer",
    borderRadius: "24px",
    border: "1px solid rgba(216,180,254,.22)",
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,.18),transparent 35%),linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.05))",
    backdropFilter: "blur(18px)",
    boxShadow: "0 22px 55px rgba(88,28,135,.18)",
    transition: ".30s"
  },

  topLine: {
    position: "absolute",
    top: 0,
    left: "20px",
    right: "20px",
    height: "3px",
    background: "linear-gradient(90deg,transparent,#22c55e,transparent)",
    boxShadow: "0 0 20px rgba(34,197,94,.45)"
  },

  icon: {
    width: "64px",
    height: "64px",
    borderRadius: "20px",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    color: "#052e16",
    background: "linear-gradient(135deg,#7cff4a,#22c55e)",
    boxShadow: "0 0 22px rgba(124,255,74,.28)",
    flexShrink: 0
  },

  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column"
  },

  title: {
    color: "#1f2937",
    fontWeight: "900",
    fontSize: "18px"
  },

  subtitle: {
    marginTop: "6px",
    color: "#4b5563",
    fontSize: "13px",
    fontWeight: "600"
  },

  arrow: {
    width: "46px",
    height: "46px",
    borderRadius: "50%",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(124,255,74,.12)",
    border: "1px solid rgba(124,255,74,.25)",
    color: "#7cff4a",
    fontSize: "18px",
    flexShrink: 0
  }
};

export default MonitorButton;
