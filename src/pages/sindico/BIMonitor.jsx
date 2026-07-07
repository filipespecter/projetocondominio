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

import logoStar from "../../assets/images/logo-star-infinity.png";

function BIMonitor() {
  const [hora, setHora] = useState("");
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState("");
  const [visaoAtiva, setVisaoAtiva] = useState(
    () => localStorage.getItem("bi_monitor_visao") || "geral"
  );
  const [telaMonitor, setTelaMonitor] = useState(
    () => localStorage.getItem("bi_monitor_tela") || "geral"
  );

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

  function verificarAcessoBI() {
    try {
      const perfil =
        JSON.parse(localStorage.getItem("perfil_condominio")) ||
        JSON.parse(localStorage.getItem("configuracoes")) ||
        {};

      const plano = perfil.plano || "Completo";

      return plano === "Completo";
    } catch {
      return true;
    }
  }

  const acessoLiberado = verificarAcessoBI();

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
  }, []);

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

  if (!acessoLiberado) {
    return (
      <div style={styles.container}>
        <div style={styles.scanLine}></div>

        <header style={styles.header}>
          <div style={styles.headerBrand}>
            <img
              src={logoStar}
              alt="Star Infinity Code"
              style={styles.logoImage}
            />

            <div>
              <span style={styles.badge}>
                🔒 ÁREA RESTRITA
              </span>

              <h1 style={styles.title}>
                BI Monitor
              </h1>

              <p style={styles.subtitle}>
                A Central de Monitoramento está disponível apenas no Plano Completo.
                Entre em contato com a Star Infinity Code para realizar o upgrade.
              </p>
            </div>
          </div>

          <div style={styles.headerRight}>
            <div style={styles.statusPill}>
              Recurso premium
            </div>

            <div style={styles.clock}>
              Plano Básico
            </div>

            <div style={styles.updateText}>
              Contato: (81) 7910-9935
            </div>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.scanLine}></div>

      <header style={styles.header}>
        <div style={styles.headerBrand}>
          <img
            src={logoStar}
            alt="Star Infinity Code"
            style={styles.logoImage}
          />

          <div>
            <span style={styles.badge}>
              INFINITYCONDO COMMAND CENTER
            </span>

            <h1 style={styles.title}>
              Central de Monitoramento
            </h1>

            <p style={styles.subtitle}>
              Segunda tela controlada pelo BI principal.
            </p>
          </div>
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
                    <div key={item.id || item.titulo || index} style={styles.alertItem}>
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
                <div key={`${item}-${index}`} style={styles.summaryItem}>
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
                <div key={item.id || item.titulo || index} style={styles.alertItem}>
                  <strong>{item.titulo}</strong>
                  <p>{item.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer style={styles.footer}>
        <span>InfinityCondo Monitor • modo independente</span>
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
          <div key={item.id || item.nome || index} style={styles.rankingItem}>
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
      "radial-gradient(circle at top right,rgba(168,85,247,0.18),transparent 26%), radial-gradient(circle at bottom left,rgba(59,130,246,0.08),transparent 24%), linear-gradient(180deg,#ffffff,#f8f5ff)",
    color: "#111827",
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
    height: "3px",
    background: "linear-gradient(90deg,transparent,#a855f7,transparent)",
    boxShadow: "0 0 28px rgba(168,85,247,0.85)"
  },

  header: {
    background:
      "radial-gradient(circle at top right,rgba(255,255,255,0.18),transparent 30%), radial-gradient(circle at bottom left,rgba(168,85,247,0.26),transparent 34%), linear-gradient(135deg,#2e1065,#4c1d95,#7c3aed)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: "40px",
    padding: "30px",
    boxShadow:
      "0 34px 90px rgba(88,28,135,0.26), 0 0 60px rgba(168,85,247,0.18)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "20px",
    flexWrap: "wrap",
    color: "white",
    overflow: "hidden"
  },

  headerBrand: {
    display: "flex",
    alignItems: "center",
    gap: "18px"
  },

  logoImage: {
    width: "94px",
    height: "94px",
    objectFit: "contain",
    borderRadius: "28px",
    background: "rgba(255,255,255,0.94)",
    border: "1px solid rgba(255,255,255,0.28)",
    boxShadow: "0 18px 40px rgba(0,0,0,0.22), 0 0 32px rgba(216,180,254,0.30)",
    padding: "8px",
    boxSizing: "border-box"
  },

  badge: {
    display: "inline-block",
    background: "rgba(255,255,255,0.14)",
    color: "#f5f3ff",
    border: "1px solid rgba(255,255,255,0.22)",
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
    letterSpacing: "-1px",
    color: "white"
  },

  subtitle: {
    margin: "10px 0 0",
    color: "rgba(255,255,255,0.72)"
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
    background: "rgba(255,255,255,0.14)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.22)",
    padding: "8px 13px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "12px"
  },

  liveDot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    background: "#22c55e",
    boxShadow: "0 0 0 6px rgba(34,197,94,0.20)"
  },

  clock: {
    color: "white",
    fontSize: "22px",
    fontWeight: "900"
  },

  updateText: {
    color: "rgba(255,255,255,0.62)",
    fontSize: "12px"
  },

  monitorTabs: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "20px"
  },

  monitorTab: {
    background: "white",
    color: "#4c1d95",
    border: "1px solid #ddd6fe",
    borderRadius: "16px",
    padding: "12px 16px",
    cursor: "pointer",
    fontWeight: "900",
    boxShadow: "0 12px 26px rgba(88,28,135,0.07)"
  },

  monitorTabActive: {
    background: "linear-gradient(135deg,#6d28d9,#8b5cf6,#a855f7)",
    color: "white",
    border: "1px solid rgba(124,58,237,0.40)",
    boxShadow: "0 18px 34px rgba(124,58,237,0.24)"
  },

  kpis: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
    gap: "14px",
    marginBottom: "20px"
  },

  kpiCard: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.10),transparent 34%), white",
    border: "1px solid #ede9fe",
    borderRadius: "26px",
    padding: "18px",
    boxShadow: "0 18px 45px rgba(88,28,135,0.10)",
    minHeight: "118px"
  },

  kpiDanger: {
    border: "1px solid rgba(239,68,68,0.35)",
    boxShadow: "0 0 30px rgba(239,68,68,0.12)"
  },

  kpiLabel: {
    color: "#6b7280",
    fontWeight: "900",
    fontSize: "12px",
    textTransform: "uppercase"
  },

  kpiValue: {
    color: "#6d28d9",
    fontSize: "42px",
    margin: "8px 0 4px"
  },

  kpiDetail: {
    margin: 0,
    color: "#7c3aed",
    fontSize: "12px",
    fontWeight: "800"
  },

  commandGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(320px,1.4fr) minmax(300px,0.8fr)",
    gap: "20px",
    marginBottom: "20px",
    alignItems: "stretch"
  },

  mainPanel: {
    background: "linear-gradient(135deg,#4c1d95,#6d28d9)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: "30px",
    padding: "22px",
    boxShadow: "0 22px 60px rgba(88,28,135,0.18)",
    minWidth: 0,
    color: "white"
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
    background: "rgba(255,255,255,0.14)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.22)",
    padding: "7px 11px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "11px"
  },

  panelBadgeGold: {
    display: "inline-block",
    background: "#f3e8ff",
    color: "#6d28d9",
    border: "1px solid #ddd6fe",
    padding: "7px 11px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "11px"
  },

  panelTitle: {
    margin: "10px 0 0",
    fontSize: "27px",
    color: "white"
  },

  panelSubtitle: {
    margin: "6px 0 0",
    color: "rgba(255,255,255,0.72)"
  },

  viewButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap"
  },

  viewButton: {
    background: "rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.82)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: "13px",
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: "900"
  },

  viewButtonActive: {
    background: "#22c55e",
    color: "#052e16",
    border: "1px solid rgba(255,255,255,0.34)"
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
      "radial-gradient(circle at top right,rgba(168,85,247,0.12),transparent 36%), white",
    border: "1px solid #ede9fe",
    borderRadius: "30px",
    padding: "20px",
    boxShadow: "0 20px 50px rgba(88,28,135,0.10)"
  },

  healthCircle: {
    width: "160px",
    height: "160px",
    borderRadius: "50%",
    border: "9px solid #22c55e",
    margin: "20px auto 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    fontSize: "22px",
    fontWeight: "900",
    boxShadow: "0 0 50px rgba(34,197,94,0.24)",
    color: "#16a34a"
  },

  healthText: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: "13px",
    lineHeight: "1.45"
  },

  alertBox: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.10),transparent 36%), white",
    border: "1px solid #ede9fe",
    borderRadius: "30px",
    padding: "20px",
    boxShadow: "0 20px 50px rgba(88,28,135,0.10)"
  },

  alertList: {
    marginTop: "14px",
    display: "grid",
    gap: "10px"
  },

  alertItem: {
    background: "#fbfaff",
    border: "1px solid #ede9fe",
    borderRadius: "15px",
    padding: "11px",
    color: "#111827"
  },

  analyticsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
    gap: "20px",
    marginBottom: "20px"
  },

  rankingMonitor: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.10),transparent 34%), white",
    border: "1px solid #ede9fe",
    borderRadius: "24px",
    padding: "18px",
    boxShadow: "0 18px 42px rgba(88,28,135,0.09)"
  },

  rankingItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    padding: "10px 0",
    borderBottom: "1px solid #ede9fe",
    color: "#6b7280"
  },

  rankingEmpty: {
    color: "#6b7280"
  },

  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
    gap: "20px",
    marginBottom: "20px"
  },

  summaryPanel: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.10),transparent 34%), white",
    border: "1px solid #ede9fe",
    borderRadius: "30px",
    padding: "20px",
    boxShadow: "0 20px 50px rgba(88,28,135,0.10)"
  },

  summaryList: {
    marginTop: "14px",
    display: "grid",
    gap: "9px"
  },

  summaryItem: {
    background: "#fbfaff",
    border: "1px solid #ede9fe",
    borderRadius: "14px",
    padding: "11px",
    color: "#111827",
    fontSize: "13px"
  },

  footer: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "10px",
    color: "#6b7280",
    fontSize: "12px",
    marginTop: "20px"
  }
};

export default BIMonitor;