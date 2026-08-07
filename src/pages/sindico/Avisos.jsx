import { useAlerta } from "../../components/Alerta/AlertaProvider";
import { useState } from "react";
import { registrarAuditoria } from "../../Services/auditoriaService";
import { criarNotificacao } from "../../Services/notificacaoService";

function Avisos() {
  const { mostrarAlerta, confirmarAcao } = useAlerta();
  const STORAGE_AVISOS = "avisos";
  const STORAGE_CENTRAL = "avisos_sindico";
  const STORAGE_SUGESTOES = "sugestoes_reclamacoes";
  const STORAGE_OCORRENCIAS = "ocorrencias";
  const STORAGE_VISITANTES = "visitantes";
  const STORAGE_ENCOMENDAS = "encomendas";
  const STORAGE_MOVIMENTACOES = "movimentacoes";
  const STORAGE_RELATORIOS = "relatorios_operacionais";
  const STORAGE_NOTIFICACOES_MORADOR = "notificacoesMorador";

  const estadoInicialAviso = {
    titulo: "",
    descricao: "",
    prioridade: "Média",
    data: new Date().toLocaleDateString("pt-BR")
  };

  const [avisos, setAvisos] = useState(() => carregarCentral());
  const [mostrarModal, setMostrarModal] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroPrioridade, setFiltroPrioridade] = useState("Todas");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [novoAviso, setNovoAviso] = useState(estadoInicialAviso);
  const [editId, setEditId] = useState(null);
  const [respostaTexto, setRespostaTexto] = useState("");

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

  function carregarCentral() {
    const avisosOficiais = lerStorage(STORAGE_AVISOS).map((item) => ({
      ...item,
      categoria: "Aviso",
      origem: "Síndico",
      status: item.status || "Publicado",
      prioridade: item.prioridade || "Média",
      responsavel: "Síndico",
      cienciaSindico: true
    }));

    const centralManual = lerStorage(STORAGE_CENTRAL);

    const sugestoes = lerStorage(STORAGE_SUGESTOES).map((item) => ({
      ...item,
      categoria: item.tipoRegistro || item.tipo || "Solicitação",
      origem: "Morador",
      status: item.status || "Novo",
      prioridade: item.prioridade || "Média",
      morador: item.moradorNome || item.morador || "",
      responsavel: item.sindicoResponsavel || "",
      cienciaSindico: item.lidaSindico || false
    }));

    const ocorrencias = lerStorage(STORAGE_OCORRENCIAS).map((item) => ({
      ...item,
      categoria: "Ocorrência",
      origem: "Porteiro",
      status: item.status || "Novo",
      prioridade: item.prioridade || "Média",
      responsavel: item.porteiroNome || "Porteiro",
      cienciaSindico: item.lidaSindico || false
    }));

    const visitantes = lerStorage(STORAGE_VISITANTES).map((item) => ({
      ...item,
      id: item.id || Date.now(),
      categoria: "Visitante",
      origem: "Porteiro",
      titulo: item.nome
        ? `Visitante: ${item.nome}`
        : "Registro de visitante",
      descricao:
        item.observacao ||
        item.motivo ||
        `Visitante registrado para o apartamento ${item.apartamento || "-"}`,
      prioridade: "Média",
      status: item.statusSindico || item.status || "Novo",
      responsavel: item.porteiroNome || "Porteiro",
      cienciaSindico: item.cienciaSindico || false,
      data: item.data || item.dataEntrada || new Date().toLocaleDateString("pt-BR")
    }));

    const encomendas = lerStorage(STORAGE_ENCOMENDAS).map((item) => ({
      ...item,
      id: item.id || Date.now(),
      categoria: "Encomenda",
      origem: "Porteiro",
      titulo: item.destinatario
        ? `Encomenda para ${item.destinatario}`
        : "Registro de encomenda",
      descricao:
        item.descricao ||
        item.nome ||
        `Encomenda registrada para o apartamento ${item.apartamento || "-"}`,
      prioridade: "Baixa",
      status: item.statusSindico || item.status || "Novo",
      responsavel: item.porteiroNome || "Porteiro",
      cienciaSindico: item.cienciaSindico || false,
      data: item.data || new Date().toLocaleDateString("pt-BR")
    }));

    const lista = [
      ...centralManual,
      ...avisosOficiais,
      ...sugestoes,
      ...ocorrencias,
      ...visitantes,
      ...encomendas
    ];

    const semDuplicados = lista.filter(
      (item, index, self) =>
        index === self.findIndex((x) => String(x.id) === String(item.id))
    );

    return semDuplicados.sort((a, b) => Number(b.id) - Number(a.id));
  }

  function atualizarCentral() {
    setAvisos(carregarCentral());
  }

  function registrarMovimentacao(tipo, origem, titulo) {
    const movimentacoes = lerStorage(STORAGE_MOVIMENTACOES);

    const nova = {
      id: Date.now(),
      tipo,
      origem,
      titulo,
      data: new Date().toLocaleDateString("pt-BR"),
      hora: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    };

    salvarStorage(STORAGE_MOVIMENTACOES, [nova, ...movimentacoes]);
  }

  function registrarRelatorio(tipo, origem, titulo) {
    const relatorios = lerStorage(STORAGE_RELATORIOS);

    const novo = {
      id: Date.now(),
      tipo,
      origem,
      titulo,
      data: new Date().toLocaleDateString("pt-BR"),
      hora: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    };

    salvarStorage(STORAGE_RELATORIOS, [novo, ...relatorios]);
  }

  function registrarAuditoriaAvisos({ acao, modulo, detalhes = "", antes = null, depois = null, referenciaId = null }) {
    registrarAuditoria({
      acao,
      modulo,
      detalhes,
      antes,
      depois,
      referenciaId
    });
  }

  function criarNotificacaoGlobal({
    titulo,
    mensagem,
    tipo = "Avisos",
    perfilDestino = "sindico",
    usuarioDestinoId = null,
    usuarioDestinoNome = "",
    usuarioDestinoUsuario = "",
    apartamentoDestino = "",
    condominioId = null,
    referenciaId = null,
    prioridade = "normal"
  }) {
    criarNotificacao({
      titulo,
      mensagem,
      tipo,
      origem: "Avisos",
      perfilDestino,
      usuarioDestinoId,
      usuarioDestinoNome,
      usuarioDestinoUsuario,
      apartamentoDestino,
      condominioId,
      moduloOrigem: "Avisos",
      referenciaId,
      prioridade
    });
  }

  const avisosFiltrados = avisos.filter((a) => {
    const texto = busca.toLowerCase();

    const correspondeBusca =
      a.titulo?.toLowerCase().includes(texto) ||
      a.descricao?.toLowerCase().includes(texto) ||
      a.prioridade?.toLowerCase().includes(texto) ||
      a.status?.toLowerCase().includes(texto) ||
      a.categoria?.toLowerCase().includes(texto) ||
      a.origem?.toLowerCase().includes(texto) ||
      a.data?.toLowerCase().includes(texto);

    const correspondePrioridade =
      filtroPrioridade === "Todas" || a.prioridade === filtroPrioridade;

    const correspondeCategoria =
      filtroCategoria === "Todas" || a.categoria === filtroCategoria;

    return correspondeBusca && correspondePrioridade && correspondeCategoria;
  });

  const alta = avisos.filter((a) => a.prioridade === "Alta").length;
  const media = avisos.filter((a) => a.prioridade === "Média").length;
  const baixa = avisos.filter((a) => a.prioridade === "Baixa").length;

  function salvarAviso() {
    if (!novoAviso.titulo || !novoAviso.descricao) {
      mostrarAlerta("Preencha todos os campos");
      return;
    }

    const listaAvisos = lerStorage(STORAGE_AVISOS);
    let listaAtualizada = [];

    if (editId !== null) {
      listaAtualizada = listaAvisos.map((a) =>
        a.id === editId
          ? {
              ...a,
              ...novoAviso,
              id: editId,
              categoria: "Aviso",
              origem: "Síndico",
              status: "Publicado",
              cienciaSindico: true
            }
          : a
      );

      const avisoEditado = listaAtualizada.find((a) => a.id === editId);

      registrarAuditoriaAvisos({
        acao: "Editou aviso oficial",
        modulo: "Avisos",
        detalhes: novoAviso.titulo,
        depois: avisoEditado,
        referenciaId: editId
      });

      criarNotificacaoGlobal({
        titulo: "Aviso oficial atualizado",
        mensagem: novoAviso.titulo,
        tipo: "Aviso",
        perfilDestino: "morador",
        referenciaId: editId
      });

      setEditId(null);
    } else {
      const novo = {
        id: Date.now(),
        categoria: "Aviso",
        origem: "Síndico",
        titulo: novoAviso.titulo,
        descricao: novoAviso.descricao,
        prioridade: novoAviso.prioridade,
        status: "Publicado",
        respostaSindico: "",
        cienciaSindico: true,
        data: new Date().toLocaleDateString("pt-BR")
      };

      listaAtualizada = [novo, ...listaAvisos];

      registrarMovimentacao("Aviso", "Síndico", novo.titulo);
      registrarRelatorio("Aviso", "Síndico", novo.titulo);

      registrarAuditoriaAvisos({
        acao: "Publicou aviso oficial",
        modulo: "Avisos",
        detalhes: novo.titulo,
        depois: novo,
        referenciaId: novo.id
      });

      criarNotificacaoGlobal({
        titulo: novo.titulo,
        mensagem: novo.descricao,
        tipo: "Aviso",
        perfilDestino: "morador",
        referenciaId: novo.id,
        prioridade: novo.prioridade === "Alta" ? "alta" : "normal"
      });
    }

    salvarStorage(STORAGE_AVISOS, listaAtualizada);

    setNovoAviso(estadoInicialAviso);
    setMostrarModal(false);
    atualizarCentral();
  }

  function editarAviso(aviso) {
    if (aviso.categoria !== "Aviso") {
      mostrarAlerta("Apenas avisos oficiais podem ser editados por este botão.");
      return;
    }

    setNovoAviso({
      ...estadoInicialAviso,
      ...aviso
    });

    setEditId(aviso.id);
    setMostrarModal(true);
  }

  async function excluirAviso(id) {
    const confirmar = await confirmarAcao("Deseja realmente excluir este aviso?");

    if (!confirmar) return;

    const avisoAntes = lerStorage(STORAGE_AVISOS).find((a) => a.id === id);
    const listaAvisos = lerStorage(STORAGE_AVISOS).filter((a) => a.id !== id);

    salvarStorage(STORAGE_AVISOS, listaAvisos);

    registrarAuditoriaAvisos({
      acao: "Excluiu aviso oficial",
      modulo: "Avisos",
      detalhes: avisoAntes?.titulo || "Aviso excluído",
      antes: avisoAntes,
      referenciaId: id
    });

    atualizarCentral();
  }

  function atualizarStatus(item, novoStatus) {
    const agora = new Date();

    if (item.categoria === "Sugestão" || item.categoria === "Reclamação") {
      const lista = lerStorage(STORAGE_SUGESTOES).map((registro) =>
        registro.id === item.id
          ? {
              ...registro,
              status: novoStatus,
              lidaSindico: true,
              dataResolucao:
                novoStatus === "Resolvido"
                  ? agora.toLocaleDateString("pt-BR")
                  : registro.dataResolucao,
              horaResolucao:
                novoStatus === "Resolvido"
                  ? agora.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                  : registro.horaResolucao
            }
          : registro
      );

      salvarStorage(STORAGE_SUGESTOES, lista);
    }

    if (item.categoria === "Ocorrência") {
      const lista = lerStorage(STORAGE_OCORRENCIAS).map((registro) =>
        registro.id === item.id
          ? {
              ...registro,
              status: novoStatus,
              lidaSindico: true,
              dataResolucao:
                novoStatus === "Resolvido"
                  ? agora.toLocaleDateString("pt-BR")
                  : registro.dataResolucao,
              horaResolucao:
                novoStatus === "Resolvido"
                  ? agora.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                  : registro.horaResolucao
            }
          : registro
      );

      salvarStorage(STORAGE_OCORRENCIAS, lista);
    }

    if (item.categoria === "Visitante") {
      const lista = lerStorage(STORAGE_VISITANTES).map((registro) =>
        registro.id === item.id
          ? {
              ...registro,
              statusSindico: novoStatus,
              cienciaSindico: true
            }
          : registro
      );

      salvarStorage(STORAGE_VISITANTES, lista);
    }

    if (item.categoria === "Encomenda") {
      const lista = lerStorage(STORAGE_ENCOMENDAS).map((registro) =>
        registro.id === item.id
          ? {
              ...registro,
              statusSindico: novoStatus,
              cienciaSindico: true
            }
          : registro
      );

      salvarStorage(STORAGE_ENCOMENDAS, lista);
    }

    registrarAuditoriaAvisos({
      acao: "Alterou status na central",
      modulo: item.categoria,
      detalhes: `${item.titulo} - ${novoStatus}`,
      antes: item,
      depois: { ...item, status: novoStatus },
      referenciaId: item.id
    });

    if (item.categoria !== "Notificação") {
      criarNotificacaoGlobal({
        titulo: item.titulo,
        mensagem: `Status alterado para ${novoStatus}`,
        tipo: item.categoria,
        perfilDestino:
          item.categoria === "Sugestão" || item.categoria === "Reclamação"
            ? "morador"
            : "sindico",
        usuarioDestinoId:
          item.categoria === "Sugestão" || item.categoria === "Reclamação"
            ? item.moradorId || null
            : null,
        usuarioDestinoNome:
          item.categoria === "Sugestão" || item.categoria === "Reclamação"
            ? item.moradorNome || item.morador || ""
            : "",
        usuarioDestinoUsuario:
          item.categoria === "Sugestão" || item.categoria === "Reclamação"
            ? item.moradorUsuario || ""
            : "",
        apartamentoDestino:
          item.categoria === "Sugestão" || item.categoria === "Reclamação"
            ? item.apartamento || item.apto || ""
            : "",
        condominioId: item.condominioId || null,
        referenciaId: item.id,
        prioridade: novoStatus === "Resolvido" ? "baixa" : "normal"
      });
    }

    registrarMovimentacao(item.categoria, "Síndico", `${item.titulo} - ${novoStatus}`);
    registrarRelatorio(item.categoria, "Síndico", `${item.titulo} - ${novoStatus}`);

    atualizarCentral();
  }

  function responderItem(item) {
    if (!respostaTexto.trim()) {
      mostrarAlerta("Digite uma resposta antes de salvar.");
      return;
    }

    const agora = new Date();

    const resposta = {
      id: Date.now(),
      texto: respostaTexto,
      autor: "Síndico",
      data: agora.toLocaleDateString("pt-BR"),
      hora: agora.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    };

    if (item.categoria === "Sugestão" || item.categoria === "Reclamação") {
      const lista = lerStorage(STORAGE_SUGESTOES).map((registro) =>
        registro.id === item.id
          ? {
              ...registro,
              respostaSindico: respostaTexto,
              respostasSindico: [...(registro.respostasSindico || []), resposta],
              lidaSindico: true,
              status:
                registro.status === "Novo" || registro.status === "Ciente"
                  ? "Em Tratamento"
                  : registro.status,
              dataResposta: agora.toLocaleString()
            }
          : registro
      );

      salvarStorage(STORAGE_SUGESTOES, lista);

      const notificacoes = lerStorage(STORAGE_NOTIFICACOES_MORADOR);
      const novaNotificacao = {
        id: Date.now(),
        tipo: item.categoria,
        titulo: `Resposta do síndico: ${item.titulo}`,
        descricao: respostaTexto,
        apartamento: item.apartamento || item.apto || "",
        apartamentoId: item.apartamentoId || null,
        morador: item.morador || item.moradorNome || "",
        moradorId: item.moradorId || null,
        moradorUsuario: item.moradorUsuario || "",
        condominioId: item.condominioId || null,
        referenciaId: item.id,
        lida: false,
        data: agora.toLocaleDateString("pt-BR"),
        hora: agora.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        })
      };

      salvarStorage(STORAGE_NOTIFICACOES_MORADOR, [
        novaNotificacao,
        ...notificacoes
      ]);
    }

    if (item.categoria === "Ocorrência") {
      const lista = lerStorage(STORAGE_OCORRENCIAS).map((registro) =>
        registro.id === item.id
          ? {
              ...registro,
              respostaSindico: respostaTexto,
              respostasSindico: [...(registro.respostasSindico || []), resposta],
              lidaSindico: true,
              status:
                registro.status === "Novo" || registro.status === "Ciente"
                  ? "Em Tratamento"
                  : registro.status
            }
          : registro
      );

      salvarStorage(STORAGE_OCORRENCIAS, lista);
    }

    registrarMovimentacao(item.categoria, "Síndico", `Resposta: ${item.titulo}`);
    registrarRelatorio(item.categoria, "Síndico", `Resposta: ${item.titulo}`);

    registrarAuditoriaAvisos({
      acao: "Respondeu item da central",
      modulo: item.categoria,
      detalhes: item.titulo,
      depois: resposta,
      referenciaId: item.id
    });

    criarNotificacaoGlobal({
      titulo: `Resposta do síndico: ${item.titulo}`,
      mensagem: respostaTexto,
      tipo: item.categoria,
      perfilDestino: item.categoria === "Ocorrência" ? "sindico" : "morador",
      usuarioDestinoId:
        item.categoria === "Ocorrência" ? null : item.moradorId || null,
      usuarioDestinoNome:
        item.categoria === "Ocorrência"
          ? ""
          : item.moradorNome || item.morador || "",
      usuarioDestinoUsuario:
        item.categoria === "Ocorrência" ? "" : item.moradorUsuario || "",
      apartamentoDestino:
        item.categoria === "Ocorrência"
          ? ""
          : item.apartamento || item.apto || "",
      condominioId: item.condominioId || null,
      referenciaId: item.id
    });

    setRespostaTexto("");
    atualizarCentral();
  }

  function fecharModal() {
    setMostrarModal(false);
    setEditId(null);
    setNovoAviso(estadoInicialAviso);
  }

  function corPrioridade(prioridade) {
    switch (prioridade) {
      case "Alta":
      case "Urgente":
        return {
          background: "#fee2e2",
          color: "#b91c1c",
          border: "#fecaca",
          icon: "🚨",
          label: prioridade === "Urgente" ? "Urgente" : "Alta prioridade"
        };

      case "Média":
        return {
          background: "#fef3c7",
          color: "#92400e",
          border: "#fde68a",
          icon: "⚠️",
          label: "Média prioridade"
        };

      case "Baixa":
        return {
          background: "#dcfce7",
          color: "#166534",
          border: "#bbf7d0",
          icon: "✅",
          label: "Baixa prioridade"
        };

      default:
        return {
          background: "#f3f4f6",
          color: "#374151",
          border: "#e5e7eb",
          icon: "📢",
          label: prioridade || "Sem prioridade"
        };
    }
  }

  function iconeCategoria(categoria) {
    switch (categoria) {
      case "Aviso":
        return "📢";
      case "Encomenda":
        return "📦";
      case "Ocorrência":
        return "📘";
      case "Visitante":
        return "🧾";
      case "Reclamação":
        return "⚠️";
      case "Sugestão":
        return "💡";
      default:
        return "📌";
    }
  }

  return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <div style={styles.heroLeft}>
          <span style={styles.heroBadge}>📢 Central de comunicação</span>

          <h1 style={styles.title}>Avisos</h1>

          <p style={styles.subtitle}>
            Publique comunicados, acompanhe ocorrências, sugestões,
            reclamações, encomendas e visitantes em uma única central.
          </p>
        </div>

        <div style={styles.heroRight}>
          <div style={styles.noticeBoard}>
            <div style={styles.noticeItem}>
              <span>🚨</span>
              <strong>{alta}</strong>
              <small>alta</small>
            </div>

            <div style={styles.noticeItem}>
              <span>⚠️</span>
              <strong>{media}</strong>
              <small>média</small>
            </div>

            <div style={styles.noticeItem}>
              <span>✅</span>
              <strong>{baixa}</strong>
              <small>baixa</small>
            </div>
          </div>

          <button
            style={styles.heroButton}
            onClick={() => {
              setEditId(null);
              setNovoAviso(estadoInicialAviso);
              setMostrarModal(true);
            }}
          >
            + Novo aviso
          </button>
        </div>
      </section>

      <section style={styles.controlStrip}>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>⌕</span>

          <input
            placeholder="Buscar por título, descrição, data, status, categoria ou prioridade..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={styles.search}
          />
        </div>

        <select
          value={filtroPrioridade}
          onChange={(e) => setFiltroPrioridade(e.target.value)}
          style={styles.filter}
        >
          <option>Todas</option>
          <option>Alta</option>
          <option>Média</option>
          <option>Baixa</option>
          <option>Urgente</option>
        </select>

        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          style={styles.filter}
        >
          <option>Todas</option>
          <option>Aviso</option>
          <option>Encomenda</option>
          <option>Ocorrência</option>
          <option>Visitante</option>
          <option>Reclamação</option>
          <option>Sugestão</option>
        </select>

        <div style={styles.compactStats}>
          <span>
            <b>{avisos.length}</b> registros
          </span>

          <span>
            <b>{avisosFiltrados.length}</b> resultado(s)
          </span>
        </div>
      </section>

      <section style={styles.communicationPanel}>
        <div style={styles.panelHeader}>
          <div>
            <span style={styles.panelLabel}>Central operacional</span>

            <h2 style={styles.panelTitle}>Comunicações recebidas</h2>
          </div>

          <span style={styles.resultBadge}>
            {avisosFiltrados.length} resultado(s)
          </span>
        </div>

        {avisosFiltrados.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>📢</div>

            <h3 style={styles.emptyTitle}>Nenhum registro encontrado</h3>

            <p style={styles.emptyText}>
              Avisos, ocorrências, reclamações, sugestões, visitantes e
              encomendas aparecerão aqui.
            </p>

            <button
              style={styles.emptyButton}
              onClick={() => {
                setEditId(null);
                setNovoAviso(estadoInicialAviso);
                setMostrarModal(true);
              }}
            >
              Publicar aviso
            </button>
          </div>
        ) : (
          <div style={styles.noticeGrid}>
            {avisosFiltrados.map((aviso) => {
              const prioridade = corPrioridade(aviso.prioridade);

              return (
                <article
                  key={`${aviso.categoria}-${aviso.id}`}
                  style={{
                    ...styles.noticeCard,
                    borderColor: prioridade.border
                  }}
                >
                  <div style={styles.cardTop}>
                    <div style={styles.noticeIcon}>
                      {iconeCategoria(aviso.categoria)}
                    </div>

                    <span
                      style={{
                        ...styles.priorityBadge,
                        background: prioridade.background,
                        color: prioridade.color
                      }}
                    >
                      {prioridade.label}
                    </span>
                  </div>

                  <div style={styles.badges}>
                    <span style={styles.categoryBadge}>{aviso.categoria}</span>
                    <span style={styles.originBadge}>{aviso.origem}</span>
                    <span style={styles.statusBadge}>{aviso.status}</span>
                  </div>

                  <h3 style={styles.noticeTitle}>{aviso.titulo}</h3>

                  <p style={styles.description}>{aviso.descricao}</p>

                  <div style={styles.meta}>
                    <span>Registrado em</span>
                    <strong>{aviso.data}</strong>
                  </div>

                  {(aviso.categoria === "Sugestão" ||
                    aviso.categoria === "Reclamação" ||
                    aviso.categoria === "Ocorrência") && (
                    <div style={styles.responseArea}>
                      <textarea
                        placeholder="Resposta ou comentário do síndico..."
                        value={respostaTexto}
                        onChange={(e) => setRespostaTexto(e.target.value)}
                        style={styles.responseInput}
                      />

                      <button
                        style={styles.editButton}
                        onClick={() => responderItem(aviso)}
                      >
                        Responder
                      </button>
                    </div>
                  )}

                  <div style={styles.actions}>
                    {aviso.categoria === "Aviso" ? (
                      <>
                        <button
                          style={styles.editButton}
                          onClick={() => editarAviso(aviso)}
                        >
                          Editar
                        </button>

                        <button
                          style={styles.deleteButton}
                          onClick={() => excluirAviso(aviso.id)}
                        >
                          Excluir
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          style={styles.editButton}
                          onClick={() => atualizarStatus(aviso, "Ciente")}
                        >
                          Ciente
                        </button>

                        <button
                          style={styles.editButton}
                          onClick={() =>
                            atualizarStatus(aviso, "Em Tratamento")
                          }
                        >
                          Em tratamento
                        </button>

                        <button
                          style={styles.editButton}
                          onClick={() => atualizarStatus(aviso, "Resolvido")}
                        >
                          Resolver
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {mostrarModal && (
        <div style={styles.modalBackground}>
          <div style={styles.modal} className="scroll-sindico">
            <div style={styles.modalTop}>
              <div>
                <span style={styles.modalBadge}>
                  {editId !== null ? "Editar comunicado" : "Novo comunicado"}
                </span>

                <h2 style={styles.modalTitle}>
                  {editId !== null ? "Editar aviso" : "Publicar aviso"}
                </h2>
              </div>

              <button style={styles.closeButton} onClick={fecharModal}>
                ✕
              </button>
            </div>

            <div style={styles.modalSection}>
              <h3 style={styles.modalSectionTitle}>Conteúdo do aviso</h3>

              <div style={styles.formGrid}>
                <div style={styles.groupFull}>
                  <label style={styles.label}>Título</label>

                  <input
                    placeholder="Ex: Manutenção no elevador"
                    value={novoAviso.titulo}
                    onChange={(e) =>
                      setNovoAviso({
                        ...novoAviso,
                        titulo: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.groupFull}>
                  <label style={styles.label}>Descrição</label>

                  <textarea
                    placeholder="Digite a mensagem do comunicado..."
                    value={novoAviso.descricao}
                    onChange={(e) =>
                      setNovoAviso({
                        ...novoAviso,
                        descricao: e.target.value
                      })
                    }
                    style={styles.textarea}
                  />
                </div>

                <div style={styles.groupFull}>
                  <label style={styles.label}>Prioridade</label>

                  <select
                    value={novoAviso.prioridade}
                    onChange={(e) =>
                      setNovoAviso({
                        ...novoAviso,
                        prioridade: e.target.value
                      })
                    }
                    style={styles.input}
                  >
                    <option>Alta</option>
                    <option>Média</option>
                    <option>Baixa</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={styles.modalButtons}>
              <button style={styles.saveButton} onClick={salvarAviso}>
                Salvar aviso
              </button>

              <button style={styles.cancelButton} onClick={fecharModal}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    minWidth: 0,
    fontFamily: "Arial",
    color: "#111827",
    position: "relative",
    boxSizing: "border-box"
  },

  hero: {
    minWidth: 0,
    flexWrap: "wrap",
    background:
      "radial-gradient(circle at top right,rgba(255,255,255,0.18),transparent 28%), radial-gradient(circle at bottom left,rgba(168,85,247,0.26),transparent 34%), linear-gradient(135deg,#2e1065,#4c1d95,#7c3aed)",
    borderRadius: "42px",
    padding: "40px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "34px",
    marginBottom: "26px",
    boxShadow:
      "0 30px 80px rgba(88,28,135,0.26), 0 0 46px rgba(168,85,247,0.16)",
    border: "1px solid rgba(255,255,255,0.18)",
    overflow: "hidden",
    position: "relative"
  },

  heroLeft: {
    flex: 1,
    position: "relative",
    zIndex: 2
  },

  heroBadge: {
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.18)",
    padding: "10px 15px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "900",
    display: "inline-block",
    marginBottom: "16px",
    boxShadow: "0 10px 28px rgba(0,0,0,0.10)"
  },

  title: {
    margin: 0,
    fontSize: "46px",
    letterSpacing: "-1px",
    fontWeight: "900"
  },

  subtitle: {
    margin: "13px 0 0",
    color: "rgba(255,255,255,0.80)",
    maxWidth: "780px",
    lineHeight: "1.6",
    fontSize: "15px"
  },

  heroRight: {
    minWidth: "330px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    position: "relative",
    zIndex: 2
  },

  noticeBoard: {
    background:
      "linear-gradient(145deg,rgba(255,255,255,0.16),rgba(255,255,255,0.08))",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: "30px",
    padding: "18px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(220px,100%),1fr))",
    gap: "12px",
    backdropFilter: "blur(16px)",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)"
  },

  noticeItem: {
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "22px",
    padding: "14px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },

  heroButton: {
    background: "linear-gradient(135deg,#6d28d9,#8b5cf6,#a855f7)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.22)",
    padding: "16px 22px",
    borderRadius: "18px",
    cursor: "pointer",
    fontWeight: "900",
    boxShadow:
      "0 18px 34px rgba(124,58,237,0.28), 0 0 28px rgba(168,85,247,0.18)"
  },

  controlStrip: {
    minWidth: 0,
    flexWrap: "wrap",
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.10),transparent 34%), white",
    border: "1px solid #ddd6fe",
    borderRadius: "30px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "26px",
    boxShadow: "0 16px 40px rgba(88,28,135,0.08)"
  },

  searchWrap: {
    flex: "1 1 320px",
    minWidth: "220px",
    position: "relative"
  },

  searchIcon: {
    position: "absolute",
    left: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#7c3aed",
    fontWeight: "900"
  },

  search: {
    width: "100%",
    padding: "15px 16px 15px 44px",
    borderRadius: "17px",
    border: "1px solid #c4b5fd",
    outline: "none",
    background: "#fbfaff",
    color: "#111827",
    fontSize: "14px",
    boxSizing: "border-box"
  },

  filter: {
    width: "170px",
    padding: "15px 16px",
    borderRadius: "17px",
    border: "1px solid #c4b5fd",
    outline: "none",
    background: "#fbfaff",
    color: "#111827",
    fontSize: "14px"
  },

  compactStats: {
    background: "#f3e8ff",
    border: "1px solid #ddd6fe",
    color: "#6d28d9",
    padding: "12px 14px",
    borderRadius: "18px",
    display: "flex",
    flexWrap: "wrap",
    gap: "14px",
    fontSize: "13px",
    fontWeight: "800",
    whiteSpace: "nowrap"
  },

  communicationPanel: {
    minWidth: 0,
    overflow: "hidden",
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.10),transparent 34%), linear-gradient(180deg,#ffffff,#fbfaff)",
    border: "1px solid #ede9fe",
    borderRadius: "36px",
    padding: "28px",
    boxShadow: "0 20px 60px rgba(88,28,135,0.10)"
  },

  panelHeader: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "24px"
  },

  panelLabel: {
    display: "inline-block",
    background: "#f3e8ff",
    color: "#6d28d9",
    border: "1px solid #ddd6fe",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900",
    marginBottom: "10px"
  },

  panelTitle: {
    margin: 0,
    color: "#2e1065",
    fontSize: "27px",
    letterSpacing: "-0.4px"
  },

  resultBadge: {
    background: "#f3e8ff",
    color: "#6d28d9",
    border: "1px solid #ddd6fe",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    whiteSpace: "nowrap"
  },

  empty: {
    background: "#fbfaff",
    border: "1px dashed #c4b5fd",
    borderRadius: "28px",
    padding: "46px",
    textAlign: "center"
  },

  emptyIcon: {
    fontSize: "44px",
    marginBottom: "12px"
  },

  emptyTitle: {
    margin: 0,
    color: "#111827"
  },

  emptyText: {
    margin: "8px 0 18px",
    color: "#6b7280"
  },

  emptyButton: {
    background: "linear-gradient(135deg,#6d28d9,#a855f7)",
    color: "white",
    border: "none",
    padding: "13px 18px",
    borderRadius: "15px",
    cursor: "pointer",
    fontWeight: "900",
    boxShadow: "0 16px 32px rgba(124,58,237,0.22)"
  },

  noticeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(330px,100%),1fr))",
    gap: "18px"
  },

  avisosGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(330px,100%),1fr))",
    gap: "18px"
  },

  list: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(330px,100%),1fr))",
    gap: "18px"
  },

  timeline: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(330px,100%),1fr))",
    gap: "18px"
  },

  noticeCard: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.11),transparent 34%), linear-gradient(180deg,#ffffff,#fbfaff)",
    border: "1px solid #ede9fe",
    borderRadius: "30px",
    padding: "22px",
    boxShadow: "0 18px 42px rgba(88,28,135,0.10)",
    position: "relative",
    overflow: "hidden"
  },

  card: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.11),transparent 34%), linear-gradient(180deg,#ffffff,#fbfaff)",
    border: "1px solid #ede9fe",
    borderRadius: "30px",
    padding: "22px",
    boxShadow: "0 18px 42px rgba(88,28,135,0.10)",
    position: "relative",
    overflow: "hidden"
  },

  cardTop: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "flex-start",
    marginBottom: "14px"
  },

  noticeIcon: {
    width: "58px",
    height: "58px",
    borderRadius: "20px",
    background: "linear-gradient(135deg,#f3e8ff,#faf5ff)",
    border: "1px solid #ddd6fe",
    color: "#6d28d9",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    flexShrink: 0
  },

  categoryIcon: {
    width: "58px",
    height: "58px",
    borderRadius: "20px",
    background: "linear-gradient(135deg,#f3e8ff,#faf5ff)",
    border: "1px solid #ddd6fe",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    flexShrink: 0
  },

  badges: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "12px"
  },

  priorityBadge: {
    padding: "8px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    border: "1px solid transparent"
  },

  categoryBadge: {
    background: "#f3e8ff",
    color: "#6d28d9",
    border: "1px solid #ddd6fe",
    padding: "8px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  originBadge: {
    background: "#ede9fe",
    color: "#4c1d95",
    border: "1px solid #ddd6fe",
    padding: "8px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  statusBadge: {
    background: "#f5f3ff",
    color: "#6d28d9",
    border: "1px solid #ddd6fe",
    padding: "8px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  dateBadge: {
    background: "#fbfaff",
    color: "#6b7280",
    border: "1px solid #ede9fe",
    padding: "8px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  cardTitle: {
    margin: "8px 0",
    color: "#111827",
    fontSize: "21px",
    lineHeight: "1.25"
  },

  noticeTitle: {
    margin: "8px 0",
    color: "#111827",
    fontSize: "21px",
    lineHeight: "1.25"
  },

  description: {
    color: "#6b7280",
    lineHeight: "1.6",
    margin: "0 0 14px",
    fontSize: "14px"
  },

  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    color: "#6b7280",
    fontSize: "13px",
    marginTop: "12px"
  },

  responseArea: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "14px",
    minWidth: 0
  },

  responseBox: {
    background: "#f3e8ff",
    border: "1px solid #ddd6fe",
    color: "#4c1d95",
    borderRadius: "18px",
    padding: "14px",
    marginTop: "14px",
    fontSize: "14px"
  },

  responseInput: {
    width: "100%",
    minHeight: "90px",
    padding: "14px",
    borderRadius: "16px",
    border: "1px solid #c4b5fd",
    outline: "none",
    background: "#fbfaff",
    resize: "vertical",
    boxSizing: "border-box",
    marginTop: "12px",
    fontFamily: "Arial"
  },

  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "16px"
  },

  buttonSmall: {
    background: "#f3e8ff",
    color: "#6d28d9",
    border: "1px solid #ddd6fe",
    padding: "10px 12px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "900"
  },

  editButton: {
    background: "#ede9fe",
    color: "#6d28d9",
    border: "none",
    padding: "11px 13px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "900"
  },

  deleteButton: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    padding: "11px 13px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "900"
  },

  saveResponseButton: {
    background: "linear-gradient(135deg,#6d28d9,#a855f7)",
    color: "white",
    border: "none",
    padding: "11px 13px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "900",
    boxShadow: "0 14px 28px rgba(124,58,237,0.22)"
  },

  modalBackground: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.62)",
    backdropFilter: "blur(10px)",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    padding: "20px",
    boxSizing: "border-box"
  },

  modal: {
    width: "620px",
    maxWidth: "100%",
    maxHeight: "calc(100vh - 40px)",
    overflowY: "auto",
    overflowX: "hidden",
    boxSizing: "border-box",
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.10),transparent 34%), #fbfaff",
    padding: "26px",
    borderRadius: "36px",
    boxShadow: "0 34px 90px rgba(88,28,135,0.30)",
    border: "1px solid rgba(255,255,255,0.55)"
  },

  modalTop: {
    minWidth: 0,
    flexWrap: "wrap",
    background:
      "radial-gradient(circle at top right,rgba(255,255,255,0.16),transparent 34%), linear-gradient(135deg,#4c1d95,#7c3aed)",
    color: "white",
    borderRadius: "28px",
    padding: "26px",
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "20px"
  },

  modalBadge: {
    background: "rgba(255,255,255,0.14)",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  modalTitle: {
    margin: "14px 0 6px",
    fontSize: "28px"
  },

  closeButton: {
    width: "42px",
    height: "42px",
    borderRadius: "15px",
    border: "none",
    background: "rgba(255,255,255,0.14)",
    color: "white",
    cursor: "pointer",
    fontWeight: "900"
  },

  modalSectionTitle: {
    margin: "0 0 16px",
    color: "#4c1d95",
    fontSize: "18px",
    fontWeight: "900"
  },

  modalSection: {
    background: "white",
    border: "1px solid #ede9fe",
    borderRadius: "26px",
    padding: "20px"
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(220px,100%),1fr))",
    gap: "15px"
  },

  formRow: {
    display: "flex",
    flexDirection: "column",
    gap: "7px"
  },

  groupFull: {
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
    gap: "7px"
  },

  label: {
    color: "#374151",
    fontSize: "13px",
    fontWeight: "900"
  },

  input: {
    width: "100%",
    minWidth: 0,
    padding: "15px",
    borderRadius: "16px",
    border: "1px solid #c4b5fd",
    outline: "none",
    fontSize: "14px",
    background: "#fbfaff",
    color: "#111827",
    boxSizing: "border-box"
  },

  textarea: {
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
    minHeight: "120px",
    padding: "15px",
    borderRadius: "16px",
    border: "1px solid #c4b5fd",
    outline: "none",
    fontSize: "14px",
    background: "#fbfaff",
    color: "#111827",
    resize: "vertical",
    fontFamily: "Arial",
    boxSizing: "border-box"
  },

  modalButtons: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "18px"
  },

  saveButton: {
    flex: 1,
    background: "linear-gradient(135deg,#6d28d9,#8b5cf6,#a855f7)",
    color: "white",
    border: "none",
    padding: "14px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900",
    boxShadow:
      "0 18px 34px rgba(124,58,237,0.28), 0 0 28px rgba(168,85,247,0.18)"
  },

  cancelButton: {
    flex: 1,
    background: "#f5f3ff",
    color: "#4c1d95",
    border: "1px solid #ddd6fe",
    padding: "14px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900"
  }
};

export default Avisos;