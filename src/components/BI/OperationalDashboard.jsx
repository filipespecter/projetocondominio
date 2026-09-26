import ActivityColumn from "./ActivityColumn";

import {
  FaCogs,
  FaBoxOpen,
  FaCalendarCheck,
  FaUsers,
  FaExclamationTriangle,
  FaTrophy,
  FaBolt
} from "react-icons/fa";

function OperationalDashboard({
  ranking = [],
  atividades = {},
  indicadores = {}
}) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.badge}>
          <FaCogs /> Operação do condomínio
        </span>

        <h2 style={styles.title}>
          Painel operacional
        </h2>

        <p style={styles.subtitle}>
          Acompanhe módulos mais movimentados, encomendas, reservas, visitantes e ocorrências.
        </p>
      </div>

      <div style={styles.kpiGrid}>
        <MiniCard title="Encomendas" value={indicadores.totalEncomendas || 0} detail={`${indicadores.totalPendentes || 0} pendentes`} />
        <MiniCard title="Reservas" value={indicadores.totalReservas || 0} detail={`${indicadores.totalReservasAtivas || 0} ativas`} />
        <MiniCard title="Visitantes" value={indicadores.totalVisitantes || 0} detail={`${indicadores.totalVisitantesAtivos || 0} ativos`} />
        <MiniCard title="Ocorrências" value={indicadores.totalOcorrencias || 0} detail={`${indicadores.totalOcorrenciasAbertas || 0} abertas`} />
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.rankingPanel}>
          <span style={styles.smallBadge}>
            <FaTrophy /> Ranking operacional
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
                    <span style={styles.position}>#{index + 1}</span>
                    <strong style={styles.rankingName}>{item.nome}</strong>
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
            <FaBolt /> Tempo real
          </span>

          <h3 style={styles.panelTitle}>
            Últimas movimentações
          </h3>

          <div style={styles.activityGrid}>
            <ActivityColumn title="Visitantes" icon={<FaUsers />} items={atividades.visitantes || []} empty="Nenhum visitante recente" />
            <ActivityColumn title="Encomendas" icon={<FaBoxOpen />} items={atividades.encomendas || []} empty="Nenhuma encomenda recente" />
            <ActivityColumn title="Reservas" icon={<FaCalendarCheck />} items={atividades.reservas || []} empty="Nenhuma reserva recente" />
            <ActivityColumn title="Ocorrências" icon={<FaExclamationTriangle />} items={atividades.ocorrencias || []} empty="Nenhuma ocorrência recente" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniCard({ title, value, detail }) {
  return (
    <div style={styles.miniCard}>
      <div style={styles.topLine}></div>

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
      "radial-gradient(circle at top right,rgba(168,85,247,0.18),transparent 35%), linear-gradient(135deg,#2e1065,#4c1d95,#7c3aed)",
    border: "1px solid rgba(216,180,254,0.22)",
    borderRadius: "30px",
    padding: "28px",
    boxShadow: "0 24px 60px rgba(88,28,135,0.22)"
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
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

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "16px"
  },

  miniCard: {
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

  miniLabel: {
    color: "#1f2937",
    fontSize: "12px",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: "1px"
  },

  miniValue: {
    margin: "10px 0 4px",
    fontSize: "40px",
    color: "#7cff4a",
    textShadow: "0 0 20px rgba(124,255,74,0.35)"
  },

  miniDetail: {
    margin: 0,
    color: "#4b5563",
    fontSize: "13px",
    fontWeight: "700"
  },

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(300px,0.75fr) minmax(420px,1.25fr)",
    gap: "22px"
  },

  rankingPanel: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.18),transparent 35%), linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.05))",
    border: "1px solid rgba(216,180,254,0.22)",
    borderRadius: "30px",
    padding: "26px",
    color: "white",
    boxShadow: "0 22px 55px rgba(88,28,135,0.20)",
    backdropFilter: "blur(16px)"
  },

  activityPanel: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.16),transparent 35%), linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.045))",
    border: "1px solid rgba(216,180,254,0.22)",
    borderRadius: "30px",
    padding: "26px",
    color: "white",
    boxShadow: "0 22px 55px rgba(88,28,135,0.20)",
    backdropFilter: "blur(16px)"
  },

  smallBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(124,255,74,0.12)",
    color: "#7cff4a",
    border: "1px solid rgba(124,255,74,0.24)",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900"
  },

  smallBadgeGold: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
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
    color: "#1f2937",
    fontSize: "24px",
    fontWeight: "900"
  },

  rankingList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },

  rankingItem: {
    background: "rgba(255,255,255,0.09)",
    border: "1px solid rgba(216,180,254,0.16)",
    borderRadius: "18px",
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

  rankingName: {
    color: "#1f2937",
    fontWeight: "900"
  },

  rankingValue: {
    background: "rgba(124,255,74,0.12)",
    color: "#7cff4a",
    border: "1px solid rgba(124,255,74,0.24)",
    padding: "7px 11px",
    borderRadius: "999px",
    fontWeight: "900"
  },

  activityGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
    gap: "16px"
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

export default OperationalDashboard;