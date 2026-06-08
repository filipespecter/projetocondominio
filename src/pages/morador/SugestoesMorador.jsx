import { useEffect, useState } from "react";

function SugestoesMorador() {
  const STORAGE_KEY = "sugestoes_reclamacoes";
  const STORAGE_AVISOS_SINDICO = "avisos_sindico";
  const STORAGE_MOVIMENTACOES = "movimentacoes";
  const STORAGE_RELATORIOS = "relatorios_operacionais";

  const estadoInicial = {
    tipo: "Reclamação",
    categoria: "",
    prioridade: "Média",
    titulo: "",
    descricao: ""
  };

  const [morador, setMorador] = useState(null);

  const [ocorrencias, setOcorrencias] = useState(() => {
    return lerStorage(STORAGE_KEY);
  });

  const [form, setForm] = useState(estadoInicial);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");

  useEffect(() => {
    carregarSessao();
    carregarOcorrencias();
  }, []);

  function lerStorage(chave) {
    try {
      const dados = localStorage.getItem(chave);
      return dados ? JSON.parse(dados) : [];
    } catch {
      return [];
    }
  }

  function salvarStorage(chave, dados) {
    localStorage.setItem(chave, JSON.stringify(dados));
  }

  function carregarSessao() {
    const sessao =
      localStorage.getItem("sessaoMorador") ||
      sessionStorage.getItem("sessaoMorador");

    try {
      const usuario = sessao ? JSON.parse(sessao) : null;
      setMorador(usuario);
    } catch {
      setMorador(null);
    }
  }

  function carregarOcorrencias() {
    const data = lerStorage(STORAGE_KEY);
    setOcorrencias(data);
  }

  function limparFormulario() {
    setForm(estadoInicial);
  }

  function registrarAvisoSindico(registro) {
    const avisos = lerStorage(STORAGE_AVISOS_SINDICO);

    const novoAviso = {
      id: registro.id,
      categoria: registro.tipoRegistro,
      origem: "Morador",
      titulo: registro.titulo,
      descricao: registro.descricao,
      apartamento: registro.apartamento,
      morador: registro.moradorNome,
      responsavel: registro.moradorNome,
      status: "Novo",
      respostaSindico: "",
      cienciaSindico: false,
      data: registro.data
    };

    salvarStorage(STORAGE_AVISOS_SINDICO, [
      novoAviso,
      ...avisos
    ]);
  }

  function registrarMovimentacao(registro) {
    const movimentacoes = lerStorage(STORAGE_MOVIMENTACOES);

    const novaMovimentacao = {
      id: Date.now() + 1,
      tipo: registro.tipoRegistro,
      origem: "Morador",
      titulo: registro.titulo,
      descricao: registro.descricao,
      apartamento: registro.apartamento,
      morador: registro.moradorNome,
      data: registro.data,
      hora: registro.hora
    };

    salvarStorage(STORAGE_MOVIMENTACOES, [
      novaMovimentacao,
      ...movimentacoes
    ]);
  }

  function registrarRelatorio(registro) {
    const relatorios = lerStorage(STORAGE_RELATORIOS);

    const novoRelatorio = {
      id: Date.now() + 2,
      tipo: registro.tipoRegistro,
      origem: "Morador",
      titulo: registro.titulo,
      descricao: registro.descricao,
      apartamento: registro.apartamento,
      morador: registro.moradorNome,
      status: registro.status,
      data: registro.data,
      hora: registro.hora
    };

    salvarStorage(STORAGE_RELATORIOS, [
      novoRelatorio,
      ...relatorios
    ]);
  }

  function enviarSolicitacao() {
    if (
      !form.tipo ||
      !form.categoria ||
      !form.titulo ||
      !form.descricao
    ) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    const agora = new Date();

    const nova = {
      id: Date.now(),

      origem: "morador",
      tipoRegistro: form.tipo,
      tipo: form.tipo,
      categoria: form.categoria,
      prioridade: form.prioridade,
      titulo: form.titulo,
      descricao: form.descricao,

      status: "Novo",
      etapa: "aguardando_sindico",

      data: agora.toLocaleDateString("pt-BR"),
      hora: agora.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      }),
      dataCriacao: agora.toLocaleString("pt-BR"),

      moradorId: morador?.id || null,
      moradorNome: morador?.nome || "Morador",
      moradorUsuario: morador?.usuario || "",
      apartamento: morador?.apartamento || "",
      bloco: morador?.bloco || "",

      porteiroId: null,
      porteiroNome: "",
      porteiroUsuario: "",

      lidaPorteiro: false,
      lidaSindico: false,

      observacoesPorteiro: [],
      respostasSindico: [],
      respostaSindico: "",
      sindicoResponsavel: "",
      dataResposta: "",
      dataResolucao: "",
      horaResolucao: ""
    };

    const listaAtualizada = [
      nova,
      ...ocorrencias
    ];

    setOcorrencias(listaAtualizada);
    salvarStorage(STORAGE_KEY, listaAtualizada);

    registrarAvisoSindico(nova);
    registrarMovimentacao(nova);
    registrarRelatorio(nova);

    limparFormulario();

    alert("Solicitação enviada com sucesso");
  }

  const minhasSolicitacoes =
    ocorrencias.filter((item) => {
      const mesmoMorador =
        item.origem === "morador" &&
        (
          item.moradorId === morador?.id ||
          item.moradorUsuario === morador?.usuario ||
          item.apartamento === morador?.apartamento
        );

      if (!mesmoMorador) return false;

      const texto = busca.toLowerCase();

      const correspondeBusca =
        item.titulo?.toLowerCase().includes(texto) ||
        item.descricao?.toLowerCase().includes(texto) ||
        item.categoria?.toLowerCase().includes(texto) ||
        item.tipo?.toLowerCase().includes(texto) ||
        item.tipoRegistro?.toLowerCase().includes(texto) ||
        item.status?.toLowerCase().includes(texto);

      const correspondeStatus =
        filtroStatus === "Todos" ||
        item.status === filtroStatus;

      return correspondeBusca && correspondeStatus;
    });

  const pendentes =
    minhasSolicitacoes.filter(
      (item) =>
        item.status !== "Resolvido" &&
        item.status !== "Resolvida"
    ).length;

  const resolvidas =
    minhasSolicitacoes.filter(
      (item) =>
        item.status === "Resolvido" ||
        item.status === "Resolvida"
    ).length;

  const reclamacoes =
    minhasSolicitacoes.filter(
      (item) =>
        item.tipo === "Reclamação" ||
        item.tipoRegistro === "Reclamação"
    ).length;

  const sugestoes =
    minhasSolicitacoes.filter(
      (item) =>
        item.tipo === "Sugestão" ||
        item.tipoRegistro === "Sugestão"
    ).length;

  function obterStatus(status) {
    if (
      status === "Resolvida" ||
      status === "Resolvido"
    ) {
      return {
        texto: "Resolvida",
        fundo: "#dcfce7",
        cor: "#166534"
      };
    }

    if (status === "Em Tratamento") {
      return {
        texto: "Em tratamento",
        fundo: "#dbeafe",
        cor: "#1d4ed8"
      };
    }

    if (status === "Ciente") {
      return {
        texto: "Ciente",
        fundo: "#fef3c7",
        cor: "#92400e"
      };
    }

    return {
      texto: "Novo",
      fundo: "#fef3c7",
      cor: "#92400e"
    };
  }

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div>
          <span style={styles.heroBadge}>
            💬 Canal do morador
          </span>

          <h1 style={styles.title}>
            Sugestões / Reclamações
          </h1>

          <p style={styles.subtitle}>
            Envie solicitações para o condomínio e acompanhe
            o retorno da administração.
          </p>

          {morador && (
            <div style={styles.userLine}>
              <span style={styles.statusDot}></span>

              <span>
                Morador:{" "}
                <strong>{morador.nome}</strong>
              </span>

              <span style={styles.apBadge}>
                Apto {morador.apartamento || "-"}
              </span>
            </div>
          )}
        </div>

        <div style={styles.heroPanel}>
          <p style={styles.heroLabel}>
            Minhas solicitações
          </p>

          <h3 style={styles.heroNumber}>
            {minhasSolicitacoes.length}
          </h3>

          <span style={styles.heroStatus}>
            Central integrada
          </span>
        </div>
      </div>

      <div style={styles.cards}>
        <div style={styles.cardPrimary}>
          <div>
            <p style={styles.cardLabelLight}>
              Aguardando retorno
            </p>

            <h2 style={styles.cardNumberLight}>
              {pendentes}
            </h2>

            <span style={styles.cardHintLight}>
              encaminhadas ao síndico
            </span>
          </div>

          <div style={styles.cardIconLight}>
            📤
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIconGreen}>
            ✅
          </div>

          <div>
            <p style={styles.cardLabel}>
              Resolvidas
            </p>

            <h2 style={styles.cardNumberGreen}>
              {resolvidas}
            </h2>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIconYellow}>
            ⚠️
          </div>

          <div>
            <p style={styles.cardLabel}>
              Reclamações
            </p>

            <h2 style={styles.cardNumberYellow}>
              {reclamacoes}
            </h2>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIconBlue}>
            💡
          </div>

          <div>
            <p style={styles.cardLabel}>
              Sugestões
            </p>

            <h2 style={styles.cardNumberBlue}>
              {sugestoes}
            </h2>
          </div>
        </div>
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.formCard}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                Nova solicitação
              </h2>

              <p style={styles.sectionSubtitle}>
                Sua mensagem será registrada e encaminhada
                para análise do síndico.
              </p>
            </div>

            <span style={styles.sectionBadge}>
              Envio direto
            </span>
          </div>

          <label style={styles.label}>
            Tipo
          </label>

          <select
            value={form.tipo}
            onChange={(e) =>
              setForm({
                ...form,
                tipo: e.target.value
              })
            }
            style={styles.input}
          >
            <option>Reclamação</option>
            <option>Sugestão</option>
          </select>

          <label style={styles.label}>
            Categoria
          </label>

          <select
            value={form.categoria}
            onChange={(e) =>
              setForm({
                ...form,
                categoria: e.target.value
              })
            }
            style={styles.input}
          >
            <option value="">
              Selecione uma categoria
            </option>
            <option>Barulho</option>
            <option>Limpeza</option>
            <option>Segurança</option>
            <option>Manutenção</option>
            <option>Área comum</option>
            <option>Garagem</option>
            <option>Convivência</option>
            <option>Outros</option>
          </select>

          <label style={styles.label}>
            Prioridade
          </label>

          <select
            value={form.prioridade}
            onChange={(e) =>
              setForm({
                ...form,
                prioridade: e.target.value
              })
            }
            style={styles.input}
          >
            <option>Baixa</option>
            <option>Média</option>
            <option>Alta</option>
            <option>Urgente</option>
          </select>

          <label style={styles.label}>
            Título
          </label>

          <input
            placeholder="Ex: Barulho após as 22h"
            value={form.titulo}
            onChange={(e) =>
              setForm({
                ...form,
                titulo: e.target.value
              })
            }
            style={styles.input}
          />

          <label style={styles.label}>
            Descrição
          </label>

          <textarea
            placeholder="Descreva sua solicitação com detalhes..."
            value={form.descricao}
            onChange={(e) =>
              setForm({
                ...form,
                descricao: e.target.value
              })
            }
            style={styles.textarea}
          />

          <button
            style={styles.submitButton}
            onClick={enviarSolicitacao}
          >
            Enviar ao síndico
          </button>

          <p style={styles.formHint}>
            O porteiro poderá visualizar o registro no livro de
            ocorrências, e o síndico poderá responder pelo painel administrativo.
          </p>
        </div>

        <div style={styles.listCard}>
          <div style={styles.listHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                Minhas solicitações
              </h2>

              <p style={styles.sectionSubtitle}>
                Acompanhe o andamento das suas reclamações e sugestões.
              </p>
            </div>

            <div style={styles.filters}>
              <input
                placeholder="Buscar..."
                value={busca}
                onChange={(e) =>
                  setBusca(e.target.value)
                }
                style={styles.search}
              />

              <select
                value={filtroStatus}
                onChange={(e) =>
                  setFiltroStatus(e.target.value)
                }
                style={styles.filter}
              >
                <option>Todos</option>
                <option>Novo</option>
                <option>Ciente</option>
                <option>Em Tratamento</option>
                <option>Resolvido</option>
              </select>
            </div>
          </div>

          {minhasSolicitacoes.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>
                📭
              </div>

              <h3 style={styles.emptyTitle}>
                Nenhuma solicitação encontrada
              </h3>

              <p style={styles.emptyText}>
                Quando você enviar uma sugestão ou reclamação,
                ela aparecerá aqui.
              </p>
            </div>
          ) : (
            <div style={styles.timeline}>
              {minhasSolicitacoes.map((item) => {
                const status = obterStatus(item.status);

                return (
                  <div
                    key={item.id}
                    style={styles.solicitacaoCard}
                  >
                    <div style={styles.cardTop}>
                      <div>
                        <div style={styles.badges}>
                          <span style={styles.typeBadge}>
                            {item.tipoRegistro || item.tipo}
                          </span>

                          <span style={styles.categoryBadge}>
                            {item.categoria}
                          </span>

                          <span style={styles.priorityBadge}>
                            {item.prioridade}
                          </span>
                        </div>

                        <h3 style={styles.solicitacaoTitle}>
                          {item.titulo}
                        </h3>
                      </div>

                      <span
                        style={{
                          ...styles.statusBadge,
                          background: status.fundo,
                          color: status.cor
                        }}
                      >
                        {status.texto}
                      </span>
                    </div>

                    <p style={styles.description}>
                      {item.descricao}
                    </p>

                    <div style={styles.meta}>
                      <span>
                        📅 {item.data} às {item.hora}
                      </span>

                      <span>
                        🏠 Apto {item.apartamento || "-"}
                      </span>

                      <span>
                        👤 {item.moradorNome || morador?.nome}
                      </span>
                    </div>

                    {item.respostasSindico?.length > 0 ? (
                      <div style={styles.responseBox}>
                        <strong>
                          Resposta do síndico:
                        </strong>

                        <p style={styles.responseText}>
                          {
                            item.respostasSindico[
                              item.respostasSindico.length - 1
                            ].texto
                          }
                        </p>
                      </div>
                    ) : item.respostaSindico ? (
                      <div style={styles.responseBox}>
                        <strong>
                          Resposta do síndico:
                        </strong>

                        <p style={styles.responseText}>
                          {item.respostaSindico}
                        </p>
                      </div>
                    ) : (
                      <div style={styles.waitBox}>
                        Solicitação encaminhada e aguardando retorno.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    fontFamily: "Arial",
    color: "#111827"
  },

  hero: {
    background:
      "linear-gradient(135deg,#0f172a,#1e3a8a,#2563eb)",
    borderRadius: "30px",
    padding: "32px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "28px",
    marginBottom: "26px",
    boxShadow:
      "0 20px 45px rgba(37,99,235,0.25)"
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

  userLine: {
    marginTop: "18px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#dbeafe",
    fontSize: "14px",
    fontWeight: "600",
    flexWrap: "wrap"
  },

  statusDot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    background: "#38bdf8",
    boxShadow:
      "0 0 0 5px rgba(56,189,248,0.16)"
  },

  apBadge: {
    background: "rgba(255,255,255,0.14)",
    padding: "7px 11px",
    borderRadius: "999px",
    color: "white",
    fontWeight: "800",
    fontSize: "12px"
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
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "18px",
    marginBottom: "26px"
  },

  cardPrimary: {
    background:
      "linear-gradient(135deg,#1e3a8a,#2563eb)",
    borderRadius: "24px",
    padding: "24px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow:
      "0 14px 35px rgba(37,99,235,0.2)"
  },

  card: {
    background: "white",
    borderRadius: "24px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow:
      "0 12px 35px rgba(15,23,42,0.07)",
    border: "1px solid #eef2f7"
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

  cardIconGreen: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#dcfce7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px"
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

  cardIconBlue: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#dbeafe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px"
  },

  cardLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px"
  },

  cardNumberGreen: {
    margin: "8px 0 0",
    color: "#166534",
    fontSize: "34px"
  },

  cardNumberYellow: {
    margin: "8px 0 0",
    color: "#92400e",
    fontSize: "34px"
  },

  cardNumberBlue: {
    margin: "8px 0 0",
    color: "#2563eb",
    fontSize: "34px"
  },

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "400px 1fr",
    gap: "24px",
    alignItems: "flex-start"
  },

  formCard: {
    background: "white",
    borderRadius: "28px",
    padding: "26px",
    boxShadow:
      "0 14px 40px rgba(15,23,42,0.08)",
    border: "1px solid #eef2f7"
  },

  listCard: {
    background: "white",
    borderRadius: "28px",
    padding: "26px",
    boxShadow:
      "0 14px 40px rgba(15,23,42,0.08)",
    border: "1px solid #eef2f7"
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "20px"
  },

  sectionTitle: {
    margin: 0,
    color: "#1e3a8a",
    fontSize: "24px"
  },

  sectionSubtitle: {
    margin: "7px 0 0",
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "1.5"
  },

  sectionBadge: {
    background: "#eff6ff",
    color: "#1d4ed8",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    whiteSpace: "nowrap"
  },

  label: {
    display: "block",
    marginBottom: "8px",
    color: "#374151",
    fontSize: "13px",
    fontWeight: "800"
  },

  input: {
    width: "100%",
    padding: "14px 15px",
    borderRadius: "15px",
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: "14px",
    background: "#f9fafb",
    boxSizing: "border-box",
    marginBottom: "15px"
  },

  textarea: {
    width: "100%",
    minHeight: "140px",
    padding: "14px 15px",
    borderRadius: "15px",
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: "14px",
    background: "#f9fafb",
    boxSizing: "border-box",
    marginBottom: "16px",
    resize: "vertical",
    fontFamily: "Arial",
    lineHeight: "1.5"
  },

  submitButton: {
    width: "100%",
    background:
      "linear-gradient(135deg,#1e3a8a,#2563eb)",
    color: "white",
    border: "none",
    padding: "15px",
    borderRadius: "16px",
    cursor: "pointer",
    fontWeight: "800",
    boxShadow:
      "0 12px 25px rgba(37,99,235,0.22)"
  },

  formHint: {
    margin: "14px 0 0",
    color: "#6b7280",
    fontSize: "13px",
    lineHeight: "1.5",
    textAlign: "center"
  },

  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "20px"
  },

  filters: {
    display: "flex",
    gap: "10px"
  },

  search: {
    padding: "13px 14px",
    borderRadius: "15px",
    border: "1px solid #d1d5db",
    outline: "none",
    background: "#f9fafb",
    minWidth: "210px"
  },

  filter: {
    padding: "13px 14px",
    borderRadius: "15px",
    border: "1px solid #d1d5db",
    outline: "none",
    background: "#f9fafb"
  },

  empty: {
    background: "#f9fafb",
    border: "1px dashed #d1d5db",
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

  timeline: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },

  solicitacaoCard: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    padding: "22px"
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "flex-start",
    marginBottom: "14px"
  },

  badges: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "10px"
  },

  typeBadge: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  categoryBadge: {
    background: "#f0fdf4",
    color: "#166534",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  priorityBadge: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  solicitacaoTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "20px"
  },

  statusBadge: {
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    whiteSpace: "nowrap"
  },

  description: {
    color: "#374151",
    lineHeight: "1.6",
    margin: "0 0 15px"
  },

  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    color: "#6b7280",
    fontSize: "13px",
    marginBottom: "14px"
  },

  responseBox: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
    padding: "14px",
    borderRadius: "16px",
    fontSize: "14px"
  },

  responseText: {
    margin: "8px 0 0",
    color: "#374151",
    lineHeight: "1.5"
  },

  waitBox: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    color: "#92400e",
    padding: "14px",
    borderRadius: "16px",
    fontSize: "14px",
    fontWeight: "700"
  }
};

export default SugestoesMorador;