function SecurityDashboard({ indicadores = {}, saude = {}, insights = [] }) {
  const alertasCriticos = insights.filter((item) => {
    const tipo = String(item.tipo || "").toLowerCase();

    return (
      tipo.includes("crítico") ||
      tipo.includes("critico") ||
      tipo.includes("atenção") ||
      tipo.includes("atencao")
    );
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.badge}>
          🛡 Segurança operacional
        </span>

        <h2 style={styles.title}>
          Controle de risco do condomínio
        </h2>

        <p style={styles.subtitle}>
          Acompanhe visitantes ativos, ocorrências abertas e sinais de atenção.
        </p>
      </div>

      <div style={styles.grid}>
        <SecurityCard
          title="Visitantes ativos"
          value={indicadores.totalVisitantesAtivos || 0}
          detail="Pessoas constando como ativas"
          status={
            indicadores.totalVisitantesAtivos > 0
              ? "atenção"
              : "normal"
          }
        />

        <SecurityCard
          title="Ocorrências abertas"
          value={indicadores.totalOcorrenciasAbertas || 0}
          detail="Registros aguardando resolução"
          status={
            indicadores.totalOcorrenciasAbertas > 0
              ? "crítico"
              : "normal"
          }
        />

        <SecurityCard
          title="Encomendas pendentes"
          value={indicadores.totalPendentes || 0}
          detail="Pacotes aguardando retirada"
          status={
            indicadores.totalPendentes > 0
              ? "atenção"
              : "normal"
          }
        />

        <SecurityCard
          title="Alertas críticos"
          value={alertasCriticos.length}
          detail="Insights que exigem acompanhamento"
          status={
            alertasCriticos.length > 0
              ? "crítico"
              : "normal"
          }
        />
      </div>

      <div style={styles.bottomGrid}>
        <div style={styles.healthPanel}>
          <span style={styles.smallBadge}>
            Saúde operacional
          </span>

          <div
            style={{
              ...styles.healthCircle,
              borderColor: saude.cor || "#7cff4a",
              color: saude.cor || "#7cff4a"
            }}
          >
            <strong>
              {saude.pontuacao || 100}%
            </strong>

            <span>
              {saude.status || "Excelente"}
            </span>
          </div>

          <p style={styles.healthText}>
            {saude.descricao ||
              "Operação estável e sem sinais críticos."}
          </p>
        </div>

        <div style={styles.alertPanel}>
          <span style={styles.smallBadgeGold}>
            Alertas inteligentes
          </span>

          <div style={styles.alertList}>
            {insights.length === 0 ? (
              <div style={styles.empty}>
                Nenhum alerta encontrado.
              </div>
            ) : (
              insights.slice(0, 5).map((item, index) => (
                <div key={index} style={styles.alertItem}>
                  <span style={styles.alertType}>
                    {item.tipo || "info"}
                  </span>

                  <strong>{item.titulo}</strong>

                  <p>{item.texto}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SecurityCard({ title, value, detail, status }) {
  const isCritico = status === "crítico";
  const isAtencao = status === "atenção";

  return (
    <div
      style={{
        ...styles.card,
        ...(isCritico ? styles.cardCritical : {}),
        ...(isAtencao ? styles.cardWarning : {})
      }}
    >
      <span style={styles.cardLabel}>
        {title}
      </span>

      <h3
        style={{
          ...styles.cardValue,
          color: isCritico
            ? "#ef4444"
            : isAtencao
            ? "#facc15"
            : "#7cff4a"
        }}
      >
        {value}
      </h3>

      <p style={styles.cardDetail}>
        {detail}
      </p>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "22px"
  },

  header: {
    background:
      "radial-gradient(circle at top right,rgba(124,255,74,0.12),transparent 35%), rgba(7,19,13,0.95)",
    border: "1px solid rgba(124,255,74,0.14)",
    borderRadius: "28px",
    padding: "26px"
  },

  badge: {
    display: "inline-block",
    background: "rgba(124,255,74,0.12)",
    color: "#b9ff8a",
    border: "1px solid rgba(124,255,74,0.28)",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  title: {
    margin: "14px 0 0",
    color: "white",
    fontSize: "28px"
  },

  subtitle: {
    margin: "8px 0 0",
    color: "rgba(255,255,255,0.62)"
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(230px,1fr))",
    gap: "16px"
  },

  card: {
    background:
      "linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.035))",
    border: "1px solid rgba(124,255,74,0.14)",
    borderRadius: "24px",
    padding: "20px",
    boxShadow: "0 18px 45px rgba(0,0,0,0.18)"
  },

  cardCritical: {
    border: "1px solid rgba(239,68,68,0.32)",
    boxShadow: "0 0 30px rgba(239,68,68,0.10)"
  },

  cardWarning: {
    border: "1px solid rgba(250,204,21,0.32)",
    boxShadow: "0 0 30px rgba(250,204,21,0.08)"
  },

  cardLabel: {
    color: "rgba(255,255,255,0.58)",
    fontSize: "13px",
    fontWeight: "900"
  },

  cardValue: {
    margin: "10px 0 4px",
    fontSize: "38px",
    textShadow: "0 0 20px rgba(124,255,74,0.16)"
  },

  cardDetail: {
    margin: 0,
    color: "rgba(255,255,255,0.58)",
    fontSize: "13px"
  },

  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(280px,0.75fr) minmax(360px,1.25fr)",
    gap: "20px"
  },

  healthPanel: {
    background:
      "radial-gradient(circle at top right,rgba(124,255,74,0.12),transparent 35%), rgba(7,19,13,0.95)",
    border: "1px solid rgba(124,255,74,0.14)",
    borderRadius: "28px",
    padding: "26px"
  },

  smallBadge: {
    display: "inline-block",
    background: "rgba(124,255,74,0.12)",
    color: "#b9ff8a",
    border: "1px solid rgba(124,255,74,0.24)",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900"
  },

  smallBadgeGold: {
    display: "inline-block",
    background: "rgba(250,204,21,0.14)",
    color: "#facc15",
    border: "1px solid rgba(250,204,21,0.24)",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900"
  },

  healthCircle: {
    width: "190px",
    height: "190px",
    borderRadius: "50%",
    border: "10px solid #7cff4a",
    margin: "28px auto 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    fontSize: "26px",
    fontWeight: "900",
    boxShadow: "0 0 55px rgba(124,255,74,0.22)"
  },

  healthText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.68)",
    lineHeight: "1.6"
  },

  alertPanel: {
    background:
      "radial-gradient(circle at top right,rgba(250,204,21,0.12),transparent 35%), rgba(7,19,13,0.95)",
    border: "1px solid rgba(250,204,21,0.14)",
    borderRadius: "28px",
    padding: "26px"
  },

  alertList: {
    marginTop: "16px",
    display: "grid",
    gap: "12px"
  },

  alertItem: {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "14px"
  },

  alertType: {
    display: "inline-block",
    background: "#b9ff8a",
    color: "#07130d",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900",
    marginBottom: "8px"
  },

  empty: {
    background: "rgba(255,255,255,0.06)",
    borderRadius: "16px",
    padding: "16px",
    color: "rgba(255,255,255,0.55)"
  }
};

export default SecurityDashboard;