import { useState } from "react";
import { registrarAuditoria } from "../../Services/auditoriaService";
import { criarNotificacao } from "../../Services/notificacaoService";

function OcorrenciasPorteiro() {
  const STORAGE_KEY = "ocorrencias";
  const STORAGE_AVISOS_SINDICO = "avisos_sindico";
  const STORAGE_MOVIMENTACOES = "movimentacoes";
  const STORAGE_RELATORIOS = "relatorios_operacionais";
  const STORAGE_HISTORICO = "historico_ocorrencias";

  const estadoInicial = {
    categoria: "",
    prioridade: "Média",
    titulo: "",
    apartamento: "",
    apartamentoId: null,
    bloco: "",
    torre: "",
    unidade: "",
    descricao: "",
    turno: "",
    dataPlantao: ""
  };

  const [ocorrencias, setOcorrencias] = useState(() => {
    return lerStorage(STORAGE_KEY);
  });

  const [novaOcorrencia, setNovaOcorrencia] = useState(estadoInicial);
  const [busca, setBusca] = useState("");
  const [abaAtiva, setAbaAtiva] = useState("encaminhadas");

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

  function obterPorteiroLogado() {
    const sessao =
      localStorage.getItem("sessaoPorteiro") ||
      sessionStorage.getItem("sessaoPorteiro") ||
      localStorage.getItem("usuarioPorteiro") ||
      sessionStorage.getItem("usuarioPorteiro");

    if (!sessao) return null;

    try {
      return JSON.parse(sessao);
    } catch {
      return null;
    }
  }

  function obterPerfilCondominio() {
    try {
      const perfil =
        JSON.parse(localStorage.getItem("perfil_condominio")) ||
        JSON.parse(localStorage.getItem("configuracoes")) ||
        {};

      return {
        condominioId: perfil.id || perfil.condominioId || null,
        nomeCondominio: perfil.nomeCondominio || ""
      };
    } catch {
      return {
        condominioId: null,
        nomeCondominio: ""
      };
    }
  }

  function turnoAtual() {
    const hora = new Date().getHours();

    if (hora >= 6 && hora < 12) return "Manhã";
    if (hora >= 12 && hora < 18) return "Tarde";
    return "Noite";
  }

  function validarOcorrencia() {
    const titulo = String(novaOcorrencia.titulo || "").trim();
    const descricao = String(novaOcorrencia.descricao || "").trim();

    if (!novaOcorrencia.categoria) {
      alert("Selecione a categoria da ocorrência.");
      return false;
    }

    if (!novaOcorrencia.prioridade) {
      alert("Selecione a prioridade da ocorrência.");
      return false;
    }

    if (titulo.length < 4) {
      alert("Informe um título válido com pelo menos 4 caracteres.");
      return false;
    }

    if (descricao.length < 10) {
      alert("Descreva melhor a ocorrência. Use pelo menos 10 caracteres.");
      return false;
    }

    return true;
  }

  function registrarAuditoriaOcorrencia({
    acao,
    detalhes,
    antes = null,
    depois = null,
    referenciaId = null
  }) {
    registrarAuditoria({
      acao,
      modulo: "Livro de Ocorrências",
      detalhes,
      antes,
      depois,
      referenciaId
    });
  }

  function criarNotificacaoOcorrencia({
    titulo,
    mensagem,
    referenciaId = null,
    prioridade = "normal",
    perfilDestino = "sindico"
  }) {
    criarNotificacao({
      titulo,
      mensagem,
      tipo: "Ocorrência",
      origem: "Livro de Ocorrências",
      perfilDestino,
      moduloOrigem: "LivroOcorrencias",
      referenciaId,
      prioridade
    });
  }

  function registrarHistoricoOcorrencia(acao, registro, antes = null) {
    const historico = lerStorage(STORAGE_HISTORICO);

    const novoHistorico = {
      id: Date.now() + 3,
      ocorrenciaId: registro.id,
      acao,
      origem: "Porteiro",
      titulo: registro.titulo,
      categoria: registro.categoria,
      prioridade: registro.prioridade,
      descricao: registro.descricao,
      apartamento: registro.apartamento,
      apartamentoId: registro.apartamentoId || null,
      bloco: registro.bloco || "",
      torre: registro.torre || "",
      unidade: registro.unidade || "",
      condominioId: registro.condominioId || null,
      nomeCondominio: registro.nomeCondominio || "",
      status: registro.status,
      porteiroId: registro.porteiroId,
      porteiroNome: registro.porteiroNome,
      porteiroUsuario: registro.porteiroUsuario,
      dataPlantao: registro.dataPlantao,
      turno: registro.turno,
      antes,
      depois: registro,
      registradoEm: new Date().toLocaleString("pt-BR"),
      criadoEm: new Date().toISOString(),
      origemModulo: "LivroOcorrencias"
    };

    salvarStorage(STORAGE_HISTORICO, [novoHistorico, ...historico]);
  }

  function limparFormulario() {
    setNovaOcorrencia(estadoInicial);
  }

  function registrarAvisoSindico(registro) {
    const avisos = lerStorage(STORAGE_AVISOS_SINDICO);

    const novoAviso = {
      id: registro.id,
      categoria: "Ocorrência",
      origem: "Porteiro",
      titulo: registro.titulo,
      descricao: registro.descricao,
      apartamento: registro.apartamento,
      apartamentoId: registro.apartamentoId || null,
      bloco: registro.bloco || "",
      torre: registro.torre || "",
      unidade: registro.unidade || "",
      condominioId: registro.condominioId || null,
      nomeCondominio: registro.nomeCondominio || "",
      morador: "",
      responsavel: registro.porteiroNome,
      porteiroId: registro.porteiroId,
      porteiroUsuario: registro.porteiroUsuario,
      turno: registro.turno,
      dataPlantao: registro.dataPlantao,
      status: registro.status,
      respostaSindico: "",
      cienciaSindico: false,
      data: registro.data,
      origemModulo: "LivroOcorrencias",
      impactaBI: true,
      impactaRelatorio: true,
      exibirNaCentral: true
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
      tipo: "Ocorrência",
      origem: "Porteiro",
      titulo: registro.titulo,
      descricao: registro.descricao,
      apartamento: registro.apartamento,
      apartamentoId: registro.apartamentoId || null,
      bloco: registro.bloco || "",
      torre: registro.torre || "",
      unidade: registro.unidade || "",
      condominioId: registro.condominioId || null,
      nomeCondominio: registro.nomeCondominio || "",
      responsavel: registro.porteiroNome,
      porteiroId: registro.porteiroId,
      porteiroUsuario: registro.porteiroUsuario,
      turno: registro.turno,
      dataPlantao: registro.dataPlantao,
      status: registro.status,
      data: registro.data,
      hora: registro.hora,
      origemModulo: "LivroOcorrencias",
      impactaBI: true
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
      tipo: "Ocorrência",
      origem: "Porteiro",
      titulo: registro.titulo,
      descricao: registro.descricao,
      apartamento: registro.apartamento,
      apartamentoId: registro.apartamentoId || null,
      bloco: registro.bloco || "",
      torre: registro.torre || "",
      unidade: registro.unidade || "",
      condominioId: registro.condominioId || null,
      nomeCondominio: registro.nomeCondominio || "",
      responsavel: registro.porteiroNome,
      status: registro.status,
      prioridade: registro.prioridade,
      categoria: registro.categoria,
      data: registro.data,
      hora: registro.hora,
      origemModulo: "LivroOcorrencias",
      impactaRelatorio: true
    };

    salvarStorage(STORAGE_RELATORIOS, [
      novoRelatorio,
      ...relatorios
    ]);
  }

  function registrarOcorrencia() {
    if (!validarOcorrencia()) {
      return;
    }

    const porteiro = obterPorteiroLogado();
    const perfilCondominio = obterPerfilCondominio();
    const agora = new Date();

    const nova = {
      id: Date.now(),
      origem: "porteiro",
      origemModulo: "LivroOcorrencias",
      tipoRegistro: "Ocorrência",
      categoria: novaOcorrencia.categoria,
      prioridade: novaOcorrencia.prioridade,
      titulo: String(novaOcorrencia.titulo || "").trim(),
      apartamento: String(novaOcorrencia.apartamento || "").trim(),
      apartamentoId: novaOcorrencia.apartamentoId || null,
      bloco: novaOcorrencia.bloco || "",
      torre: novaOcorrencia.torre || "",
      unidade: novaOcorrencia.unidade || "",
      descricao: String(novaOcorrencia.descricao || "").trim(),

      status: "Encaminhada",
      etapa: "encaminhada_ao_sindico",

      condominioId: perfilCondominio.condominioId,
      nomeCondominio: perfilCondominio.nomeCondominio,

      impactaBI: true,
      impactaRelatorio: true,
      exibirNaCentral: true,

      data: agora.toLocaleDateString("pt-BR"),
      hora: agora.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      }),
      criadoEm: agora.toISOString(),
      atualizadoEm: agora.toISOString(),
      dataPlantao:
        novaOcorrencia.dataPlantao ||
        agora.toLocaleDateString("pt-BR"),
      turno: novaOcorrencia.turno || porteiro?.turno || turnoAtual(),

      porteiroId: porteiro?.id || null,
      porteiroNome: porteiro?.nome || "Porteiro",
      porteiroUsuario: porteiro?.usuario || "",

      moradorId: null,
      moradorNome: "",
      apartamentoMorador: "",

      lidaPorteiro: true,
      lidaSindico: false,

      observacoesPorteiro: [],
      respostasSindico: [],
      respostaSindico: "",
      dataResolucao: "",
      horaResolucao: "",
      sindicoId: null,
      sindicoNome: ""
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
    registrarHistoricoOcorrencia("criação", nova);

    registrarAuditoriaOcorrencia({
      acao: "Criou ocorrência",
      detalhes: `${nova.titulo} • ${nova.categoria} • ${nova.prioridade}`,
      depois: nova,
      referenciaId: nova.id
    });

    criarNotificacaoOcorrencia({
      titulo:
        nova.prioridade === "Urgente"
          ? "Ocorrência urgente registrada"
          : "Nova ocorrência registrada",
      mensagem: `${nova.titulo} • ${nova.porteiroNome}`,
      referenciaId: nova.id,
      prioridade: nova.prioridade === "Urgente" ? "alta" : "normal"
    });

    limparFormulario();
    setAbaAtiva("encaminhadas");

    alert("Ocorrência registrada e encaminhada ao síndico");
  }

  function excluirRegistro(id) {
    const confirmar = window.confirm(
      "Deseja excluir este registro do livro de ocorrências?"
    );

    if (!confirmar) return;

    const ocorrenciaExcluida = ocorrencias.find((item) => item.id === id);

    const listaAtualizada = ocorrencias.filter(
      (item) => item.id !== id
    );

    setOcorrencias(listaAtualizada);
    salvarStorage(STORAGE_KEY, listaAtualizada);

    const avisos = lerStorage(STORAGE_AVISOS_SINDICO).filter(
      (item) => item.id !== id
    );

    salvarStorage(STORAGE_AVISOS_SINDICO, avisos);

    if (ocorrenciaExcluida) {
      const registroExclusao = {
        ...ocorrenciaExcluida,
        status: "Excluída",
        atualizadoEm: new Date().toISOString()
      };

      registrarHistoricoOcorrencia("exclusão", registroExclusao, ocorrenciaExcluida);
      registrarMovimentacao(registroExclusao);
      registrarRelatorio(registroExclusao);

      registrarAuditoriaOcorrencia({
        acao: "Excluiu ocorrência",
        detalhes: `${ocorrenciaExcluida.titulo} • ${ocorrenciaExcluida.categoria}`,
        antes: ocorrenciaExcluida,
        depois: registroExclusao,
        referenciaId: id
      });

      criarNotificacaoOcorrencia({
        titulo: "Ocorrência removida",
        mensagem: `${ocorrenciaExcluida.titulo} foi removida pelo porteiro.`,
        referenciaId: id,
        prioridade: "alta"
      });
    }
  }

  function correspondeBusca(item) {
    const texto = busca.toLowerCase();

    return (
      item.titulo?.toLowerCase().includes(texto) ||
      item.descricao?.toLowerCase().includes(texto) ||
      item.categoria?.toLowerCase().includes(texto) ||
      item.prioridade?.toLowerCase().includes(texto) ||
      item.status?.toLowerCase().includes(texto) ||
      item.porteiroNome?.toLowerCase().includes(texto) ||
      item.moradorNome?.toLowerCase().includes(texto) ||
      String(item.apartamento || "").toLowerCase().includes(texto)
    );
  }

  const encaminhadas = ocorrencias.filter(
    (item) =>
      !["resolvido", "resolvida"].includes(
        String(item.status || "").toLowerCase()
      ) &&
      correspondeBusca(item)
  );

  const historico = ocorrencias.filter(
    (item) =>
      ["resolvido", "resolvida"].includes(
        String(item.status || "").toLowerCase()
      ) &&
      correspondeBusca(item)
  );

  const totalEncaminhadas = ocorrencias.filter(
    (item) =>
      !["resolvido", "resolvida"].includes(
        String(item.status || "").toLowerCase()
      )
  ).length;

  const totalResolvidas = ocorrencias.filter(
    (item) =>
      ["resolvido", "resolvida"].includes(
        String(item.status || "").toLowerCase()
      )
  ).length;

  const totalPorteiros = ocorrencias.filter(
    (item) => item.origem === "porteiro"
  ).length;

  const totalUrgentes = ocorrencias.filter(
    (item) => item.prioridade === "Urgente"
  ).length;

  const listaExibida =
    abaAtiva === "encaminhadas"
      ? encaminhadas
      : historico;

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div>
          <span style={styles.heroBadge}>
            📘 Livro digital da portaria
          </span>

          <h1 style={styles.title}>
            Livro de Ocorrências
          </h1>

          <p style={styles.subtitle}>
            Registre situações do plantão e acompanhe o
            encaminhamento ao síndico.
          </p>
        </div>

        <div style={styles.heroPanel}>
          <p style={styles.heroLabel}>
            Fluxo atual
          </p>

          <h3 style={styles.heroText}>
            Porteiro registra → Síndico resolve
          </h3>

          <span style={styles.heroStatus}>
            Encaminhamento automático
          </span>
        </div>
      </div>

      <div style={styles.cards}>
        <div style={styles.cardPrimary}>
          <div>
            <p style={styles.cardLabelLight}>
              Encaminhadas
            </p>

            <h2 style={styles.cardNumberLight}>
              {totalEncaminhadas}
            </h2>
          </div>

          <div style={styles.cardIconLight}>
            📤
          </div>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>
            Resolvidas pelo síndico
          </p>

          <h2 style={styles.cardNumberGreen}>
            {totalResolvidas}
          </h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>
            Registros da portaria
          </p>

          <h2 style={styles.cardNumber}>
            {totalPorteiros}
          </h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>
            Prioridade urgente
          </p>

          <h2 style={styles.cardNumberBlue}>
            {totalUrgentes}
          </h2>
        </div>
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.formCard}>
          <div style={styles.sectionTop}>
            <div>
              <h2 style={styles.sectionTitle}>
                Registrar ocorrência
              </h2>

              <p style={styles.sectionSubtitle}>
                O registro será enviado automaticamente ao síndico.
              </p>
            </div>

            <div style={styles.lockBadge}>
              🔒 Registro
            </div>
          </div>

          <label style={styles.label}>
            Categoria
          </label>

          <select
            style={styles.input}
            value={novaOcorrencia.categoria}
            onChange={(e) =>
              setNovaOcorrencia({
                ...novaOcorrencia,
                categoria: e.target.value
              })
            }
          >
            <option value="">
              Selecione uma categoria
            </option>
            <option>Segurança</option>
            <option>Visitante</option>
            <option>Encomenda</option>
            <option>Barulho</option>
            <option>Manutenção</option>
            <option>Convivência</option>
            <option>Outros</option>
          </select>

          <label style={styles.label}>
            Prioridade
          </label>

          <select
            style={styles.input}
            value={novaOcorrencia.prioridade}
            onChange={(e) =>
              setNovaOcorrencia({
                ...novaOcorrencia,
                prioridade: e.target.value
              })
            }
          >
            <option>Baixa</option>
            <option>Média</option>
            <option>Alta</option>
            <option>Urgente</option>
          </select>

          <label style={styles.label}>
            Turno do plantão
          </label>

          <select
            style={styles.input}
            value={novaOcorrencia.turno}
            onChange={(e) =>
              setNovaOcorrencia({
                ...novaOcorrencia,
                turno: e.target.value
              })
            }
          >
            <option value="">
              Automático
            </option>
            <option>Manhã</option>
            <option>Tarde</option>
            <option>Noite</option>
          </select>

          <label style={styles.label}>
            Data do plantão
          </label>

          <input
            type="date"
            style={styles.input}
            value={novaOcorrencia.dataPlantao}
            onChange={(e) =>
              setNovaOcorrencia({
                ...novaOcorrencia,
                dataPlantao: e.target.value
              })
            }
          />

          <label style={styles.label}>
            Título
          </label>

          <input
            style={styles.input}
            minLength="4"
            placeholder="Ex: Barulho no bloco A"
            value={novaOcorrencia.titulo}
            onChange={(e) =>
              setNovaOcorrencia({
                ...novaOcorrencia,
                titulo: e.target.value
              })
            }
          />

          <label style={styles.label}>
            Apartamento relacionado
          </label>

          <input
            style={styles.input}
            placeholder="Ex: 101 ou deixe em branco"
            value={novaOcorrencia.apartamento}
            onChange={(e) =>
              setNovaOcorrencia({
                ...novaOcorrencia,
                apartamento: e.target.value
              })
            }
          />

          <label style={styles.label}>
            Descrição detalhada
          </label>

          <textarea
            style={styles.textarea}
            minLength="10"
            placeholder="Descreva o que aconteceu no plantão..."
            value={novaOcorrencia.descricao}
            onChange={(e) =>
              setNovaOcorrencia({
                ...novaOcorrencia,
                descricao: e.target.value
              })
            }
          />

          <button
            style={styles.submitButton}
            onClick={registrarOcorrencia}
          >
            Registrar e encaminhar ao síndico
          </button>

          <p style={styles.formHint}>
            O porteiro não precisa resolver ou fechar a ocorrência.
            A resolução será feita depois pelo síndico.
          </p>
        </div>

        <div style={styles.listCard}>
          <div style={styles.listHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                Acompanhamento
              </h2>

              <p style={styles.sectionSubtitle}>
                Registros encaminhados e histórico resolvido.
              </p>
            </div>

            <input
              style={styles.search}
              placeholder="Buscar ocorrência..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <div style={styles.tabs}>
            <button
              style={{
                ...styles.tab,
                ...(abaAtiva === "encaminhadas"
                  ? styles.tabActive
                  : {})
              }}
              onClick={() => setAbaAtiva("encaminhadas")}
            >
              Encaminhadas ao síndico
            </button>

            <button
              style={{
                ...styles.tab,
                ...(abaAtiva === "historico"
                  ? styles.tabActive
                  : {})
              }}
              onClick={() => setAbaAtiva("historico")}
            >
              Histórico resolvido
            </button>
          </div>

          {listaExibida.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>
                📭
              </div>

              <h3 style={styles.emptyTitle}>
                Nenhum registro encontrado
              </h3>

              <p style={styles.emptyText}>
                Quando houver ocorrências nesta etapa,
                elas aparecerão aqui.
              </p>
            </div>
          ) : (
            <div style={styles.timeline}>
              {listaExibida.map((item) => (
                <div
                  key={item.id}
                  style={styles.timelineItem}
                >
                  <div style={styles.timelineDot}></div>

                  <div style={styles.occurrenceCard}>
                    <div style={styles.occurrenceTop}>
                      <div>
                        <div style={styles.badges}>
                          <span style={styles.originBadge}>
                            Porteiro
                          </span>

                          <span style={styles.categoryBadge}>
                            {item.categoria}
                          </span>

                          <span
                            style={{
                              ...styles.priorityBadge,
                              ...(item.prioridade === "Urgente"
                                ? styles.priorityUrgent
                                : item.prioridade === "Alta"
                                ? styles.priorityHigh
                                : item.prioridade === "Média"
                                ? styles.priorityMedium
                                : styles.priorityLow)
                            }}
                          >
                            {item.prioridade}
                          </span>
                        </div>

                        <h3 style={styles.occurrenceTitle}>
                          {item.titulo}
                        </h3>
                      </div>

                      <span
                        style={{
                          ...styles.statusBadge,
                          ...(item.status === "Resolvido" ||
                          item.status === "Resolvida"
                            ? styles.statusResolved
                            : styles.statusForwarded)
                        }}
                      >
                        {item.status}
                      </span>
                    </div>

                    <p style={styles.description}>
                      {item.descricao}
                    </p>

                    <div style={styles.metaGrid}>
                      <span>
                        📅 {item.data} às {item.hora}
                      </span>

                      <span>
                        👤 {item.porteiroNome || "Porteiro"}
                      </span>

                      <span>
                        🕒 {item.turno || "Plantão não informado"}
                      </span>

                      {item.apartamento && (
                        <span>
                          🏠 Apto {item.apartamento}
                        </span>
                      )}
                    </div>

                    {item.status !== "Resolvido" &&
                      item.status !== "Resolvida" && (
                        <div style={styles.forwardBox}>
                          <strong>
                            Situação atual:
                          </strong>{" "}
                          encaminhada ao síndico e aguardando resolução.
                        </div>
                      )}

                    {(item.status === "Resolvido" ||
                      item.status === "Resolvida") && (
                      <div style={styles.resolvedBox}>
                        <strong>
                          Resolvida pelo síndico.
                        </strong>

                        {item.respostasSindico?.length > 0 && (
                          <p style={styles.responseText}>
                            {
                              item.respostasSindico[
                                item.respostasSindico.length - 1
                              ].texto
                            }
                          </p>
                        )}
                      </div>
                    )}

                    {item.status !== "Resolvido" &&
                      item.status !== "Resolvida" && (
                      <div style={styles.actions}>
                        <button
                          style={styles.deleteButton}
                          onClick={() =>
                            excluirRegistro(item.id)
                          }
                        >
                          Excluir registro
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
    color: "#111827",
    position: "relative"
  },

  hero: {
    background:
      "linear-gradient(135deg,#4c1d95,#6d28d9,#7c3aed)",
    borderRadius: "30px",
    padding: "32px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "30px",
    marginBottom: "26px",
    boxShadow: "0 22px 55px rgba(124,58,237,0.24), 0 0 38px rgba(168,85,247,0.12)",
    border: "1px solid rgba(255,255,255,0.18)",
    position: "relative",
    overflow: "hidden"
  },

  heroBadge: {
    background: "rgba(255,255,255,0.14)",
    padding: "10px 14px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "700",
    display: "inline-block",
    marginBottom: "16px",
    backdropFilter: "blur(10px)"
  },

  title: {
    margin: 0,
    fontSize: "36px",
    letterSpacing: "-0.5px"
  },

  subtitle: {
    margin: "10px 0 0",
    color: "rgba(255,255,255,0.78)",
    maxWidth: "620px",
    lineHeight: "1.5"
  },

  heroPanel: {
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: "24px",
    padding: "22px",
    minWidth: "280px",
    backdropFilter: "blur(12px)"
  },

  heroLabel: {
    margin: 0,
    color: "rgba(255,255,255,0.7)",
    fontSize: "13px"
  },

  heroText: {
    margin: "8px 0 14px",
    fontSize: "20px"
  },

  heroStatus: {
    background: "#f3e8ff",
    color: "#7c3aed",
    padding: "8px 12px",
    borderRadius: "999px",
    fontWeight: "700",
    fontSize: "12px"
  },

  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "18px",
    marginBottom: "26px"
  },

  cardPrimary: {
    background:
      "linear-gradient(135deg,#6d28d9,#8b5cf6)",
    borderRadius: "24px",
    padding: "24px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 14px 35px rgba(124,58,237,0.18)"
  },

  card: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.08),transparent 34%), white",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 16px 40px rgba(88,28,135,0.08)",
    border: "1px solid #ede9fe"
  },

  cardLabelLight: {
    margin: 0,
    color: "rgba(255,255,255,0.75)",
    fontSize: "14px"
  },

  cardNumberLight: {
    margin: "10px 0 0",
    color: "white",
    fontSize: "36px"
  },

  cardIconLight: {
    width: "56px",
    height: "56px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.16)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px"
  },

  cardLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px"
  },

  cardNumber: {
    margin: "10px 0 0",
    color: "#111827",
    fontSize: "34px"
  },

  cardNumberGreen: {
    margin: "10px 0 0",
    color: "#7c3aed",
    fontSize: "34px"
  },

  cardNumberBlue: {
    margin: "10px 0 0",
    color: "#7c3aed",
    fontSize: "34px"
  },

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(380px,1fr))",
    gap: "24px",
    alignItems: "flex-start"
  },

  formCard: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.08),transparent 34%), white",
    borderRadius: "28px",
    padding: "26px",
    boxShadow: "0 18px 45px rgba(88,28,135,0.09)",
    border: "1px solid #ede9fe"
  },

  listCard: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.08),transparent 34%), white",
    borderRadius: "28px",
    padding: "26px",
    boxShadow: "0 18px 45px rgba(88,28,135,0.09)",
    border: "1px solid #ede9fe"
  },

  sectionTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "20px"
  },

  sectionTitle: {
    margin: 0,
    color: "#6d28d9",
    fontSize: "23px"
  },

  sectionSubtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "1.4"
  },

  lockBadge: {
    background: "#faf5ff",
    color: "#7c3aed",
    padding: "9px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
    whiteSpace: "nowrap"
  },

  label: {
    display: "block",
    marginBottom: "8px",
    color: "#374151",
    fontSize: "13px",
    fontWeight: "700"
  },

  input: {
    width: "100%",
    padding: "14px 15px",
    borderRadius: "15px",
    border: "1px solid #c4b5fd",
    outline: "none",
    fontSize: "14px",
    marginBottom: "15px",
    boxSizing: "border-box",
    background: "#fbfaff"
  },

  textarea: {
    width: "100%",
    minHeight: "140px",
    padding: "14px 15px",
    borderRadius: "15px",
    border: "1px solid #c4b5fd",
    outline: "none",
    fontSize: "14px",
    marginBottom: "16px",
    boxSizing: "border-box",
    background: "#fbfaff",
    resize: "vertical",
    fontFamily: "Arial",
    lineHeight: "1.5"
  },

  submitButton: {
    width: "100%",
    background:
      "linear-gradient(135deg,#6d28d9,#8b5cf6)",
    color: "white",
    border: "none",
    padding: "15px",
    borderRadius: "16px",
    cursor: "pointer",
    fontWeight: "800",
    boxShadow: "0 12px 25px rgba(124,58,237,0.20)"
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
    marginBottom: "18px"
  },

  search: {
    padding: "13px 15px",
    borderRadius: "15px",
    border: "1px solid #c4b5fd",
    outline: "none",
    minWidth: "260px",
    maxWidth: "100%",
    background: "#fbfaff"
  },

  tabs: {
    display: "flex",
    background: "#f5f3ff",
    padding: "6px",
    borderRadius: "18px",
    marginBottom: "22px",
    gap: "6px"
  },

  tab: {
    flex: 1,
    border: "none",
    background: "transparent",
    padding: "12px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "800",
    color: "#6b7280"
  },

  tabActive: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.08),transparent 34%), white",
    color: "#6d28d9",
    boxShadow: "0 6px 18px rgba(15,23,42,0.08)"
  },

  empty: {
    background: "#fbfaff",
    borderRadius: "22px",
    padding: "45px",
    textAlign: "center",
    border: "1px dashed #c4b5fd"
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
    color: "#6b7280",
    margin: "8px 0 0"
  },

  timeline: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: "18px"
  },

  timelineItem: {
    display: "grid",
    gridTemplateColumns: "18px 1fr",
    gap: "14px"
  },

  timelineDot: {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    background: "#8b5cf6",
    marginTop: "26px",
    boxShadow: "0 0 0 6px #f3e8ff"
  },

  occurrenceCard: {
    background: "#fbfaff",
    border: "1px solid #ddd6fe",
    borderRadius: "24px",
    padding: "22px"
  },

  occurrenceTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "flex-start"
  },

  badges: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "10px"
  },

  originBadge: {
    background: "#f3e8ff",
    color: "#7c3aed",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  categoryBadge: {
    background: "#e0f2fe",
    color: "#0369a1",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  priorityBadge: {
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  priorityLow: {
    background: "#f3e8ff",
    color: "#7c3aed"
  },

  priorityMedium: {
    background: "#fef3c7",
    color: "#92400e"
  },

  priorityHigh: {
    background: "#ffedd5",
    color: "#c2410c"
  },

  priorityUrgent: {
    background: "#fee2e2",
    color: "#dc2626"
  },

  occurrenceTitle: {
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

  statusForwarded: {
    background: "#fef3c7",
    color: "#92400e"
  },

  statusResolved: {
    background: "#f3e8ff",
    color: "#7c3aed"
  },

  description: {
    color: "#374151",
    lineHeight: "1.6",
    margin: "15px 0"
  },

  metaGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    color: "#6b7280",
    fontSize: "13px",
    marginBottom: "14px"
  },

  forwardBox: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    color: "#92400e",
    padding: "14px",
    borderRadius: "16px",
    fontSize: "14px"
  },

  resolvedBox: {
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

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "14px"
  },

  deleteButton: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    padding: "11px 14px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "800"
  }
};

export default OcorrenciasPorteiro;