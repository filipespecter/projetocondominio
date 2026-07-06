import { useEffect, useState } from "react";
import { registrarAuditoria } from "../../Services/auditoriaService";

function AvisosMorador() {
  const [avisos, setAvisos] = useState([]);
  const [busca, setBusca] = useState("");
  const [filtroPrioridade, setFiltroPrioridade] = useState("Todos");

  useEffect(() => {
    carregarAvisos();

    const interval = setInterval(() => {
      carregarAvisos();
    }, 1000);

    window.addEventListener("storage", carregarAvisos);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", carregarAvisos);
    };
  }, []);

  function lerStorage(chave) {
    try {
      return JSON.parse(localStorage.getItem(chave)) || [];
    } catch {
      return [];
    }
  }

  function salvarStorage(chave, dados) {
    localStorage.setItem(chave, JSON.stringify(dados));
  }

  function carregarAvisos() {
    const avisosOficiais = lerStorage("avisos").map((item) => ({
      ...item,
      origem: "Síndico",
      tipo: "Aviso",
      status: item.status || "Publicado",
      lida: item.lidaMorador || false
    }));

    const notificacoesMorador = lerStorage("notificacoesMorador").map((item) => ({
      ...item,
      titulo: item.titulo || "Notificação",
      descricao: item.descricao || item.mensagem || "",
      prioridade: item.prioridade || "Normal",
      origem: "Síndico",
      tipo: item.tipo || "Notificação",
      status: item.status || "Novo",
      lida: item.lida || false
    }));

    const sugestoesRespondidas = lerStorage("sugestoes_reclamacoes")
      .filter((item) => item.respostaSindico || item.respostasSindico?.length > 0)
      .map((item) => ({
        ...item,
        titulo: item.titulo || item.tipoRegistro || item.tipo || "Resposta do síndico",
        descricao: item.descricao || item.mensagem || "Solicitação respondida pelo síndico.",
        prioridade: item.prioridade || "Normal",
        origem: "Síndico",
        tipo: item.tipoRegistro || item.tipo || "Resposta",
        status: item.status || "Respondido",
        respostaSindico:
          item.respostaSindico ||
          item.respostasSindico?.[item.respostasSindico.length - 1]?.texto ||
          "",
        data: item.dataResposta || item.data || item.criadoEm || "",
        lida: item.lidaMorador || false
      }));

    const lista = [
      ...avisosOficiais,
      ...notificacoesMorador,
      ...sugestoesRespondidas
    ];

    const semDuplicados = lista.filter(
      (item, index, self) =>
        index === self.findIndex(
          (x) => String(x.tipo || x.categoria) + String(x.id) === String(item.tipo || item.categoria) + String(item.id)
        )
    );

    setAvisos(semDuplicados.sort((a, b) => Number(b.id) - Number(a.id)));
  }

  function normalizarPrioridade(prioridade) {
    return prioridade ? prioridade.toLowerCase() : "normal";
  }

  function obterPrioridade(prioridade) {
    const valor = normalizarPrioridade(prioridade);

    if (valor === "urgente" || valor === "alta") {
      return {
        texto: "Urgente",
        fundo: "#fee2e2",
        cor: "#991b1b",
        icone: "🚨"
      };
    }

    if (valor === "importante" || valor === "média" || valor === "media") {
      return {
        texto: "Importante",
        fundo: "#fef3c7",
        cor: "#92400e",
        icone: "⚠️"
      };
    }

    return {
      texto: "Normal",
      fundo: "#f3e8ff",
      cor: "#7c3aed",
      icone: "📢"
    };
  }

  function marcarComoLido(item) {
    const avisosOficiais = lerStorage("avisos").map((aviso) =>
      aviso.id === item.id
        ? {
            ...aviso,
            lidaMorador: true,
            lidaEm: new Date().toISOString()
          }
        : aviso
    );

    salvarStorage("avisos", avisosOficiais);

    const notificacoes = lerStorage("notificacoesMorador").map((notificacao) =>
      notificacao.id === item.id
        ? {
            ...notificacao,
            lida: true,
            lidaEm: new Date().toISOString()
          }
        : notificacao
    );

    salvarStorage("notificacoesMorador", notificacoes);

    const sugestoes = lerStorage("sugestoes_reclamacoes").map((registro) =>
      registro.id === item.id
        ? {
            ...registro,
            lidaMorador: true,
            lidaMoradorEm: new Date().toISOString()
          }
        : registro
    );

    salvarStorage("sugestoes_reclamacoes", sugestoes);

    registrarAuditoria({
      acao: "Morador marcou aviso como lido",
      modulo: "Avisos Morador",
      detalhes: item.titulo || "Aviso lido",
      referenciaId: item.id
    });

    carregarAvisos();
  }

  const urgentes = avisos.filter(
    (a) => obterPrioridade(a.prioridade).texto === "Urgente"
  );

  const importantes = avisos.filter(
    (a) => obterPrioridade(a.prioridade).texto === "Importante"
  );

  const normais = avisos.filter(
    (a) => obterPrioridade(a.prioridade).texto === "Normal"
  );

  const avisosFiltrados = avisos.filter((item) => {
    const texto = busca.toLowerCase();

    const correspondeBusca =
      item.titulo?.toLowerCase().includes(texto) ||
      item.descricao?.toLowerCase().includes(texto) ||
      item.prioridade?.toLowerCase().includes(texto) ||
      item.data?.toLowerCase().includes(texto) ||
      item.status?.toLowerCase().includes(texto) ||
      item.origem?.toLowerCase().includes(texto) ||
      item.tipo?.toLowerCase().includes(texto);

    const prioridade = obterPrioridade(item.prioridade).texto;

    const correspondePrioridade =
      filtroPrioridade === "Todos" || prioridade === filtroPrioridade;

    return correspondeBusca && correspondePrioridade;
  });

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div>
          <span style={styles.heroBadge}>📢 Comunicação oficial</span>

          <h1 style={styles.title}>Avisos do Condomínio</h1>

          <p style={styles.subtitle}>
            Acompanhe comunicados importantes, respostas do síndico,
            alertas e informações publicadas pela administração.
          </p>
        </div>

        <div style={styles.heroPanel}>
          <p style={styles.heroLabel}>Total de avisos</p>

          <h3 style={styles.heroNumber}>{avisos.length}</h3>

          <span style={styles.heroStatus}>Comunicados ativos</span>
        </div>
      </div>

      <div style={styles.resumeGrid}>
        <div style={styles.cardPrimary}>
          <div>
            <p style={styles.cardLabelLight}>Total de avisos</p>

            <h2 style={styles.cardNumberLight}>{avisos.length}</h2>

            <span style={styles.cardHintLight}>comunicados publicados</span>
          </div>

          <div style={styles.cardIconLight}>📢</div>
        </div>

        <div style={styles.resumeCard}>
          <div style={styles.cardIconYellow}>⚠️</div>

          <div>
            <p style={styles.resumeLabel}>Importantes</p>

            <h2 style={styles.resumeNumberYellow}>{importantes.length}</h2>
          </div>
        </div>

        <div style={styles.resumeCard}>
          <div style={styles.cardIconRed}>🚨</div>

          <div>
            <p style={styles.resumeLabel}>Urgentes</p>

            <h2 style={styles.resumeNumberRed}>{urgentes.length}</h2>
          </div>
        </div>

        <div style={styles.resumeCard}>
          <div style={styles.cardIconGreen}>✅</div>

          <div>
            <p style={styles.resumeLabel}>Normais</p>

            <h2 style={styles.resumeNumberGreen}>{normais.length}</h2>
          </div>
        </div>
      </div>

      <div style={styles.listCard}>
        <div style={styles.listHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Comunicados publicados</h2>

            <p style={styles.sectionSubtitle}>
              Consulte avisos enviados pelo síndico e respostas das suas solicitações.
            </p>
          </div>

          <div style={styles.filters}>
            <input
              placeholder="Buscar aviso..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={styles.search}
            />

            <select
              value={filtroPrioridade}
              onChange={(e) => setFiltroPrioridade(e.target.value)}
              style={styles.filter}
            >
              <option>Todos</option>
              <option>Normal</option>
              <option>Importante</option>
              <option>Urgente</option>
            </select>
          </div>
        </div>

        {avisosFiltrados.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>📭</div>

            <h3 style={styles.emptyTitle}>Nenhum aviso encontrado</h3>

            <p style={styles.emptyText}>
              Não existem avisos cadastrados ou filtrados no momento.
            </p>
          </div>
        ) : (
          <div style={styles.list}>
            {avisosFiltrados.map((item) => {
              const prioridade = obterPrioridade(item.prioridade);

              return (
                <div key={`${item.tipo || "aviso"}-${item.id}`} style={styles.card}>
                  <div style={styles.cardTop}>
                    <div style={styles.noticeIcon}>{prioridade.icone}</div>

                    <div style={styles.noticeContent}>
                      <div style={styles.badges}>
                        <span
                          style={{
                            ...styles.priority,
                            background: prioridade.fundo,
                            color: prioridade.cor
                          }}
                        >
                          {prioridade.texto}
                        </span>

                        <span style={styles.dateBadge}>
                          📅 {item.data || "Sem data"}
                        </span>

                        <span style={styles.originBadge}>
                          {item.origem || "Administração"}
                        </span>

                        <span style={styles.statusBadge}>
                          {item.status || "Publicado"}
                        </span>

                        {!item.lida && (
                          <span style={styles.newBadge}>
                            Novo
                          </span>
                        )}
                      </div>

                      <h2 style={styles.cardTitle}>{item.titulo}</h2>

                      <p style={styles.description}>{item.descricao}</p>

                      {item.respostaSindico && (
                        <div style={styles.responseBox}>
                          <strong>Resposta do síndico:</strong>

                          <p>{item.respostaSindico}</p>
                        </div>
                      )}

                      {!item.lida && (
                        <button
                          style={styles.readButton}
                          onClick={() => marcarComoLido(item)}
                        >
                          Marcar como lido
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    fontFamily: "Arial",
    color: "#111827",
    position: "relative"
  },

  hero: {
    background:
      "linear-gradient(135deg,#2e1065,#4c1d95,#7c3aed)",
    borderRadius: "30px",
    padding: "32px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "28px",
    marginBottom: "26px",
    boxShadow:
      "0 22px 55px rgba(124,58,237,0.24), 0 0 38px rgba(168,85,247,0.12)",
    border: "1px solid rgba(255,255,255,0.18)"
  },

  heroBadge: {
    background: "rgba(255,255,255,0.14)",
    padding: "10px 14px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "800",
    display: "inline-block",
    marginBottom: "15px"
  },

  title: {
    margin: 0,
    fontSize: "36px",
    letterSpacing: "-0.5px"
  },

  subtitle: {
    margin: "10px 0 0",
    color: "rgba(255,255,255,0.78)",
    maxWidth: "680px",
    lineHeight: "1.5"
  },

  heroPanel: {
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: "24px",
    padding: "22px",
    minWidth: "230px",
    textAlign: "center",
    backdropFilter: "blur(12px)"
  },

  heroLabel: {
    margin: 0,
    color: "rgba(255,255,255,0.68)",
    fontSize: "13px"
  },

  heroNumber: {
    margin: "8px 0 12px",
    color: "white",
    fontSize: "38px"
  },

  heroStatus: {
    background: "#ede9fe",
    color: "#6d28d9",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  resumeGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "18px",
    marginBottom: "26px"
  },

  cardPrimary: {
    background:
      "linear-gradient(135deg,#4c1d95,#7c3aed)",
    borderRadius: "24px",
    padding: "24px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow:
      "0 16px 36px rgba(124,58,237,0.24), 0 0 28px rgba(168,85,247,0.12)"
  },

  cardLabelLight: {
    margin: 0,
    color: "rgba(255,255,255,0.75)",
    fontSize: "14px"
  },

  cardNumberLight: {
    margin: "10px 0 2px",
    color: "white",
    fontSize: "38px"
  },

  cardHintLight: {
    color: "rgba(255,255,255,0.72)",
    fontSize: "13px"
  },

  cardIconLight: {
    width: "58px",
    height: "58px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.16)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "29px"
  },

  resumeCard: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.08),transparent 34%), white",
    borderRadius: "24px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow:
      "0 16px 40px rgba(88,28,135,0.08)",
    border: "1px solid #ede9fe"
  },

  cardIconYellow: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#fef3c7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px"
  },

  cardIconRed: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#fee2e2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px"
  },

  cardIconGreen: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#f3e8ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px"
  },

  resumeLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px"
  },

  resumeNumberYellow: {
    margin: "8px 0 0",
    color: "#92400e",
    fontSize: "34px"
  },

  resumeNumberRed: {
    margin: "8px 0 0",
    color: "#dc2626",
    fontSize: "34px"
  },

  resumeNumberGreen: {
    margin: "8px 0 0",
    color: "#7c3aed",
    fontSize: "34px"
  },

  listCard: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.08),transparent 34%), white",
    borderRadius: "28px",
    padding: "26px",
    boxShadow:
      "0 18px 45px rgba(88,28,135,0.09)",
    border: "1px solid #ede9fe"
  },

  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "22px"
  },

  sectionTitle: {
    margin: 0,
    color: "#4c1d95",
    fontSize: "24px"
  },

  sectionSubtitle: {
    margin: "7px 0 0",
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "1.5"
  },

  filters: {
    display: "flex",
    gap: "10px"
  },

  search: {
    padding: "13px 14px",
    borderRadius: "15px",
    border: "1px solid #c4b5fd",
    outline: "none",
    background: "#fbfaff",
    minWidth: "230px"
  },

  filter: {
    padding: "13px 14px",
    borderRadius: "15px",
    border: "1px solid #c4b5fd",
    outline: "none",
    background: "#fbfaff"
  },

  empty: {
    background: "#fbfaff",
    border: "1px dashed #c4b5fd",
    borderRadius: "22px",
    padding: "45px",
    textAlign: "center"
  },

  emptyIcon: {
    fontSize: "42px",
    marginBottom: "12px"
  },

  emptyTitle: {
    margin: 0,
    color: "#111827"
  },

  emptyText: {
    margin: "8px 0 0",
    color: "#6b7280"
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "18px"
  },

  card: {
    background: "#fbfaff",
    border: "1px solid #ddd6fe",
    borderRadius: "24px",
    padding: "22px",
    boxShadow:
      "0 10px 25px rgba(15,23,42,0.04)"
  },

  cardTop: {
    display: "flex",
    gap: "18px",
    alignItems: "flex-start"
  },

  noticeIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "20px",
    background: "white",
    border: "1px solid #ede9fe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px",
    flexShrink: 0
  },

  noticeContent: {
    flex: 1
  },

  badges: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "10px"
  },

  priority: {
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  dateBadge: {
    background: "#faf5ff",
    color: "#6d28d9",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  originBadge: {
    background: "#ecfdf5",
    color: "#7c3aed",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  statusBadge: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  newBadge: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  cardTitle: {
    margin: "0 0 10px",
    color: "#111827",
    fontSize: "22px"
  },

  description: {
    color: "#374151",
    lineHeight: "1.6",
    margin: 0
  },

  responseBox: {
    marginTop: "14px",
    background: "#faf5ff",
    border: "1px solid #ddd6fe",
    borderRadius: "18px",
    padding: "14px",
    color: "#4c1d95"
  },

  readButton: {
    marginTop: "14px",
    background: "#7c3aed",
    color: "white",
    border: "none",
    padding: "11px 14px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "800"
  }
};

export default AvisosMorador;