import { FaRegListAlt } from "react-icons/fa";

function ActivityColumn({
  title,
  icon,
  items = [],
  empty
}) {
  return (
    <div style={styles.activityColumn}>
      <div style={styles.topLine}></div>

      <div style={styles.header}>
        <div style={styles.iconBox}>
          {icon || <FaRegListAlt />}
        </div>

        <h3 style={styles.activityTitle}>
          {title}
        </h3>
      </div>

      {items.length === 0 ? (
        <div style={styles.emptyActivity}>
          {empty || "Nenhum registro recente"}
        </div>
      ) : (
        items.map((item, index) => (
          <div
            key={index}
            style={styles.activityItem}
          >
            <strong style={styles.itemTitle}>
              {item.nome ||
                item.morador ||
                item.titulo ||
                item.area ||
                item.descricao ||
                "Registro"}
            </strong>

            <span style={styles.itemSubtitle}>
              {item.status ||
                item.data ||
                item.criadoEm ||
                item.apartamento ||
                "Sem detalhe"}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  activityColumn: {
    position: "relative",
    overflow: "hidden",

    background:
      "radial-gradient(circle at top right,rgba(168,85,247,.18),transparent 34%),linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.05))",

    border: "1px solid rgba(216,180,254,.22)",

    borderRadius: "24px",

    padding: "18px",

    boxShadow:
      "0 18px 45px rgba(88,28,135,.18)",

    backdropFilter: "blur(16px)"
  },

  topLine: {
    position: "absolute",

    top: 0,

    left: "18px",

    right: "18px",

    height: "3px",

    background:
      "linear-gradient(90deg,transparent,#22c55e,transparent)",

    boxShadow:
      "0 0 22px rgba(34,197,94,.45)"
  },

  header: {
    display: "flex",
    flexWrap: "wrap",

    alignItems: "center",

    gap: "14px",

    marginBottom: "18px"
  },

  iconBox: {
    width: "42px",

    height: "42px",

    borderRadius: "12px",

    display: "flex",
    flexWrap: "wrap",

    alignItems: "center",

    justifyContent: "center",

    background:
      "linear-gradient(135deg,#22c55e,#16a34a)",

    color: "#ffffff",

    fontSize: "18px",

    boxShadow:
      "0 0 18px rgba(34,197,94,.28)",

    flexShrink: 0
  },

  activityTitle: {
    margin: 0,

    color: "#1f2937",

    fontSize: "18px",

    fontWeight: "900",

    letterSpacing: ".2px"
  },

  activityItem: {
    background:
      "rgba(255,255,255,.10)",

    borderRadius: "16px",

    padding: "14px",

    display: "flex",

    flexDirection: "column",

    gap: "6px",

    marginBottom: "12px",

    border:
      "1px solid rgba(216,180,254,.18)"
  },

  itemTitle: {
    color: "#1f2937",

    fontSize: "14px",

    fontWeight: "800",

    lineHeight: "1.4"
  },

  itemSubtitle: {
    color: "#4b5563",

    fontSize: "12px",

    fontWeight: "500",

    lineHeight: "1.4"
  },

  emptyActivity: {
    color: "#4b5563",

    background:
      "rgba(255,255,255,.08)",

    border:
      "1px solid rgba(34,197,94,.20)",

    borderRadius: "16px",

    padding: "18px",

    textAlign: "center",

    fontWeight: "600",

    lineHeight: "1.5"
  }
};

export default ActivityColumn;