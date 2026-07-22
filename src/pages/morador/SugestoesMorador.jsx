import { useEffect, useState } from "react";
import { registrarAuditoria } from "../../Services/auditoriaService";
import { criarNotificacao } from "../../Services/notificacaoService";

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

  function registroPertenceAoMorador(item) {
    if (!morador) return false;

    if (item.moradorId && morador.id) {
      return String(item.moradorId) === String(morador.id);
    }

    if (item.moradorUsuario && morador.usuario) {
      return String(item.moradorUsuario) === String(morador.usuario);
    }

    const nomeItem = item.moradorNome || item.morador || "";
    const nomeMorador = morador.nome || "";

    const apartamentoItem = item.apartamento || item.apto || "";
    const apartamentoMorador = morador.apartamento || morador.apto || "";

    return Boolean(
      nomeItem &&
      nomeMorador &&
      apartamentoItem &&
      apartamentoMorador &&
      String(nomeItem).trim().toLowerCase() ===
        String(nomeMorador).trim().toLowerCase() &&
      String(apartamentoItem) === String(apartamentoMorador)
    );
  }

  function registrarAuditoriaSolicitacao(acao, registro, antes = null) {
    registrarAuditoria({
      acao,
      modulo: "Sugestões/Reclamações Morador",
      detalhes: `${registro?.tipoRegistro || "Solicitação"} • ${registro?.titulo || ""}`,
      antes,
      depois: registro,
      referenciaId: registro?.id || null
    });
  }

  function criarNotificacaoSolicitacao(registro) {
    criarNotificacao({
      titulo:
        registro.prioridade === "Urgente"
          ? "Solicitação urgente do morador"
          : "Nova solicitação do morador",
      mensagem: `${registro.moradorNome} enviou: ${registro.titulo}`,
      tipo: registro.tipoRegistro,
      origem: "Morador",
      perfilDestino: "sindico",
      moduloOrigem: "SugestoesMorador",
      referenciaId: registro.id,
      prioridade: registro.prioridade === "Urgente" ? "alta" : "normal"
    });
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
      apartamentoId: registro.apartamentoId || null,
      morador: registro.moradorNome,
      moradorNome: registro.moradorNome,
      moradorId: registro.moradorId || null,
      moradorUsuario: registro.moradorUsuario || "",
      condominioId: registro.condominioId || null,
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
    if (!morador) {
      alert("Sessão do morador não encontrada.");
      return;
    }

    if (
      !form.tipo ||
      !form.categoria ||
      !form.titulo ||
      !form.descricao
    ) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    if (form.titulo.trim().length < 4) {
      alert("Informe um título com pelo menos 4 caracteres.");
      return;
    }

    if (form.descricao.trim().length < 10) {
      alert("Descreva melhor a solicitação com pelo menos 10 caracteres.");
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
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),

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
      apartamento: morador?.apartamento || morador?.apto || "",
      apto: morador?.apartamento || morador?.apto || "",
      apartamentoId: morador?.apartamentoId || null,
      bloco: morador?.bloco || "",
      tipoMorador: morador?.tipoMorador || "Morador",
      moradorPrincipal: Boolean(morador?.moradorPrincipal),
      perfilMorador: morador?.perfilMorador || "dependente",
      condominioId: morador?.condominioId || null,
      nomeCondominio: morador?.nomeCondominio || "",

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
      horaResolucao: "",
      origemModulo: "SugestoesMorador",
      impactaBI: true,
      impactaRelatorio: true,
      criadoEm: agora.toISOString(),
      atualizadoEm: agora.toISOString()
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
    registrarAuditoriaSolicitacao("Enviou solicitação", nova);
    criarNotificacaoSolicitacao(nova);

    limparFormulario();

    alert("Solicitação enviada com sucesso");
  }

  const minhasSolicitacoes =
    ocorrencias.filter((item) => {
      const mesmoMorador =
        item.origem === "morador" &&
        registroPertenceAoMorador(item);

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
        fundo: "#f3e8ff",
        cor: "#7c3aed"
      };
    }

    if (status === "Em Tratamento") {
      return {
        texto: "Em tratamento",
        fundo: "#ede9fe",
        cor: "#6d28d9"
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
                Apto {morador.apartamento || morador.apto || "-"}
              </span>

              <span style={styles.apBadge}>
                {morador.moradorPrincipal ? "Principal" : "Dependente"}
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
            minLength="4"
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
            minLength="10"
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
    minWidth: 0,
    boxSizing: "border-box",
    fontFamily: "Arial",
    color: "#111827",
    position: "relative"
  },

  hero: {
    minWidth: 0,
    flexWrap: "wrap",
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

  userLine: {
    marginTop: "18px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#ede9fe",
    fontSize: "14px",
    fontWeight: "600",
    flexWrap: "wrap"
  },

  statusDot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    background: "#a855f7",
    boxShadow:
      "0 0 0 5px rgba(168,85,247,0.18)"
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
    background: "#ede9fe",
    color: "#6d28d9",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  cards: {
    display: "grid",
    minWidth: 0,
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

  card: {
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
    background: "#f3e8ff",
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
    background: "#ede9fe",
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
    color: "#7c3aed",
    fontSize: "34px"
  },

  cardNumberYellow: {
    margin: "8px 0 0",
    color: "#92400e",
    fontSize: "34px"
  },

  cardNumberBlue: {
    margin: "8px 0 0",
    color: "#7c3aed",
    fontSize: "34px"
  },

  mainGrid: {
    display: "grid",
    minWidth: 0,
    gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,400px),1fr))",
    gap: "24px",
    alignItems: "flex-start"
  },

  formCard: {
    minWidth: 0,
    overflow: "hidden",
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.08),transparent 34%), white",
    borderRadius: "28px",
    padding: "26px",
    boxShadow:
      "0 18px 45px rgba(88,28,135,0.09)",
    border: "1px solid #ede9fe"
  },

  listCard: {
    minWidth: 0,
    overflow: "hidden",
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.08),transparent 34%), white",
    borderRadius: "28px",
    padding: "26px",
    boxShadow:
      "0 18px 45px rgba(88,28,135,0.09)",
    border: "1px solid #ede9fe"
  },

  sectionHeader: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "20px"
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

  sectionBadge: {
    background: "#faf5ff",
    color: "#6d28d9",
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
    minWidth: 0,
    padding: "14px 15px",
    borderRadius: "15px",
    border: "1px solid #c4b5fd",
    outline: "none",
    fontSize: "14px",
    background: "#fbfaff",
    boxSizing: "border-box",
    marginBottom: "15px"
  },

  textarea: {
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
    minHeight: "140px",
    padding: "14px 15px",
    borderRadius: "15px",
    border: "1px solid #c4b5fd",
    outline: "none",
    fontSize: "14px",
    background: "#fbfaff",
    boxSizing: "border-box",
    marginBottom: "16px",
    resize: "vertical",
    fontFamily: "Arial",
    lineHeight: "1.5"
  },

  submitButton: {
    width: "100%",
    background:
      "linear-gradient(135deg,#4c1d95,#7c3aed)",
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
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "20px"
  },

  filters: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px"
  },

  search: {
    width: "100%",
    minWidth: "180px",
    flex: "1 1 210px",
    padding: "13px 14px",
    borderRadius: "15px",
    border: "1px solid #c4b5fd",
    outline: "none",
    background: "#fbfaff",
    boxSizing: "border-box"
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

  timeline: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },

  solicitacaoCard: {
    background: "#fbfaff",
    border: "1px solid #ddd6fe",
    borderRadius: "24px",
    padding: "22px"
  },

  cardTop: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "flex-start",
    marginBottom: "14px"
  },

  badges: {
    display: "flex",
    flexWrap: "wrap",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "10px"
  },

  typeBadge: {
    background: "#ede9fe",
    color: "#6d28d9",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  categoryBadge: {
    background: "#faf5ff",
    color: "#7c3aed",
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
    background: "#faf5ff",
    border: "1px solid #ddd6fe",
    color: "#7c3aed",
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