import { useAlerta } from "../../components/Alerta/AlertaProvider";
import { useEffect, useState } from "react";
import { registrarAuditoria } from "../../Services/auditoriaService";
import { criarNotificacao } from "../../Services/notificacaoService";

function Reservas() {
  const { mostrarAlerta, confirmarAcao } = useAlerta();
  const STORAGE_KEY = "reservas";
  const STORAGE_MOVIMENTACOES = "movimentacoes";
  const STORAGE_RELATORIOS = "relatorios_operacionais";
  const STORAGE_HISTORICO = "historico_reservas";

  const estadoInicialReserva = {
    area: "",
    areaId: null,
    morador: "",
    moradorId: null,
    apartamento: "",
    apartamentoId: null,
    tipoMorador: "",
    moradorPrincipal: false,
    perfilMorador: "",
    data: "",
    horario: "",
    obs: "",
    status: "pendente",
    condominioId: null,
    nomeCondominio: "",
    criadoPor: "",
    aprovadoPor: "",
    aprovadoEm: "",
    porteiroId: null,
    porteiroNome: ""
  };

  const [reservas, setReservas] = useState(() => {
    const dados = localStorage.getItem(STORAGE_KEY);

    if (!dados) return [];

    const lista = JSON.parse(dados);

    return lista.map((reserva) => ({
      ...reserva,
      moradorId: reserva.moradorId || null,
      areaId: reserva.areaId || null,
      status: normalizarStatus(reserva.status)
    }));
  });

  const [moradores] = useState(() => {
    const dados = localStorage.getItem("moradores");

    if (!dados) return [];

    const lista = JSON.parse(dados);

    return lista.map((morador) => ({
      ...morador,
      apto: morador.apto || morador.apartamento || "",
      apartamento: morador.apartamento || morador.apto || "",
      apartamentoId: morador.apartamentoId || null,
      tipoMorador: morador.tipoMorador || "Morador",
      moradorPrincipal: Boolean(morador.moradorPrincipal),
      perfilMorador: morador.perfilMorador || (morador.moradorPrincipal ? "principal" : "dependente")
    }));
  });

  const [areasComuns] = useState(() => {
    const dados = localStorage.getItem("areasComuns");
    return dados ? JSON.parse(dados) : [];
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [novaReserva, setNovaReserva] = useState(estadoInicialReserva);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    const sincronizar = () => {
      const lista = lerStorage(STORAGE_KEY).map((reserva) => ({
        ...reserva,
        moradorId: reserva.moradorId || null,
        areaId: reserva.areaId || null,
        status: normalizarStatus(reserva.status)
      }));

      setReservas(lista);
    };

    window.addEventListener("storage", sincronizar);
    window.addEventListener(
      "infinitycondo:reservas",
      sincronizar
    );

    return () => {
      window.removeEventListener("storage", sincronizar);
      window.removeEventListener(
        "infinitycondo:reservas",
        sincronizar
      );
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

    if (
      chave === STORAGE_KEY ||
      chave === "areasComuns" ||
      chave === STORAGE_HISTORICO
    ) {
      window.dispatchEvent(
        new CustomEvent("infinitycondo:reservas", {
          detail: { chave }
        })
      );
    }
  }

  function gerarIdUnico() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function normalizarStatus(status) {
    const valor = String(status || "")
      .trim()
      .toLowerCase();

    if (
      valor === "aprovada" ||
      valor === "aprovado" ||
      valor === "confirmada" ||
      valor === "confirmado" ||
      valor === "ativa" ||
      valor === "ativo"
    ) {
      return "aprovada";
    }

    if (
      valor === "recusada" ||
      valor === "recusado" ||
      valor === "rejeitada" ||
      valor === "rejeitado"
    ) {
      return "recusada";
    }

    if (
      valor === "cancelada" ||
      valor === "cancelado"
    ) {
      return "cancelada";
    }

    if (
      valor === "concluída" ||
      valor === "concluida" ||
      valor === "concluído" ||
      valor === "concluido" ||
      valor === "finalizada" ||
      valor === "finalizado"
    ) {
      return "concluida";
    }

    return "pendente";
  }

  function reservaAtiva(reserva) {
    return ![
      "recusada",
      "cancelada",
      "concluida"
    ].includes(normalizarStatus(reserva?.status));
  }

  function mesmoMorador(reserva, dadosMorador) {
    if (
      reserva?.moradorId &&
      dadosMorador?.moradorId
    ) {
      return (
        String(reserva.moradorId) ===
        String(dadosMorador.moradorId)
      );
    }

    const nomeReserva = String(
      reserva?.morador ||
      reserva?.moradorNome ||
      ""
    )
      .trim()
      .toLowerCase();

    const nomeMorador = String(
      dadosMorador?.morador ||
      dadosMorador?.moradorNome ||
      ""
    )
      .trim()
      .toLowerCase();

    return (
      Boolean(nomeReserva) &&
      nomeReserva === nomeMorador &&
      String(reserva?.apartamento || "") ===
        String(dadosMorador?.apartamento || "")
    );
  }

  function mesmaArea(reserva, dadosReserva) {
    if (reserva?.areaId && dadosReserva?.areaId) {
      return String(reserva.areaId) === String(dadosReserva.areaId);
    }

    return (
      String(reserva?.area || "").trim().toLowerCase() ===
      String(dadosReserva?.area || "").trim().toLowerCase()
    );
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
        JSON.parse(localStorage.getItem("usuarioMorador")) ||
        JSON.parse(sessionStorage.getItem("usuarioMorador")) ||
        {}
      );
    } catch {
      return {};
    }
  }

  function buscarAreaSelecionada(nomeArea) {
    return areasComuns.find(
      (area) =>
        area.nome === nomeArea ||
        String(area.id) === String(nomeArea)
    );
  }

  function areaIndisponivel(area) {
    const status = String(area?.status || "").toLowerCase();

    return (
      status.includes("manutenção") ||
      status.includes("manutencao") ||
      status.includes("inativa") ||
      status.includes("indisponível") ||
      status.includes("indisponivel")
    );
  }

  function validarReserva() {
    if (!novaReserva.area) {
      mostrarAlerta("Selecione a área comum.");
      return false;
    }

    const areaSelecionada = buscarAreaSelecionada(novaReserva.area);

    if (areaSelecionada && areaIndisponivel(areaSelecionada)) {
      mostrarAlerta("Esta área está indisponível ou em manutenção.");
      return false;
    }

    if (!novaReserva.morador) {
      mostrarAlerta("Selecione o morador responsável pela reserva.");
      return false;
    }

    if (!novaReserva.apartamento) {
      mostrarAlerta("O apartamento é obrigatório.");
      return false;
    }

    if (!novaReserva.data) {
      mostrarAlerta("Informe a data da reserva.");
      return false;
    }

    if (!novaReserva.horario) {
      mostrarAlerta("Informe o horário da reserva.");
      return false;
    }

    const dataSelecionada = new Date(`${novaReserva.data}T${novaReserva.horario}`);

    if (!isNaN(dataSelecionada.getTime()) && dataSelecionada < new Date()) {
      mostrarAlerta("Não é permitido criar reserva em data ou horário passado.");
      return false;
    }

    const dadosValidacao = {
      ...novaReserva,
      areaId:
        areaSelecionada?.id ||
        novaReserva.areaId ||
        null
    };

    const reservaDoMesmoMoradorNoDia = reservas.find(
      (reserva) =>
        reserva.id !== editId &&
        reserva.data === novaReserva.data &&
        reservaAtiva(reserva) &&
        mesmoMorador(reserva, dadosValidacao)
    );

    if (reservaDoMesmoMoradorNoDia) {
      mostrarAlerta(
        "Este morador já possui uma reserva ativa nesta data. É permitida apenas uma reserva por morador por dia."
      );
      return false;
    }

    const conflito = reservas.find(
      (reserva) =>
        reserva.id !== editId &&
        reserva.data === novaReserva.data &&
        reserva.horario === novaReserva.horario &&
        reservaAtiva(reserva) &&
        mesmaArea(reserva, dadosValidacao)
    );

    if (conflito) {
      mostrarAlerta(
        "Já existe uma reserva ativa para esta área, data e horário."
      );
      return false;
    }

    return true;
  }

  function registrarAuditoriaReserva({
    acao,
    detalhes,
    antes = null,
    depois = null,
    referenciaId = null
  }) {
    registrarAuditoria({
      acao,
      modulo: "Reservas",
      detalhes,
      antes,
      depois,
      referenciaId
    });
  }

  function criarNotificacaoReserva({
    titulo,
    mensagem,
    referenciaId = null,
    prioridade = "normal",
    perfilDestino = "sindico",
    reserva = null
  }) {
    criarNotificacao({
      titulo,
      mensagem,
      tipo: "Reservas",
      origem: "Reservas",
      perfilDestino,
      usuarioDestinoId:
        perfilDestino === "morador"
          ? reserva?.moradorId || null
          : null,
      usuarioDestinoNome:
        perfilDestino === "morador"
          ? reserva?.morador ||
            reserva?.moradorNome ||
            ""
          : "",
      apartamentoDestino:
        perfilDestino === "morador"
          ? reserva?.apartamento || ""
          : "",
      moduloOrigem: "Reservas",
      referenciaId,
      prioridade
    });
  }

  function registrarMovimentacaoReserva(acao, reserva) {
    const movimentacoes = lerStorage(STORAGE_MOVIMENTACOES);

    const nova = {
      id: gerarIdUnico(),
      tipo: "Reserva",
      acao,
      origem: "Síndico",
      titulo: `${reserva.area} - ${reserva.morador}`,
      morador: reserva.morador,
      moradorId: reserva.moradorId || null,
      apartamento: reserva.apartamento,
      apartamentoId: reserva.apartamentoId || null,
      area: reserva.area,
      areaId: reserva.areaId || null,
      status: reserva.status,
      condominioId: reserva.condominioId || null,
      nomeCondominio: reserva.nomeCondominio || "",
      data: new Date().toLocaleDateString("pt-BR"),
      hora: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      }),
      dataReserva: reserva.data,
      horario: reserva.horario,
      timestamp: Date.now(),
      impactaBI: true,
      origemModulo: "Reservas"
    };

    salvarStorage(STORAGE_MOVIMENTACOES, [nova, ...movimentacoes]);

    const relatorios = lerStorage(STORAGE_RELATORIOS);
    salvarStorage(STORAGE_RELATORIOS, [nova, ...relatorios]);

    const historico = lerStorage(STORAGE_HISTORICO);
    salvarStorage(STORAGE_HISTORICO, [
      {
        ...nova,
        reservaId: reserva.id,
        registradoEm: new Date().toLocaleString("pt-BR")
      },
      ...historico
    ]);
  }

  function registrarFluxoReserva(acao, reserva, antes = null) {
    registrarMovimentacaoReserva(acao, reserva);

    registrarAuditoriaReserva({
      acao: `Reserva - ${acao}`,
      detalhes: `${reserva.area} • ${reserva.morador} • ${formatarData(reserva.data)} às ${reserva.horario}`,
      antes,
      depois: reserva,
      referenciaId: reserva.id
    });

    if (
      acao === "criação" ||
      acao === "exclusão" ||
      acao === "status: aprovada" ||
      acao === "status: recusada"
    ) {
      criarNotificacaoReserva({
        titulo:
          acao === "criação"
            ? "Nova reserva registrada"
            : acao === "status: aprovada"
            ? "Reserva aprovada"
            : acao === "status: recusada"
            ? "Reserva recusada"
            : "Reserva removida",
        mensagem: `${reserva.area} • ${reserva.morador} • ${formatarData(reserva.data)} às ${reserva.horario}`,
        referenciaId: reserva.id,
        reserva,
        prioridade:
          acao === "status: recusada" || acao === "exclusão"
            ? "alta"
            : "normal"
      });

      criarNotificacaoReserva({
        titulo:
          acao === "status: aprovada"
            ? "Sua reserva foi aprovada"
            : acao === "status: recusada"
            ? "Sua reserva foi recusada"
            : acao === "criação"
            ? "Reserva registrada"
            : "Reserva removida",
        mensagem: `${reserva.area} • ${formatarData(reserva.data)} às ${reserva.horario}`,
        referenciaId: reserva.id,
        perfilDestino: "morador",
        reserva,
        prioridade:
          acao === "status: recusada" || acao === "exclusão"
            ? "alta"
            : "normal"
      });
    }
  }

  function selecionarMorador(moradorId) {
    const moradorSelecionado = moradores.find(
      (m) => String(m.id) === String(moradorId)
    );

    if (!moradorSelecionado) {
      setNovaReserva({
        ...novaReserva,
        moradorId: null,
        morador: "",
        apartamento: "",
        apartamentoId: null,
        tipoMorador: "",
        moradorPrincipal: false,
        perfilMorador: ""
      });

      return;
    }

    setNovaReserva({
      ...novaReserva,
      moradorId: moradorSelecionado.id,
      morador: moradorSelecionado.nome,
      apartamento:
        moradorSelecionado.apartamento ||
        moradorSelecionado.apto ||
        "",
      apartamentoId: moradorSelecionado.apartamentoId || null,
      tipoMorador: moradorSelecionado.tipoMorador || "Morador",
      moradorPrincipal: Boolean(moradorSelecionado.moradorPrincipal),
      perfilMorador:
        moradorSelecionado.perfilMorador ||
        (moradorSelecionado.moradorPrincipal ? "principal" : "dependente")
    });
  }

  function salvarReserva() {
    if (!validarReserva()) {
      return;
    }

    const perfilCondominio = obterPerfilCondominio();
    const usuarioAtual = obterUsuarioAtual();
    const areaSelecionada = buscarAreaSelecionada(novaReserva.area);

    const reservaFormatada = {
      ...novaReserva,
      area: novaReserva.area,
      areaId: areaSelecionada?.id || novaReserva.areaId || null,
      morador: String(novaReserva.morador || "").trim(),
      moradorId: novaReserva.moradorId || null,
      apartamento: String(novaReserva.apartamento || "").trim(),
      apartamentoId: novaReserva.apartamentoId || null,
      tipoMorador: novaReserva.tipoMorador || "",
      moradorPrincipal: Boolean(novaReserva.moradorPrincipal),
      perfilMorador: novaReserva.perfilMorador || "",
      data: novaReserva.data,
      horario: novaReserva.horario,
      obs: String(novaReserva.obs || "").trim(),
      status: normalizarStatus(novaReserva.status),
      condominioId: perfilCondominio.condominioId,
      nomeCondominio: perfilCondominio.nomeCondominio,
      criadoPor: usuarioAtual.nome || usuarioAtual.usuario || "Sistema",
      atualizadoEm: new Date().toISOString()
    };

    let listaAtualizada = [];

    if (editId !== null) {
      const reservaAntes = reservas.find((r) => r.id === editId);

      listaAtualizada = reservas.map((r) =>
        r.id === editId
          ? {
              ...reservaFormatada,
              id: editId,
              criadoEm: r.criadoEm || new Date().toLocaleString()
            }
          : r
      );

      const reservaDepois = listaAtualizada.find((r) => r.id === editId);

      registrarFluxoReserva("edição", reservaDepois, reservaAntes);

      setEditId(null);
    } else {
      const nova = {
        id: gerarIdUnico(),
        ...reservaFormatada,
        criadoEm: new Date().toLocaleString(),
        criadoEmISO: new Date().toISOString()
      };

      listaAtualizada = [
        nova,
        ...reservas
      ];

      registrarFluxoReserva("criação", nova);
    }

    setReservas(listaAtualizada);

    salvarStorage(STORAGE_KEY, listaAtualizada);

    setNovaReserva(estadoInicialReserva);
    setMostrarModal(false);
  }

  async function excluirReserva(id) {
    const confirmar = await confirmarAcao(
      "Deseja realmente excluir esta reserva?"
    );

    if (!confirmar) return;

    const reservaExcluida = reservas.find((r) => r.id === id);

    const lista = reservas.filter(
      (r) => r.id !== id
    );

    setReservas(lista);

    salvarStorage(STORAGE_KEY, lista);

    if (reservaExcluida) {
      registrarFluxoReserva("exclusão", reservaExcluida);
    }
  }

  function editarReserva(reserva) {
    setNovaReserva({
      ...estadoInicialReserva,
      ...reserva,
      moradorId: reserva.moradorId || null,
      areaId: reserva.areaId || null,
      apartamentoId: reserva.apartamentoId || null,
      tipoMorador: reserva.tipoMorador || "",
      moradorPrincipal: Boolean(reserva.moradorPrincipal),
      perfilMorador: reserva.perfilMorador || ""
    });

    setEditId(reserva.id);
    setMostrarModal(true);
  }

  function alterarStatus(id, status) {
    const statusNormalizado = normalizarStatus(status);
    const usuarioAtual = obterUsuarioAtual();
    const reservaAntes = reservas.find((r) => r.id === id);

    if (!reservaAntes) {
      mostrarAlerta("Reserva não encontrada.");
      return;
    }

    if (statusNormalizado === "aprovada") {
      const areaSelecionada =
        areasComuns.find(
          (area) =>
            String(area.id) ===
              String(reservaAntes.areaId || "") ||
            String(area.nome || "")
              .trim()
              .toLowerCase() ===
              String(reservaAntes.area || "")
                .trim()
                .toLowerCase()
        ) || null;

      if (areaSelecionada && areaIndisponivel(areaSelecionada)) {
        mostrarAlerta(
          "Não é possível aprovar a reserva porque a área está indisponível ou em manutenção."
        );
        return;
      }

      const conflito = reservas.find(
        (reserva) =>
          reserva.id !== id &&
          reserva.data === reservaAntes.data &&
          reserva.horario === reservaAntes.horario &&
          reservaAtiva(reserva) &&
          mesmaArea(reserva, reservaAntes)
      );

      if (conflito) {
        mostrarAlerta(
          "Não é possível aprovar: já existe uma reserva ativa para esta área, data e horário."
        );
        return;
      }

      const outraDoMorador = reservas.find(
        (reserva) =>
          reserva.id !== id &&
          reserva.data === reservaAntes.data &&
          reservaAtiva(reserva) &&
          mesmoMorador(reserva, reservaAntes)
      );

      if (outraDoMorador) {
        mostrarAlerta(
          "Não é possível aprovar: o morador já possui outra reserva ativa nesta data."
        );
        return;
      }
    }

    const lista = reservas.map((reserva) =>
      reserva.id === id
        ? {
            ...reserva,
            status: statusNormalizado,
            aprovadoPor:
              statusNormalizado === "aprovada"
                ? usuarioAtual.nome ||
                  usuarioAtual.usuario ||
                  "Síndico"
                : reserva.aprovadoPor,
            aprovadoEm:
              statusNormalizado === "aprovada"
                ? new Date().toLocaleString("pt-BR")
                : reserva.aprovadoEm,
            recusadoPor:
              statusNormalizado === "recusada"
                ? usuarioAtual.nome ||
                  usuarioAtual.usuario ||
                  "Síndico"
                : reserva.recusadoPor,
            recusadoEm:
              statusNormalizado === "recusada"
                ? new Date().toLocaleString("pt-BR")
                : reserva.recusadoEm,
            atualizadoEm: new Date().toISOString()
          }
        : reserva
    );

    const reservaDepois = lista.find(
      (reserva) => reserva.id === id
    );

    setReservas(lista);
    salvarStorage(STORAGE_KEY, lista);

    if (reservaDepois) {
      registrarFluxoReserva(
        `status: ${statusNormalizado}`,
        reservaDepois,
        reservaAntes
      );
    }
  }

  function fecharModal() {
    setMostrarModal(false);
    setEditId(null);
    setNovaReserva(estadoInicialReserva);
  }

  const reservasFiltradas = reservas.filter((r) => {
    const texto = busca.toLowerCase();

    const correspondeBusca =
      r.area?.toLowerCase().includes(texto) ||
      r.morador?.toLowerCase().includes(texto) ||
      r.apartamento?.toLowerCase().includes(texto) ||
      r.data?.toLowerCase().includes(texto) ||
      r.horario?.toLowerCase().includes(texto) ||
      r.status?.toLowerCase().includes(texto);

    const correspondeStatus =
      filtroStatus === "Todos" ||
      String(r.status || "").toLowerCase() === String(filtroStatus).toLowerCase();

    return correspondeBusca && correspondeStatus;
  });

  const reservasOrdenadas = [
    ...reservasFiltradas
  ].sort((a, b) => new Date(a.data) - new Date(b.data));

  const pendentes = reservas.filter(
    (r) => String(r.status || "").toLowerCase() === "pendente"
  );

  const aprovadas = reservas.filter(
    (r) => String(r.status || "").toLowerCase() === "aprovada"
  );

  const recusadas = reservas.filter(
    (r) => String(r.status || "").toLowerCase() === "recusada"
  );

  function corStatus(status) {
    if (normalizarStatus(status) === "aprovada") {
      return {
        background: "#f3e8ff",
        color: "#7c3aed",
        border: "#ddd6fe",
        label: "Confirmada"
      };
    }

    if (normalizarStatus(status) === "recusada") {
      return {
        background: "#fee2e2",
        color: "#b91c1c",
        border: "#fecaca",
        label: "Recusada"
      };
    }

    return {
      background: "#fef3c7",
      color: "#92400e",
      border: "#fde68a",
      label: "Em análise"
    };
  }

  function iconeArea(nome) {
    const texto = nome?.toLowerCase() || "";

    if (texto.includes("piscina")) return "🏊";
    if (texto.includes("churrasqueira")) return "🔥";
    if (texto.includes("salão") || texto.includes("salao")) return "🎉";
    if (texto.includes("quadra")) return "⚽";
    if (texto.includes("academia")) return "💪";
    if (texto.includes("brinquedo") || texto.includes("play")) return "🧸";
    if (texto.includes("coworking")) return "💻";
    if (texto.includes("jardim")) return "🌿";

    return "📅";
  }

  function formatarData(data) {
    if (!data) return "-";

    const partes = data.split("-");

    if (partes.length !== 3) return data;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <div style={styles.heroLeft}>
          <span style={styles.heroBadge}>
            📅 Central de reservas
          </span>

          <h1 style={styles.title}>
            Reservas
          </h1>

          <p style={styles.subtitle}>
            Analise solicitações, aprove reservas e organize o uso das áreas comuns cadastradas.
          </p>
        </div>

        <div style={styles.heroRight}>
          <div style={styles.reserveBoard}>
            <div style={styles.reserveItem}>
              <span>🟡</span>
              <strong>{pendentes.length}</strong>
              <small>em análise</small>
            </div>

            <div style={styles.reserveItem}>
              <span>🟢</span>
              <strong>{aprovadas.length}</strong>
              <small>confirmadas</small>
            </div>

            <div style={styles.reserveItem}>
              <span>🔴</span>
              <strong>{recusadas.length}</strong>
              <small>recusadas</small>
            </div>
          </div>

          <button
            style={styles.heroButton}
            onClick={() => {
              setEditId(null);
              setNovaReserva(estadoInicialReserva);
              setMostrarModal(true);
            }}
          >
            + Nova reserva
          </button>
        </div>
      </section>

      <section style={styles.controlStrip}>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>⌕</span>

          <input
            placeholder="Buscar por área, morador, apartamento, data ou status..."
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
          <option value="Todos">Todos</option>
          <option value="pendente">Em análise</option>
          <option value="aprovada">Confirmadas</option>
          <option value="recusada">Recusadas</option>
        </select>

        <div style={styles.compactStats}>
          <span>
            <b>{reservas.length}</b> total
          </span>

          <span>
            <b>{areasComuns.length}</b> áreas
          </span>

          <span>
            <b>{moradores.length}</b> moradores
          </span>
        </div>
      </section>

      <section style={styles.reservationPanel}>
        <div style={styles.panelHeader}>
          <div>
            <span style={styles.panelLabel}>
              Agenda
            </span>

            <h2 style={styles.panelTitle}>
              Solicitações de reserva
            </h2>
          </div>

          <span style={styles.resultBadge}>
            {reservasOrdenadas.length} resultado(s)
          </span>
        </div>

        {reservasOrdenadas.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              📅
            </div>

            <h3 style={styles.emptyTitle}>
              Nenhuma reserva encontrada
            </h3>

            <p style={styles.emptyText}>
              As reservas cadastradas pelo síndico ou solicitadas por moradores aparecerão aqui.
            </p>

            <button
              style={styles.emptyButton}
              onClick={() => {
                setEditId(null);
                setNovaReserva(estadoInicialReserva);
                setMostrarModal(true);
              }}
            >
              Criar reserva
            </button>
          </div>
        ) : (
          <div style={styles.reservationGrid}>
            {reservasOrdenadas.map((r) => {
              const status = corStatus(r.status);

              return (
                <article
                  key={r.id}
                  style={{
                    ...styles.reservationCard,
                    borderColor: status.border
                  }}
                >
                  <div style={styles.cardTop}>
                    <div style={styles.areaIdentity}>
                      <div style={styles.areaIcon}>
                        {iconeArea(r.area)}
                      </div>

                      <div>
                        <h3 style={styles.areaName}>
                          {r.area}
                        </h3>

                        <p style={styles.created}>
                          Criada em {r.criadoEm || "não informado"}
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

                  <div style={styles.scheduleBox}>
                    <div>
                      <span>Data</span>
                      <strong>{formatarData(r.data)}</strong>
                    </div>

                    <div>
                      <span>Horário</span>
                      <strong>{r.horario || "-"}</strong>
                    </div>
                  </div>

                  <div style={styles.infoGrid}>
                    <div style={styles.infoItem}>
                      <span>Morador</span>
                      <strong>{r.morador || "-"}</strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span>Apartamento</span>
                      <strong>{r.apartamento || "-"}</strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span>Perfil</span>
                      <strong>
                        {r.moradorPrincipal ? "Principal" : r.tipoMorador || "Morador"}
                      </strong>
                    </div>
                  </div>

                  {r.obs && (
                    <div style={styles.noteBox}>
                      {r.obs}
                    </div>
                  )}

                  <div style={styles.actionRow}>
                    {r.status === "pendente" && (
                      <>
                        <button
                          style={styles.approveButton}
                          onClick={() => alterarStatus(r.id, "aprovada")}
                        >
                          Aprovar
                        </button>

                        <button
                          style={styles.rejectButton}
                          onClick={() => alterarStatus(r.id, "recusada")}
                        >
                          Recusar
                        </button>
                      </>
                    )}

                    {r.status !== "pendente" && (
                      <button
                        style={styles.pendingButton}
                        onClick={() => alterarStatus(r.id, "pendente")}
                      >
                        Reabrir
                      </button>
                    )}

                    <button
                      style={styles.editButton}
                      onClick={() => editarReserva(r)}
                    >
                      Editar
                    </button>

                    <button
                      style={styles.deleteButton}
                      onClick={() => excluirReserva(r.id)}
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
        <div
          style={styles.modalBackground}
          onClick={fecharModal}
        >
          <div
            style={styles.modal}
            className="scroll-sindico"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalTop}>
              <div>
                <span style={styles.modalBadge}>
                  {editId ? "Editar solicitação" : "Nova solicitação"}
                </span>

                <h2 style={styles.modalTitle}>
                  {editId ? "Editar reserva" : "Cadastrar reserva"}
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
                Área e responsável
              </h3>

              <div style={styles.formGrid}>
                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Área comum
                  </label>

                  <select
                    value={novaReserva.area}
                    onChange={(e) =>
                      setNovaReserva({
                        ...novaReserva,
                        area: e.target.value
                      })
                    }
                    style={styles.input}
                  >
                    <option value="">
                      Selecione uma área
                    </option>

                    {areasComuns.map((area) => (
                      <option
                        key={area.id}
                        value={area.nome}
                      >
                        {area.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Morador
                  </label>

                  <select
                    value={
                      novaReserva.moradorId ||
                      moradores.find(
                        (m) =>
                          m.nome === novaReserva.morador &&
                          (
                            m.apto === novaReserva.apartamento ||
                            m.apartamento === novaReserva.apartamento
                          )
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
                        {morador.apartamento || morador.apto} -{" "}
                        {morador.tipoMorador || "Morador"}
                        {morador.moradorPrincipal ? " - Principal" : " - Dependente"}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formRowFull}>
                  <label style={styles.label}>
                    Apartamento
                  </label>

                  <input
                    placeholder="Apartamento"
                    value={novaReserva.apartamento}
                    readOnly
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            <div style={styles.modalSection}>
              <h3 style={styles.modalSectionTitle}>
                Agenda
              </h3>

              <div style={styles.formGrid}>
                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Data
                  </label>

                  <input
                    type="date"
                    value={novaReserva.data}
                    onChange={(e) =>
                      setNovaReserva({
                        ...novaReserva,
                        data: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Horário
                  </label>

                  <input
                    type="time"
                    value={novaReserva.horario}
                    onChange={(e) =>
                      setNovaReserva({
                        ...novaReserva,
                        horario: e.target.value
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
                    value={novaReserva.status}
                    onChange={(e) =>
                      setNovaReserva({
                        ...novaReserva,
                        status: e.target.value
                      })
                    }
                    style={styles.input}
                  >
                    <option value="pendente">Em análise</option>
                    <option value="aprovada">Confirmada</option>
                    <option value="recusada">Recusada</option>
                  </select>
                </div>

                <div style={styles.formRowFull}>
                  <label style={styles.label}>
                    Observação
                  </label>

                  <textarea
                    placeholder="Observação"
                    value={novaReserva.obs}
                    onChange={(e) =>
                      setNovaReserva({
                        ...novaReserva,
                        obs: e.target.value
                      })
                    }
                    style={styles.textarea}
                  />
                </div>
              </div>
            </div>

            <div style={styles.modalButtons}>
              <button
                style={styles.saveButton}
                onClick={salvarReserva}
              >
                Salvar reserva
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
    minWidth: 0,
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

  reserveBoard: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    padding: "12px",
    borderRadius: "24px"
  },

  reserveItem: {
    width: "92px",
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

  reservationPanel: {
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

  reservationGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(340px,100%),1fr))",
    gap: "18px"
  },

  reservationCard: {
    background: "linear-gradient(180deg,#ffffff,#fbfaff)",
    borderRadius: "30px",
    padding: "22px",
    boxShadow: "0 15px 38px rgba(88,28,135,0.07)",
    border: "1px solid #ede9fe"
  },

  cardTop: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "18px"
  },

  areaIdentity: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "14px"
  },

  areaIcon: {
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
    fontSize: "28px",
    fontWeight: "900",
    boxShadow: "0 14px 26px rgba(124,58,237,0.18)"
  },

  areaName: {
    margin: 0,
    color: "#111827",
    fontSize: "21px"
  },

  created: {
    margin: "5px 0 0",
    color: "#6b7280",
    fontSize: "12px"
  },

  statusBadge: {
    padding: "7px 11px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "12px",
    whiteSpace: "nowrap"
  },

  scheduleBox: {
    background: "#faf5ff",
    border: "1px solid #ddd6fe",
    borderRadius: "18px",
    padding: "14px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(260px,100%),1fr))",
    gap: "10px",
    color: "#7c3aed",
    marginBottom: "14px"
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

  approveButton: {
    background: "#f3e8ff",
    color: "#7c3aed",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  rejectButton: {
    background: "#fee2e2",
    color: "#b91c1c",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  pendingButton: {
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
    padding: "20px",
    boxSizing: "border-box"
  },

  modal: {
    minWidth: 0,
    width: "100%",
    maxWidth: "780px",
    maxHeight: "90vh",
    overflowY: "auto",
    overflowX: "hidden",
    background: "#fbfaff",
    boxSizing: "border-box",
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
    minWidth: 0,
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

  textarea: {
    minHeight: "100px",
    resize: "vertical",
    padding: "15px",
    borderRadius: "16px",
    border: "1px solid #c4b5fd",
    outline: "none",
    fontSize: "14px",
    background: "#fbfaff",
    fontFamily: "Arial"
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

export default Reservas;