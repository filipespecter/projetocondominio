import { useAlerta } from "../../components/Alerta/AlertaProvider";
import { useState } from "react";
import { registrarAuditoria } from "../../Services/auditoriaService";
import { criarNotificacao } from "../../Services/notificacaoService";

function Visitantes() {
  const { mostrarAlerta, confirmarAcao } = useAlerta();
  const STORAGE_KEY = "visitantes";
  const STORAGE_AVISOS_SINDICO = "avisos_sindico";
  const STORAGE_MOVIMENTACOES = "movimentacoes";
  const STORAGE_RELATORIOS = "relatorios_operacionais";
  const STORAGE_HISTORICO = "visitantes_historico";

  const estadoInicialVisitante = {
    nome: "",
    documento: "",
    telefone: "",
    apartamento: "",
    morador: "",
    moradorId: "",
    apartamentoId: null,
    tipoMorador: "",
    moradorPrincipal: false,
    observacao: "",
    entrada: "",
    autorizado: false,
    bloqueado: false,
    status: "Aguardando",
    tipo: "Visitante",
    cienciaSindico: true,
    condominioId: null,
    nomeCondominio: "",
    criadoPor: "",
    porteiroId: null,
    porteiroNome: ""
  };

  const [visitantes, setVisitantes] = useState(() =>
    lerStorage(STORAGE_KEY)
  );

  const [moradores] = useState(() => {
    const lista = lerStorage("moradores");

    return lista.map((morador) => ({
      ...morador,
      apto: morador.apto || morador.apartamento || "",
      apartamento: morador.apartamento || morador.apto || "",
      apartamentoId: morador.apartamentoId || null,
      tipoMorador: morador.tipoMorador || "Morador",
      moradorPrincipal: Boolean(morador.moradorPrincipal)
    }));
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [novoVisitante, setNovoVisitante] = useState(estadoInicialVisitante);
  const [editId, setEditId] = useState(null);

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

  function normalizarStatus(status) {
    if (status === "aguardando" || status === "Pendente") return "Aguardando";
    if (status === "liberado" || status === "Autorizado") return "Autorizado";
    if (status === "entrou" || status === "Em visita") return "Em Visita";
    if (status === "saiu" || status === "Encerrado") return "Saiu";
    if (status === "Bloqueado") return "Bloqueado";

    return status || "Aguardando";
  }

  const visitantesNormalizados = visitantes.map((v) => ({
    ...v,
    status: normalizarStatus(v.status)
  }));

  const visitantesFiltrados = visitantesNormalizados.filter((v) => {
    const texto = busca.toLowerCase();

    const correspondeBusca =
      v.nome?.toLowerCase().includes(texto) ||
      v.documento?.toLowerCase().includes(texto) ||
      v.telefone?.toLowerCase().includes(texto) ||
      v.apartamento?.toLowerCase().includes(texto) ||
      v.morador?.toLowerCase().includes(texto) ||
      v.tipo?.toLowerCase().includes(texto) ||
      v.tipoVisitante?.toLowerCase().includes(texto) ||
      v.status?.toLowerCase().includes(texto);

    const correspondeStatus =
      filtroStatus === "Todos" || v.status === filtroStatus;

    return correspondeBusca && correspondeStatus;
  });

  const pendentes = visitantesNormalizados.filter(
    (v) => v.status === "Aguardando"
  );

  const emVisita = visitantesNormalizados.filter(
    (v) => v.status === "Em Visita"
  );

  const autorizados = visitantesNormalizados.filter(
    (v) => v.status === "Autorizado"
  );

  const bloqueados = visitantesNormalizados.filter(
    (v) => v.status === "Bloqueado" || v.bloqueado === true
  );

  const encerrados = visitantesNormalizados.filter(
    (v) => v.status === "Saiu"
  );

  function limparDocumento(valor) {
    return String(valor || "").replace(/[^\dA-Za-z.-]/g, "");
  }

  function limparTelefone(valor) {
    return String(valor || "").replace(/\D/g, "");
  }

  function validarHora(valor) {
    if (!valor) return true;
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(valor);
  }

  function validarDocumento(valor) {
    const doc = String(valor || "").trim();

    const cpfNumerico = doc.replace(/\D/g, "");

    if (cpfNumerico.length === 11) {
      return true;
    }

    const rgValido = /^[0-9A-Za-z.-]{5,14}$/.test(doc);

    return rgValido;
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

  function obterUsuarioAtual() {
    try {
      return (
        JSON.parse(localStorage.getItem("usuarioSindico")) ||
        JSON.parse(sessionStorage.getItem("usuarioSindico")) ||
        JSON.parse(localStorage.getItem("usuarioPorteiro")) ||
        JSON.parse(sessionStorage.getItem("usuarioPorteiro")) ||
        {}
      );
    } catch {
      return {};
    }
  }

  function registrarAuditoriaVisitante({
    acao,
    detalhes,
    antes = null,
    depois = null,
    referenciaId = null
  }) {
    registrarAuditoria({
      acao,
      modulo: "Visitantes",
      detalhes,
      antes,
      depois,
      referenciaId
    });
  }

  function criarNotificacaoVisitante({
    titulo,
    mensagem,
    referenciaId = null,
    prioridade = "normal",
    perfilDestino = "sindico"
  }) {
    criarNotificacao({
      titulo,
      mensagem,
      tipo: "Visitantes",
      origem: "Visitantes",
      perfilDestino,
      moduloOrigem: "Visitantes",
      referenciaId,
      prioridade
    });
  }

  function validarVisitante() {
    const nome = String(novoVisitante.nome || "").trim();
    const documento = String(novoVisitante.documento || "").trim();
    const telefone = limparTelefone(novoVisitante.telefone);
    const entrada = String(novoVisitante.entrada || "").trim();

    if (nome.length < 3) {
      mostrarAlerta("Informe o nome do visitante com pelo menos 3 caracteres.");
      return false;
    }

    if (!documento) {
      mostrarAlerta("Informe o documento do visitante.");
      return false;
    }

    if (!validarDocumento(documento)) {
      mostrarAlerta("Informe um CPF com 11 números ou um RG válido.");
      return false;
    }

    if (telefone && (telefone.length < 10 || telefone.length > 11)) {
      mostrarAlerta("Informe um telefone válido com DDD ou deixe em branco.");
      return false;
    }

    if (!novoVisitante.tipo) {
      mostrarAlerta("Selecione o tipo do visitante.");
      return false;
    }

    if (entrada && !validarHora(entrada)) {
      mostrarAlerta("Informe a hora no formato HH:mm. Exemplo: 14:35");
      return false;
    }

    if (!novoVisitante.morador) {
      mostrarAlerta("Selecione o morador responsável.");
      return false;
    }

    if (!novoVisitante.apartamento) {
      mostrarAlerta("O apartamento do morador responsável é obrigatório.");
      return false;
    }

    const documentoNormalizado = documento.replace(/\D/g, "") || documento.toLowerCase();

    const visitanteDuplicado = visitantes.find((v) => {
      const docExistente =
        String(v.documento || "").replace(/\D/g, "") ||
        String(v.documento || "").toLowerCase();

      const statusAtual = normalizarStatus(v.status);

      return (
        docExistente === documentoNormalizado &&
        v.id !== editId &&
        statusAtual !== "Saiu" &&
        statusAtual !== "Bloqueado"
      );
    });

    if (visitanteDuplicado) {
      mostrarAlerta("Já existe um visitante ativo/pendente com este documento.");
      return false;
    }

    return true;
  }

  function registrarMovimentacao(acao, visitante) {
    const movimentacoes = lerStorage(STORAGE_MOVIMENTACOES);

    const nova = {
      id: Date.now(),
      tipo: "Visitante",
      acao,
      origem: "Síndico",
      titulo: `Visitante ${visitante.nome}`,
      visitanteId: visitante.id,
      nome: visitante.nome,
      apartamento: visitante.apartamento,
      status: visitante.status,
      data: new Date().toLocaleDateString("pt-BR"),
      hora: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      }),
      timestamp: Date.now(),
      impactaBI: true,
      origemModulo: "Visitantes",
      atualizadoEm: new Date().toISOString()
    };

    salvarStorage(STORAGE_MOVIMENTACOES, [nova, ...movimentacoes]);
  }

  function registrarRelatorio(acao, visitante) {
    const relatorios = lerStorage(STORAGE_RELATORIOS);

    const novo = {
      id: Date.now() + 1,
      tipo: "Visitante",
      acao,
      origem: "Síndico",
      visitanteId: visitante.id,
      nome: visitante.nome,
      documento: visitante.documento,
      apartamento: visitante.apartamento,
      morador: visitante.morador,
      tipoVisitante: visitante.tipo || visitante.tipoVisitante || "Visita",
      observacao: visitante.observacao,
      status: visitante.status,
      data: visitante.data || new Date().toLocaleDateString("pt-BR"),
      entrada: visitante.entrada || visitante.horarioEntrada || "",
      saida: visitante.saida || visitante.horarioSaida || "",
      impactaRelatorio: true,
      origemModulo: "Visitantes"
    };

    salvarStorage(STORAGE_RELATORIOS, [novo, ...relatorios]);
  }

  function registrarHistorico(acao, visitante) {
    const historico = lerStorage(STORAGE_HISTORICO);

    const novo = {
      id: Date.now() + 2,
      visitanteId: visitante.id,
      acao,
      origem: "Síndico",
      nome: visitante.nome,
      documento: visitante.documento,
      apartamento: visitante.apartamento,
      morador: visitante.morador,
      tipoVisitante: visitante.tipo || visitante.tipoVisitante || "Visita",
      observacao: visitante.observacao,
      status: visitante.status,
      data: visitante.data || new Date().toLocaleDateString("pt-BR"),
      entrada: visitante.entrada || visitante.horarioEntrada || "",
      saida: visitante.saida || visitante.horarioSaida || "",
      registradoEm: new Date().toLocaleString("pt-BR"),
      origemModulo: "Visitantes"
    };

    salvarStorage(STORAGE_HISTORICO, [novo, ...historico]);
  }

  function registrarAvisoSindico(acao, visitante) {
    const avisos = lerStorage(STORAGE_AVISOS_SINDICO);

    const novo = {
      id: Date.now() + 3,
      visitanteId: visitante.id,
      categoria: "Visitante",
      origem: "Síndico",
      titulo: `Visitante ${acao} - ${visitante.nome}`,
      descricao:
        visitante.observacao ||
        `Visitante ${visitante.nome} vinculado ao apartamento ${visitante.apartamento}`,
      apartamento: visitante.apartamento,
      morador: visitante.morador || "",
      responsavel: "Síndico",
      status: visitante.status,
      respostaSindico: "",
      cienciaSindico: true,
      data: new Date().toLocaleDateString("pt-BR"),
      impactaBI: true,
      impactaRelatorio: true,
      exibirNaCentral: true,
      origemModulo: "Visitantes"
    };

    salvarStorage(STORAGE_AVISOS_SINDICO, [novo, ...avisos]);
  }

  function atualizarAvisoSindico(visitante) {
    const avisos = lerStorage(STORAGE_AVISOS_SINDICO);

    const atualizados = avisos.map((aviso) =>
      aviso.categoria === "Visitante" &&
      (
        aviso.visitanteId === visitante.id ||
        String(aviso.apartamento) === String(visitante.apartamento)
      ) &&
      aviso.titulo?.includes(visitante.nome)
        ? {
            ...aviso,
            visitanteId: visitante.id,
            status: visitante.status,
            cienciaSindico: true,
            dataAtualizacao: new Date().toLocaleString("pt-BR"),
            impactaBI: true,
            impactaRelatorio: true,
            exibirNaCentral: true,
            origemModulo: "Visitantes"
          }
        : aviso
    );

    salvarStorage(STORAGE_AVISOS_SINDICO, atualizados);
  }

  function registrarFluxo(acao, visitante, antes = null) {
    registrarMovimentacao(acao, visitante);
    registrarRelatorio(acao, visitante);
    registrarHistorico(acao, visitante);
    registrarAvisoSindico(acao, visitante);

    registrarAuditoriaVisitante({
      acao: `Visitante - ${acao}`,
      detalhes: `${visitante.nome} - Apto ${visitante.apartamento}`,
      antes,
      depois: visitante,
      referenciaId: visitante.id
    });

    if (["cadastro", "edição", "exclusão"].includes(acao)) {
      criarNotificacaoVisitante({
        titulo:
          acao === "cadastro"
            ? "Novo visitante registrado"
            : acao === "edição"
            ? "Visitante atualizado"
            : "Visitante removido",
        mensagem: `${visitante.nome} • Apartamento ${visitante.apartamento}`,
        referenciaId: visitante.id,
        prioridade: acao === "exclusão" ? "alta" : "normal"
      });
    }
  }

  function salvarVisitante() {
    if (!validarVisitante()) {
      return;
    }

    const agora = new Date();

    let statusFinal = "Aguardando";

    if (novoVisitante.bloqueado) {
      statusFinal = "Bloqueado";
    } else if (novoVisitante.autorizado) {
      statusFinal = "Autorizado";
    }

    const perfilCondominio = obterPerfilCondominio();
    const usuarioAtual = obterUsuarioAtual();

    const visitanteCompleto = {
      ...novoVisitante,
      nome: String(novoVisitante.nome || "").trim(),
      documento: limparDocumento(novoVisitante.documento),
      telefone: limparTelefone(novoVisitante.telefone),
      tipo: novoVisitante.tipo || "Visitante",
      status: statusFinal,
      cienciaSindico: true,
      condominioId: perfilCondominio.condominioId,
      nomeCondominio: perfilCondominio.nomeCondominio,
      criadoPor: usuarioAtual.nome || usuarioAtual.usuario || "Sistema",
      porteiroId: usuarioAtual.tipo === "porteiro" ? usuarioAtual.id || null : novoVisitante.porteiroId || null,
      apartamentoId: novoVisitante.apartamentoId || null,
      tipoMorador: novoVisitante.tipoMorador || "",
      moradorPrincipal: Boolean(novoVisitante.moradorPrincipal),
      porteiroNome: usuarioAtual.tipo === "porteiro" ? usuarioAtual.nome || usuarioAtual.usuario || "" : novoVisitante.porteiroNome || "",
      data: agora.toLocaleDateString("pt-BR"),
      hora: agora.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      }),
      timestamp: agora.getTime(),
      mes: agora.getMonth() + 1,
      ano: agora.getFullYear(),
      entrada:
        novoVisitante.entrada ||
        agora.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        }),
      impactaBI: true,
      impactaRelatorio: true,
      exibirNaCentral: true,
      origemModulo: "Visitantes"
    };

    let listaAtualizada = [];

    if (editId !== null) {
      listaAtualizada = visitantes.map((v) =>
        v.id === editId
          ? {
              ...visitanteCompleto,
              id: editId
            }
          : v
      );

      const visitanteAntes = visitantes.find((v) => v.id === editId);

      registrarFluxo(
        "edição",
        {
          ...visitanteCompleto,
          id: editId
        },
        visitanteAntes
      );

      setEditId(null);
    } else {
      const novo = {
        id: Date.now(),
        ...visitanteCompleto,
        criadoEm: agora.toISOString()
      };

      listaAtualizada = [novo, ...visitantes];

      registrarFluxo("cadastro", novo);
    }

    setVisitantes(listaAtualizada);
    salvarStorage(STORAGE_KEY, listaAtualizada);

    setNovoVisitante(estadoInicialVisitante);
    setMostrarModal(false);
  }

  async function excluirVisitante(id) {
    const confirmar = await confirmarAcao(
      "Deseja realmente excluir este visitante?"
    );

    if (!confirmar) return;

    const visitante = visitantes.find((v) => v.id === id);

    if (visitante) {
      registrarMovimentacao("exclusão", visitante);
      registrarRelatorio("exclusão", visitante);
      registrarHistorico("exclusão", visitante);

      registrarAuditoriaVisitante({
        acao: "Excluiu visitante",
        detalhes: `${visitante.nome} - Apto ${visitante.apartamento}`,
        antes: visitante,
        referenciaId: id
      });

      criarNotificacaoVisitante({
        titulo: "Visitante removido",
        mensagem: `${visitante.nome} foi removido do controle de acesso.`,
        referenciaId: id,
        prioridade: "alta"
      });
    }

    const novaLista = visitantes.filter((v) => v.id !== id);

    setVisitantes(novaLista);
    salvarStorage(STORAGE_KEY, novaLista);
  }

  function editarVisitante(v) {
    setNovoVisitante({
      ...estadoInicialVisitante,
      ...v,
      status: normalizarStatus(v.status),
      apartamentoId: v.apartamentoId || null,
      tipoMorador: v.tipoMorador || "",
      moradorPrincipal: Boolean(v.moradorPrincipal),
      moradorId:
        v.moradorId ||
        obterMoradorIdPorNomeApartamento(v.morador, v.apartamento)
    });

    setEditId(v.id);
    setMostrarModal(true);
  }

  function mudarStatus(id, status) {
    const agora = new Date();

    let visitanteAtualizado = null;

    const lista = visitantes.map((v) => {
      if (v.id !== id) return v;

      visitanteAtualizado = {
        ...v,
        status,
        statusSindico: status,
        cienciaSindico: true,
        autorizado:
          status === "Autorizado" || status === "Em Visita"
            ? true
            : v.autorizado,
        bloqueado:
          status === "Bloqueado"
            ? true
            : status === "Autorizado" || status === "Em Visita"
            ? false
            : v.bloqueado,
        saida:
          status === "Saiu"
            ? agora.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              })
            : v.saida,
        horarioSaida:
          status === "Saiu"
            ? agora.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              })
            : v.horarioSaida,
        saidaEm:
          status === "Saiu"
            ? agora.toLocaleString("pt-BR")
            : v.saidaEm,
        impactaBI: true,
        impactaRelatorio: true,
        exibirNaCentral: true,
        origemModulo: "Visitantes"
      };

      return visitanteAtualizado;
    });

    if (visitanteAtualizado) {
      registrarMovimentacao(`status: ${status}`, visitanteAtualizado);
      registrarRelatorio(`status: ${status}`, visitanteAtualizado);
      registrarHistorico(`status: ${status}`, visitanteAtualizado);
      atualizarAvisoSindico(visitanteAtualizado);

      registrarAuditoriaVisitante({
        acao: `Alterou status do visitante para ${status}`,
        detalhes: `${visitanteAtualizado.nome} - Apto ${visitanteAtualizado.apartamento}`,
        depois: visitanteAtualizado,
        referenciaId: visitanteAtualizado.id
      });

      criarNotificacaoVisitante({
        titulo:
          status === "Autorizado"
            ? "Visitante autorizado"
            : status === "Em Visita"
            ? "Visitante entrou no condomínio"
            : status === "Saiu"
            ? "Visitante saiu do condomínio"
            : status === "Bloqueado"
            ? "Visitante bloqueado"
            : "Status de visitante atualizado",
        mensagem: `${visitanteAtualizado.nome} • Apartamento ${visitanteAtualizado.apartamento}`,
        referenciaId: visitanteAtualizado.id,
        prioridade: status === "Bloqueado" ? "alta" : "normal"
      });
    }

    setVisitantes(lista);
    salvarStorage(STORAGE_KEY, lista);
  }

  function obterMoradorIdPorNomeApartamento(nome, apartamento) {
    const moradorEncontrado = moradores.find(
      (m) =>
        m.nome === nome &&
        (m.apto === apartamento || m.apartamento === apartamento)
    );

    return moradorEncontrado ? moradorEncontrado.id : "";
  }

  function selecionarMorador(moradorId) {
    const moradorSelecionado = moradores.find(
      (m) => String(m.id) === String(moradorId)
    );

    if (!moradorSelecionado) {
      setNovoVisitante({
        ...novoVisitante,
        moradorId: "",
        morador: "",
        apartamento: "",
        apartamentoId: null,
        tipoMorador: "",
        moradorPrincipal: false
      });

      return;
    }

    setNovoVisitante({
      ...novoVisitante,
      moradorId: moradorSelecionado.id,
      morador: moradorSelecionado.nome,
      apartamento:
        moradorSelecionado.apartamento || moradorSelecionado.apto || "",
      apartamentoId: moradorSelecionado.apartamentoId || null,
      tipoMorador: moradorSelecionado.tipoMorador || "Morador",
      moradorPrincipal: Boolean(moradorSelecionado.moradorPrincipal)
    });
  }

  function corStatus(status) {
    switch (status) {
      case "Em Visita":
        return {
          bg: "#f3e8ff",
          color: "#7c3aed",
          border: "#ddd6fe",
          label: "Dentro do condomínio"
        };

      case "Autorizado":
        return {
          bg: "#ede9fe",
          color: "#6d28d9",
          border: "#ddd6fe",
          label: "Liberado"
        };

      case "Bloqueado":
        return {
          bg: "#fee2e2",
          color: "#b91c1c",
          border: "#fecaca",
          label: "Bloqueado"
        };

      case "Saiu":
        return {
          bg: "#f5f3ff",
          color: "#374151",
          border: "#ddd6fe",
          label: "Encerrado"
        };

      default:
        return {
          bg: "#fef3c7",
          color: "#92400e",
          border: "#fde68a",
          label: "Aguardando"
        };
    }
  }

  function tipoVisual(tipo) {
    if (tipo === "Entregador") return "📦";
    if (tipo === "Prestador") return "🧰";
    if (tipo === "Técnico") return "🔧";
    if (tipo === "Corretor") return "🏘️";
    if (tipo === "Familiar") return "👨‍👩‍👧";
    return "👤";
  }

  function iniciais(nome) {
    if (!nome) return "V";

    const partes = nome.trim().split(" ");

    if (partes.length === 1) {
      return partes[0].charAt(0).toUpperCase();
    }

    return `${partes[0].charAt(0)}${partes[
      partes.length - 1
    ].charAt(0)}`.toUpperCase();
  }

  function fecharModal() {
    setMostrarModal(false);
    setEditId(null);
    setNovoVisitante(estadoInicialVisitante);
  }

  return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <div style={styles.heroLeft}>
          <span style={styles.heroBadge}>🛂 Controle de acesso</span>

          <h1 style={styles.title}>Visitantes</h1>

          <p style={styles.subtitle}>
            Monitore entradas, autorizações, bloqueios e saídas do condomínio.
          </p>
        </div>

        <div style={styles.heroRight}>
          <div style={styles.accessBoard}>
            <div style={styles.accessItem}>
              <span>🟡</span>
              <strong>{pendentes.length}</strong>
              <small>pendentes</small>
            </div>

            <div style={styles.accessItem}>
              <span>🟢</span>
              <strong>{emVisita.length}</strong>
              <small>em visita</small>
            </div>

            <div style={styles.accessItem}>
              <span>🔴</span>
              <strong>{bloqueados.length}</strong>
              <small>bloqueados</small>
            </div>
          </div>

          <button
            style={styles.heroButton}
            onClick={() => {
              setEditId(null);
              setNovoVisitante(estadoInicialVisitante);
              setMostrarModal(true);
            }}
          >
            + Novo visitante
          </button>
        </div>
      </section>

      <section style={styles.controlStrip}>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>⌕</span>

          <input
            placeholder="Buscar visitante, documento, morador, apartamento ou tipo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={styles.search}
          />
        </div>

        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          style={styles.filter}
        >
          <option>Todos</option>
          <option>Aguardando</option>
          <option>Autorizado</option>
          <option>Em Visita</option>
          <option>Bloqueado</option>
          <option>Saiu</option>
        </select>

        <div style={styles.compactStats}>
          <span>
            <b>{visitantes.length}</b> total
          </span>

          <span>
            <b>{autorizados.length}</b> liberados
          </span>

          <span>
            <b>{encerrados.length}</b> encerrados
          </span>
        </div>
      </section>

      <section style={styles.accessPanel}>
        <div style={styles.panelHeader}>
          <div>
            <span style={styles.panelLabel}>Monitoramento</span>

            <h2 style={styles.panelTitle}>Fluxo de visitantes</h2>
          </div>

          <span style={styles.resultBadge}>
            {visitantesFiltrados.length} resultado(s)
          </span>
        </div>

        {visitantesFiltrados.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>🛂</div>

            <h3 style={styles.emptyTitle}>Nenhum visitante encontrado</h3>

            <p style={styles.emptyText}>
              Registre visitantes para acompanhar entrada, autorização e saída.
            </p>

            <button
              style={styles.emptyButton}
              onClick={() => {
                setEditId(null);
                setNovoVisitante(estadoInicialVisitante);
                setMostrarModal(true);
              }}
            >
              Registrar visitante
            </button>
          </div>
        ) : (
          <div style={styles.visitorGrid}>
            {visitantesFiltrados.map((v) => {
              const status = corStatus(v.status);

              return (
                <article
                  key={v.id}
                  style={{
                    ...styles.visitorCard,
                    borderColor: status.border
                  }}
                >
                  <div style={styles.cardHeader}>
                    <div style={styles.identityArea}>
                      <div style={styles.avatar}>{iniciais(v.nome)}</div>

                      <div>
                        <h3 style={styles.visitorName}>{v.nome}</h3>

                        <p style={styles.document}>Doc: {v.documento}</p>
                      </div>
                    </div>

                    <span
                      style={{
                        ...styles.statusBadge,
                        background: status.bg,
                        color: status.color
                      }}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div style={styles.typeLine}>
                    <span style={styles.typeIcon}>
                      {tipoVisual(v.tipo || v.tipoVisitante)}
                    </span>

                    <strong>{v.tipo || v.tipoVisitante || "Visita"}</strong>
                  </div>

                  <div style={styles.infoGrid}>
                    <div style={styles.infoItem}>
                      <span>Morador responsável</span>
                      <strong>{v.morador || "N/A"}</strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span>Apartamento</span>
                      <strong>{v.apartamento || "-"}</strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span>Telefone</span>
                      <strong>{v.telefone || "-"}</strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span>Entrada</span>
                      <strong>
                        {v.entrada || v.horarioEntrada || v.hora || "-"}
                      </strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span>Data</span>
                      <strong>{v.data || "-"}</strong>
                    </div>
                  </div>

                  {v.observacao && (
                    <div style={styles.noteBox}>{v.observacao}</div>
                  )}

                  <div style={styles.actionRow}>
                    <button
                      style={styles.authorizeBtn}
                      onClick={() => mudarStatus(v.id, "Autorizado")}
                    >
                      Autorizar
                    </button>

                    <button
                      style={styles.enterBtn}
                      onClick={() => mudarStatus(v.id, "Em Visita")}
                    >
                      Entrou
                    </button>

                    <button
                      style={styles.exitBtn}
                      onClick={() => mudarStatus(v.id, "Saiu")}
                    >
                      Saiu
                    </button>

                    <button
                      style={styles.deleteBtn}
                      onClick={() => excluirVisitante(v.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {mostrarModal && (
        <div style={styles.modalBg}>
          <div style={styles.modal} className="scroll-sindico">
            <div style={styles.modalTop}>
              <div>
                <span style={styles.modalBadge}>
                  {editId !== null ? "Editar acesso" : "Novo acesso"}
                </span>

                <h2 style={styles.modalTitle}>
                  {editId !== null ? "Editar visitante" : "Registrar visitante"}
                </h2>
              </div>

              <button style={styles.closeButton} onClick={fecharModal}>
                ✕
              </button>
            </div>

            <div style={styles.modalSection}>
              <h3 style={styles.modalSectionTitle}>Dados do visitante</h3>

              <div style={styles.formGrid}>
                <div style={styles.formRow}>
                  <label style={styles.label}>Nome</label>

                  <input
                    minLength="3"
                    placeholder="Nome do visitante"
                    value={novoVisitante.nome}
                    onChange={(e) =>
                      setNovoVisitante({
                        ...novoVisitante,
                        nome: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Documento</label>

                  <input
                    placeholder="CPF ou RG"
                    value={novoVisitante.documento}
                    onChange={(e) =>
                      setNovoVisitante({
                        ...novoVisitante,
                        documento: limparDocumento(e.target.value)
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Telefone</label>

                  <input
                    inputMode="numeric"
                    maxLength="11"
                    placeholder="Ex: 81999999999"
                    value={novoVisitante.telefone}
                    onChange={(e) =>
                      setNovoVisitante({
                        ...novoVisitante,
                        telefone: limparTelefone(e.target.value)
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Tipo</label>

                  <select
                    value={novoVisitante.tipo}
                    onChange={(e) =>
                      setNovoVisitante({
                        ...novoVisitante,
                        tipo: e.target.value
                      })
                    }
                    style={styles.input}
                  >
                    <option>Visitante</option>
                    <option>Familiar</option>
                    <option>Prestador</option>
                    <option>Entregador</option>
                    <option>Corretor</option>
                    <option>Técnico</option>
                  </select>
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Hora de entrada</label>

                  <input
                    placeholder="Ex: 14:35"
                    maxLength="5"
                    value={novoVisitante.entrada}
                    onChange={(e) =>
                      setNovoVisitante({
                        ...novoVisitante,
                        entrada: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            <div style={styles.modalSection}>
              <h3 style={styles.modalSectionTitle}>Responsável pela visita</h3>

              <div style={styles.formGrid}>
                <div style={styles.formRow}>
                  <label style={styles.label}>Morador responsável</label>

                  <select
                    value={
                      novoVisitante.moradorId ||
                      obterMoradorIdPorNomeApartamento(
                        novoVisitante.morador,
                        novoVisitante.apartamento
                      )
                    }
                    onChange={(e) => selecionarMorador(e.target.value)}
                    style={styles.input}
                  >
                    <option value="">Selecione o morador responsável</option>

                    {moradores.map((morador) => (
                      <option key={morador.id} value={morador.id}>
                        {morador.nome} - Apto{" "}
                        {morador.apartamento || morador.apto}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Apartamento</label>

                  <input
                    placeholder="Apartamento"
                    value={novoVisitante.apartamento}
                    readOnly
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            <div style={styles.modalSection}>
              <h3 style={styles.modalSectionTitle}>Controle de acesso</h3>

              <div style={styles.accessOptions}>
                <label style={styles.optionCard}>
                  <input
                    type="checkbox"
                    checked={novoVisitante.autorizado}
                    onChange={(e) =>
                      setNovoVisitante({
                        ...novoVisitante,
                        autorizado: e.target.checked,
                        bloqueado: e.target.checked
                          ? false
                          : novoVisitante.bloqueado
                      })
                    }
                  />

                  <span>✅ Autorizado</span>
                </label>

                <label style={styles.optionCard}>
                  <input
                    type="checkbox"
                    checked={novoVisitante.bloqueado}
                    onChange={(e) =>
                      setNovoVisitante({
                        ...novoVisitante,
                        bloqueado: e.target.checked,
                        autorizado: e.target.checked
                          ? false
                          : novoVisitante.autorizado
                      })
                    }
                  />

                  <span>⛔ Bloqueado</span>
                </label>
              </div>

              <textarea
                placeholder="Observações"
                value={novoVisitante.observacao}
                onChange={(e) =>
                  setNovoVisitante({
                    ...novoVisitante,
                    observacao: e.target.value
                  })
                }
                style={styles.textarea}
              />
            </div>

            <div style={styles.modalButtons}>
              <button style={styles.saveBtn} onClick={salvarVisitante}>
                Salvar visitante
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
    color: "#111827",
    position: "relative"
  },

  hero: {
    background:
      "linear-gradient(135deg,#02140b,#5b21b6 55%,#7c3aed)",
    borderRadius: "36px",
    padding: "34px",
    color: "white",
    display: "flex",
    flexWrap: "wrap",
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
    color: "#f3e8ff",
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
    flexWrap: "wrap",
    alignItems: "center",
    gap: "14px"
  },

  accessBoard: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    padding: "12px",
    borderRadius: "24px"
  },

  accessItem: {
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
    background: "#f3e8ff",
    color: "#7c3aed",
    border: "none",
    padding: "15px 20px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900",
    whiteSpace: "nowrap"
  },

  controlStrip: {
    background: "white",
    border: "1px solid #ddd6fe",
    borderRadius: "28px",
    padding: "18px",
    marginBottom: "24px",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "14px",
    boxShadow: "0 14px 35px rgba(88,28,135,0.07)"
  },

  searchWrap: {
    flex: 1,
    background: "#fbfaff",
    border: "1px solid #c4b5fd",
    borderRadius: "18px",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    padding: "0 14px"
  },

  searchIcon: {
    color: "#7c3aed",
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
    width: "170px",
    padding: "15px",
    borderRadius: "18px",
    border: "1px solid #c4b5fd",
    outline: "none",
    background: "#fbfaff"
  },

  compactStats: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    fontSize: "12px",
    color: "#374151"
  },

  accessPanel: {
    background: "white",
    border: "1px solid #ede9fe",
    borderRadius: "34px",
    padding: "28px",
    boxShadow: "0 18px 55px rgba(88,28,135,0.09)"
  },

  panelHeader: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px"
  },

  panelLabel: {
    background: "#f3e8ff",
    color: "#7c3aed",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900"
  },

  panelTitle: {
    margin: "12px 0 0",
    color: "#4c1d95",
    fontSize: "28px"
  },

  resultBadge: {
    background: "#faf5ff",
    color: "#7c3aed",
    border: "1px solid #ddd6fe",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  visitorGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(340px,100%),1fr))",
    gap: "18px"
  },

  visitorCard: {
    background: "linear-gradient(180deg,#ffffff,#fbfaff)",
    borderRadius: "30px",
    padding: "22px",
    boxShadow: "0 15px 38px rgba(88,28,135,0.07)",
    border: "1px solid #ede9fe"
  },

  cardHeader: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "18px"
  },

  identityArea: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "14px"
  },

  avatar: {
    width: "64px",
    height: "64px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg,#4c1d95,#8b5cf6)",
    color: "white",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "900",
    boxShadow: "0 14px 26px rgba(124,58,237,0.18)"
  },

  visitorName: {
    margin: 0,
    color: "#111827",
    fontSize: "21px"
  },

  document: {
    margin: "5px 0 0",
    color: "#6b7280",
    fontSize: "13px"
  },

  statusBadge: {
    padding: "7px 11px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "12px",
    whiteSpace: "nowrap"
  },

  typeLine: {
    background: "#faf5ff",
    border: "1px solid #ddd6fe",
    borderRadius: "18px",
    padding: "13px",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "10px",
    color: "#7c3aed",
    marginBottom: "14px"
  },

  typeIcon: {
    fontSize: "21px"
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px"
  },

  infoItem: {
    background: "white",
    border: "1px solid #ede9fe",
    borderRadius: "17px",
    padding: "13px"
  },

  noteBox: {
    marginTop: "12px",
    background: "#fffbeb",
    border: "1px solid #fde68a",
    color: "#92400e",
    padding: "12px",
    borderRadius: "16px",
    fontSize: "13px"
  },

  actionRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(120px,100%),1fr))",
    gap: "8px",
    marginTop: "18px"
  },

  authorizeBtn: {
    background: "#ede9fe",
    color: "#6d28d9",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  enterBtn: {
    background: "#f3e8ff",
    color: "#7c3aed",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  exitBtn: {
    background: "#f5f3ff",
    color: "#374151",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  deleteBtn: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  empty: {
    background: "#fbfaff",
    border: "1px dashed #c4b5fd",
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
    background:
      "linear-gradient(135deg,#5b21b6,#8b5cf6)",
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
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    padding: "20px"
  },

  modal: {
    width: "100%",
    maxWidth: "780px",
    maxHeight: "90vh",
    overflowY: "auto",
    overflowX: "hidden",
    background: "#fbfaff",
    padding: "26px",
    borderRadius: "36px",
    boxShadow: "0 30px 80px rgba(0,0,0,0.28)"
  },

  modalTop: {
    background:
      "linear-gradient(135deg,#4c1d95,#7c3aed)",
    color: "white",
    borderRadius: "28px",
    padding: "26px",
    display: "flex",
    flexWrap: "wrap",
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
    border: "1px solid #ede9fe",
    borderRadius: "26px",
    padding: "20px",
    marginBottom: "15px"
  },

  modalSectionTitle: {
    margin: "0 0 16px",
    color: "#4c1d95"
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(260px,100%),1fr))",
    gap: "15px"
  },

  formRow: {
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
    border: "1px solid #c4b5fd",
    outline: "none",
    fontSize: "14px",
    background: "#fbfaff"
  },

  accessOptions: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(260px,100%),1fr))",
    gap: "12px",
    marginBottom: "14px"
  },

  optionCard: {
    background: "#fbfaff",
    border: "1px solid #ddd6fe",
    borderRadius: "17px",
    padding: "14px",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "10px",
    fontWeight: "900",
    color: "#374151"
  },

  textarea: {
    width: "100%",
    minHeight: "100px",
    padding: "15px",
    borderRadius: "16px",
    border: "1px solid #c4b5fd",
    outline: "none",
    fontSize: "14px",
    background: "#fbfaff",
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "Arial"
  },

  modalButtons: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "18px"
  },

  saveBtn: {
    flex: 1,
    background:
      "linear-gradient(135deg,#5b21b6,#8b5cf6)",
    color: "white",
    border: "none",
    padding: "14px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900"
  },

  cancelBtn: {
    flex: 1,
    background: "#f5f3ff",
    color: "#374151",
    border: "none",
    padding: "14px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900"
  }
};

export default Visitantes;