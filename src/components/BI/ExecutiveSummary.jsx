function ExecutiveSummary({ resumo = [] }) {
  return (
    <div style={styles.container}>
      {resumo.map((item, index) => (
        <div
          key={index}
          style={styles.item}
        >
          🧠 {item}
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    display: "grid",
    gap: "12px"
  },

  item: {
    background:
      "rgba(255,255,255,0.07)",
    border:
      "1px solid rgba(124,255,74,0.12)",
    borderRadius: "18px",
    padding: "15px",
    color: "rgba(255,255,255,0.78)",
    lineHeight: "1.5"
  }
};

export default ExecutiveSummary;