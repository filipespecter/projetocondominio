import { useState } from "react";

function Prestadores() {
  const STORAGE_KEYS = {
    prestadores: "condominio_prestadores",
    particulares: "prestadores_particulares_v2",
    operacional: "operacional_condominio_v2"
  };

  const estadoInicialPrestador = {
    nome: "",
    empresa: "",
    telefone: "",
    cpf: "",
    servico: "",
    tipoServico: "Condomínio",
    areaRelacionada: "",
    apartamento: "",
    responsavel: "",
    dataEntrada: "",
    horaEntrada: "",
    dataSaida: "",
    horaSaida: "",
    observacao: "",
    status: "Pendente"
  };

  const estadoInicialOperacional = {
    data: "",
    horario: "",
    porteiro: "",
    leituraAnterior: "",
    leituraAtual: "",
    consumo: "",
    poco: "Desligado",
    observacao: ""
  };

  const [abaAtiva, setAbaAtiva] = useState("condominio");

  const [prestadores, setPrestadores] = useState(() => {
    const dados = localStorage.getItem(STORAGE_KEYS.prestadores);
    return dados ? JSON.parse(dados) : [];
  });

  const [particulares, setParticulares] = useState(() => {
    const dados = localStorage.getItem(STORAGE_KEYS.particulares);
    return dados ? JSON.parse(dados) : [];
  });

  const [operacional, setOperacional] = useState(() => {
    const dados = localStorage.getItem(STORAGE_KEYS.operacional);
    return dados ? JSON.parse(dados) : [];
  });

  const [areasComuns] = useState(() => {
    const dados = localStorage.getItem("areasComuns");
    return dados ? JSON.parse(dados) : [];
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [busca, setBusca] = useState("");
  const [editId, setEditId] = useState(null);
  const [novoPrestador, setNovoPrestador] = useState(estadoInicialPrestador);
  const [novoOperacional, setNovoOperacional] = useState(estadoInicialOperacional);

  const listaAtual =
    abaAtiva === "condominio"
      ? prestadores
      : particulares;

  const listaFiltrada = listaAtual.filter((item) => {
    const texto = busca.toLowerCase();

    return (
      item.nome?.toLowerCase().includes(texto) ||
      item.empresa?.toLowerCase().includes(texto) ||
      item.servico?.toLowerCase().includes(texto) ||
      item.tipoServico?.toLowerCase().includes(texto) ||
      item.areaRelacionada?.toLowerCase().includes(texto) ||
      item.apartamento?.toLowerCase().includes(texto) ||
      item.responsavel?.toLowerCase().includes(texto) ||
      item.status?.toLowerCase().includes(texto)
    );
  });

  const ativos = [...prestadores, ...particulares].filter(
    (p) => p.status === "Em execução" || p.status === "Aguardando liberação"
  ).length;

  const finalizados = [...prestadores, ...particulares].filter(
    (p) => p.status === "Finalizado"
  ).length;

  function formatarTelefone(valor) {
    valor = valor.replace(/\D/g, "").slice(0, 11);

    if (valor.length <= 10) {
      return valor.replace(
        /(\d{2})(\d{4})(\d{0,4})/,
        "($1) $2-$3"
      );
    }

    return valor.replace(
      /(\d{2})(\d{5})(\d{0,4})/,
      "($1) $2-$3"
    );
  }

  function formatarCPF(valor) {
    valor = valor.replace(/\D/g, "").slice(0, 11);

    return valor.replace(
      /(\d{3})(\d{3})(\d{3})(\d{0,2})/,
      "$1.$2.$3-$4"
    );
  }

  function abrirNovoCadastro() {
    setEditId(null);

    setNovoPrestador({
      ...estadoInicialPrestador,
      tipoServico:
        abaAtiva === "condominio"
          ? "Condomínio"
          : "Apartamento"
    });

    setMostrarModal(true);
  }

  function editarPrestador(item) {
    setEditId(item.id);

    setNovoPrestador({
      ...estadoInicialPrestador,
      ...item
    });

    setMostrarModal(true);
  }

  function fecharModal() {
    setMostrarModal(false);
    setEditId(null);
    setNovoPrestador(estadoInicialPrestador);
  }

  function excluirPrestador(id) {
    const confirmar = window.confirm(
      "Deseja excluir este cadastro?"
    );

    if (!confirmar) return;

    if (abaAtiva === "condominio") {
      const listaAtualizada = prestadores.filter(
        (item) => item.id !== id
      );

      setPrestadores(listaAtualizada);

      localStorage.setItem(
        STORAGE_KEYS.prestadores,
        JSON.stringify(listaAtualizada)
      );
    } else {
      const listaAtualizada = particulares.filter(
        (item) => item.id !== id
      );

      setParticulares(listaAtualizada);

      localStorage.setItem(
        STORAGE_KEYS.particulares,
        JSON.stringify(listaAtualizada)
      );
    }
  }

  function salvarPrestador() {
    if (
      !novoPrestador.nome ||
      !novoPrestador.telefone ||
      !novoPrestador.servico
    ) {
      alert("Preencha os campos obrigatórios.");
      return;
    }

    const dados = {
      ...novoPrestador
    };

    if (editId !== null) {
      dados.id = editId;

      if (abaAtiva === "condominio") {
        const listaAtualizada = prestadores.map((item) =>
          item.id === editId ? dados : item
        );

        setPrestadores(listaAtualizada);

        localStorage.setItem(
          STORAGE_KEYS.prestadores,
          JSON.stringify(listaAtualizada)
        );
      } else {
        const listaAtualizada = particulares.map((item) =>
          item.id === editId ? dados : item
        );

        setParticulares(listaAtualizada);

        localStorage.setItem(
          STORAGE_KEYS.particulares,
          JSON.stringify(listaAtualizada)
        );
      }
    } else {
      dados.id = Date.now();

      if (abaAtiva === "condominio") {
        const listaAtualizada = [
          dados,
          ...prestadores
        ];

        setPrestadores(listaAtualizada);

        localStorage.setItem(
          STORAGE_KEYS.prestadores,
          JSON.stringify(listaAtualizada)
        );
      } else {
        const listaAtualizada = [
          dados,
          ...particulares
        ];

        setParticulares(listaAtualizada);

        localStorage.setItem(
          STORAGE_KEYS.particulares,
          JSON.stringify(listaAtualizada)
        );
      }
    }

    setNovoPrestador(estadoInicialPrestador);
    setEditId(null);
    setMostrarModal(false);
  }

  function alterarStatusPrestador(id, status) {
    if (abaAtiva === "condominio") {
      const listaAtualizada = prestadores.map((item) =>
        item.id === id
          ? {
              ...item,
              status
            }
          : item
      );

      setPrestadores(listaAtualizada);

      localStorage.setItem(
        STORAGE_KEYS.prestadores,
        JSON.stringify(listaAtualizada)
      );
    } else {
      const listaAtualizada = particulares.map((item) =>
        item.id === id
          ? {
              ...item,
              status
            }
          : item
      );

      setParticulares(listaAtualizada);

      localStorage.setItem(
        STORAGE_KEYS.particulares,
        JSON.stringify(listaAtualizada)
      );
    }
  }

  function calcularConsumoManual(leituraAnterior, leituraAtual) {
    const anterior = Number(leituraAnterior);
    const atual = Number(leituraAtual);

    if (!anterior || !atual || atual < anterior) return "";

    return String(atual - anterior);
  }

  function salvarOperacional() {
    if (
      !novoOperacional.data ||
      !novoOperacional.horario ||
      !novoOperacional.porteiro
    ) {
      alert("Preencha data, horário e porteiro responsável.");
      return;
    }

    const consumoCalculado =
      novoOperacional.consumo ||
      calcularConsumoManual(
        novoOperacional.leituraAnterior,
        novoOperacional.leituraAtual
      );

    const novo = {
      id: Date.now(),
      ...novoOperacional,
      consumo: consumoCalculado
    };

    const listaAtualizada = [
      novo,
      ...operacional
    ];

    setOperacional(listaAtualizada);

    localStorage.setItem(
      STORAGE_KEYS.operacional,
      JSON.stringify(listaAtualizada)
    );

    setNovoOperacional(estadoInicialOperacional);
  }

  function excluirOperacional(id) {
    const confirmar = window.confirm(
      "Deseja excluir este registro operacional?"
    );

    if (!confirmar) return;

    const listaAtualizada = operacional.filter(
      (item) => item.id !== id
    );

    setOperacional(listaAtualizada);

    localStorage.setItem(
      STORAGE_KEYS.operacional,
      JSON.stringify(listaAtualizada)
    );
  }

  function corStatus(status) {
    switch (status) {
      case "Pendente":
        return {
          background: "#fef3c7",
          color: "#92400e",
          border: "#fde68a",
          label: "Pendente"
        };

      case "Aguardando liberação":
        return {
          background: "#fffbeb",
          color: "#854d0e",
          border: "#fde68a",
          label: "Aguardando"
        };

      case "Em execução":
        return {
          background: "#dbeafe",
          color: "#1d4ed8",
          border: "#bfdbfe",
          label: "Em execução"
        };

      case "Finalizado":
        return {
          background: "#dcfce7",
          color: "#166534",
          border: "#bbf7d0",
          label: "Finalizado"
        };

      case "Cancelado":
        return {
          background: "#fee2e2",
          color: "#b91c1c",
          border: "#fecaca",
          label: "Cancelado"
        };

      default:
        return {
          background: "#f3f4f6",
          color: "#374151",
          border: "#e5e7eb",
          label: status || "Sem status"
        };
    }
  }

  function iconeServico(servico) {
    const texto = servico?.toLowerCase() || "";

    if (texto.includes("elétrica") || texto.includes("eletrica") || texto.includes("eletric")) return "⚡";
    if (texto.includes("hidráulica") || texto.includes("hidraulica") || texto.includes("água")) return "💧";
    if (texto.includes("limpeza")) return "🧹";
    if (texto.includes("pintura")) return "🎨";
    if (texto.includes("jardin")) return "🌿";
    if (texto.includes("internet") || texto.includes("rede")) return "🌐";
    if (texto.includes("manutenção") || texto.includes("manutencao")) return "🛠️";
    if (texto.includes("segurança") || texto.includes("seguranca")) return "🛡️";

    return "🧰";
  }

  function formatarData(data) {
    if (!data) return "-";

    const partes = data.split("-");

    if (partes.length !== 3) return data;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  function atualizarOperacional(campo, valor) {
    const atualizado = {
      ...novoOperacional,
      [campo]: valor
    };

    const consumo =
      calcularConsumoManual(
        campo === "leituraAnterior"
          ? valor
          : atualizado.leituraAnterior,
        campo === "leituraAtual"
          ? valor
          : atualizado.leituraAtual
      );

    if (consumo) {
      atualizado.consumo = consumo;
    }

    setNovoOperacional(atualizado);
  }

  const ultimoRegistroOperacional = operacional[0];

  return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <div style={styles.heroLeft}>
          <span style={styles.heroBadge}>
            🛠️ Central operacional
          </span>

          <h1 style={styles.title}>
            Prestadores e Operações
          </h1>

          <p style={styles.subtitle}>
            Controle serviços do condomínio, atendimentos particulares e registros técnicos de operação.
          </p>
        </div>

        <div style={styles.heroRight}>
          <div style={styles.operationBoard}>
            <div style={styles.operationItem}>
              <span>🏢</span>
              <strong>{prestadores.length}</strong>
              <small>condomínio</small>
            </div>

            <div style={styles.operationItem}>
              <span>🏠</span>
              <strong>{particulares.length}</strong>
              <small>particulares</small>
            </div>

            <div style={styles.operationItem}>
              <span>💧</span>
              <strong>{operacional.length}</strong>
              <small>operações</small>
            </div>
          </div>
        </div>
      </section>

      <section style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(abaAtiva === "condominio" ? styles.activeTab : {})
          }}
          onClick={() => {
            setAbaAtiva("condominio");
            setBusca("");
          }}
        >
          🏢 Serviços Condomínio
        </button>

        <button
          style={{
            ...styles.tab,
            ...(abaAtiva === "particular" ? styles.activeTab : {})
          }}
          onClick={() => {
            setAbaAtiva("particular");
            setBusca("");
          }}
        >
          🏠 Serviços Particulares
        </button>

        <button
          style={{
            ...styles.tab,
            ...(abaAtiva === "operacional" ? styles.activeTab : {})
          }}
          onClick={() => {
            setAbaAtiva("operacional");
            setBusca("");
          }}
        >
          💧 Operacional / COMPESA
        </button>
      </section>

      {abaAtiva !== "operacional" && (
        <section style={styles.controlStrip}>
          <div style={styles.searchWrap}>
            <span style={styles.searchIcon}>⌕</span>

            <input
              placeholder="Buscar por nome, empresa, serviço, área, apartamento ou status..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={styles.search}
            />
          </div>

          <div style={styles.compactStats}>
            <span>
              <b>{listaAtual.length}</b> cadastros
            </span>

            <span>
              <b>{ativos}</b> ativos
            </span>

            <span>
              <b>{finalizados}</b> finalizados
            </span>
          </div>

          <button
            style={styles.heroButton}
            onClick={abrirNovoCadastro}
          >
            + Novo cadastro
          </button>
        </section>
      )}

      {abaAtiva === "operacional" ? (
        <section style={styles.operationalPanel}>
          <div style={styles.operationalHeader}>
            <div>
              <span style={styles.operationalBadge}>
                💧 Controle técnico
              </span>

              <h2 style={styles.operationalTitle}>
                COMPESA / Poço
              </h2>
            </div>

            <div style={styles.operationalResume}>
              <div style={styles.yellowMetric}>
                <span>Registros</span>
                <strong>{operacional.length}</strong>
              </div>

              <div style={styles.yellowMetric}>
                <span>Último consumo</span>
                <strong>
                  {ultimoRegistroOperacional?.consumo || "0"} m³
                </strong>
              </div>

              <div style={styles.yellowMetric}>
                <span>Poço</span>
                <strong>
                  {ultimoRegistroOperacional?.poco || "Sem registro"}
                </strong>
              </div>
            </div>
          </div>

          <div style={styles.operationalFormCard}>
            <div style={styles.operationalSectionTitle}>
              <span>01</span>
              Dados do registro
            </div>

            <div style={styles.operationalGrid}>
              <div style={styles.formRow}>
                <label style={styles.label}>Data</label>

                <input
                  type="date"
                  value={novoOperacional.data}
                  onChange={(e) =>
                    atualizarOperacional("data", e.target.value)
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>Horário</label>

                <input
                  type="time"
                  value={novoOperacional.horario}
                  onChange={(e) =>
                    atualizarOperacional("horario", e.target.value)
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>Porteiro responsável</label>

                <input
                  placeholder="Nome do porteiro"
                  value={novoOperacional.porteiro}
                  onChange={(e) =>
                    atualizarOperacional("porteiro", e.target.value)
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>Poço</label>

                <select
                  value={novoOperacional.poco}
                  onChange={(e) =>
                    atualizarOperacional("poco", e.target.value)
                  }
                  style={styles.input}
                >
                  <option>Ligado</option>
                  <option>Desligado</option>
                </select>
              </div>
            </div>

            <div style={styles.operationalSectionTitle}>
              <span>02</span>
              Leitura e consumo
            </div>

            <div style={styles.readingGrid}>
              <div style={styles.readingBox}>
                <label style={styles.yellowLabel}>
                  Leitura anterior
                </label>

                <input
                  type="number"
                  placeholder="Ex: 1200"
                  value={novoOperacional.leituraAnterior}
                  onChange={(e) =>
                    atualizarOperacional("leituraAnterior", e.target.value)
                  }
                  style={styles.yellowInput}
                />
              </div>

              <div style={styles.readingBox}>
                <label style={styles.yellowLabel}>
                  Leitura atual
                </label>

                <input
                  type="number"
                  placeholder="Ex: 1230"
                  value={novoOperacional.leituraAtual}
                  onChange={(e) =>
                    atualizarOperacional("leituraAtual", e.target.value)
                  }
                  style={styles.yellowInput}
                />
              </div>

              <div style={styles.consumptionBox}>
                <span>Consumo calculado</span>

                <strong>
                  {novoOperacional.consumo || "0"} m³
                </strong>
              </div>
            </div>

            <div style={styles.formRowFull}>
              <label style={styles.label}>Observações</label>

              <textarea
                placeholder="Observações operacionais"
                value={novoOperacional.observacao}
                onChange={(e) =>
                  atualizarOperacional("observacao", e.target.value)
                }
                style={styles.textarea}
              />
            </div>

            <button
              style={styles.saveOperationalButton}
              onClick={salvarOperacional}
            >
              Salvar controle operacional
            </button>
          </div>

          <div style={styles.operationalHistory}>
            <div style={styles.panelHeader}>
              <div>
                <span style={styles.panelLabel}>
                  Histórico operacional
                </span>

                <h2 style={styles.panelTitle}>
                  Registros COMPESA / Poço
                </h2>
              </div>

              <span style={styles.resultBadgeYellow}>
                {operacional.length} registro(s)
              </span>
            </div>

            {operacional.length === 0 ? (
              <div style={styles.emptyYellow}>
                <div style={styles.emptyIcon}>💧</div>

                <h3 style={styles.emptyTitle}>
                  Nenhum registro operacional
                </h3>

                <p style={styles.emptyText}>
                  Registre leituras para acompanhar consumo, poço e controle técnico.
                </p>
              </div>
            ) : (
              <div style={styles.operationalList}>
                {operacional.map((o) => (
                  <article key={o.id} style={styles.operationalCard}>
                    <div style={styles.operationalIcon}>
                      💧
                    </div>

                    <div style={styles.operationalInfo}>
                      <div style={styles.operationalCardTop}>
                        <div>
                          <h3 style={styles.operationalCardTitle}>
                            {formatarData(o.data)} às {o.horario || "-"}
                          </h3>

                          <p style={styles.operationalText}>
                            Porteiro: <strong>{o.porteiro || "-"}</strong>
                          </p>
                        </div>

                        <span style={styles.pocoBadge}>
                          {o.poco}
                        </span>
                      </div>

                      <div style={styles.meterGrid}>
                        <div style={styles.meterItem}>
                          <span>Anterior</span>
                          <strong>{o.leituraAnterior || "-"}</strong>
                        </div>

                        <div style={styles.meterItem}>
                          <span>Atual</span>
                          <strong>{o.leituraAtual || "-"}</strong>
                        </div>

                        <div style={styles.meterItemYellow}>
                          <span>Consumo</span>
                          <strong>{o.consumo || "0"} m³</strong>
                        </div>
                      </div>

                      {o.observacao && (
                        <p style={styles.observation}>
                          {o.observacao}
                        </p>
                      )}

                      <button
                        style={styles.deleteOperationalButton}
                        onClick={() => excluirOperacional(o.id)}
                      >
                        Excluir registro
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        <section style={styles.servicePanel}>
          <div style={styles.panelHeader}>
            <div>
              <span style={styles.panelLabel}>
                {abaAtiva === "condominio"
                  ? "Serviços do condomínio"
                  : "Serviços particulares"}
              </span>

              <h2 style={styles.panelTitle}>
                Cadastros operacionais
              </h2>
            </div>

            <span style={styles.resultBadge}>
              {listaFiltrada.length} resultado(s)
            </span>
          </div>

          {listaFiltrada.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>🧰</div>

              <h3 style={styles.emptyTitle}>
                Nenhum cadastro encontrado
              </h3>

              <p style={styles.emptyText}>
                Cadastre prestadores para controlar serviços, entradas e status de execução.
              </p>

              <button
                style={styles.emptyButton}
                onClick={abrirNovoCadastro}
              >
                Novo cadastro
              </button>
            </div>
          ) : (
            <div style={styles.serviceGrid}>
              {listaFiltrada.map((p) => {
                const status = corStatus(p.status);

                return (
                  <article
                    key={p.id}
                    style={{
                      ...styles.serviceCard,
                      borderColor: status.border
                    }}
                  >
                    <div style={styles.cardTop}>
                      <div style={styles.serviceIdentity}>
                        <div style={styles.serviceIcon}>
                          {iconeServico(p.servico)}
                        </div>

                        <div>
                          <h3 style={styles.serviceName}>
                            {p.nome}
                          </h3>

                          <p style={styles.company}>
                            {p.empresa || "Sem empresa informada"}
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

                    <div style={styles.serviceType}>
                      <span>🧰</span>
                      <strong>{p.servico}</strong>
                    </div>

                    <div style={styles.infoGrid}>
                      <div style={styles.infoItem}>
                        <span>Telefone</span>
                        <strong>{p.telefone || "-"}</strong>
                      </div>

                      <div style={styles.infoItem}>
                        <span>CPF</span>
                        <strong>{p.cpf || "-"}</strong>
                      </div>

                      <div style={styles.infoItem}>
                        <span>Tipo</span>
                        <strong>{p.tipoServico || "-"}</strong>
                      </div>

                      <div style={styles.infoItem}>
                        <span>Área</span>
                        <strong>{p.areaRelacionada || "-"}</strong>
                      </div>

                      {abaAtiva === "particular" && (
                        <>
                          <div style={styles.infoItem}>
                            <span>Apartamento</span>
                            <strong>{p.apartamento || "-"}</strong>
                          </div>

                          <div style={styles.infoItem}>
                            <span>Responsável</span>
                            <strong>{p.responsavel || "-"}</strong>
                          </div>
                        </>
                      )}
                    </div>

                    <div style={styles.timeBox}>
                      <div>
                        <span>Entrada</span>
                        <strong>
                          {formatarData(p.dataEntrada)} {p.horaEntrada || ""}
                        </strong>
                      </div>

                      <div>
                        <span>Saída</span>
                        <strong>
                          {formatarData(p.dataSaida)} {p.horaSaida || ""}
                        </strong>
                      </div>
                    </div>

                    {p.observacao && (
                      <div style={styles.noteBox}>
                        {p.observacao}
                      </div>
                    )}

                    <div style={styles.actionRow}>
                      {p.status !== "Em execução" && (
                        <button
                          style={styles.runningButton}
                          onClick={() => alterarStatusPrestador(p.id, "Em execução")}
                        >
                          Iniciar
                        </button>
                      )}

                      {p.status !== "Finalizado" && (
                        <button
                          style={styles.doneButton}
                          onClick={() => alterarStatusPrestador(p.id, "Finalizado")}
                        >
                          Finalizar
                        </button>
                      )}

                      <button
                        style={styles.editButton}
                        onClick={() => editarPrestador(p)}
                      >
                        Editar
                      </button>

                      <button
                        style={styles.deleteButton}
                        onClick={() => excluirPrestador(p.id)}
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
      )}

      {mostrarModal && (
        <div style={styles.modalBg}>
          <div style={styles.modal}>
            <div style={styles.modalTop}>
              <div>
                <span style={styles.modalBadge}>
                  {editId !== null ? "Editar serviço" : "Novo serviço"}
                </span>

                <h2 style={styles.modalTitle}>
                  {editId !== null
                    ? "Editar cadastro"
                    : "Cadastrar prestador"}
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
                Dados do prestador
              </h3>

              <div style={styles.formGrid}>
                <div style={styles.formRow}>
                  <label style={styles.label}>Nome completo</label>

                  <input
                    placeholder="Nome completo"
                    value={novoPrestador.nome}
                    onChange={(e) =>
                      setNovoPrestador({
                        ...novoPrestador,
                        nome: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Empresa</label>

                  <input
                    placeholder="Empresa"
                    value={novoPrestador.empresa}
                    onChange={(e) =>
                      setNovoPrestador({
                        ...novoPrestador,
                        empresa: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Telefone</label>

                  <input
                    placeholder="Telefone"
                    value={novoPrestador.telefone}
                    onChange={(e) =>
                      setNovoPrestador({
                        ...novoPrestador,
                        telefone: formatarTelefone(e.target.value)
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>CPF</label>

                  <input
                    placeholder="CPF"
                    value={novoPrestador.cpf}
                    onChange={(e) =>
                      setNovoPrestador({
                        ...novoPrestador,
                        cpf: formatarCPF(e.target.value)
                      })
                    }
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            <div style={styles.modalSection}>
              <h3 style={styles.modalSectionTitle}>
                Serviço
              </h3>

              <div style={styles.formGrid}>
                <div style={styles.formRow}>
                  <label style={styles.label}>Serviço executado</label>

                  <input
                    placeholder="Ex: Manutenção elétrica"
                    value={novoPrestador.servico}
                    onChange={(e) =>
                      setNovoPrestador({
                        ...novoPrestador,
                        servico: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Tipo de serviço</label>

                  <select
                    value={novoPrestador.tipoServico}
                    onChange={(e) =>
                      setNovoPrestador({
                        ...novoPrestador,
                        tipoServico: e.target.value
                      })
                    }
                    style={styles.input}
                  >
                    <option>Condomínio</option>
                    <option>Apartamento</option>
                    <option>Emergencial</option>
                    <option>Preventiva</option>
                  </select>
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Área relacionada</label>

                  {areasComuns.length > 0 ? (
                    <select
                      value={novoPrestador.areaRelacionada}
                      onChange={(e) =>
                        setNovoPrestador({
                          ...novoPrestador,
                          areaRelacionada: e.target.value
                        })
                      }
                      style={styles.input}
                    >
                      <option value="">Selecione uma área</option>

                      {areasComuns.map((area) => (
                        <option
                          key={area.id}
                          value={area.nome}
                        >
                          {area.nome}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      placeholder="Área relacionada"
                      value={novoPrestador.areaRelacionada}
                      onChange={(e) =>
                        setNovoPrestador({
                          ...novoPrestador,
                          areaRelacionada: e.target.value
                        })
                      }
                      style={styles.input}
                    />
                  )}
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Status</label>

                  <select
                    value={novoPrestador.status}
                    onChange={(e) =>
                      setNovoPrestador({
                        ...novoPrestador,
                        status: e.target.value
                      })
                    }
                    style={styles.input}
                  >
                    <option>Pendente</option>
                    <option>Aguardando liberação</option>
                    <option>Em execução</option>
                    <option>Finalizado</option>
                    <option>Cancelado</option>
                  </select>
                </div>
              </div>
            </div>

            {abaAtiva === "particular" && (
              <div style={styles.modalSection}>
                <h3 style={styles.modalSectionTitle}>
                  Responsável pela solicitação
                </h3>

                <div style={styles.formGrid}>
                  <div style={styles.formRow}>
                    <label style={styles.label}>Apartamento</label>

                    <input
                      placeholder="Apartamento"
                      value={novoPrestador.apartamento}
                      onChange={(e) =>
                        setNovoPrestador({
                          ...novoPrestador,
                          apartamento: e.target.value
                        })
                      }
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.formRow}>
                    <label style={styles.label}>Morador responsável</label>

                    <input
                      placeholder="Morador responsável"
                      value={novoPrestador.responsavel}
                      onChange={(e) =>
                        setNovoPrestador({
                          ...novoPrestador,
                          responsavel: e.target.value
                        })
                      }
                      style={styles.input}
                    />
                  </div>
                </div>
              </div>
            )}

            <div style={styles.modalSection}>
              <h3 style={styles.modalSectionTitle}>
                Controle de entrada e saída
              </h3>

              <div style={styles.formGrid}>
                <div style={styles.formRow}>
                  <label style={styles.label}>Data entrada</label>

                  <input
                    type="date"
                    value={novoPrestador.dataEntrada}
                    onChange={(e) =>
                      setNovoPrestador({
                        ...novoPrestador,
                        dataEntrada: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Hora entrada</label>

                  <input
                    type="time"
                    value={novoPrestador.horaEntrada}
                    onChange={(e) =>
                      setNovoPrestador({
                        ...novoPrestador,
                        horaEntrada: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Data saída</label>

                  <input
                    type="date"
                    value={novoPrestador.dataSaida}
                    onChange={(e) =>
                      setNovoPrestador({
                        ...novoPrestador,
                        dataSaida: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Hora saída</label>

                  <input
                    type="time"
                    value={novoPrestador.horaSaida}
                    onChange={(e) =>
                      setNovoPrestador({
                        ...novoPrestador,
                        horaSaida: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRowFull}>
                  <label style={styles.label}>Observações</label>

                  <textarea
                    placeholder="Digite observações adicionais"
                    value={novoPrestador.observacao}
                    onChange={(e) =>
                      setNovoPrestador({
                        ...novoPrestador,
                        observacao: e.target.value
                      })
                    }
                    style={styles.textarea}
                  />
                </div>
              </div>
            </div>

            <div style={styles.modalButtons}>
              <button
                style={styles.saveBtn}
                onClick={salvarPrestador}
              >
                Salvar cadastro
              </button>

              <button
                style={styles.cancelBtn}
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
    fontFamily: "Arial",
    color: "#111827"
  },

  hero: {
    background:
      "linear-gradient(135deg,#02140b,#064e3b 55%,#15803d)",
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

  operationBoard: {
    display: "flex",
    gap: "10px",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    padding: "12px",
    borderRadius: "24px"
  },

  operationItem: {
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

  tabs: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "28px",
    padding: "12px",
    marginBottom: "24px",
    display: "flex",
    gap: "12px",
    boxShadow: "0 14px 35px rgba(15,23,42,0.06)",
    flexWrap: "wrap"
  },

  tab: {
    flex: 1,
    minWidth: "210px",
    background: "#f8fafc",
    color: "#166534",
    border: "1px solid #d1d5db",
    padding: "14px",
    borderRadius: "18px",
    cursor: "pointer",
    fontWeight: "900"
  },

  activeTab: {
    background: "linear-gradient(135deg,#064e3b,#16a34a)",
    color: "white",
    border: "1px solid #16a34a",
    boxShadow: "0 12px 26px rgba(22,163,74,0.22)"
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

  compactStats: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    fontSize: "12px",
    color: "#374151"
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

  servicePanel: {
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

  resultBadgeYellow: {
    background: "#fef3c7",
    color: "#92400e",
    border: "1px solid #fde68a",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  serviceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))",
    gap: "18px"
  },

  serviceCard: {
    background: "linear-gradient(180deg,#ffffff,#f8fafc)",
    borderRadius: "30px",
    padding: "22px",
    boxShadow: "0 15px 38px rgba(15,23,42,0.06)",
    border: "1px solid #eef2f7"
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "18px"
  },

  serviceIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },

  serviceIcon: {
    width: "64px",
    height: "64px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg,#052e16,#16a34a)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    boxShadow: "0 14px 26px rgba(22,163,74,0.22)"
  },

  serviceName: {
    margin: 0,
    color: "#111827",
    fontSize: "21px"
  },

  company: {
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

  serviceType: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "18px",
    padding: "13px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#166534",
    marginBottom: "14px"
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px"
  },

  infoItem: {
    background: "white",
    border: "1px solid #eef2f7",
    borderRadius: "17px",
    padding: "13px"
  },

  timeBox: {
    marginTop: "12px",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "17px",
    padding: "13px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px"
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
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "8px",
    marginTop: "18px"
  },

  runningButton: {
    background: "#dbeafe",
    color: "#1d4ed8",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  doneButton: {
    background: "#dcfce7",
    color: "#166534",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  editButton: {
    background: "#fef3c7",
    color: "#92400e",
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

  operationalPanel: {
    background: "white",
    border: "1px solid #eef2f7",
    borderRadius: "34px",
    padding: "28px",
    boxShadow: "0 18px 55px rgba(15,23,42,0.08)"
  },

  operationalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "24px",
    flexWrap: "wrap"
  },

  operationalBadge: {
    background: "#fef3c7",
    color: "#92400e",
    border: "1px solid #fde68a",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900"
  },

  operationalTitle: {
    margin: "12px 0 0",
    color: "#052e16",
    fontSize: "30px"
  },

  operationalResume: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap"
  },

  yellowMetric: {
    minWidth: "135px",
    background: "#fffbeb",
    border: "1px solid #fde68a",
    color: "#92400e",
    padding: "14px",
    borderRadius: "18px"
  },

  operationalFormCard: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "28px",
    padding: "24px",
    marginBottom: "24px"
  },

  operationalSectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#052e16",
    fontWeight: "900",
    marginBottom: "16px",
    marginTop: "8px"
  },

  operationalGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "15px",
    marginBottom: "22px"
  },

  readingGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "15px",
    marginBottom: "20px"
  },

  readingBox: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: "20px",
    padding: "14px"
  },

  yellowLabel: {
    display: "block",
    color: "#92400e",
    fontSize: "13px",
    fontWeight: "900",
    marginBottom: "8px"
  },

  yellowInput: {
    width: "100%",
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid #facc15",
    outline: "none",
    fontSize: "14px",
    background: "white",
    boxSizing: "border-box"
  },

  consumptionBox: {
    background: "linear-gradient(135deg,#facc15,#fef3c7)",
    border: "1px solid #eab308",
    color: "#713f12",
    borderRadius: "20px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  },

  operationalHistory: {
    background: "#ffffff",
    border: "1px solid #eef2f7",
    borderRadius: "28px",
    padding: "24px"
  },

  operationalList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))",
    gap: "14px"
  },

  operationalCard: {
    display: "flex",
    gap: "14px",
    background: "linear-gradient(180deg,#ffffff,#f8fafc)",
    border: "1px solid #fde68a",
    borderRadius: "24px",
    padding: "18px"
  },

  operationalIcon: {
    width: "58px",
    height: "58px",
    borderRadius: "20px",
    background: "linear-gradient(135deg,#facc15,#92400e)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px"
  },

  operationalInfo: {
    flex: 1
  },

  operationalCardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start"
  },

  operationalCardTitle: {
    margin: 0,
    color: "#111827"
  },

  operationalText: {
    margin: "6px 0",
    color: "#6b7280"
  },

  pocoBadge: {
    background: "#fef3c7",
    color: "#92400e",
    border: "1px solid #fde68a",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  meterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
    gap: "8px",
    marginTop: "10px"
  },

  meterItem: {
    background: "white",
    border: "1px solid #eef2f7",
    borderRadius: "14px",
    padding: "10px"
  },

  meterItemYellow: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    color: "#92400e",
    borderRadius: "14px",
    padding: "10px"
  },

  observation: {
    marginTop: "10px",
    background: "#fffbeb",
    border: "1px solid #fde68a",
    color: "#92400e",
    padding: "10px",
    borderRadius: "14px"
  },

  deleteOperationalButton: {
    marginTop: "12px",
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    padding: "10px 12px",
    borderRadius: "13px",
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

  emptyYellow: {
    background: "#fffbeb",
    border: "1px dashed #fde68a",
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
      "linear-gradient(135deg,#064e3b,#16a34a)",
    color: "white",
    border: "none",
    padding: "13px 18px",
    borderRadius: "15px",
    cursor: "pointer",
    fontWeight: "900"
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
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
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: "14px",
    background: "white"
  },

  textarea: {
    minHeight: "100px",
    resize: "vertical",
    padding: "15px",
    borderRadius: "16px",
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: "14px",
    background: "white",
    fontFamily: "Arial"
  },

  saveOperationalButton: {
    width: "100%",
    marginTop: "18px",
    background:
      "linear-gradient(135deg,#92400e,#facc15)",
    color: "white",
    border: "none",
    padding: "14px",
    borderRadius: "17px",
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
    width: "820px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#f8fafc",
    padding: "26px",
    borderRadius: "36px",
    boxShadow: "0 30px 80px rgba(0,0,0,0.28)"
  },

  modalTop: {
    background:
      "linear-gradient(135deg,#052e16,#166534)",
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

  modalButtons: {
    display: "flex",
    gap: "12px",
    marginTop: "18px"
  },

  saveBtn: {
    flex: 1,
    background:
      "linear-gradient(135deg,#064e3b,#16a34a)",
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

export default Prestadores;