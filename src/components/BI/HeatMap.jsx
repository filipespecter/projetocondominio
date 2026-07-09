import { FaFire } from "react-icons/fa";

function HeatMap({ dados = [] }) {
  const maximo = Math.max(
    ...dados.map((item) => item.total),
    1
  );

  return (
    <div style={styles.container}>
      <div style={styles.topLine}></div>

      <div style={styles.header}>
        <span style={styles.badge}>
          <FaFire /> Heat Map
        </span>

        <h3 style={styles.title}>
          Intensidade operacional
        </h3>
      </div>

      <div style={styles.list}>
        {dados.map((item, index) => {
          const largura = (item.total / maximo) * 100;

          return (
            <div key={index} style={styles.row}>
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
    position: "relative",
    overflow: "hidden",

    background:
      "radial-gradient(circle at top right,rgba(168,85,247,.16),transparent 34%), linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.05))",

    border: "1px solid rgba(216,180,254,.22)",

    borderRadius: "26px",

    padding: "22px",

    boxShadow:
      "0 22px 55px rgba(88,28,135,.18)",

    backdropFilter: "blur(16px)"
  },

  topLine: {
    position: "absolute",
    top: 0,
    left: "20px",
    right: "20px",
    height: "3px",
    background: "linear-gradient(90deg,transparent,#22c55e,transparent)",
    boxShadow: "0 0 18px rgba(34,197,94,.45)"
  },

  header: {
    marginBottom: "20px"
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(34,197,94,.10)",
    color: "#16a34a",
    border: "1px solid rgba(34,197,94,.24)",
    padding: "8px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  title: {
    color: "#1f2937",
    marginTop: "12px",
    fontSize: "24px",
    fontWeight: "900"
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },

  row: {
    display: "grid",
    gridTemplateColumns: "120px 1fr 50px",
    alignItems: "center",
    gap: "10px"
  },

  label: {
    color: "#1f2937",
    fontWeight: "800"
  },

  barArea: {
    background: "rgba(255,255,255,.07)",
    border: "1px solid rgba(216,180,254,.14)",
    borderRadius: "999px",
    height: "18px",
    overflow: "hidden"
  },

  bar: {
    height: "100%",
    borderRadius: "999px",
    background: "linear-gradient(90deg,#22c55e,#86efac,#facc15)",
    boxShadow: "0 0 16px rgba(34,197,94,.32)"
  },

  value: {
    color: "#1f2937",
    fontWeight: "900"
  }
};

export default HeatMap;