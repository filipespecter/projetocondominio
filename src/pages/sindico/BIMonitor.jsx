import { useEffect, useState } from "react";

import {
  gerarIndicadoresBI,
  calcularSaudeCondominio,
  gerarDistribuicaoGeral,
  gerarIndicadoresCriticos,
  gerarInsightsBI,
  gerarDadosComparativoGrafico,
  gerarResumoExecutivoBI,
  gerarRankingModulos,
  buscarAtividadesRecentes,
  gerarComparativosBI,
  gerarRankingsPremiumBI
} from "../../Services/biService";

import DynamicCharts from "../../components/BI/DynamicCharts";
import SecurityDashboard from "../../components/BI/SecurityDashboard";
import OperationalDashboard from "../../components/BI/OperationalDashboard";
import HeatMap from "../../components/BI/HeatMap";
import TrendAnalysis from "../../components/BI/TrendAnalysis";

function BIMonitor() {
  const [hora, setHora] = useState("");
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState("");
  const [visaoAtiva, setVisaoAtiva] = useState("geral");
  const [telaMonitor, setTelaMonitor] = useState("geral");

  const [indicadores, setIndicadores] = useState({});
  const [saude, setSaude] = useState({});
  const [distribuicao, setDistribuicao] = useState([]);
  const [criticos, setCriticos] = useState([]);
  const [comparativo, setComparativo] = useState([]);
  const [comparativos, setComparativos] = useState({});
  const [insights, setInsights] = useState([]);
  const [resumo, setResumo] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [atividades, setAtividades] = useState({});
  const [rankingsPremium, setRankingsPremium] = useState({});

  useEffect(() => {
    carregarDados();

    const refresh = setInterval(() => {
      carregarDados();
    }, 15000);

    const relogio = setInterval(() => {
      setHora(new Date().toLocaleString("pt-BR"));
    }, 1000);

    const sincronizador = setInterval(() => {
      const visaoSalva = localStorage.getItem("bi_monitor_visao");
      const telaSalva = localStorage.getItem("bi_monitor_tela");

      if (visaoSalva && visaoSalva !== visaoAtiva) {
        setVisaoAtiva(visaoSalva);
      }

      if (telaSalva && telaSalva !== telaMonitor) {
        setTelaMonitor(telaSalva);
      }
    }, 1000);

    return () => {
      clearInterval(refresh);
      clearInterval(relogio);
      clearInterval(sincronizador);
    };
  }, [visaoAtiva, telaMonitor]);

  function carregarDados() {
    setIndicadores(gerarIndicadoresBI("geral"));
    setSaude(calcularSaudeCondominio("geral"));
    setDistribuicao(gerarDistribuicaoGeral("geral"));
    setCriticos(gerarIndicadoresCriticos("geral"));
    setComparativo(gerarDadosComparativoGrafico("30dias"));
    setComparativos(gerarComparativosBI("geral"));
    setInsights(gerarInsightsBI("geral"));
    setResumo(gerarResumoExecutivoBI("geral"));
    setRanking(gerarRankingModulos("geral"));
    setAtividades(buscarAtividadesRecentes("geral"));
    setRankingsPremium(gerarRankingsPremiumBI("geral"));
    setUltimaAtualizacao(new Date().toLocaleTimeString("pt-BR"));
  }

  function trocarTela(tela) {
    setTelaMonitor(tela);
    localStorage.setItem("bi_monitor_tela", tela);
  }

  function trocarVisao(visao) {
    setTelaMonitor("geral");
    setVisaoAtiva(visao);

    localStorage.setItem("bi_monitor_tela", "geral");
    localStorage.setItem("bi_monitor_visao", visao);
  }

  const graficoPrincipal =
    visaoAtiva === "comparativo"
      ? {
          titulo: "Atual x período anterior",
          subtitulo: "Comparativo operacional dos últimos 30 dias",
          tipo: "barra",
          data: comparativo,
          dataKey: "atual",
          secondKey: "anterior"
        }
      : visaoAtiva === "criticos"
      ? {
          titulo: "Indicadores críticos",
          subtitulo: "Pendências e sinais de atenção operacional",
          tipo: "pizza",
          data: criticos,
          dataKey: "total",
          secondKey: null
        }
      : {
          titulo: "Distribuição geral",
          subtitulo: "Leitura consolidada dos principais módulos",
          tipo: "barra",
          data: distribuicao,
          dataKey: "total",
          secondKey: null
        };

  return (
    <div style={styles.container}>
      <div style={styles.scanLine}></div>

      <header style={styles.header}>
        <div>
          <span style={styles.badge}>
            GREENCONDO COMMAND CENTER
          </span>

          <h1 style={styles.title}>
            Central de Monitoramento
          </h1>

          <p style={styles.subtitle}>
            Segunda tela controlada pelo BI principal.
          </p>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.statusPill}>
            <span style={styles.liveDot}></span>
            Sistema ativo
          </div>

          <div style={styles.clock}>
            {hora || "Carregando..."}
          </div>

          <div style={styles.updateText}>
            Atualização automática: {ultimaAtualizacao || "--:--"}
          </div>
        </div>
      </header>

      <section style={styles.monitorTabs}>
        <button
          onClick={() => trocarTela("geral")}
          style={{
            ...styles.monitorTab,
            ...(telaMonitor === "geral" ? styles.monitorTabActive : {})
          }}
        >
          📊 Geral
        </button>

        <button
          onClick={() => trocarTela("operacional")}
          style={{
            ...styles.monitorTab,
            ...(telaMonitor === "operacional" ? styles.monitorTabActive : {})
          }}
        >
          ⚙ Operacional
        </button>

        <button
          onClick={() => trocarTela("seguranca")}
          style={{
            ...styles.monitorTab,
            ...(telaMonitor === "seguranca" ? styles.monitorTabActive : {})
          }}
        >
          🛡 Segurança
        </button>

        <button
          onClick={() => trocarTela("inteligencia")}
          style={{
            ...styles.monitorTab,
            ...(telaMonitor === "inteligencia" ? styles.monitorTabActive : {})
          }}
        >
          🧠 Inteligência
        </button>
      </section>

      {telaMonitor === "geral" && (
        <>
          <section style={styles.kpis}>
            <KpiCard
              label="Moradores"
              value={indicadores.totalMoradores}
              detail={`${indicadores.totalMoradoresPrincipais || 0} principais`}
            />

            <KpiCard
              label="Visitantes"
              value={indicadores.totalVisitantes}
              detail={`${indicadores.totalVisitantesAtivos || 0} ativos`}
            />

            <KpiCard
              label="Encomendas"
              value={indicadores.totalEncomendas}
              detail={`${indicadores.totalPendentes || 0} pendentes`}
            />

            <KpiCard
              label="Reservas"
              value={indicadores.totalReservas}
              detail={`${indicadores.totalReservasAtivas || 0} ativas`}
            />

            <KpiCard
              label="Prestadores"
              value={indicadores.totalPrestadores}
              detail={`${indicadores.totalPrestadoresExecucao || 0} em execução`}
            />

            <KpiCard
              label="Auditoria"
              value={indicadores.totalAuditorias}
              detail="logs do sistema"
            />

            <KpiCard
              label="Ocorrências"
              value={indicadores.totalOcorrencias}
              detail={`${indicadores.totalOcorrenciasAbertas || 0} abertas`}
              danger={indicadores.totalOcorrenciasAbertas > 0}
            />
          </section>

          <main style={styles.commandGrid}>
            <section style={styles.mainPanel}>
              <div style={styles.panelHeader}>
                <div>
                  <span style={styles.panelBadge}>
                    VISUALIZAÇÃO ATIVA
                  </span>

                  <h2 style={styles.panelTitle}>
                    {graficoPrincipal.titulo}
                  </h2>

                  <p style={styles.panelSubtitle}>
                    {graficoPrincipal.subtitulo}
                  </p>
                </div>

                <div style={styles.viewButtons}>
                  <button
                    onClick={() => trocarVisao("geral")}
                    style={{
                      ...styles.viewButton,
                      ...(visaoAtiva === "geral" ? styles.viewButtonActive : {})
                    }}
                  >
                    Geral
                  </button>

                  <button
                    onClick={() => trocarVisao("comparativo")}
                    style={{
                      ...styles.viewButton,
                      ...(visaoAtiva === "comparativo"
                        ? styles.viewButtonActive
                        : {})
                    }}
                  >
                    Comparativo
                  </button>

                  <button
                    onClick={() => trocarVisao("criticos")}
                    style={{
                      ...styles.viewButton,
                      ...(visaoAtiva === "criticos"
                        ? styles.viewButtonActive
                        : {})
                    }}
                  >
                    Críticos
                  </button>
                </div>
              </div>

              <div style={styles.bigChart}>
                <DynamicCharts
                  height={520}
                  tipo={graficoPrincipal.tipo}
                  data={graficoPrincipal.data}
                  dataKey={graficoPrincipal.dataKey}
                  xKey="nome"
                  secondKey={graficoPrincipal.secondKey}
                />
              </div>
            </section>

            <aside style={styles.sidePanel}>
              <div style={styles.healthBox}>
                <span style={styles.panelBadgeGold}>
                  SAÚDE OPERACIONAL
                </span>

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
                  {saude.descricao ||
                    "Operação estável e sem sinais críticos."}
                </p>
              </div>

              <div style={styles.alertBox}>
                <span style={styles.panelBadgeGold}>
                  ALERTAS INTELIGENTES
                </span>

                <div style={styles.alertList}>
                  {insights.slice(0, 4).map((item, index) => (
                    <div key={index} style={styles.alertItem}>
                      <strong>{item.titulo}</strong>
                      <p>{item.texto}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </main>

          <section style={styles.analyticsGrid}>
            <RankingMonitor title="Top áreas" dados={rankingsPremium.areasMaisReservadas || []} />
            <RankingMonitor title="Apartamentos com visitantes" dados={rankingsPremium.apartamentosComMaisVisitantes || []} />
            <HeatMap dados={distribuicao} />

            <TrendAnalysis comparativos={comparativos} />
          </section>
        </>
      )}

      {telaMonitor === "operacional" && (
        <OperationalDashboard
          ranking={ranking}
          atividades={atividades}
          indicadores={indicadores}
        />
      )}

      {telaMonitor === "seguranca" && (
        <SecurityDashboard
          indicadores={indicadores}
          saude={saude}
          insights={insights}
        />
      )}

      {telaMonitor === "inteligencia" && (
        <section style={styles.bottomGrid}>
          <div style={styles.summaryPanel}>
            <span style={styles.panelBadge}>
              RESUMO EXECUTIVO
            </span>

            <div style={styles.summaryList}>
              {resumo.map((item, index) => (
                <div key={index} style={styles.summaryItem}>
                  🧠 {item}
                </div>
              ))}
            </div>
          </div>

          <div style={styles.alertBox}>
            <span style={styles.panelBadgeGold}>
              INSIGHTS INTELIGENTES
            </span>

            <div style={styles.alertList}>
              {insights.map((item, index) => (
                <div key={index} style={styles.alertItem}>
                  <strong>{item.titulo}</strong>
                  <p>{item.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer style={styles.footer}>
        <span>GreenCondo Monitor • modo independente</span>
        <span>Rota: /bi-monitor</span>
        <span>Controlado pelo BIAnalytics</span>
      </footer>
    </div>
  );
}

function RankingMonitor({ title, dados }) {
  return (
    <div style={styles.rankingMonitor}>
      <span style={styles.panelBadgeGold}>{title}</span>

      {dados.length === 0 ? (
        <p style={styles.rankingEmpty}>Sem dados suficientes.</p>
      ) : (
        dados.slice(0, 5).map((item, index) => (
          <div key={index} style={styles.rankingItem}>
            <span>{index + 1}. {item.nome}</span>
            <strong>{item.total}</strong>
          </div>
        ))
      )}
    </div>
  );
}

function KpiCard({ label, value, detail, danger }) {
  return (
    <div
      style={{
        ...styles.kpiCard,
        ...(danger ? styles.kpiDanger : {})
      }}
    >
      <span style={styles.kpiLabel}>
        {label}
      </span>

      <h2 style={styles.kpiValue}>
        {value || 0}
      </h2>

      <p style={styles.kpiDetail}>
        {detail}
      </p>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    width: "100%",
    overflowX: "hidden",
    overflowY: "auto",
    background:
      "radial-gradient(circle at top right,rgba(124,255,74,0.18),transparent 26%), radial-gradient(circle at bottom left,rgba(250,204,21,0.10),transparent 24%), linear-gradient(180deg,#020617,#041009 42%,#07130d)",
    color: "white",
    padding: "24px",
    boxSizing: "border-box",
    fontFamily: "Arial",
    position: "relative"
  },

  scanLine: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "2px",
    background:
      "linear-gradient(90deg,transparent,#7cff4a,transparent)",
    boxShadow: "0 0 22px rgba(124,255,74,0.85)"
  },

  rankingMonitor: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "22px",
    padding: "18px"
  },

  rankingItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    padding: "10px 0",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.76)"
  },

  rankingEmpty: {
    color: "rgba(255,255,255,0.50)"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "20px",
    flexWrap: "wrap"
  },

  badge: {
    display: "inline-block",
    background: "rgba(124,255,74,0.12)",
    color: "#b9ff8a",
    border: "1px solid rgba(124,255,74,0.24)",
    padding: "8px 14px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "12px",
    letterSpacing: "1px"
  },

  title: {
    margin: "12px 0 0",
    fontSize: "clamp(32px,4vw,52px)",
    lineHeight: "1",
    letterSpacing: "-1px"
  },

  subtitle: {
    margin: "10px 0 0",
    color: "rgba(255,255,255,0.58)"
  },

  headerRight: {
    textAlign: "right",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "8px"
  },

  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(124,255,74,0.12)",
    color: "#b9ff8a",
    border: "1px solid rgba(124,255,74,0.25)",
    padding: "8px 13px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "12px"
  },

  liveDot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    background: "#7cff4a",
    boxShadow: "0 0 0 6px rgba(124,255,74,0.12)"
  },

  clock: {
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: "900"
  },

  updateText: {
    color: "rgba(255,255,255,0.50)",
    fontSize: "12px"
  },

  monitorTabs: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "20px"
  },

  monitorTab: {
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "14px",
    padding: "12px 16px",
    cursor: "pointer",
    fontWeight: "900"
  },

  monitorTabActive: {
    background: "linear-gradient(135deg,#7cff4a,#b9ff8a)",
    color: "#07130d",
    border: "1px solid rgba(124,255,74,0.40)"
  },

  kpis: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
    gap: "14px",
    marginBottom: "20px"
  },

  kpiCard: {
    background:
      "linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.035))",
    border: "1px solid rgba(124,255,74,0.14)",
    borderRadius: "24px",
    padding: "18px",
    boxShadow: "0 18px 45px rgba(0,0,0,0.20)",
    minHeight: "118px"
  },

  kpiDanger: {
    border: "1px solid rgba(239,68,68,0.35)",
    boxShadow: "0 0 30px rgba(239,68,68,0.12)"
  },

  kpiLabel: {
    color: "rgba(255,255,255,0.55)",
    fontWeight: "900",
    fontSize: "12px",
    textTransform: "uppercase"
  },

  kpiValue: {
    color: "#7cff4a",
    fontSize: "42px",
    margin: "8px 0 4px",
    textShadow: "0 0 20px rgba(124,255,74,0.22)"
  },

  kpiDetail: {
    margin: 0,
    color: "#b9ff8a",
    fontSize: "12px"
  },

  commandGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0,2fr) minmax(320px,420px)",
    gap: "20px",
    marginBottom: "20px",
    alignItems: "stretch"
  },

  mainPanel: {
    background: "rgba(7,19,13,0.94)",
    border: "1px solid rgba(124,255,74,0.16)",
    borderRadius: "28px",
    padding: "22px",
    boxShadow: "0 22px 60px rgba(0,0,0,0.26)",
    minWidth: 0
  },

  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "8px",
    flexWrap: "wrap"
  },

  panelBadge: {
    display: "inline-block",
    background: "rgba(124,255,74,0.12)",
    color: "#b9ff8a",
    border: "1px solid rgba(124,255,74,0.25)",
    padding: "7px 11px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "11px"
  },

  panelBadgeGold: {
    display: "inline-block",
    background: "rgba(250,204,21,0.13)",
    color: "#facc15",
    border: "1px solid rgba(250,204,21,0.26)",
    padding: "7px 11px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "11px"
  },

  panelTitle: {
    margin: "10px 0 0",
    fontSize: "27px"
  },

  panelSubtitle: {
    margin: "6px 0 0",
    color: "rgba(255,255,255,0.54)"
  },

  viewButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap"
  },

  viewButton: {
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.68)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "13px",
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: "900"
  },

  viewButtonActive: {
    background: "linear-gradient(135deg,#7cff4a,#b9ff8a)",
    color: "#07130d",
    border: "1px solid rgba(124,255,74,0.40)"
  },

  bigChart: {
    minHeight: "520px",
    width: "100%"
  },

  sidePanel: {
    display: "grid",
    gridTemplateRows: "auto auto",
    gap: "20px",
    minWidth: 0
  },

  healthBox: {
    background:
      "radial-gradient(circle at top right,rgba(124,255,74,0.12),transparent 36%), rgba(7,19,13,0.94)",
    border: "1px solid rgba(124,255,74,0.16)",
    borderRadius: "28px",
    padding: "20px"
  },

  healthCircle: {
    width: "160px",
    height: "160px",
    borderRadius: "50%",
    border: "9px solid #7cff4a",
    margin: "20px auto 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    fontSize: "22px",
    fontWeight: "900",
    boxShadow: "0 0 50px rgba(124,255,74,0.24)"
  },

  healthText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.62)",
    fontSize: "13px",
    lineHeight: "1.45"
  },

  alertBox: {
    background:
      "radial-gradient(circle at top right,rgba(250,204,21,0.10),transparent 36%), rgba(7,19,13,0.94)",
    border: "1px solid rgba(250,204,21,0.18)",
    borderRadius: "28px",
    padding: "20px"
  },

  alertList: {
    marginTop: "14px",
    display: "grid",
    gap: "10px"
  },

  alertItem: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "15px",
    padding: "11px"
  },

  analyticsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(420px,1fr))",
    gap: "20px",
    marginBottom: "20px"
  },

  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(420px,1fr))",
    gap: "20px",
    marginBottom: "20px"
  },

  summaryPanel: {
    background: "rgba(7,19,13,0.94)",
    border: "1px solid rgba(124,255,74,0.14)",
    borderRadius: "28px",
    padding: "20px"
  },

  summaryList: {
    marginTop: "14px",
    display: "grid",
    gap: "9px"
  },

  summaryItem: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(124,255,74,0.10)",
    borderRadius: "14px",
    padding: "11px",
    color: "rgba(255,255,255,0.75)",
    fontSize: "13px"
  },

  footer: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "10px",
    color: "rgba(255,255,255,0.42)",
    fontSize: "12px",
    marginTop: "20px"
  }
};

export default BIMonitor;