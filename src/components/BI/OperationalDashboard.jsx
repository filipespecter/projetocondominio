import ActivityColumn from "./ActivityColumn";

function OperationalDashboard({
  ranking = [],
  atividades = {},
  indicadores = {}
}) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.badge}>
          ⚙ Operação do condomínio
        </span>

        <h2 style={styles.title}>
          Painel operacional
        </h2>

        <p style={styles.subtitle}>
          Acompanhe módulos mais movimentados, encomendas, reservas, visitantes e ocorrências.
        </p>
      </div>

      <div style={styles.kpiGrid}>
        <MiniCard
          title="Encomendas"
          value={indicadores.totalEncomendas || 0}
          detail={`${indicadores.totalPendentes || 0} pendentes`}
        />

        <MiniCard
          title="Reservas"
          value={indicadores.totalReservas || 0}
          detail={`${indicadores.totalReservasAtivas || 0} ativas`}
        />

        <MiniCard
          title="Visitantes"
          value={indicadores.totalVisitantes || 0}
          detail={`${indicadores.totalVisitantesAtivos || 0} ativos`}
        />

        <MiniCard
          title="Ocorrências"
          value={indicadores.totalOcorrencias || 0}
          detail={`${indicadores.totalOcorrenciasAbertas || 0} abertas`}
        />
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.rankingPanel}>
          <span style={styles.smallBadge}>
            Ranking operacional
          </span>

          <h3 style={styles.panelTitle}>
            Módulos com mais registros
          </h3>

          <div style={styles.rankingList}>
            {ranking.length === 0 ? (
              <div style={styles.empty}>
                Nenhum registro para ranquear.
              </div>
            ) : (
              ranking.map((item, index) => (
                <div key={item.nome} style={styles.rankingItem}>
                  <div>
                    <span style={styles.position}>
                      #{index + 1}
                    </span>

                    <strong>{item.nome}</strong>
                  </div>

                  <span style={styles.rankingValue}>
                    {item.total}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={styles.activityPanel}>
          <span style={styles.smallBadgeGold}>
            Tempo real
          </span>

          <h3 style={styles.panelTitle}>
            Últimas movimentações
          </h3>

          <div style={styles.activityGrid}>
            <ActivityColumn
              title="Visitantes"
              icon="🚶"
              items={atividades.visitantes || []}
              empty="Nenhum visitante recente"
            />

            <ActivityColumn
              title="Encomendas"
              icon="📦"
              items={atividades.encomendas || []}
              empty="Nenhuma encomenda recente"
            />

            <ActivityColumn
              title="Reservas"
              icon="📅"
              items={atividades.reservas || []}
              empty="Nenhuma reserva recente"
            />

            <ActivityColumn
              title="Ocorrências"
              icon="🚨"
              items={atividades.ocorrencias || []}
              empty="Nenhuma ocorrência recente"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniCard({ title, value, detail }) {
  return (
    <div style={styles.miniCard}>
      <span style={styles.miniLabel}>
        {title}
      </span>

      <h3 style={styles.miniValue}>
        {value}
      </h3>

      <p style={styles.miniDetail}>
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

  kpiGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "16px"
  },

  miniCard: {
    background:
      "linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.035))",
    border: "1px solid rgba(124,255,74,0.14)",
    borderRadius: "24px",
    padding: "20px",
    boxShadow: "0 18px 45px rgba(0,0,0,0.18)"
  },

  miniLabel: {
    color: "rgba(255,255,255,0.58)",
    fontSize: "13px",
    fontWeight: "900"
  },

  miniValue: {
    margin: "10px 0 4px",
    fontSize: "38px",
    color: "#7cff4a",
    textShadow: "0 0 20px rgba(124,255,74,0.18)"
  },

  miniDetail: {
    margin: 0,
    color: "#b9ff8a",
    fontSize: "13px"
  },

  mainGrid: {
    display: "grid",
    gridTemplateColumns:
      "minmax(300px,0.75fr) minmax(420px,1.25fr)",
    gap: "22px"
  },

  rankingPanel: {
    background:
      "radial-gradient(circle at top right,rgba(124,255,74,0.13),transparent 35%), rgba(7,19,13,0.96)",
    border: "1px solid rgba(124,255,74,0.14)",
    borderRadius: "28px",
    padding: "26px",
    color: "white"
  },

  activityPanel: {
    background: "rgba(7,19,13,0.94)",
    border: "1px solid rgba(124,255,74,0.14)",
    borderRadius: "28px",
    padding: "26px",
    color: "white"
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

  panelTitle: {
    margin: "14px 0 18px",
    color: "white",
    fontSize: "24px"
  },

  rankingList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },

  rankingItem: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(124,255,74,0.12)",
    borderRadius: "16px",
    padding: "14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  position: {
    display: "inline-flex",
    marginRight: "10px",
    color: "#7cff4a",
    fontWeight: "900"
  },

  rankingValue: {
    background: "rgba(124,255,74,0.12)",
    color: "#b9ff8a",
    padding: "7px 11px",
    borderRadius: "999px",
    fontWeight: "900"
  },

  activityGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(200px,1fr))",
    gap: "16px"
  },

  empty: {
    background: "rgba(255,255,255,0.06)",
    borderRadius: "16px",
    padding: "16px",
    color: "rgba(255,255,255,0.55)"
  }
};

export default OperationalDashboard;