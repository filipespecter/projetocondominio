import { useState } from "react";

function Avisos() {
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
      alert("Preencha todos os campos");
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
    }

    salvarStorage(STORAGE_AVISOS, listaAtualizada);

    setNovoAviso(estadoInicialAviso);
    setMostrarModal(false);
    atualizarCentral();
  }

  function editarAviso(aviso) {
    if (aviso.categoria !== "Aviso") {
      alert("Apenas avisos oficiais podem ser editados por este botão.");
      return;
    }

    setNovoAviso({
      ...estadoInicialAviso,
      ...aviso
    });

    setEditId(aviso.id);
    setMostrarModal(true);
  }

  function excluirAviso(id) {
    const confirmar = window.confirm("Deseja realmente excluir este aviso?");

    if (!confirmar) return;

    const listaAvisos = lerStorage(STORAGE_AVISOS).filter((a) => a.id !== id);

    salvarStorage(STORAGE_AVISOS, listaAvisos);
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

    registrarMovimentacao(item.categoria, "Síndico", `${item.titulo} - ${novoStatus}`);
    registrarRelatorio(item.categoria, "Síndico", `${item.titulo} - ${novoStatus}`);

    atualizarCentral();
  }

  function responderItem(item) {
    if (!respostaTexto.trim()) {
      alert("Digite uma resposta antes de salvar.");
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
        apartamento: item.apartamento || "",
        morador: item.morador || item.moradorNome || "",
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

                  <div style={styles.badgeRow}>
                    <span style={styles.categoryTag}>{aviso.categoria}</span>
                    <span style={styles.originTag}>{aviso.origem}</span>
                    <span style={styles.statusTag}>{aviso.status}</span>
                  </div>

                  <h3 style={styles.noticeTitle}>{aviso.titulo}</h3>

                  <p style={styles.noticeDescription}>{aviso.descricao}</p>

                  <div style={styles.dateBox}>
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
                        style={styles.responseTextarea}
                      />

                      <button
                        style={styles.editButton}
                        onClick={() => responderItem(aviso)}
                      >
                        Responder
                      </button>
                    </div>
                  )}

                  <div style={styles.actionRow}>
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
        <div style={styles.modalBg}>
          <div style={styles.modal}>
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
                <div style={styles.formRowFull}>
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

                <div style={styles.formRowFull}>
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

                <div style={styles.formRowFull}>
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
              <button style={styles.saveBtn} onClick={salvarAviso}>
                Salvar aviso
              </button>

              <button style={styles.cancelBtn} onClick={fecharModal}>
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
    fontFamily: "Arial",
    color: "#111827"
  },

  hero: {
    background: "linear-gradient(135deg,#02140b,#064e3b 55%,#15803d)",
    borderRadius: "36px",
    padding: "34px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "28px",
    boxShadow: "0 26px 70px rgba(6,78,59,0.30)",
    marginBottom: "24px"
  },

  heroLeft: {
    maxWidth: "680px"
  },

  heroBadge: {
    display: "inline-block",
    background: "rgba(255,255,255,0.13)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "#dcfce7",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    marginBottom: "15px"
  },

  title: {
    margin: 0,
    fontSize: "44px",
    letterSpacing: "-1px"
  },

  subtitle: {
    margin: "10px 0 0",
    color: "rgba(255,255,255,0.76)",
    lineHeight: "1.55"
  },

  heroRight: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },

  noticeBoard: {
    display: "flex",
    gap: "10px",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    padding: "12px",
    borderRadius: "24px"
  },

  noticeItem: {
    width: "84px",
    height: "76px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.11)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "3px"
  },

  heroButton: {
    background: "#dcfce7",
    color: "#166534",
    border: "none",
    padding: "15px 20px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900",
    whiteSpace: "nowrap"
  },

  controlStrip: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "28px",
    padding: "18px",
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    boxShadow: "0 14px 35px rgba(15,23,42,0.06)"
  },

  searchWrap: {
    flex: 1,
    background: "#f8fafc",
    border: "1px solid #d1d5db",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    padding: "0 14px"
  },

  searchIcon: {
    color: "#166534",
    fontSize: "20px",
    marginRight: "8px"
  },

  search: {
    flex: 1,
    padding: "15px 0",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "14px"
  },

  filter: {
    width: "150px",
    padding: "15px",
    borderRadius: "18px",
    border: "1px solid #d1d5db",
    outline: "none",
    background: "#f8fafc"
  },

  compactStats: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    fontSize: "12px",
    color: "#374151"
  },

  communicationPanel: {
    background: "white",
    border: "1px solid #eef2f7",
    borderRadius: "34px",
    padding: "28px",
    boxShadow: "0 18px 55px rgba(15,23,42,0.08)"
  },

  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px"
  },

  panelLabel: {
    background: "#dcfce7",
    color: "#166534",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900"
  },

  panelTitle: {
    margin: "12px 0 0",
    color: "#052e16",
    fontSize: "28px"
  },

  resultBadge: {
    background: "#f0fdf4",
    color: "#166534",
    border: "1px solid #bbf7d0",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  noticeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))",
    gap: "18px"
  },

  noticeCard: {
    background: "linear-gradient(180deg,#ffffff,#f8fafc)",
    borderRadius: "30px",
    padding: "22px",
    boxShadow: "0 15px 38px rgba(15,23,42,0.06)",
    border: "1px solid #eef2f7"
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px"
  },

  noticeIcon: {
    width: "64px",
    height: "64px",
    borderRadius: "24px",
    background: "linear-gradient(135deg,#052e16,#16a34a)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    boxShadow: "0 14px 26px rgba(22,163,74,0.22)"
  },

  priorityBadge: {
    padding: "7px 11px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "12px",
    whiteSpace: "nowrap"
  },

  badgeRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "14px"
  },

  categoryTag: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  originTag: {
    background: "#f0fdf4",
    color: "#166534",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  statusTag: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  noticeTitle: {
    margin: "0 0 10px",
    color: "#111827",
    fontSize: "22px"
  },

  noticeDescription: {
    margin: 0,
    color: "#4b5563",
    lineHeight: "1.55",
    minHeight: "70px"
  },

  dateBox: {
    marginTop: "16px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
    borderRadius: "17px",
    padding: "13px"
  },

  responseArea: {
    marginTop: "14px",
    display: "grid",
    gap: "10px"
  },

  responseTextarea: {
    padding: "13px",
    borderRadius: "16px",
    border: "1px solid #d1d5db",
    resize: "vertical",
    minHeight: "80px",
    outline: "none",
    fontFamily: "Arial",
    background: "#f9fafb"
  },

  actionRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
    gap: "10px",
    marginTop: "18px"
  },

  editButton: {
    background: "#dcfce7",
    color: "#166534",
    border: "none",
    padding: "12px",
    borderRadius: "15px",
    cursor: "pointer",
    fontWeight: "900"
  },

  deleteButton: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    padding: "12px",
    borderRadius: "15px",
    cursor: "pointer",
    fontWeight: "900"
  },

  empty: {
    background: "#f8fafc",
    border: "1px dashed #d1d5db",
    borderRadius: "26px",
    padding: "48px",
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
    background: "linear-gradient(135deg,#064e3b,#16a34a)",
    color: "white",
    border: "none",
    padding: "13px 18px",
    borderRadius: "15px",
    cursor: "pointer",
    fontWeight: "900"
  },

  modalBg: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.62)",
    backdropFilter: "blur(8px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    padding: "20px"
  },

  modal: {
    width: "680px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#f8fafc",
    padding: "26px",
    borderRadius: "36px",
    boxShadow: "0 30px 80px rgba(0,0,0,0.28)"
  },

  modalTop: {
    background: "linear-gradient(135deg,#052e16,#166534)",
    color: "white",
    borderRadius: "28px",
    padding: "26px",
    display: "flex",
    justifyContent: "space-between",
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
    margin: "14px 0 0",
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

  modalSection: {
    background: "white",
    border: "1px solid #eef2f7",
    borderRadius: "26px",
    padding: "20px",
    marginBottom: "15px"
  },

  modalSectionTitle: {
    margin: "0 0 16px",
    color: "#052e16"
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "15px"
  },

  formRowFull: {
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
    padding: "15px",
    borderRadius: "16px",
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: "14px",
    background: "#f9fafb"
  },

  textarea: {
    padding: "15px",
    borderRadius: "16px",
    border: "1px solid #d1d5db",
    resize: "vertical",
    minHeight: "140px",
    outline: "none",
    fontSize: "14px",
    background: "#f9fafb",
    fontFamily: "Arial"
  },

  modalButtons: {
    display: "flex",
    gap: "12px",
    marginTop: "18px"
  },

  saveBtn: {
    flex: 1,
    background: "linear-gradient(135deg,#064e3b,#16a34a)",
    color: "white",
    border: "none",
    padding: "14px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900"
  },

  cancelBtn: {
    flex: 1,
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    padding: "14px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900"
  }
};

export default Avisos;