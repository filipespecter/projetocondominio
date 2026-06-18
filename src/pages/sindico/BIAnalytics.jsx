import { useEffect, useState } from "react";

import PanelHeader from "../../components/BI/PanelHeader";
import CompareCard from "../../components/BI/CompareCard";
import IndicatorCard from "../../components/BI/IndicatorCard";
import DynamicCharts from "../../components/BI/DynamicCharts";
import ExecutiveSummary from "../../components/BI/ExecutiveSummary";
import MonitorButton from "../../components/BI/MonitorButton";
import SecurityDashboard from "../../components/BI/SecurityDashboard";
import OperationalDashboard from "../../components/BI/OperationalDashboard";
import HeatMap from "../../components/BI/HeatMap";
import TrendAnalysis from "../../components/BI/TrendAnalysis";

import {
  buscarDadosBI,
  gerarIndicadoresBI,
  calcularSaudeCondominio,
  gerarDistribuicaoGeral,
  gerarIndicadoresCriticos,
  gerarRankingModulos,
  gerarInsightsBI,
  buscarAtividadesRecentes,
  gerarComparativosBI,
  gerarDadosComparativoGrafico,
  gerarResumoExecutivoBI,
  gerarRankingsPremiumBI
} from "../../Services/biService";

function BIAnalytics() {
  const [periodo, setPeriodo] = useState("geral");
  const [tipoGrafico, setTipoGrafico] = useState("barra");
  const [graficoAtivo, setGraficoAtivo] = useState("distribuicao");
  const [abaAtiva, setAbaAtiva] = useState(
    () => localStorage.getItem("bi_monitor_tela") || "geral"
  );

  const [indicadores, setIndicadores] = useState({});
  const [saude, setSaude] = useState({});
  const [distribuicao, setDistribuicao] = useState([]);
  const [criticos, setCriticos] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [insights, setInsights] = useState([]);
  const [atividades, setAtividades] = useState({});
  const [comparativos, setComparativos] = useState({});
  const [dadosComparativo, setDadosComparativo] = useState([]);
  const [resumoExecutivo, setResumoExecutivo] = useState([]);
  const [rankingsPremium, setRankingsPremium] = useState({});
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState("");

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
    carregarBI(periodo);
  }, [periodo]);

  useEffect(() => {
    const interval = setInterval(() => {
      carregarBI(periodo);
    }, 30000);

    return () => clearInterval(interval);
  }, [periodo]);

  function carregarBI(periodoSelecionado = periodo) {
    buscarDadosBI(periodoSelecionado);

    setIndicadores(gerarIndicadoresBI(periodoSelecionado));
    setSaude(calcularSaudeCondominio(periodoSelecionado));
    setDistribuicao(gerarDistribuicaoGeral(periodoSelecionado));
    setCriticos(gerarIndicadoresCriticos(periodoSelecionado));
    setRanking(gerarRankingModulos(periodoSelecionado));
    setInsights(gerarInsightsBI(periodoSelecionado));
    setAtividades(buscarAtividadesRecentes(periodoSelecionado));
    setComparativos(gerarComparativosBI(periodoSelecionado));
    setDadosComparativo(gerarDadosComparativoGrafico(periodoSelecionado));
    setResumoExecutivo(gerarResumoExecutivoBI(periodoSelecionado));
    setRankingsPremium(gerarRankingsPremiumBI(periodoSelecionado));
    setUltimaAtualizacao(new Date().toLocaleString("pt-BR"));
  }

  function trocarAba(id) {
    setAbaAtiva(id);
    localStorage.setItem("bi_monitor_tela", id);

    if (id === "geral") {
      localStorage.setItem("bi_monitor_visao", "geral");
    }
  }

  function sincronizarMonitor(id) {
    setGraficoAtivo(id);
    localStorage.setItem("bi_monitor_tela", "geral");

    if (id === "distribuicao") {
      localStorage.setItem("bi_monitor_visao", "geral");
    }

    if (id === "comparativo") {
      localStorage.setItem("bi_monitor_visao", "comparativo");
    }

    if (id === "criticos") {
      localStorage.setItem("bi_monitor_visao", "criticos");
    }
  }

  const periodos = [
    { id: "geral", label: "Geral" },
    { id: "hoje", label: "Hoje" },
    { id: "7dias", label: "7 dias" },
    { id: "30dias", label: "30 dias" },
    { id: "mes", label: "Mês" },
    { id: "ano", label: "Ano" }
  ];

  const tiposGrafico = [
    { id: "barra", label: "Barras" },
    { id: "linha", label: "Linha" },
    { id: "pizza", label: "Pizza" },
    { id: "area", label: "Área" }
  ];

  const abas = [
    { id: "geral", label: "📊 Visão Geral" },
    { id: "operacional", label: "⚙ Operacional" },
    { id: "seguranca", label: "🛡 Segurança" },
    { id: "inteligencia", label: "🧠 Inteligência" }
  ];

  const graficos = [
    {
      id: "distribuicao",
      label: "Distribuição geral",
      badge: "Visão geral",
      title: "Distribuição por módulo",
      data: distribuicao,
      dataKey: "total",
      xKey: "nome",
      secondKey: null
    },
    {
      id: "comparativo",
      label: "Atual x anterior",
      badge: "Comparativo",
      title: "Atual x período anterior",
      data: dadosComparativo,
      dataKey: "atual",
      xKey: "nome",
      secondKey: "anterior"
    },
    {
      id: "criticos",
      label: "Operação crítica",
      badge: "Indicadores críticos",
      title: "Operação em foco",
      data: criticos,
      dataKey: "total",
      xKey: "nome",
      secondKey: null
    }
  ];

  const graficoSelecionado =
    graficos.find((item) => item.id === graficoAtivo) || graficos[0];

  if (!acessoLiberado) {
    return (
      <div style={styles.container}>
        <section style={styles.hero}>
          <div>
            <span style={styles.heroBadge}>
              🔒 Área restrita
            </span>

            <h1 style={styles.title}>BI Analytics</h1>

            <p style={styles.subtitle}>
              Este recurso está disponível apenas para clientes do Plano Completo.
              Entre em contato com a Star Infinity Code para realizar o upgrade.
            </p>

            <div style={styles.heroActions}>
              <button style={styles.refreshButton}>
                Contato: (81) 7910-9935
              </button>
            </div>
          </div>

          <div style={styles.heroStats}>
            <div style={styles.heroCardNeon}>
              <span>Plano atual</span>
              <strong>Básico</strong>
            </div>

            <div style={styles.heroCard}>
              <span>Recurso</span>
              <strong>Premium</strong>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <div style={styles.heroGlow}></div>

        <div>
          <span style={styles.heroBadge}>
            🧠 Infinity Intelligence Center
          </span>

          <h1 style={styles.title}>BI Command Center</h1>

          <p style={styles.subtitle}>
            Visão geral executiva, indicadores críticos, leitura inteligente
            e acompanhamento operacional do condomínio em tempo real.
          </p>

          <div style={styles.heroActions}>
            <MonitorButton />
          </div>
        </div>

        <div style={styles.heroStats}>
          <div style={styles.heroCard}>
            <span>Sistema</span>
            <strong>Online</strong>
          </div>

          <div style={styles.heroCardNeon}>
            <span>Saúde</span>
            <strong>{saude.pontuacao || 100}%</strong>
          </div>

          <div style={styles.heroCard}>
            <span>Atualizado</span>
            <strong>{ultimaAtualizacao || "Agora"}</strong>
          </div>
        </div>
      </section>

      <section style={styles.tabs}>
        {abas.map((aba) => (
          <button
            key={aba.id}
            onClick={() => trocarAba(aba.id)}
            style={{
              ...styles.tabButton,
              ...(abaAtiva === aba.id ? styles.tabButtonActive : {})
            }}
          >
            {aba.label}
          </button>
        ))}
      </section>

      <section style={styles.commandBar}>
        <div>
          <p style={styles.controlLabel}>Período</p>

          <div style={styles.filterGroup}>
            {periodos.map((item) => (
              <button
                key={item.id}
                onClick={() => setPeriodo(item.id)}
                style={{
                  ...styles.filterButton,
                  ...(periodo === item.id ? styles.filterActive : {})
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p style={styles.controlLabel}>Tipo de gráfico</p>

          <div style={styles.filterGroup}>
            {tiposGrafico.map((item) => (
              <button
                key={item.id}
                onClick={() => setTipoGrafico(item.id)}
                style={{
                  ...styles.filterButton,
                  ...(tipoGrafico === item.id ? styles.filterActive : {})
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <button style={styles.refreshButton} onClick={() => carregarBI()}>
          🔄 Atualizar BI
        </button>
      </section>

      {abaAtiva === "geral" && (
        <>
          <section style={styles.compareGrid}>
            <CompareCard
              title="Visitantes"
              atual={comparativos.visitantes?.atual || 0}
              anterior={comparativos.visitantes?.anterior || 0}
              variacao={comparativos.visitantes?.variacao}
            />

            <CompareCard
              title="Encomendas"
              atual={comparativos.encomendas?.atual || 0}
              anterior={comparativos.encomendas?.anterior || 0}
              variacao={comparativos.encomendas?.variacao}
            />

            <CompareCard
              title="Reservas"
              atual={comparativos.reservas?.atual || 0}
              anterior={comparativos.reservas?.anterior || 0}
              variacao={comparativos.reservas?.variacao}
            />

            <CompareCard
              title="Ocorrências"
              atual={comparativos.ocorrencias?.atual || 0}
              anterior={comparativos.ocorrencias?.anterior || 0}
              variacao={comparativos.ocorrencias?.variacao}
            />

            <CompareCard
              title="Sugestões"
              atual={comparativos.sugestoes?.atual || 0}
              anterior={comparativos.sugestoes?.anterior || 0}
              variacao={comparativos.sugestoes?.variacao}
            />

            <CompareCard
              title="Reclamações"
              atual={comparativos.reclamacoes?.atual || 0}
              anterior={comparativos.reclamacoes?.anterior || 0}
              variacao={comparativos.reclamacoes?.variacao}
            />
          </section>

          <section style={styles.indicatorsGrid}>
            <IndicatorCard
              icon="👥"
              title="Moradores"
              value={indicadores.totalMoradores || 0}
              detail="Total cadastrados"
            />

            <IndicatorCard
              icon="🏢"
              title="Apartamentos"
              value={indicadores.totalApartamentos || 0}
              detail={`${indicadores.totalApartamentosOcupados || 0} ocupados`}
            />

            <IndicatorCard
              icon="👑"
              title="Moradores principais"
              value={indicadores.totalMoradoresPrincipais || 0}
              detail={`${indicadores.totalDependentes || 0} dependentes`}
            />

            <IndicatorCard
              icon="🚶"
              title="Visitantes"
              value={indicadores.totalVisitantes || 0}
              detail={`${indicadores.totalVisitantesAtivos || 0} ativos`}
            />

            <IndicatorCard
              icon="📦"
              title="Encomendas"
              value={indicadores.totalEncomendas || 0}
              detail={`${indicadores.totalPendentes || 0} pendentes`}
            />

            <IndicatorCard
              icon="📅"
              title="Reservas"
              value={indicadores.totalReservas || 0}
              detail={`${indicadores.totalReservasAtivas || 0} ativas`}
            />

            <IndicatorCard
              icon="🚨"
              title="Ocorrências"
              value={indicadores.totalOcorrencias || 0}
              detail={`${indicadores.totalOcorrenciasAbertas || 0} abertas`}
            />

            <IndicatorCard
              icon="💡"
              title="Sugestões"
              value={indicadores.totalSugestoes || 0}
              detail={`${indicadores.totalSugestoesResolvidas || 0} resolvidas`}
            />

            <IndicatorCard
              icon="⚠️"
              title="Reclamações"
              value={indicadores.totalReclamacoes || 0}
              detail={`${indicadores.totalReclamacoesAbertas || 0} abertas`}
            />

            <IndicatorCard
              icon="📢"
              title="Central Síndico"
              value={indicadores.totalAvisosSindico || 0}
              detail={`${indicadores.totalPendenciasSindico || 0} pendências`}
            />

            <IndicatorCard
              icon="🔔"
              title="Notificações"
              value={(indicadores.totalNotificacoesMorador || 0) + (indicadores.totalNotificacoesSistema || 0)}
              detail="Moradores e sistema"
            />

            <IndicatorCard
              icon="🧰"
              title="Prestadores"
              value={indicadores.totalPrestadores || 0}
              detail={`${indicadores.totalPrestadoresExecucao || 0} em execução`}
            />

            <IndicatorCard
              icon="🏗️"
              title="Áreas comuns"
              value={indicadores.totalAreas || 0}
              detail={`${indicadores.totalAreasManutencao || 0} em manutenção`}
            />

            <IndicatorCard
              icon="🧾"
              title="Auditoria"
              value={indicadores.totalAuditorias || 0}
              detail="Registros do sistema"
            />
          </section>

          <section style={styles.rankingGrid}>
            <RankingBox title="Top áreas reservadas" dados={rankingsPremium.areasMaisReservadas || []} />
            <RankingBox title="Moradores com mais reservas" dados={rankingsPremium.moradoresComMaisReservas || []} />
            <RankingBox title="Apartamentos com visitantes" dados={rankingsPremium.apartamentosComMaisVisitantes || []} />
            <RankingBox title="Prestadores utilizados" dados={rankingsPremium.prestadoresMaisUtilizados || []} />
          </section>

          <div style={styles.extraGrid}>
            <HeatMap dados={distribuicao} />

            <TrendAnalysis comparativos={comparativos} />
          </div>

          <section style={styles.commandCenterGrid}>
            <div style={styles.mainChartPanel}>
              <div style={styles.chartTop}>
                <PanelHeader
                  badge={graficoSelecionado.badge}
                  title={graficoSelecionado.title}
                />

                <div style={styles.chartTabs}>
                  {graficos.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => sincronizarMonitor(item.id)}
                      style={{
                        ...styles.chartTab,
                        ...(graficoAtivo === item.id
                          ? styles.chartTabActive
                          : {})
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <DynamicCharts
                tipo={tipoGrafico}
                data={graficoSelecionado.data}
                dataKey={graficoSelecionado.dataKey}
                xKey={graficoSelecionado.xKey}
                secondKey={graficoSelecionado.secondKey}
              />
            </div>

            <div style={styles.healthPanel}>
              <PanelHeader
                badge="Saúde operacional"
                title="Status do condomínio"
                gold
              />

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

              <div style={styles.healthList}>
                <MiniMetric
                  label="Encomendas pendentes"
                  value={indicadores.totalPendentes || 0}
                />

                <MiniMetric
                  label="Ocorrências abertas"
                  value={indicadores.totalOcorrenciasAbertas || 0}
                />

                <MiniMetric
                  label="Reclamações abertas"
                  value={indicadores.totalReclamacoesAbertas || 0}
                />

                <MiniMetric
                  label="Sugestões abertas"
                  value={indicadores.totalSugestoesAbertas || 0}
                />

                <MiniMetric
                  label="Pendências do síndico"
                  value={indicadores.totalPendenciasSindico || 0}
                />

                <MiniMetric
                  label="Visitantes ativos"
                  value={indicadores.totalVisitantesAtivos || 0}
                />
              </div>
            </div>
          </section>
        </>
      )}

      {abaAtiva === "seguranca" && (
        <SecurityDashboard
          indicadores={indicadores}
          saude={saude}
          insights={insights}
        />
      )}

      {abaAtiva === "operacional" && (
        <OperationalDashboard
          ranking={ranking}
          atividades={atividades}
          indicadores={indicadores}
        />
      )}

      {abaAtiva === "inteligencia" && (
        <section style={styles.middleGrid}>
          <div style={styles.executivePanel}>
            <PanelHeader
              badge="Resumo executivo"
              title="Leitura automática"
              gold
            />

            <ExecutiveSummary resumo={resumoExecutivo} />
          </div>

          <div style={styles.insightsPanel}>
            <PanelHeader
              badge="Central do Síndico"
              title="Pendências Administrativas"
              gold
            />

            <div style={styles.centralBox}>
              <MiniMetric
                label="Registros na Central"
                value={indicadores.totalAvisosSindico || 0}
              />

              <MiniMetric
                label="Pendências do síndico"
                value={indicadores.totalPendenciasSindico || 0}
              />

              <MiniMetric
                label="Reclamações abertas"
                value={indicadores.totalReclamacoesAbertas || 0}
              />

              <MiniMetric
                label="Sugestões abertas"
                value={indicadores.totalSugestoesAbertas || 0}
              />
            </div>

            <PanelHeader
              badge="Insights"
              title="Leitura inteligente"
              gold
            />

            <div style={styles.insightsList}>
              {insights.map((item, index) => (
                <div key={item.id || item.titulo || index} style={styles.insightItem}>
                  <span style={styles.insightType}>{item.tipo}</span>

                  <strong>{item.titulo}</strong>

                  <p>{item.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function RankingBox({ title, dados }) {
  return (
    <div style={styles.rankingBox}>
      <h3 style={styles.rankingTitle}>{title}</h3>

      {dados.length === 0 ? (
        <p style={styles.rankingEmpty}>Sem dados suficientes.</p>
      ) : (
        dados.map((item, index) => (
          <div key={item.id || item.nome || index} style={styles.rankingItem}>
            <span>{index + 1}. {item.nome}</span>
            <strong>{item.total}</strong>
          </div>
        ))
      )}
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div style={styles.miniMetric}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    minHeight: "100vh",
    fontFamily: "Arial",
    color: "white",
    background:
      "radial-gradient(circle at top right,rgba(124,255,74,0.16),transparent 28%), linear-gradient(180deg,#020617,#05110a 35%,#07130d)",
    padding: "4px",
    boxSizing: "border-box"
  },

  extraGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(360px,1fr))",
    gap: "22px",
    marginBottom: "22px"
  },

  rankingGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
    gap: "18px",
    marginBottom: "22px"
  },

  rankingBox: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "22px",
    padding: "18px"
  },

  rankingTitle: {
    margin: "0 0 12px",
    color: "#dcfce7"
  },

  rankingItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    padding: "10px 0",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.78)"
  },

  rankingEmpty: {
    color: "rgba(255,255,255,0.52)",
    margin: 0
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(circle at top right,rgba(124,255,74,0.25),transparent 32%), linear-gradient(135deg,#020617,#05110a 42%,#07130d)",
    borderRadius: "38px",
    padding: "38px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "28px",
    border: "1px solid rgba(124,255,74,0.18)",
    boxShadow:
      "0 30px 85px rgba(0,0,0,0.35), 0 0 55px rgba(124,255,74,0.10)",
    marginBottom: "22px"
  },

  heroGlow: {
    position: "absolute",
    width: "260px",
    height: "260px",
    borderRadius: "50%",
    background: "rgba(124,255,74,0.15)",
    filter: "blur(70px)",
    right: "-60px",
    top: "-60px"
  },

  heroBadge: {
    display: "inline-block",
    background: "rgba(124,255,74,0.12)",
    border: "1px solid rgba(124,255,74,0.28)",
    color: "#b9ff8a",
    padding: "9px 13px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "12px",
    marginBottom: "16px"
  },

  title: {
    margin: 0,
    fontSize: "48px",
    letterSpacing: "-1px",
    color: "#ffffff"
  },

  subtitle: {
    color: "rgba(255,255,255,0.68)",
    maxWidth: "760px",
    lineHeight: "1.6"
  },

  heroActions: {
    marginTop: "22px"
  },

  heroStats: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    position: "relative",
    zIndex: 2
  },

  heroCard: {
    width: "100%",
    maxWidth: "180px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(185,255,138,0.14)",
    padding: "16px",
    borderRadius: "20px"
  },

  heroCardNeon: {
    width: "100%",
    maxWidth: "180px",
    background: "rgba(124,255,74,0.12)",
    border: "1px solid rgba(124,255,74,0.35)",
    color: "#b9ff8a",
    padding: "16px",
    borderRadius: "20px",
    boxShadow: "0 0 35px rgba(124,255,74,0.13)"
  },

  tabs: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "22px"
  },

  tabButton: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(124,255,74,0.12)",
    color: "white",
    padding: "14px 18px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "800"
  },

  tabButtonActive: {
    background: "linear-gradient(135deg,#7cff4a,#b9ff8a)",
    color: "#07130d",
    border: "1px solid rgba(124,255,74,0.4)"
  },

  commandBar: {
    background: "rgba(7,19,13,0.92)",
    border: "1px solid rgba(124,255,74,0.14)",
    borderRadius: "28px",
    padding: "16px",
    marginBottom: "22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
    flexWrap: "wrap",
    boxShadow: "0 18px 45px rgba(0,0,0,0.22)"
  },

  controlLabel: {
    margin: "0 0 8px",
    color: "rgba(255,255,255,0.55)",
    fontSize: "12px",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: "1px"
  },

  filterGroup: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap"
  },

  filterButton: {
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(255,255,255,0.10)",
    padding: "12px 15px",
    borderRadius: "15px",
    cursor: "pointer",
    fontWeight: "900"
  },

  filterActive: {
    background: "linear-gradient(135deg,#7cff4a,#b9ff8a)",
    color: "#07130d",
    border: "1px solid rgba(124,255,74,0.50)",
    boxShadow: "0 0 28px rgba(124,255,74,0.20)"
  },

  refreshButton: {
    background: "linear-gradient(135deg,#7cff4a,#b9ff8a)",
    color: "#07130d",
    border: "none",
    padding: "13px 18px",
    borderRadius: "15px",
    cursor: "pointer",
    fontWeight: "900",
    boxShadow: "0 0 28px rgba(124,255,74,0.18)"
  },

  compareGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "16px",
    marginBottom: "22px"
  },

  indicatorsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
    gap: "16px",
    marginBottom: "22px"
  },

  commandCenterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
    gap: "22px",
    marginBottom: "22px"
  },

  mainChartPanel: {
    background: "rgba(7,19,13,0.94)",
    border: "1px solid rgba(124,255,74,0.14)",
    borderRadius: "32px",
    padding: "26px",
    boxShadow: "0 22px 60px rgba(0,0,0,0.24)",
    color: "white",
    minHeight: "470px",
    minWidth: 0
  },

  chartTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    flexWrap: "wrap"
  },

  chartTabs: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap"
  },

  chartTab: {
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(255,255,255,0.10)",
    padding: "10px 12px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900",
    fontSize: "12px"
  },

  chartTabActive: {
    background: "rgba(124,255,74,0.14)",
    color: "#b9ff8a",
    border: "1px solid rgba(124,255,74,0.34)"
  },

  healthPanel: {
    background:
      "radial-gradient(circle at top right,rgba(124,255,74,0.13),transparent 35%), rgba(7,19,13,0.96)",
    border: "1px solid rgba(124,255,74,0.16)",
    borderRadius: "32px",
    padding: "26px",
    color: "white",
    boxShadow: "0 22px 60px rgba(0,0,0,0.24)"
  },

  healthCircle: {
    width: "190px",
    height: "190px",
    borderRadius: "50%",
    border: "10px solid #7cff4a",
    margin: "30px auto 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    fontSize: "26px",
    fontWeight: "900",
    boxShadow: "0 0 55px rgba(124,255,74,0.35)"
  },

  healthText: {
    color: "rgba(255,255,255,0.68)",
    lineHeight: "1.6",
    textAlign: "center"
  },

  healthList: {
    marginTop: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },

  miniMetric: {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(124,255,74,0.12)",
    borderRadius: "16px",
    padding: "13px",
    display: "flex",
    justifyContent: "space-between"
  },

  middleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))",
    gap: "22px",
    marginBottom: "22px"
  },

  executivePanel: {
    background:
      "radial-gradient(circle at top right,rgba(124,255,74,0.13),transparent 35%), rgba(7,19,13,0.96)",
    border: "1px solid rgba(124,255,74,0.14)",
    borderRadius: "32px",
    padding: "26px",
    color: "white"
  },

  insightsPanel: {
    background:
      "radial-gradient(circle at top right,rgba(250,204,21,0.12),transparent 35%), rgba(7,19,13,0.96)",
    border: "1px solid rgba(124,255,74,0.14)",
    borderRadius: "32px",
    padding: "26px",
    color: "white"
  },

  centralBox: {
    display: "grid",
    gap: "10px",
    marginBottom: "22px"
  },

  insightsList: {
    display: "grid",
    gap: "12px"
  },

  insightItem: {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(124,255,74,0.12)",
    borderRadius: "18px",
    padding: "15px"
  },

  insightType: {
    display: "inline-block",
    color: "#07130d",
    background: "#b9ff8a",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900",
    marginBottom: "8px"
  }
};

export default BIAnalytics;