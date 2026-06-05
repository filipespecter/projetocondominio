function HeatMap({ dados = [] }) {
  const maximo = Math.max(
    ...dados.map((item) => item.total),
    1
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.badge}>
          🔥 Heat Map
        </span>

        <h3 style={styles.title}>
          Intensidade operacional
        </h3>
      </div>

      <div style={styles.list}>
        {dados.map((item, index) => {
          const largura =
            (item.total / maximo) * 100;

          return (
            <div
              key={index}
              style={styles.row}
            >
              <span style={styles.label}>
                {item.nome}
              </span>

              <div style={styles.barArea}>
                <div
                  style={{
                    ...styles.bar,
                    width: `${largura}%`
                  }}
                />
              </div>

              <strong style={styles.value}>
                {item.total}
              </strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    background:
      "rgba(7,19,13,0.95)",
    border:
      "1px solid rgba(124,255,74,0.14)",
    borderRadius: "24px",
    padding: "22px"
  },

  header: {
    marginBottom: "20px"
  },

  badge: {
    background:
      "rgba(124,255,74,0.12)",
    color: "#b9ff8a",
    padding: "7px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  title: {
    color: "white",
    marginTop: "12px"
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },

  row: {
    display: "grid",
    gridTemplateColumns:
      "120px 1fr 50px",
    alignItems: "center",
    gap: "10px"
  },

  label: {
    color: "white",
    fontWeight: "700"
  },

  barArea: {
    background:
      "rgba(255,255,255,0.05)",
    borderRadius: "999px",
    height: "18px",
    overflow: "hidden"
  },

  bar: {
    height: "100%",
    borderRadius: "999px",
    background:
      "linear-gradient(90deg,#7cff4a,#facc15)"
  },

  value: {
    color: "#b9ff8a"
  }
};

export default HeatMap;