import { useAlerta } from "../../components/Alerta/AlertaProvider";
import { useEffect, useState } from "react";
import { registrarAuditoria } from "../../Services/auditoriaService";
import { criarNotificacao } from "../../Services/notificacaoService";

import logoStar from "../../assets/images/logo-star-infinity.png";

function Encomendas() {
  const { mostrarAlerta, confirmarAcao } = useAlerta();
  const STORAGE_KEY = "encomendas";
  const STORAGE_MOVIMENTACOES = "movimentacoes";
  const STORAGE_RELATORIOS = "relatorios_operacionais";
  const STORAGE_AVISOS_SINDICO = "avisos_sindico";
  const STORAGE_NOTIFICACOES = "notificacoesMorador";
  const STORAGE_HISTORICO = "encomendas_historico";

  const estadoInicialEncomenda = {
    morador: "",
    moradorId: null,
    apartamento: "",
    apartamentoId: null,
    tipoMorador: "",
    moradorPrincipal: false,
    descricao: "",
    codigo: "",
    codigoRastreio: "",
    rastreio: "",
    codigoInterno: "",
    transportadora: "",
    status: "Recebido",
    condominioId: null,
    nomeCondominio: "",
    criadoPor: "",
    porteiroId: null,
    porteiroNome: ""
  };

  const [encomendas, setEncomendas] = useState(() => {
    const lista = lerStorage(STORAGE_KEY);

    return lista.map((item, index) => ({
      ...item,
      codigoRastreio: obterCodigoRastreio(item),
      rastreio: obterCodigoRastreio(item),
      codigo: obterCodigoRastreio(item),
      codigoInterno: item.codigoInterno || gerarCodigoEncomenda(index + 1),
      moradorId: item.moradorId || null,
      status: normalizarStatus(item.status)
    }));
  });

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
  const [novaEncomenda, setNovaEncomenda] = useState(estadoInicialEncomenda);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    const sincronizar = () => {
      const lista = lerStorage(STORAGE_KEY).map((item, index) => ({
        ...item,
        codigoRastreio: obterCodigoRastreio(item),
        rastreio: obterCodigoRastreio(item),
        codigo: obterCodigoRastreio(item),
        codigoInterno:
          item.codigoInterno ||
          gerarCodigoEncomenda(index + 1),
        status: normalizarStatus(item.status)
      }));

      setEncomendas(lista);
    };

    window.addEventListener("storage", sincronizar);
    window.addEventListener(
      "infinitycondo:encomendas",
      sincronizar
    );

    return () => {
      window.removeEventListener("storage", sincronizar);
      window.removeEventListener(
        "infinitycondo:encomendas",
        sincronizar
      );
    };
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

    if (
      chave === "encomendas" ||
      chave === "encomendas_esperadas" ||
      chave === "encomendas_historico"
    ) {
      window.dispatchEvent(
        new CustomEvent("infinitycondo:encomendas", {
          detail: { chave }
        })
      );
    }
  }

  function gerarIdUnico() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function normalizarCodigo(valor) {
    const limpo = String(valor || "")
      .trim()
      .replace(/\s+/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .toUpperCase();

    return limpo;
  }

  function obterCodigoRastreio(item = {}) {
    const valor =
      item.codigoRastreio ||
      item.rastreio ||
      item.codigo ||
      "";

    if (
      String(valor).toLowerCase() === "não informado" ||
      String(valor).toLowerCase() === "nao informado"
    ) {
      return "";
    }

    return normalizarCodigo(valor);
  }

  function normalizarStatus(status) {
    const valor = String(status || "")
      .trim()
      .toLowerCase();

    if (
      valor === "entregue" ||
      valor === "retirada" ||
      valor === "retirado"
    ) {
      return "Entregue";
    }

    if (valor === "atrasado") {
      return "Atrasado";
    }

    if (
      valor === "aguardando" ||
      valor === "esperada" ||
      valor === "esperado"
    ) {
      return "Aguardando";
    }

    return "Recebido";
  }


  function limparCodigo(valor) {
    return String(valor || "").replace(/[^\w.-]/g, "").toUpperCase();
  }

  function gerarCodigoEncomenda(numero) {
    return `ENC-${String(numero).padStart(6, "0")}`;
  }

  function proximoCodigoEncomenda() {
    const numeros = encomendas
      .map((item) => Number(String(item.codigoInterno || "").replace(/\D/g, "")))
      .filter((numero) => !isNaN(numero));

    const proximo =
      numeros.length > 0
        ? Math.max(...numeros) + 1
        : encomendas.length + 1;

    return gerarCodigoEncomenda(proximo);
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

  function registrarAuditoriaEncomenda({
    acao,
    detalhes,
    antes = null,
    depois = null,
    referenciaId = null
  }) {
    registrarAuditoria({
      acao,
      modulo: "Encomendas",
      detalhes,
      antes,
      depois,
      referenciaId
    });
  }

  function criarNotificacaoEncomenda({
    titulo,
    mensagem,
    referenciaId = null,
    prioridade = "normal",
    perfilDestino = "sindico",
    encomenda = null
  }) {
    criarNotificacao({
      titulo,
      mensagem,
      tipo: "Encomendas",
      origem: "Encomendas",
      perfilDestino,
      usuarioDestinoId:
        perfilDestino === "morador"
          ? encomenda?.moradorId || null
          : null,
      usuarioDestinoNome:
        perfilDestino === "morador"
          ? encomenda?.morador || ""
          : "",
      apartamentoDestino:
        perfilDestino === "morador"
          ? encomenda?.apartamento || ""
          : "",
      moduloOrigem: "Encomendas",
      referenciaId,
      prioridade
    });
  }

  function validarEncomenda() {
    const descricao = String(novaEncomenda.descricao || "").trim();
    const transportadora = String(novaEncomenda.transportadora || "").trim();
    const codigo = obterCodigoRastreio(novaEncomenda);

    if (!novaEncomenda.morador) {
      mostrarAlerta("Selecione o morador destinatário.");
      return false;
    }

    if (!novaEncomenda.apartamento) {
      mostrarAlerta("O apartamento do destinatário é obrigatório.");
      return false;
    }

    if (descricao.length < 3) {
      mostrarAlerta("Informe uma descrição válida para a encomenda.");
      return false;
    }

    if (transportadora.length < 2) {
      mostrarAlerta("Informe a transportadora ou origem da encomenda.");
      return false;
    }

    if (codigo) {
      const codigoNormalizado = limparCodigo(codigo);

      const duplicada = encomendas.find((item) => {
        const statusAtual = item.status || "Recebido";

        return (
          obterCodigoRastreio(item) === codigoNormalizado &&
          item.id !== editId &&
          statusAtual !== "Entregue"
        );
      });

      if (duplicada) {
        mostrarAlerta("Já existe uma encomenda pendente com este código de rastreio.");
        return false;
      }
    }

    if (!novaEncomenda.status) {
      mostrarAlerta("Selecione o status da encomenda.");
      return false;
    }

    return true;
  }

  const encomendasFiltradas = encomendas.filter((e) => {
    const texto = busca.toLowerCase();

    const correspondeBusca =
      e.morador?.toLowerCase().includes(texto) ||
      e.apartamento?.toLowerCase().includes(texto) ||
      e.descricao?.toLowerCase().includes(texto) ||
      obterCodigoRastreio(e).toLowerCase().includes(texto) ||
      e.codigoInterno?.toLowerCase().includes(texto) ||
      e.transportadora?.toLowerCase().includes(texto) ||
      e.status?.toLowerCase().includes(texto);

    const correspondeStatus =
      filtroStatus === "Todos" ||
      e.status === filtroStatus;

    return correspondeBusca && correspondeStatus;
  });

  const recebidas = encomendas.filter(
    (e) => e.status === "Recebido"
  );

  const entregues = encomendas.filter(
    (e) => e.status === "Entregue"
  );

  const atrasadas = encomendas.filter(
    (e) => e.status === "Atrasado"
  );

  function selecionarMorador(moradorId) {
    const moradorSelecionado = moradores.find(
      (m) => String(m.id) === String(moradorId)
    );

    if (!moradorSelecionado) {
      setNovaEncomenda({
        ...novaEncomenda,
        morador: "",
        apartamento: "",
        moradorId: null,
        apartamentoId: null,
        tipoMorador: "",
        moradorPrincipal: false
      });

      return;
    }

    setNovaEncomenda({
      ...novaEncomenda,
      moradorId: moradorSelecionado.id,
      morador: moradorSelecionado.nome,
      apartamento:
        moradorSelecionado.apartamento ||
        moradorSelecionado.apto ||
        "",
      apartamentoId: moradorSelecionado.apartamentoId || null,
      tipoMorador: moradorSelecionado.tipoMorador || "Morador",
      moradorPrincipal: Boolean(moradorSelecionado.moradorPrincipal)
    });
  }

  function salvarMovimentacao(acao, encomenda) {
    const historico = lerStorage(STORAGE_MOVIMENTACOES);

    const nova = {
      id: Date.now(),
      tipo: "Encomenda",
      acao,
      origem: "Síndico",
      titulo: encomenda.descricao,
      nome: encomenda.morador,
      morador: encomenda.morador,
      moradorId: encomenda.moradorId || null,
      apartamento: encomenda.apartamento || "",
      descricao: encomenda.descricao,
      status: encomenda.status,
      data: new Date().toLocaleDateString("pt-BR"),
      hora: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      }),
      timestamp: Date.now()
    };

    salvarStorage(STORAGE_MOVIMENTACOES, [
      nova,
      ...historico
    ]);
  }

  function salvarRelatorio(acao, encomenda) {
    const relatorios = lerStorage(STORAGE_RELATORIOS);

    const novo = {
      id: Date.now() + 1,
      tipo: "Encomenda",
      acao,
      origem: "Síndico",
      titulo: encomenda.descricao,
      morador: encomenda.morador,
      moradorId: encomenda.moradorId || null,
      apartamento: encomenda.apartamento || "",
      descricao: encomenda.descricao,
      codigo: obterCodigoRastreio(encomenda),
      codigoRastreio: obterCodigoRastreio(encomenda),
      rastreio: obterCodigoRastreio(encomenda),
      codigoInterno: encomenda.codigoInterno,
      transportadora: encomenda.transportadora,
      status: encomenda.status,
      data: new Date().toLocaleDateString("pt-BR"),
      hora: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    };

    salvarStorage(STORAGE_RELATORIOS, [
      novo,
      ...relatorios
    ]);
  }

  function salvarHistorico(acao, encomenda) {
    const historico = lerStorage(STORAGE_HISTORICO);

    const novo = {
      id: Date.now() + 2,
      encomendaId: encomenda.id,
      acao,
      origem: "Síndico",
      morador: encomenda.morador,
      moradorId: encomenda.moradorId || null,
      apartamento: encomenda.apartamento || "",
      descricao: encomenda.descricao,
      codigo: obterCodigoRastreio(encomenda),
      codigoRastreio: obterCodigoRastreio(encomenda),
      rastreio: obterCodigoRastreio(encomenda),
      codigoInterno: encomenda.codigoInterno,
      transportadora: encomenda.transportadora,
      status: encomenda.status,
      data: new Date().toLocaleDateString("pt-BR"),
      hora: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    };

    salvarStorage(STORAGE_HISTORICO, [
      novo,
      ...historico
    ]);
  }

  function salvarAvisoSindico(acao, encomenda) {
    const avisos = lerStorage(STORAGE_AVISOS_SINDICO);

    const novo = {
      id: Date.now() + 3,
      categoria: "Encomenda",
      origem: "Síndico",
      titulo: `Encomenda - ${acao}`,
      descricao: encomenda.descricao,
      apartamento: encomenda.apartamento || "",
      morador: encomenda.morador || "",
      responsavel: "Síndico",
      status: encomenda.status || "Recebido",
      respostaSindico: "",
      cienciaSindico: true,
      data: new Date().toLocaleDateString("pt-BR")
    };

    salvarStorage(STORAGE_AVISOS_SINDICO, [
      novo,
      ...avisos
    ]);
  }

  function notificarMorador(acao, encomenda) {
    const notificacoes = lerStorage(STORAGE_NOTIFICACOES);

    const nova = {
      id: Date.now() + 4,
      tipo: "Encomenda",
      titulo:
        acao === "entrega"
          ? "Sua encomenda foi entregue"
          : "Nova atualização de encomenda",
      descricao:
        acao === "recebimento"
          ? `Uma encomenda foi registrada para você: ${encomenda.descricao}.`
          : `Status da encomenda atualizado para ${encomenda.status}.`,
      morador: encomenda.morador || "",
      moradorId: encomenda.moradorId || null,
      apartamento: encomenda.apartamento || "",
      lida: false,
      data: new Date().toLocaleDateString("pt-BR"),
      hora: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    };

    salvarStorage(STORAGE_NOTIFICACOES, [
      nova,
      ...notificacoes
    ]);
  }

  function registrarFluxo(acao, encomenda, antes = null) {
    salvarMovimentacao(acao, encomenda);
    salvarRelatorio(acao, encomenda);
    salvarHistorico(acao, encomenda);
    salvarAvisoSindico(acao, encomenda);
    notificarMorador(acao, encomenda);

    registrarAuditoriaEncomenda({
      acao: `Encomenda - ${acao}`,
      detalhes: `${encomenda.codigoInterno || encomenda.codigo || "Sem código"} • ${encomenda.morador} • Apto ${encomenda.apartamento}`,
      antes,
      depois: encomenda,
      referenciaId: encomenda.id
    });

    if (
      acao === "recebimento" ||
      acao === "exclusão" ||
      acao === "status: Entregue" ||
      acao === "status: Atrasado"
    ) {
      criarNotificacaoEncomenda({
        titulo:
          acao === "recebimento"
            ? "Nova encomenda registrada"
            : acao === "status: Entregue"
            ? "Encomenda entregue"
            : acao === "status: Atrasado"
            ? "Encomenda atrasada"
            : "Encomenda removida",
        mensagem: `${encomenda.morador} • Apto ${encomenda.apartamento} • ${encomenda.descricao}`,
        referenciaId: encomenda.id,
        prioridade:
          acao === "status: Atrasado" || acao === "exclusão"
            ? "alta"
            : "normal"
      });
    }
  }

  function salvarEncomenda() {
    if (!validarEncomenda()) {
      return;
    }

    const perfilCondominio = obterPerfilCondominio();
    const usuarioAtual = obterUsuarioAtual();

    const encomendaFormatada = {
      ...novaEncomenda,
      morador: String(novaEncomenda.morador || "").trim(),
      apartamento: String(novaEncomenda.apartamento || "").trim(),
      descricao: String(novaEncomenda.descricao || "").trim(),
      codigoRastreio: obterCodigoRastreio(novaEncomenda),
      rastreio: obterCodigoRastreio(novaEncomenda),
      codigo: obterCodigoRastreio(novaEncomenda),
      codigoInterno:
        novaEncomenda.codigoInterno ||
        proximoCodigoEncomenda(),
      transportadora: String(novaEncomenda.transportadora || "").trim(),
      status: normalizarStatus(novaEncomenda.status),
      condominioId: perfilCondominio.condominioId,
      nomeCondominio: perfilCondominio.nomeCondominio,
      criadoPor: usuarioAtual.nome || usuarioAtual.usuario || "Sistema",
      apartamentoId: novaEncomenda.apartamentoId || null,
      tipoMorador: novaEncomenda.tipoMorador || "",
      moradorPrincipal: Boolean(novaEncomenda.moradorPrincipal),
      porteiroId: usuarioAtual.tipo === "porteiro" ? usuarioAtual.id || null : novaEncomenda.porteiroId || null,
      porteiroNome: usuarioAtual.tipo === "porteiro" ? usuarioAtual.nome || usuarioAtual.usuario || "" : novaEncomenda.porteiroNome || "",
      atualizadoEm: new Date().toISOString()
    };

    let listaAtualizada = [];

    if (editId !== null) {
      const encomendaAntiga = encomendas.find(
        (item) => item.id === editId
      );

      const atualizada = {
        ...encomendaFormatada,
        id: editId,
        data:
          encomendaAntiga?.data ||
          new Date().toLocaleString("pt-BR")
      };

      listaAtualizada = encomendas.map((e) =>
        e.id === editId ? atualizada : e
      );

      registrarFluxo("edição", atualizada, encomendaAntiga);

      setEditId(null);
    } else {
      const nova = {
        id: gerarIdUnico(),
        ...encomendaFormatada,
        data: new Date().toLocaleString("pt-BR"),
        criadoEm: new Date().toISOString()
      };

      listaAtualizada = [
        nova,
        ...encomendas
      ];

      registrarFluxo("recebimento", nova);
    }

    setEncomendas(listaAtualizada);
    salvarStorage(STORAGE_KEY, listaAtualizada);

    setNovaEncomenda(estadoInicialEncomenda);
    setMostrarModal(false);
  }

  function editarEncomenda(encomenda) {
    setNovaEncomenda({
      ...estadoInicialEncomenda,
      ...encomenda
    });

    setEditId(encomenda.id);
    setMostrarModal(true);
  }

  async function excluirEncomenda(id) {
    const confirmar = await confirmarAcao(
      "Deseja excluir esta encomenda?"
    );

    if (!confirmar) return;

    const encomenda = encomendas.find(
      (e) => e.id === id
    );

    const lista = encomendas.filter(
      (e) => e.id !== id
    );

    if (encomenda) {
      registrarFluxo("exclusão", encomenda);
    }

    setEncomendas(lista);
    salvarStorage(STORAGE_KEY, lista);
  }

  function alterarStatus(id, status) {
    const encomendaAntes = encomendas.find((e) => e.id === id);

    const lista = encomendas.map((e) =>
      e.id === id
        ? {
            ...e,
            status: normalizarStatus(status),
            atualizadoEm: new Date().toISOString(),
            retiradaEm:
              normalizarStatus(status) === "Entregue"
                ? new Date().toLocaleString("pt-BR")
                : e.retiradaEm
          }
        : e
    );

    const encomenda = lista.find(
      (e) => e.id === id
    );

    if (encomenda) {
      registrarFluxo(
        `status: ${normalizarStatus(status)}`,
        encomenda,
        encomendaAntes
      );
    }

    setEncomendas(lista);
    salvarStorage(STORAGE_KEY, lista);
  }

  function fecharModal() {
    setMostrarModal(false);
    setEditId(null);
    setNovaEncomenda(estadoInicialEncomenda);
  }

  function corStatus(status) {
    switch (status) {
      case "Recebido":
        return {
          background: "#fef3c7",
          color: "#92400e",
          border: "#fde68a",
          label: "Aguardando retirada"
        };

      case "Entregue":
        return {
          background: "#f3e8ff",
          color: "#7c3aed",
          border: "#ddd6fe",
          label: "Entregue"
        };

      case "Atrasado":
        return {
          background: "#fee2e2",
          color: "#b91c1c",
          border: "#fecaca",
          label: "Atrasado"
        };

      default:
        return {
          background: "#f5f3ff",
          color: "#374151",
          border: "#ddd6fe",
          label: status || "Sem status"
        };
    }
  }

  function iconeTransportadora(nome) {
    const texto = nome?.toLowerCase() || "";

    if (texto.includes("correios")) return "📮";
    if (texto.includes("amazon")) return "🟧";
    if (texto.includes("mercado")) return "🛒";
    if (texto.includes("shopee")) return "🛍️";
    if (texto.includes("jadlog")) return "🚚";
    if (texto.includes("loggi")) return "⚡";

    return "📦";
  }

  return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <div style={styles.heroLeft}>
          <span style={styles.heroBadge}>
            📦 Central logística
          </span>

          <h1 style={styles.title}>
            Encomendas
          </h1>

          <p style={styles.subtitle}>
            Controle de recebimento, retirada e histórico de encomendas do condomínio.
          </p>
        </div>

        <div style={styles.heroRight}>
          <div style={styles.packageBoard}>
            <div style={styles.packageItem}>
              <span>📥</span>
              <strong>{recebidas.length}</strong>
              <small>recebidas</small>
            </div>

            <div style={styles.packageItem}>
              <span>✅</span>
              <strong>{entregues.length}</strong>
              <small>entregues</small>
            </div>

            <div style={styles.packageItem}>
              <span>⚠️</span>
              <strong>{atrasadas.length}</strong>
              <small>atrasadas</small>
            </div>
          </div>

          <button
            style={styles.heroButton}
            onClick={() => {
              setEditId(null);
              setNovaEncomenda(estadoInicialEncomenda);
              setMostrarModal(true);
            }}
          >
            + Nova encomenda
          </button>
        </div>
      </section>

      <section style={styles.controlStrip}>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>⌕</span>

          <input
            placeholder="Buscar por morador, apartamento, código, transportadora ou status..."
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
          <option>Recebido</option>
          <option>Entregue</option>
          <option>Atrasado</option>
        </select>

        <div style={styles.compactStats}>
          <span>
            <b>{encomendas.length}</b> total
          </span>

          <span>
            <b>{recebidas.length}</b> pendentes
          </span>

          <span>
            <b>{entregues.length}</b> retiradas
          </span>
        </div>
      </section>

      <section style={styles.logisticPanel}>
        <div style={styles.panelHeader}>
          <div>
            <span style={styles.panelLabel}>
              Recebimento
            </span>

            <h2 style={styles.panelTitle}>
              Fluxo de encomendas
            </h2>
          </div>

          <span style={styles.resultBadge}>
            {encomendasFiltradas.length} resultado(s)
          </span>
        </div>

        {encomendasFiltradas.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              📦
            </div>

            <h3 style={styles.emptyTitle}>
              Nenhuma encomenda encontrada
            </h3>

            <p style={styles.emptyText}>
              Registre uma encomenda para acompanhar recebimento e retirada.
            </p>

            <button
              style={styles.emptyButton}
              onClick={() => {
                setEditId(null);
                setNovaEncomenda(estadoInicialEncomenda);
                setMostrarModal(true);
              }}
            >
              Registrar encomenda
            </button>
          </div>
        ) : (
          <div style={styles.packageGrid}>
            {encomendasFiltradas.map((e) => {
              const status = corStatus(e.status);

              return (
                <article
                  key={e.id}
                  style={{
                    ...styles.packageCard,
                    borderColor: status.border
                  }}
                >
                  <div style={styles.cardHeader}>
                    <div style={styles.packageIdentity}>
                      <div style={styles.packageIcon}>
                        {iconeTransportadora(e.transportadora)}
                      </div>

                      <div>
                        <h3 style={styles.packageTitle}>
                          {e.descricao}
                        </h3>

                        <p style={styles.packageCode}>
                          Código: {e.codigoInterno || "Sem código interno"}{" "}
                          {obterCodigoRastreio(e)
                            ? `• Rastreio: ${obterCodigoRastreio(e)}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <span
                      style={{
                        ...styles.statusBadge,
                        background: status.background,
                        color: status.color
                      }}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div style={styles.receiverBox}>
                    <span style={styles.receiverIcon}>
                      🏠
                    </span>

                    <div>
                      <strong>{e.morador}</strong>
                      <p>Apartamento {e.apartamento || "-"}</p>
                    </div>
                  </div>

                  <div style={styles.infoGrid}>
                    <div style={styles.infoItem}>
                      <span>Recebida em</span>
                      <strong>{e.data || "-"}</strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span>Transportadora</span>
                      <strong>{e.transportadora || "Não informada"}</strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span>Retirada</span>
                      <strong>{e.retiradaEm || "Pendente"}</strong>
                    </div>
                  </div>

                  <div style={styles.actionRow}>
                    {e.status !== "Entregue" && (
                      <button
                        style={styles.successButton}
                        onClick={() => alterarStatus(e.id, "Entregue")}
                      >
                        Entregar
                      </button>
                    )}

                    {e.status !== "Atrasado" && e.status !== "Entregue" && (
                      <button
                        style={styles.warningButton}
                        onClick={() => alterarStatus(e.id, "Atrasado")}
                      >
                        Atrasar
                      </button>
                    )}

                    <button
                      style={styles.editButton}
                      onClick={() => editarEncomenda(e)}
                    >
                      Editar
                    </button>

                    <button
                      style={styles.deleteButton}
                      onClick={() => excluirEncomenda(e.id)}
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
        <div style={styles.modalBackground}>
          <div style={styles.modal} className="scroll-sindico">
            <div style={styles.modalTop}>
              <div>
                <span style={styles.modalBadge}>
                  {editId !== null ? "Editar pacote" : "Novo pacote"}
                </span>

                <h2 style={styles.modalTitle}>
                  {editId !== null
                    ? "Editar encomenda"
                    : "Registrar encomenda"}
                </h2>
              </div>

              <button
                style={styles.closeButton}
                onClick={fecharModal}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalSection}>
              <h3 style={styles.modalSectionTitle}>
                Destinatário
              </h3>

              <div style={styles.formGrid}>
                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Morador
                  </label>

                  {moradores.length > 0 ? (
                    <select
                      value={
                        novaEncomenda.moradorId ||
                        moradores.find(
                          (m) => m.nome === novaEncomenda.morador
                        )?.id ||
                        ""
                      }
                      onChange={(e) => selecionarMorador(e.target.value)}
                      style={styles.input}
                    >
                      <option value="">
                        Selecione o morador
                      </option>

                      {moradores.map((morador) => (
                        <option
                          key={morador.id}
                          value={morador.id}
                        >
                          {morador.nome} - Apto{" "}
                          {morador.apartamento || morador.apto}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      placeholder="Nome do morador"
                      value={novaEncomenda.morador}
                      onChange={(e) =>
                        setNovaEncomenda({
                          ...novaEncomenda,
                          morador: e.target.value
                        })
                      }
                      style={styles.input}
                    />
                  )}
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Apartamento
                  </label>

                  <input
                    placeholder="Apartamento"
                    inputMode="numeric"
                                        maxLength="6"
                    value={novaEncomenda.apartamento}
                    onChange={(e) =>
                      setNovaEncomenda({
                        ...novaEncomenda,
                        apartamento: e.target.value.replace(/\\D/g, "").slice(0, 6)
                      })
                    }
                    style={styles.input}
                    readOnly={moradores.length > 0}
                  />
                </div>
              </div>
            </div>

            <div style={styles.modalSection}>
              <h3 style={styles.modalSectionTitle}>
                Dados da encomenda
              </h3>

              <div style={styles.formGrid}>
                <div style={styles.formRowFull}>
                  <label style={styles.label}>
                    Descrição
                  </label>

                  <input
                    minLength="3"
                    placeholder="Ex: Amazon - Caixa média"
                    value={novaEncomenda.descricao}
                    onChange={(e) =>
                      setNovaEncomenda({
                        ...novaEncomenda,
                        descricao: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Código / rastreio
                  </label>

                  <input
                    placeholder="Ex: BR123456789"
                    value={novaEncomenda.codigo}
                    onChange={(e) =>
                      setNovaEncomenda({
                        ...novaEncomenda,
                        codigo: limparCodigo(e.target.value)
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Transportadora
                  </label>

                  <input
                    minLength="2"
                    placeholder="Ex: Correios, Amazon, Jadlog..."
                    value={novaEncomenda.transportadora}
                    onChange={(e) =>
                      setNovaEncomenda({
                        ...novaEncomenda,
                        transportadora: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRowFull}>
                  <label style={styles.label}>
                    Status
                  </label>

                  <select
                    value={novaEncomenda.status}
                    onChange={(e) =>
                      setNovaEncomenda({
                        ...novaEncomenda,
                        status: e.target.value
                      })
                    }
                    style={styles.input}
                  >
                    <option>Recebido</option>
                    <option>Entregue</option>
                    <option>Atrasado</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={styles.modalButtons}>
              <button
                style={styles.saveButton}
                onClick={salvarEncomenda}
              >
                Salvar encomenda
              </button>

              <button
                style={styles.cancelButton}
                onClick={fecharModal}
              >
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
    overflowX: "hidden",
    fontFamily: "Arial",
    color: "#111827",
    position: "relative"
  },

  hero: {
    background:
      "linear-gradient(135deg,#1c1205,#5b21b6 45%,#15803d)",
    borderRadius: "36px",
    padding: "34px",
    color: "white",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "28px",
    boxShadow: "0 26px 70px rgba(6,78,59,0.28)",
    marginBottom: "24px"
  },

  heroLeft: {
    width: "100%",
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

  packageBoard: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    padding: "12px",
    borderRadius: "24px"
  },

  packageItem: {
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
    minWidth: 0,
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.10),transparent 34%), white",
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
    width: "160px",
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

  logisticPanel: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.10),transparent 34%), white",
    border: "1px solid #ddd6fe",
    borderRadius: "34px",
    padding: "28px",
    boxShadow: "0 18px 55px rgba(88,28,135,0.09)"
  },

  panelHeader: {
    minWidth: 0,
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

  packageGrid: {
    minWidth: 0,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(340px,100%),1fr))",
    gap: "18px"
  },

  packageCard: {
    background: "linear-gradient(180deg,#ffffff,#fbfaff)",
    borderRadius: "30px",
    padding: "22px",
    boxShadow: "0 15px 38px rgba(88,28,135,0.07)",
    border: "1px solid #ddd6fe"
  },

  cardHeader: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "18px"
  },

  packageIdentity: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "14px"
  },

  packageIcon: {
    width: "64px",
    height: "64px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg,#78350f,#8b5cf6)",
    color: "white",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    fontWeight: "900",
    boxShadow: "0 14px 26px rgba(124,58,237,0.18)"
  },

  packageTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "20px"
  },

  packageCode: {
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

  receiverBox: {
    background: "#faf5ff",
    border: "1px solid #ddd6fe",
    borderRadius: "18px",
    padding: "13px",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "12px",
    color: "#7c3aed",
    marginBottom: "14px"
  },

  receiverIcon: {
    fontSize: "22px"
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px"
  },

  infoItem: {
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.10),transparent 34%), white",
    border: "1px solid #ddd6fe",
    borderRadius: "17px",
    padding: "13px"
  },

  actionRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(120px,100%),1fr))",
    gap: "8px",
    marginTop: "18px"
  },

  successButton: {
    background: "#f3e8ff",
    color: "#7c3aed",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  warningButton: {
    background: "#fef3c7",
    color: "#92400e",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  editButton: {
    background: "#ede9fe",
    color: "#6d28d9",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  deleteButton: {
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

  modalBackground: {
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
    minWidth: 0,
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
      "linear-gradient(135deg,#1c1205,#7c3aed)",
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
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,0.10),transparent 34%), white",
    border: "1px solid #ddd6fe",
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

  formRowFull: {
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
    padding: "15px",
    borderRadius: "16px",
    border: "1px solid #c4b5fd",
    outline: "none",
    fontSize: "14px",
    background: "#fbfaff"
  },

  modalButtons: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "18px"
  },

  saveButton: {
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

  cancelButton: {
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

export default Encomendas;