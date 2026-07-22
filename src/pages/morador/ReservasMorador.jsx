import { useEffect, useState } from "react";
import { registrarAuditoria } from "../../Services/auditoriaService";
import { criarNotificacao } from "../../Services/notificacaoService";

function ReservasMorador() {
  const STORAGE_KEY = "reservas";
  const STORAGE_AVISOS_SINDICO = "avisos_sindico";
  const STORAGE_MOVIMENTACOES = "movimentacoes";
  const STORAGE_RELATORIOS = "relatorios_operacionais";
  const STORAGE_NOTIFICACOES = "notificacoesMorador";

  const [morador, setMorador] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [areasComuns, setAreasComuns] = useState([]);

  const [area, setArea] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [observacao, setObservacao] = useState("");

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");

  useEffect(() => {
    carregarSessao();
    carregarAreasComuns();
    carregarReservas();

    const sincronizar = () => {
      carregarAreasComuns();
      carregarReservas();
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
      const dados = localStorage.getItem(chave);
      return dados ? JSON.parse(dados) : [];
    } catch {
      return [];
    }
  }

  function salvarStorage(chave, dados) {
    localStorage.setItem(chave, JSON.stringify(dados));

    if (
      chave === STORAGE_KEY ||
      chave === "areasComuns"
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
      valor === "concluido"
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

  function pertenceAoMorador(item, usuario) {
    if (!usuario) return false;

    if (item?.moradorId && usuario?.id) {
      return String(item.moradorId) === String(usuario.id);
    }

    if (
      item?.moradorUsuario &&
      usuario?.usuario
    ) {
      return (
        String(item.moradorUsuario) ===
        String(usuario.usuario)
      );
    }

    const nomeItem = String(
      item?.moradorNome ||
      item?.morador ||
      ""
    )
      .trim()
      .toLowerCase();

    const nomeUsuario = String(usuario?.nome || "")
      .trim()
      .toLowerCase();

    return (
      Boolean(nomeItem) &&
      nomeItem === nomeUsuario &&
      String(item?.apartamento || item?.apto || "") ===
        String(usuario?.apartamento || usuario?.apto || "")
    );
  }

  function mesmaArea(reserva, areaSelecionada) {
    if (reserva?.areaId && areaSelecionada?.id) {
      return String(reserva.areaId) === String(areaSelecionada.id);
    }

    return (
      String(reserva?.area || "").trim().toLowerCase() ===
      String(areaSelecionada?.nome || areaSelecionada?.area || "")
        .trim()
        .toLowerCase()
    );
  }

  function areaIndisponivel(areaSelecionada) {
    const status = String(areaSelecionada?.status || "")
      .trim()
      .toLowerCase();

    return (
      status.includes("manutenção") ||
      status.includes("manutencao") ||
      status.includes("indisponível") ||
      status.includes("indisponivel") ||
      status.includes("inativa")
    );
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

  function carregarAreasComuns() {
    const dataStorage = lerStorage("areasComuns");

    const areasDisponiveis = dataStorage.filter(
      (item) => item.status === "Disponível" || !item.status
    );

    setAreasComuns(areasDisponiveis);
  }

  function carregarReservas() {
    const dataStorage = lerStorage(STORAGE_KEY);
    setReservas(
      dataStorage.map((reserva) => ({
        ...reserva,
        status: normalizarStatus(reserva.status)
      }))
    );
  }

  function limparFormulario() {
    setArea("");
    setData("");
    setHorario("");
    setObservacao("");
  }

  function buscarAreaSelecionada(nomeArea) {
    return (
      areasComuns.find(
        (item) =>
          item.nome === nomeArea ||
          item.area === nomeArea ||
          item.titulo === nomeArea
      ) || {}
    );
  }

  function pertenceAoApartamento(item) {
    const apartamentoMorador = morador?.apartamento || morador?.apto || "";
    const apartamentoIdMorador = morador?.apartamentoId || null;

    return (
      String(item.apartamento || item.apto || "") === String(apartamentoMorador) ||
      (
        apartamentoIdMorador &&
        String(item.apartamentoId || "") === String(apartamentoIdMorador)
      )
    );
  }

  function possuiPermissaoReserva() {
    if (!morador) return false;

    if (morador.permissoesMorador?.podeReservar === false) {
      return false;
    }

    return true;
  }

  function registrarAuditoriaReserva(acao, reserva, antes = null) {
    registrarAuditoria({
      acao,
      modulo: "Reservas Morador",
      detalhes: `${reserva?.area || "Reserva"} • Apto ${reserva?.apartamento || "-"}`,
      antes,
      depois: reserva,
      referenciaId: reserva?.id || null
    });
  }

  function criarNotificacaoReservaSindico(reserva, titulo, mensagem, prioridade = "normal") {
    criarNotificacao({
      titulo,
      mensagem,
      tipo: "Reservas",
      origem: "Morador",
      perfilDestino: "sindico",
      moduloOrigem: "ReservasMorador",
      referenciaId: reserva?.id || null,
      prioridade
    });
  }

  function existeConflitoReserva(
    areaSelecionada,
    dataSelecionada,
    horarioSelecionado
  ) {
    const dadosArea = buscarAreaSelecionada(areaSelecionada);

    return reservas.some(
      (item) =>
        item.data === dataSelecionada &&
        item.horario === horarioSelecionado &&
        reservaAtiva(item) &&
        mesmaArea(item, dadosArea)
    );
  }

  function moradorJaPossuiReservaNoDia(dataSelecionada) {
    return reservas.some(
      (item) =>
        item.data === dataSelecionada &&
        reservaAtiva(item) &&
        pertenceAoMorador(item, morador)
    );
  }

  function registrarAvisoSindico(reserva) {
    const avisos = lerStorage(STORAGE_AVISOS_SINDICO);

    const novo = {
      id: gerarIdUnico(),
      reservaId: reserva.id,
      categoria: "Reserva",
      origem: "Morador",
      titulo: `Nova solicitação de reserva - ${reserva.area}`,
      descricao:
        reserva.observacao ||
        `O morador ${reserva.moradorNome} solicitou reserva da área ${reserva.area}.`,
      apartamento: reserva.apartamento,
      apartamentoId: reserva.apartamentoId || null,
      morador: reserva.moradorNome,
      responsavel: reserva.moradorNome,
      status: reserva.status,
      respostaSindico: "",
      cienciaSindico: false,
      data: reserva.data,
      horario: reserva.horario,
      impactaBI: true,
      impactaRelatorio: true,
      exibirNaCentral: true,
      origemModulo: "Reservas",
      atualizadoEm: new Date().toISOString()
    };

    salvarStorage(STORAGE_AVISOS_SINDICO, [
      novo,
      ...avisos
    ]);
  }

  function registrarMovimentacao(acao, reserva) {
    const movimentacoes = lerStorage(STORAGE_MOVIMENTACOES);

    const nova = {
      id: gerarIdUnico(),
      tipo: "Reserva",
      acao,
      origem: "Morador",
      titulo: `Reserva ${reserva.area}`,
      reservaId: reserva.id,
      areaId: reserva.areaId,
      area: reserva.area,
      apartamento: reserva.apartamento,
      morador: reserva.moradorNome,
      status: reserva.status,
      descricao:
        reserva.observacao ||
        `Solicitação de reserva da área ${reserva.area}`,
      data: new Date().toLocaleDateString("pt-BR"),
      hora: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      }),
      timestamp: Date.now(),
      impactaBI: true,
      origemModulo: "Reservas"
    };

    salvarStorage(STORAGE_MOVIMENTACOES, [
      nova,
      ...movimentacoes
    ]);
  }

  function registrarRelatorio(acao, reserva) {
    const relatorios = lerStorage(STORAGE_RELATORIOS);

    const novo = {
      id: gerarIdUnico(),
      tipo: "Reserva",
      acao,
      origem: "Morador",
      titulo: `Reserva ${reserva.area}`,
      reservaId: reserva.id,
      areaId: reserva.areaId,
      area: reserva.area,
      morador: reserva.moradorNome,
      moradorId: reserva.moradorId,
      apartamento: reserva.apartamento,
      bloco: reserva.bloco,
      dataReserva: reserva.data,
      horario: reserva.horario,
      observacao: reserva.observacao,
      status: reserva.status,
      criadoEm: reserva.criadoEm,
      data: new Date().toLocaleDateString("pt-BR"),
      hora: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      }),
      impactaRelatorio: true,
      origemModulo: "Reservas"
    };

    salvarStorage(STORAGE_RELATORIOS, [
      novo,
      ...relatorios
    ]);
  }

  function registrarNotificacaoMorador(acao, reserva) {
    const notificacoes = lerStorage(STORAGE_NOTIFICACOES);

    const nova = {
      id: gerarIdUnico(),
      categoria: "Reserva",
      origem: "Morador",
      titulo: "Solicitação de reserva enviada",
      descricao: `Sua reserva da área ${reserva.area} foi enviada para análise do síndico.`,
      reservaId: reserva.id,
      moradorId: reserva.moradorId,
      morador: reserva.moradorNome,
      apartamento: reserva.apartamento,
      apartamentoId: reserva.apartamentoId || null,
      area: reserva.area,
      status: reserva.status,
      acao,
      lida: false,
      data: new Date().toLocaleDateString("pt-BR"),
      hora: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      }),
      origemModulo: "Reservas"
    };

    salvarStorage(STORAGE_NOTIFICACOES, [
      nova,
      ...notificacoes
    ]);
  }

  function registrarFluxoReserva(acao, reserva) {
    registrarAvisoSindico(reserva);
    registrarMovimentacao(acao, reserva);
    registrarRelatorio(acao, reserva);
    registrarNotificacaoMorador(acao, reserva);
  }

  function solicitarReserva() {
    if (!morador) {
      alert("Sessão do morador não encontrada.");
      return;
    }

    if (!possuiPermissaoReserva()) {
      alert("Seu perfil está como dependente. A permissão para reserva pode ser liberada pelo condomínio.");
      return;
    }

    if (!area || !data || !horario) {
      alert("Preencha área, data e horário");
      return;
    }

    const dataSelecionada = new Date(`${data}T${horario}`);

    if (!isNaN(dataSelecionada.getTime()) && dataSelecionada < new Date()) {
      alert("Não é permitido solicitar reserva em data ou horário passado.");
      return;
    }

    const areaSelecionada = buscarAreaSelecionada(area);

    if (areaIndisponivel(areaSelecionada)) {
      alert(
        "Esta área está indisponível ou em manutenção."
      );
      return;
    }

    if (moradorJaPossuiReservaNoDia(data)) {
      alert(
        "Você já possui uma reserva ativa nesta data. É permitida apenas uma reserva por morador por dia."
      );
      return;
    }

    if (existeConflitoReserva(area, data, horario)) {
      alert(
        "Já existe uma reserva ativa para esta área, data e horário."
      );
      return;
    }

    const nova = {
      id: gerarIdUnico(),

      area,
      areaId: areaSelecionada.id || null,

      data,
      horario,
      observacao: String(observacao || "").trim(),

      status: "pendente",

      criadoEm: new Date().toLocaleString("pt-BR"),
      criadoEmISO: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),

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

      impactaBI: true,
      impactaRelatorio: true,
      exibirNaCentral: true,
      origemModulo: "Reservas"
    };

    const atualizadas = [
      nova,
      ...reservas
    ];

    salvarStorage(STORAGE_KEY, atualizadas);
    setReservas(atualizadas);

    registrarFluxoReserva("solicitada", nova);
    registrarAuditoriaReserva("Solicitou reserva", nova);
    criarNotificacaoReservaSindico(
      nova,
      "Nova solicitação de reserva",
      `${nova.moradorNome} solicitou reserva da área ${nova.area}.`
    );

    limparFormulario();
  }

  function cancelarReserva(id) {
    const confirmar =
      window.confirm(
        "Deseja cancelar esta reserva?"
      );

    if (!confirmar) return;

    let reservaCancelada = null;

    const atualizadas =
      reservas.map((r) => {
        if (r.id !== id) return r;

        reservaCancelada = {
          ...r,
          status: "cancelada",
          canceladaEm: new Date().toLocaleString("pt-BR"),
          atualizadoEm: new Date().toISOString(),
          impactaBI: true,
          impactaRelatorio: true,
          exibirNaCentral: true,
          origemModulo: "Reservas"
        };

        return reservaCancelada;
      });

    salvarStorage(STORAGE_KEY, atualizadas);
    setReservas(atualizadas);

    if (reservaCancelada) {
      registrarFluxoReserva("cancelada", reservaCancelada);
      registrarAuditoriaReserva(
        "Cancelou reserva",
        reservaCancelada
      );
      criarNotificacaoReservaSindico(
        reservaCancelada,
        "Reserva cancelada",
        `${reservaCancelada.moradorNome} cancelou a reserva da área ${reservaCancelada.area}.`,
        "alta"
      );
    }
  }

  function obterStatus(status) {
    const statusNormalizado = normalizarStatus(status);

    if (statusNormalizado === "aprovada") {
      return {
        texto: "Aprovada",
        fundo: "#f3e8ff",
        cor: "#7c3aed"
      };
    }

    if (statusNormalizado === "recusada") {
      return {
        texto: "Recusada",
        fundo: "#fee2e2",
        cor: "#dc2626"
      };
    }

    if (statusNormalizado === "cancelada") {
      return {
        texto: "Cancelada",
        fundo: "#f5f3ff",
        cor: "#374151"
      };
    }

    return {
      texto: "Pendente",
      fundo: "#fef3c7",
      cor: "#92400e"
    };
  }

  const minhasReservas =
    reservas.filter((item) => {
      if (!pertenceAoMorador(item, morador)) {
        return false;
      }

      const texto = busca.toLowerCase();

      const correspondeBusca =
        item.area?.toLowerCase().includes(texto) ||
        item.status?.toLowerCase().includes(texto) ||
        item.data?.toLowerCase().includes(texto) ||
        item.horario?.toLowerCase().includes(texto);

      const statusAtual =
        obterStatus(item.status).texto;

      const correspondeStatus =
        filtroStatus === "Todos" ||
        statusAtual === filtroStatus;

      return correspondeBusca && correspondeStatus;
    });

  const pendentes =
    minhasReservas.filter(
      (r) => obterStatus(r.status).texto === "Pendente"
    ).length;

  const aprovadas =
    minhasReservas.filter(
      (r) => obterStatus(r.status).texto === "Aprovada"
    ).length;

  const recusadas =
    minhasReservas.filter(
      (r) => obterStatus(r.status).texto === "Recusada"
    ).length;

  const opcoesAreas = areasComuns;
    return (
    <div style={styles.container}>
      {/* HERO */}

      <div style={styles.hero}>
        <div>
          <span style={styles.heroBadge}>
            📅 Reservas online
          </span>

          <h1 style={styles.title}>
            Reservas
          </h1>

          <p style={styles.subtitle}>
            Solicite áreas comuns do condomínio e acompanhe
            a aprovação da administração.
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
            Minhas reservas
          </p>

          <h3 style={styles.heroNumber}>
            {minhasReservas.length}
          </h3>

          <span style={styles.heroStatus}>
            Controle integrado
          </span>
        </div>
      </div>

      {/* RESUMO */}

      <div style={styles.resumeGrid}>
        <div style={styles.cardPrimary}>
          <div>
            <p style={styles.cardLabelLight}>
              Reservas pendentes
            </p>

            <h2 style={styles.cardNumberLight}>
              {pendentes}
            </h2>

            <span style={styles.cardHintLight}>
              aguardando aprovação
            </span>
          </div>

          <div style={styles.cardIconLight}>
            🕒
          </div>
        </div>

        <div style={styles.resumeCard}>
          <div style={styles.cardIconGreen}>
            ✅
          </div>

          <div>
            <p style={styles.resumeLabel}>
              Aprovadas
            </p>

            <h2 style={styles.resumeNumberGreen}>
              {aprovadas}
            </h2>
          </div>
        </div>

        <div style={styles.resumeCard}>
          <div style={styles.cardIconRed}>
            🚫
          </div>

          <div>
            <p style={styles.resumeLabel}>
              Recusadas
            </p>

            <h2 style={styles.resumeNumberRed}>
              {recusadas}
            </h2>
          </div>
        </div>

        <div style={styles.resumeCard}>
          <div style={styles.cardIconBlue}>
            🏢
          </div>

          <div>
            <p style={styles.resumeLabel}>
              Áreas disponíveis
            </p>

            <h2 style={styles.resumeNumberBlue}>
              {opcoesAreas.length}
            </h2>
          </div>
        </div>
      </div>

      <div style={styles.mainGrid}>
        {/* FORM */}

        <div style={styles.formCard}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                Nova reserva
              </h2>

              <p style={styles.sectionSubtitle}>
                Escolha a área comum, data e horário desejados.
              </p>
            </div>

            <span style={styles.sectionBadge}>
              Solicitação
            </span>
          </div>

          <label style={styles.label}>
            Área comum
          </label>

          <select
            value={area}
            onChange={(e) =>
              setArea(e.target.value)
            }
            style={styles.input}
          >
            <option value="">
              Selecione a área
            </option>

            {opcoesAreas.map((item) => (
              <option
                key={item.id || item.nome}
                value={item.nome || item.area || item.titulo}
              >
                {item.nome || item.area || item.titulo}
              </option>
            ))}
          </select>

          {opcoesAreas.length === 0 && (
            <p style={styles.formHint}>
              Nenhuma área comum disponível no momento.
            </p>
          )}

          <label style={styles.label}>
            Data
          </label>

          <input
            type="date"
            value={data}
            onChange={(e) =>
              setData(e.target.value)
            }
            style={styles.input}
          />

          <label style={styles.label}>
            Horário
          </label>

          <input
            type="time"
            value={horario}
            onChange={(e) =>
              setHorario(e.target.value)
            }
            style={styles.input}
          />

          <label style={styles.label}>
            Observação
          </label>

          <textarea
            placeholder="Ex: reserva para aniversário, reunião familiar..."
            value={observacao}
            onChange={(e) =>
              setObservacao(e.target.value)
            }
            style={styles.textarea}
          />

          <button
            style={{
              ...styles.button,
              ...(
                !possuiPermissaoReserva() || opcoesAreas.length === 0
                  ? styles.disabledButton
                  : {}
              )
            }}
            onClick={solicitarReserva}
            disabled={opcoesAreas.length === 0}
          >
            Solicitar reserva
          </button>

          <p style={styles.formHint}>
            {possuiPermissaoReserva()
              ? "Sua reserva ficará pendente até a análise do síndico."
              : "Seu perfil está como dependente. A permissão de reserva pode ser liberada pelo condomínio."}
          </p>
        </div>

        {/* LISTA */}

        <div style={styles.listCard}>
          <div style={styles.listHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                Minhas reservas
              </h2>

              <p style={styles.sectionSubtitle}>
                Acompanhe suas solicitações de áreas comuns.
              </p>
            </div>

            <div style={styles.filters}>
              <input
                placeholder="Buscar reserva..."
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
                <option>Pendente</option>
                <option>Aprovada</option>
                <option>Recusada</option>
                <option>Cancelada</option>
              </select>
            </div>
          </div>

          {minhasReservas.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>
                📭
              </div>

              <h3 style={styles.emptyTitle}>
                Nenhuma reserva encontrada
              </h3>

              <p style={styles.emptyText}>
                Quando você solicitar uma reserva,
                ela aparecerá aqui.
              </p>
            </div>
          ) : (
            <div style={styles.list}>
              {minhasReservas.map((item) => {
                const status =
                  obterStatus(item.status);

                return (
                  <div
                    key={item.id}
                    style={styles.card}
                  >
                    <div style={styles.cardTop}>
                      <div style={styles.areaIcon}>
                        🏢
                      </div>

                      <div style={styles.cardContent}>
                        <div style={styles.badges}>
                          <span
                            style={{
                              ...styles.status,
                              background: status.fundo,
                              color: status.cor
                            }}
                          >
                            {status.texto}
                          </span>

                          <span style={styles.dateBadge}>
                            📅 {item.data}
                          </span>

                          <span style={styles.dateBadge}>
                            🕒 {item.horario}
                          </span>
                        </div>

                        <h2 style={styles.area}>
                          {item.area}
                        </h2>

                        {item.observacao && (
                          <p style={styles.description}>
                            {item.observacao}
                          </p>
                        )}

                        <div style={styles.meta}>
                          <span>
                            Solicitada em {item.criadoEm}
                          </span>

                          <span>
                            Apto {item.apartamento || morador?.apartamento || "-"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={styles.footer}>
                      <span style={styles.created}>
                        Status atual:{" "}
                        <strong>{status.texto}</strong>
                      </span>

                      {status.texto === "Pendente" && (
                        <button
                          style={styles.cancelButton}
                          onClick={() =>
                            cancelarReserva(item.id)
                          }
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
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
    overflowX: "hidden",
    fontFamily: "Arial",
    color: "#111827",
    position: "relative"
  },

  hero: {
    minWidth: 0,
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

  resumeGrid: {
    minWidth: 0,
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

  resumeLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px"
  },

  resumeNumberGreen: {
    margin: "8px 0 0",
    color: "#7c3aed",
    fontSize: "34px"
  },

  resumeNumberRed: {
    margin: "8px 0 0",
    color: "#dc2626",
    fontSize: "34px"
  },

  resumeNumberBlue: {
    margin: "8px 0 0",
    color: "#7c3aed",
    fontSize: "34px"
  },

  mainGrid: {
    minWidth: 0,
    display: "grid",
    gridTemplateColumns: "390px 1fr",
    gap: "24px",
    alignItems: "flex-start"
  },

  formCard: {
    minWidth: 0,
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
    minHeight: "115px",
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

  disabledButton: {
    opacity: 0.65,
    cursor: "not-allowed"
  },

  button: {
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
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "20px"
  },

  filters: {
    minWidth: 0,
    display: "flex",
    gap: "10px"
  },

  search: {
    padding: "13px 14px",
    borderRadius: "15px",
    border: "1px solid #c4b5fd",
    outline: "none",
    background: "#fbfaff",
    minWidth: "210px"
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

  areaIcon: {
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

  cardContent: {
    flex: 1
  },

  badges: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "10px"
  },

  status: {
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

  area: {
    margin: "0 0 10px",
    color: "#111827",
    fontSize: "22px"
  },

  description: {
    color: "#374151",
    lineHeight: "1.6",
    margin: "0 0 14px"
  },

  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    color: "#6b7280",
    fontSize: "13px"
  },

  footer: {
    marginTop: "18px",
    paddingTop: "16px",
    borderTop: "1px solid #ddd6fe",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px"
  },

  created: {
    color: "#6b7280",
    fontSize: "13px"
  },

  cancelButton: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    padding: "11px 14px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "800"
  }
};

export default ReservasMorador;