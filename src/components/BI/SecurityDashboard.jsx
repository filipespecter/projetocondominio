import useResponsive from "../../hooks/useResponsive";

function SecurityDashboard({ indicadores = {}, saude = {}, insights = [] }) {
  const { isMobile, isTablet } = useResponsive();
  const bottomGridStyle =
    isMobile || isTablet
      ? { ...styles.bottomGrid, gridTemplateColumns: "1fr" }
      : styles.bottomGrid;

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
        <span style={styles.badge}>🛡 Segurança operacional</span>

        <h2 style={styles.title}>Controle de risco do condomínio</h2>

        <p style={styles.subtitle}>
          Acompanhe visitantes ativos, ocorrências abertas e sinais de atenção.
        </p>
      </div>

      <div style={styles.grid}>
        <SecurityCard
          title="Visitantes ativos"
          value={indicadores.totalVisitantesAtivos || 0}
          detail="Pessoas constando como ativas"
          status={indicadores.totalVisitantesAtivos > 0 ? "atenção" : "normal"}
        />

        <SecurityCard
          title="Ocorrências abertas"
          value={indicadores.totalOcorrenciasAbertas || 0}
          detail="Registros aguardando resolução"
          status={indicadores.totalOcorrenciasAbertas > 0 ? "crítico" : "normal"}
        />

        <SecurityCard
          title="Encomendas pendentes"
          value={indicadores.totalPendentes || 0}
          detail="Pacotes aguardando retirada"
          status={indicadores.totalPendentes > 0 ? "atenção" : "normal"}
        />

        <SecurityCard
          title="Alertas críticos"
          value={alertasCriticos.length}
          detail="Insights que exigem acompanhamento"
          status={alertasCriticos.length > 0 ? "crítico" : "normal"}
        />
      </div>

      <div style={bottomGridStyle}>
        <div style={styles.healthPanel}>
          <span style={styles.smallBadge}>Saúde operacional</span>

          <div
            style={{
              ...styles.healthCircle,
              borderColor: saude.cor || "#7cff4a",
              color: saude.cor || "#7cff4a"
            }}
          >
            <strong>{saude.pontuacao || 100}%</strong>
            <span>{saude.status || "Excelente"}</span>
          </div>

          <p style={styles.healthText}>
            {saude.descricao || "Operação estável e sem sinais críticos."}
          </p>
        </div>

        <div style={styles.alertPanel}>
          <span style={styles.smallBadgeGold}>Alertas inteligentes</span>

          <div style={styles.alertList}>
            {insights.length === 0 ? (
              <div style={styles.empty}>Nenhum alerta encontrado.</div>
            ) : (
              insights.slice(0, 5).map((item, index) => (
                <div key={index} style={styles.alertItem}>
                  <span style={styles.alertType}>{item.tipo || "info"}</span>

                  <strong style={styles.alertTitle}>{item.titulo}</strong>

                  <p style={styles.alertText}>{item.texto}</p>
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
      <div style={styles.topLine}></div>

      <span style={styles.cardLabel}>{title}</span>

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

      <p style={styles.cardDetail}>{detail}</p>
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
      "radial-gradient(circle at top right,rgba(168,85,247,0.18),transparent 35%), linear-gradient(135deg,#2e1065,#4c1d95,#7c3aed)",
    border: "1px solid rgba(216,180,254,0.22)",
    borderRadius: "30px",
    padding: "28px",
    boxShadow: "0 24px 60px rgba(88,28,135,0.22)"
  },

  badge: {
    display: "inline-block",
    background: "rgba(124,255,74,0.12)",
    color: "#7cff4a",
    border: "1px solid rgba(124,255,74,0.28)",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  title: {
    margin: "14px 0 0",
    color: "white",
    fontSize: "30px"
  },

  subtitle: {
    margin: "8px 0 0",
    color: "rgba(255,255,255,0.72)"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(230px,100%),1fr))",
    gap: "16px"
  },

  card: {
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.18),transparent 35%), linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.05))",
    border: "1px solid rgba(216,180,254,0.22)",
    borderRadius: "26px",
    padding: "22px",
    boxShadow: "0 22px 55px rgba(88,28,135,0.20)",
    backdropFilter: "blur(16px)"
  },

  topLine: {
    position: "absolute",
    top: 0,
    left: "18px",
    right: "18px",
    height: "3px",
    background: "linear-gradient(90deg,transparent,#7cff4a,transparent)",
    boxShadow: "0 0 20px rgba(124,255,74,0.55)"
  },

  cardCritical: {
    border: "1px solid rgba(239,68,68,0.32)",
    boxShadow: "0 0 30px rgba(239,68,68,0.12)"
  },

  cardWarning: {
    border: "1px solid rgba(250,204,21,0.32)",
    boxShadow: "0 0 30px rgba(250,204,21,0.10)"
  },

  cardLabel: {
    color: "#1f2937",
    fontSize: "12px",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: "1px"
  },

  cardValue: {
    margin: "10px 0 4px",
    fontSize: "40px",
    fontWeight: "900",
    textShadow: "0 0 20px rgba(124,255,74,0.24)"
  },

  cardDetail: {
    margin: 0,
    color: "#4b5563",
    fontSize: "13px",
    fontWeight: "600"
  },

  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(280px,0.75fr) minmax(360px,1.25fr)",
    gap: "20px"
  },

  healthPanel: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.16),transparent 35%), linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.05))",
    border: "1px solid rgba(216,180,254,0.22)",
    borderRadius: "30px",
    padding: "26px",
    boxShadow: "0 22px 55px rgba(88,28,135,0.20)",
    backdropFilter: "blur(16px)"
  },

  smallBadge: {
    display: "inline-block",
    background: "rgba(124,255,74,0.12)",
    color: "#7cff4a",
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
    color: "#4b5563",
    lineHeight: "1.6",
    fontWeight: "600"
  },

  alertPanel: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.14),transparent 35%), linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.05))",
    border: "1px solid rgba(216,180,254,0.22)",
    borderRadius: "30px",
    padding: "26px",
    boxShadow: "0 22px 55px rgba(88,28,135,0.20)",
    backdropFilter: "blur(16px)"
  },

  alertList: {
    marginTop: "16px",
    display: "grid",
    gap: "12px"
  },

  alertItem: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(216,180,254,0.14)",
    borderRadius: "16px",
    padding: "14px",
    color: "#1f2937"
  },

  alertType: {
    display: "inline-block",
    background: "rgba(124,255,74,0.12)",
    color: "#7cff4a",
    border: "1px solid rgba(124,255,74,0.24)",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900",
    marginBottom: "8px"
  },

  alertTitle: {
    display: "block",
    color: "#1f2937",
    fontWeight: "900"
  },

  alertText: {
    color: "#4b5563",
    margin: "6px 0 0",
    lineHeight: "1.5",
    fontSize: "13px",
    fontWeight: "600"
  },

  empty: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(216,180,254,0.14)",
    borderRadius: "16px",
    padding: "16px",
    color: "#4b5563",
    fontWeight: "600"
  }
};

export default SecurityDashboard;
