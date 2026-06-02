import { useState } from "react";

function Visitantes() {
  const STORAGE_KEY = "visitantes";

  const estadoInicialVisitante = {
    nome: "",
    documento: "",
    apartamento: "",
    morador: "",
    moradorId: "",
    observacao: "",
    entrada: "",
    autorizado: false,
    bloqueado: false,
    status: "Pendente",
    tipo: "Visita"
  };

  const [visitantes, setVisitantes] = useState(() => {
    const dados = localStorage.getItem(STORAGE_KEY);
    return dados ? JSON.parse(dados) : [];
  });

  const [moradores] = useState(() => {
    const dados = localStorage.getItem("moradores");

    if (!dados) return [];

    const lista = JSON.parse(dados);

    return lista.map((morador) => ({
      ...morador,
      apto: morador.apto || morador.apartamento || "",
      apartamento: morador.apartamento || morador.apto || ""
    }));
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [novoVisitante, setNovoVisitante] = useState(estadoInicialVisitante);
  const [editId, setEditId] = useState(null);

  const visitantesFiltrados = visitantes.filter((v) => {
    const texto = busca.toLowerCase();

    const correspondeBusca =
      v.nome?.toLowerCase().includes(texto) ||
      v.documento?.toLowerCase().includes(texto) ||
      v.apartamento?.toLowerCase().includes(texto) ||
      v.morador?.toLowerCase().includes(texto) ||
      v.tipo?.toLowerCase().includes(texto) ||
      v.status?.toLowerCase().includes(texto);

    const correspondeStatus =
      filtroStatus === "Todos" ||
      v.status === filtroStatus;

    return correspondeBusca && correspondeStatus;
  });

  const pendentes = visitantes.filter(
    (v) => v.status === "Pendente"
  );

  const emVisita = visitantes.filter(
    (v) => v.status === "Em visita"
  );

  const autorizados = visitantes.filter(
    (v) => v.status === "Autorizado"
  );

  const bloqueados = visitantes.filter(
    (v) => v.status === "Bloqueado" || v.bloqueado === true
  );

  const encerrados = visitantes.filter(
    (v) => v.status === "Saiu" || v.status === "Encerrado"
  );

  function salvarHistorico(acao, visitante) {
    const historico =
      JSON.parse(localStorage.getItem("movimentacoes")) || [];

    historico.unshift({
      id: Date.now(),
      tipo: "visitante",
      acao,
      nome: visitante.nome,
      apartamento: visitante.apartamento,
      data: new Date().toLocaleDateString(),
      hora: new Date().toLocaleTimeString(),
      timestamp: Date.now()
    });

    localStorage.setItem(
      "movimentacoes",
      JSON.stringify(historico)
    );
  }

  function salvarVisitante() {
    if (
      !novoVisitante.nome ||
      !novoVisitante.documento ||
      !novoVisitante.apartamento ||
      !novoVisitante.morador
    ) {
      alert("Preencha os campos obrigatórios");
      return;
    }

    const agora = new Date();

    let statusFinal = "Pendente";

    if (novoVisitante.bloqueado) {
      statusFinal = "Bloqueado";
    } else if (novoVisitante.autorizado) {
      statusFinal = "Autorizado";
    }

    const visitanteCompleto = {
      ...novoVisitante,
      status: statusFinal,
      data: agora.toLocaleDateString(),
      hora: agora.toLocaleTimeString(),
      timestamp: agora.getTime(),
      mes: agora.getMonth() + 1,
      ano: agora.getFullYear(),
      entrada: novoVisitante.entrada || agora.toLocaleTimeString()
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

      salvarHistorico("edição", visitanteCompleto);
      setEditId(null);
    } else {
      const novo = {
        id: Date.now(),
        ...visitanteCompleto
      };

      listaAtualizada = [
        novo,
        ...visitantes
      ];

      salvarHistorico("cadastro", novo);
    }

    setVisitantes(listaAtualizada);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(listaAtualizada)
    );

    setNovoVisitante(estadoInicialVisitante);
    setMostrarModal(false);
  }

  function excluirVisitante(id) {
    const confirmar = window.confirm(
      "Deseja realmente excluir este visitante?"
    );

    if (!confirmar) return;

    const visitante = visitantes.find(
      (v) => v.id === id
    );

    if (visitante) {
      salvarHistorico("exclusão", visitante);
    }

    const novaLista = visitantes.filter(
      (v) => v.id !== id
    );

    setVisitantes(novaLista);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(novaLista)
    );
  }

  function editarVisitante(v) {
    setNovoVisitante({
      ...estadoInicialVisitante,
      ...v,
      moradorId:
        v.moradorId ||
        obterMoradorIdPorNomeApartamento(
          v.morador,
          v.apartamento
        )
    });

    setEditId(v.id);
    setMostrarModal(true);
  }

  function mudarStatus(id, status) {
    const lista = visitantes.map((v) =>
      v.id === id
        ? {
            ...v,
            status,
            autorizado:
              status === "Autorizado" ||
              status === "Em visita"
                ? true
                : v.autorizado,
            bloqueado:
              status === "Bloqueado"
                ? true
                : status === "Autorizado" || status === "Em visita"
                  ? false
                  : v.bloqueado,
            saida:
              status === "Saiu"
                ? new Date().toLocaleTimeString()
                : v.saida
          }
        : v
    );

    const visitante = lista.find(
      (v) => v.id === id
    );

    if (visitante) {
      salvarHistorico(`status: ${status}`, visitante);
    }

    setVisitantes(lista);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(lista)
    );
  }

  function obterMoradorIdPorNomeApartamento(nome, apartamento) {
    const moradorEncontrado = moradores.find(
      (m) =>
        m.nome === nome &&
        (
          m.apto === apartamento ||
          m.apartamento === apartamento
        )
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
        apartamento: ""
      });

      return;
    }

    setNovoVisitante({
      ...novoVisitante,
      moradorId: moradorSelecionado.id,
      morador: moradorSelecionado.nome,
      apartamento:
        moradorSelecionado.apartamento ||
        moradorSelecionado.apto ||
        ""
    });
  }

  function corStatus(status) {
    switch (status) {
      case "Em visita":
        return {
          bg: "#dcfce7",
          color: "#166534",
          border: "#bbf7d0",
          label: "Dentro do condomínio"
        };

      case "Autorizado":
        return {
          bg: "#dbeafe",
          color: "#1d4ed8",
          border: "#bfdbfe",
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
      case "Encerrado":
        return {
          bg: "#f3f4f6",
          color: "#374151",
          border: "#e5e7eb",
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
    if (tipo === "Entrega") return "📦";
    if (tipo === "Prestador") return "🧰";
    if (tipo === "Familiar") return "👨‍👩‍👧";
    return "👤";
  }

  function iniciais(nome) {
    if (!nome) return "V";

    const partes = nome.trim().split(" ");

    if (partes.length === 1) {
      return partes[0].charAt(0).toUpperCase();
    }

    return `${partes[0].charAt(0)}${partes[partes.length - 1].charAt(0)}`.toUpperCase();
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
          <span style={styles.heroBadge}>
            🛂 Controle de acesso
          </span>

          <h1 style={styles.title}>
            Visitantes
          </h1>

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
          <option>Pendente</option>
          <option>Autorizado</option>
          <option>Em visita</option>
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
            <span style={styles.panelLabel}>
              Monitoramento
            </span>

            <h2 style={styles.panelTitle}>
              Fluxo de visitantes
            </h2>
          </div>

          <span style={styles.resultBadge}>
            {visitantesFiltrados.length} resultado(s)
          </span>
        </div>

        {visitantesFiltrados.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              🛂
            </div>

            <h3 style={styles.emptyTitle}>
              Nenhum visitante encontrado
            </h3>

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
                      <div style={styles.avatar}>
                        {iniciais(v.nome)}
                      </div>

                      <div>
                        <h3 style={styles.visitorName}>
                          {v.nome}
                        </h3>

                        <p style={styles.document}>
                          Doc: {v.documento}
                        </p>
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
                      {tipoVisual(v.tipo)}
                    </span>

                    <strong>
                      {v.tipo || "Visita"}
                    </strong>
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
                      <span>Entrada</span>
                      <strong>{v.entrada || v.hora || "-"}</strong>
                    </div>

                    <div style={styles.infoItem}>
                      <span>Data</span>
                      <strong>{v.data || "-"}</strong>
                    </div>
                  </div>

                  {v.observacao && (
                    <div style={styles.noteBox}>
                      {v.observacao}
                    </div>
                  )}

                  <div style={styles.actionRow}>
                    <button
                      style={styles.enterBtn}
                      onClick={() => mudarStatus(v.id, "Em visita")}
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
                      style={styles.editBtn}
                      onClick={() => editarVisitante(v)}
                    >
                      Editar
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
          <div style={styles.modal}>
            <div style={styles.modalTop}>
              <div>
                <span style={styles.modalBadge}>
                  {editId !== null ? "Editar acesso" : "Novo acesso"}
                </span>

                <h2 style={styles.modalTitle}>
                  {editId !== null
                    ? "Editar visitante"
                    : "Registrar visitante"}
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
                Dados do visitante
              </h3>

              <div style={styles.formGrid}>
                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Nome
                  </label>

                  <input
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
                  <label style={styles.label}>
                    Documento
                  </label>

                  <input
                    placeholder="Documento"
                    value={novoVisitante.documento}
                    onChange={(e) =>
                      setNovoVisitante({
                        ...novoVisitante,
                        documento: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Tipo
                  </label>

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
                    <option>Visita</option>
                    <option>Entrega</option>
                    <option>Prestador</option>
                    <option>Familiar</option>
                  </select>
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Hora de entrada
                  </label>

                  <input
                    placeholder="Ex: 14:35"
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
              <h3 style={styles.modalSectionTitle}>
                Responsável pela visita
              </h3>

              <div style={styles.formGrid}>
                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Morador responsável
                  </label>

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
                    <option value="">
                      Selecione o morador responsável
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
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Apartamento
                  </label>

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
              <h3 style={styles.modalSectionTitle}>
                Controle de acesso
              </h3>

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

                  <span>
                    ✅ Autorizado
                  </span>
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

                  <span>
                    ⛔ Bloqueado
                  </span>
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
              <button
                style={styles.saveBtn}
                onClick={salvarVisitante}
              >
                Salvar visitante
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

  accessBoard: {
    display: "flex",
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
    width: "170px",
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

  accessPanel: {
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

  visitorGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))",
    gap: "18px"
  },

  visitorCard: {
    background: "linear-gradient(180deg,#ffffff,#f8fafc)",
    borderRadius: "30px",
    padding: "22px",
    boxShadow: "0 15px 38px rgba(15,23,42,0.06)",
    border: "1px solid #eef2f7"
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "18px"
  },

  identityArea: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },

  avatar: {
    width: "64px",
    height: "64px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg,#052e16,#16a34a)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "900",
    boxShadow: "0 14px 26px rgba(22,163,74,0.22)"
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
    border: "1px solid #eef2f7",
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
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "8px",
    marginTop: "18px"
  },

  enterBtn: {
    background: "#dcfce7",
    color: "#166534",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  exitBtn: {
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  editBtn: {
    background: "#dbeafe",
    color: "#1d4ed8",
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
    background:
      "linear-gradient(135deg,#064e3b,#16a34a)",
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
    width: "780px",
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

  accessOptions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "14px"
  },

  optionCard: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "17px",
    padding: "14px",
    display: "flex",
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
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: "14px",
    background: "#f9fafb",
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "Arial"
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

export default Visitantes;