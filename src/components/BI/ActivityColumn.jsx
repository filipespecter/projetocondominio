function ActivityColumn({ title, icon, items = [], empty }) {
  return (
    <div style={styles.activityColumn}>
      <h3 style={styles.activityTitle}>
        {icon} {title}
      </h3>

      {items.length === 0 ? (
        <div style={styles.emptyActivity}>
          {empty || "Nenhum registro recente"}
        </div>
      ) : (
        items.map((item, index) => (
          <div key={index} style={styles.activityItem}>
            <strong>
              {item.nome ||
                item.morador ||
                item.titulo ||
                item.area ||
                item.descricao ||
                "Registro"}
            </strong>

            <span>
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
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(124,255,74,0.12)",
    borderRadius: "22px",
    padding: "18px"
  },

  activityTitle: {
    marginTop: 0,
    color: "white"
  },

  activityItem: {
    background: "rgba(255,255,255,0.08)",
    borderRadius: "15px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    marginBottom: "10px",
    border: "1px solid rgba(255,255,255,0.07)"
  },

  emptyActivity: {
    color: "rgba(255,255,255,0.55)",
    background: "rgba(255,255,255,0.06)",
    borderRadius: "15px",
    padding: "14px"
  }
};

export default ActivityColumn;