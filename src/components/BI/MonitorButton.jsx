function MonitorButton() {
  function abrirMonitor() {
    window.open(
      "/bi-monitor",
      "_blank"
    );
  }

  return (
    <button
      onClick={abrirMonitor}
      style={styles.button}
    >
      🖥️ Abrir Central de Monitoramento
    </button>
  );
}

const styles = {
  button: {
    background:
      "linear-gradient(135deg,#7cff4a,#b9ff8a)",
    color: "#07130d",
    border: "none",
    padding: "14px 22px",
    borderRadius: "14px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow:
      "0 0 25px rgba(124,255,74,0.25)",
    transition: "0.3s"
  }
};

export default MonitorButton;