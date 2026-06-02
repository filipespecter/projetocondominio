import { useState } from "react";

function Apartamentos() {
  const STORAGE_KEY = "apartamentos";

  const estadoInicialApartamento = {
    bloco: "",
    numero: "",
    andar: "",
    morador: "",
    status: "Ocupado"
  };

  const [apartamentos, setApartamentos] = useState(() => {
    const dados = localStorage.getItem(STORAGE_KEY);
    return dados ? JSON.parse(dados) : [];
  });

  const [moradores] = useState(() => {
    const dados = localStorage.getItem("moradores");
    return dados ? JSON.parse(dados) : [];
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [novoAp, setNovoAp] = useState(estadoInicialApartamento);
  const [editId, setEditId] = useState(null);

  const apartamentosFiltrados = apartamentos.filter((ap) => {
    const texto = busca.toLowerCase();

    const correspondeBusca =
      ap.bloco?.toLowerCase().includes(texto) ||
      ap.numero?.toLowerCase().includes(texto) ||
      ap.andar?.toLowerCase().includes(texto) ||
      ap.morador?.toLowerCase().includes(texto) ||
      ap.status?.toLowerCase().includes(texto);

    const correspondeStatus =
      filtroStatus === "Todos" ||
      ap.status === filtroStatus;

    return correspondeBusca && correspondeStatus;
  });

  function selecionarMorador(moradorId) {
    const moradorSelecionado = moradores.find(
      (m) => String(m.id) === String(moradorId)
    );

    if (!moradorSelecionado) {
      setNovoAp({
        ...novoAp,
        morador: ""
      });

      return;
    }

    setNovoAp({
      ...novoAp,
      morador: moradorSelecionado.nome,
      numero:
        novoAp.numero ||
        moradorSelecionado.apartamento ||
        moradorSelecionado.apto ||
        ""
    });
  }

  function salvarApartamento() {
    if (!novoAp.bloco || !novoAp.numero || !novoAp.andar) {
      alert("Preencha os campos obrigatórios");
      return;
    }

    const apartamentoExiste = apartamentos.find(
      (ap) =>
        ap.bloco?.toLowerCase() === novoAp.bloco.toLowerCase() &&
        ap.numero === novoAp.numero &&
        ap.id !== editId
    );

    if (apartamentoExiste) {
      alert("Esse apartamento já existe");
      return;
    }

    let listaAtualizada = [];

    if (editId !== null) {
      listaAtualizada = apartamentos.map((ap) =>
        ap.id === editId
          ? {
              ...novoAp,
              id: editId
            }
          : ap
      );

      setEditId(null);
    } else {
      const novo = {
        id: Date.now(),
        ...novoAp
      };

      listaAtualizada = [...apartamentos, novo];
    }

    setApartamentos(listaAtualizada);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(listaAtualizada)
    );

    setNovoAp(estadoInicialApartamento);
    setMostrarModal(false);
  }

  function editarApartamento(ap) {
    setNovoAp({
      ...estadoInicialApartamento,
      ...ap
    });

    setEditId(ap.id);
    setMostrarModal(true);
  }

  function excluirApartamento(id) {
    const confirmar = window.confirm(
      "Deseja excluir esse apartamento?"
    );

    if (!confirmar) return;

    const listaAtualizada = apartamentos.filter(
      (ap) => ap.id !== id
    );

    setApartamentos(listaAtualizada);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(listaAtualizada)
    );
  }

  function fecharModal() {
    setMostrarModal(false);
    setEditId(null);
    setNovoAp(estadoInicialApartamento);
  }

  function corStatus(status) {
    switch (status) {
      case "Ocupado":
        return {
          background: "#dbeafe",
          color: "#1d4ed8",
          border: "#bfdbfe",
          icon: "👥"
        };

      case "Disponível":
        return {
          background: "#dcfce7",
          color: "#166534",
          border: "#bbf7d0",
          icon: "✅"
        };

      case "Manutenção":
        return {
          background: "#fee2e2",
          color: "#dc2626",
          border: "#fecaca",
          icon: "🛠️"
        };

      default:
        return {
          background: "#f3f4f6",
          color: "#374151",
          border: "#e5e7eb",
          icon: "🏢"
        };
    }
  }

  const totalDisponiveis = apartamentos.filter(
    (a) => a.status === "Disponível"
  ).length;

  const totalOcupados = apartamentos.filter(
    (a) => a.status === "Ocupado"
  ).length;

  const totalManutencao = apartamentos.filter(
    (a) => a.status === "Manutenção"
  ).length;

  const blocosUnicos = [
    ...new Set(
      apartamentos
        .map((ap) => ap.bloco)
        .filter(Boolean)
    )
  ];

  const andaresUnicos = [
    ...new Set(
      apartamentos
        .map((ap) => ap.andar)
        .filter(Boolean)
    )
  ];

  const taxaOcupacao =
    apartamentos.length > 0
      ? Math.round((totalOcupados / apartamentos.length) * 100)
      : 0;

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <span style={styles.heroBadge}>
            🏢 Dashboard Principal
          </span>

          <h1 style={styles.title}>
            Gestão de Apartamentos
          </h1>

          <p style={styles.subtitle}>
            Controle premium das unidades reais cadastradas pelo síndico.
            Cada apartamento registrado aqui alimenta automaticamente moradores,
            reservas, portaria, encomendas e relatórios.
          </p>

          <div style={styles.heroChips}>
            <span style={styles.heroChip}>
              {blocosUnicos.length} bloco(s)
            </span>

            <span style={styles.heroChip}>
              {andaresUnicos.length} andar(es)
            </span>

            <span style={styles.heroChip}>
              {taxaOcupacao}% ocupação
            </span>
          </div>
        </div>

        <div style={styles.heroPanel}>
          <div style={styles.heroPanelIcon}>
            🏢
          </div>

          <p style={styles.heroLabel}>
            Unidades cadastradas
          </p>

          <h3 style={styles.heroNumber}>
            {apartamentos.length}
          </h3>

          <span style={styles.heroStatus}>
            base real do sistema
          </span>
        </div>
      </div>

      <div style={styles.commandBar}>
        <div style={styles.searchBox}>
          <input
            placeholder="Buscar por bloco, número, andar, morador ou status..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={styles.search}
          />

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            style={styles.filter}
          >
            <option>Todos</option>
            <option>Ocupado</option>
            <option>Disponível</option>
            <option>Manutenção</option>
          </select>
        </div>

        <button
          style={styles.button}
          onClick={() => {
            setEditId(null);
            setNovoAp(estadoInicialApartamento);
            setMostrarModal(true);
          }}
        >
          <span style={styles.buttonIcon}>＋</span>
          Novo apartamento
        </button>
      </div>

      <div style={styles.resumeGrid}>
        <div style={styles.cardPrimary}>
          <div>
            <p style={styles.cardLabelLight}>
              Total de unidades
            </p>

            <h2 style={styles.cardNumberLight}>
              {apartamentos.length}
            </h2>

            <span style={styles.cardHintLight}>
              cadastradas pelo síndico
            </span>
          </div>

          <div style={styles.cardIconLight}>
            🏢
          </div>
        </div>

        <div style={styles.resumeCard}>
          <div style={styles.cardIconGreen}>
            ✅
          </div>

          <div>
            <p style={styles.resumeLabel}>
              Disponíveis
            </p>

            <h2 style={styles.resumeNumberGreen}>
              {totalDisponiveis}
            </h2>
          </div>
        </div>

        <div style={styles.resumeCard}>
          <div style={styles.cardIconBlue}>
            👥
          </div>

          <div>
            <p style={styles.resumeLabel}>
              Ocupados
            </p>

            <h2 style={styles.resumeNumberBlue}>
              {totalOcupados}
            </h2>
          </div>
        </div>

        <div style={styles.resumeCard}>
          <div style={styles.cardIconRed}>
            🛠️
          </div>

          <div>
            <p style={styles.resumeLabel}>
              Manutenção
            </p>

            <h2 style={styles.resumeNumberRed}>
              {totalManutencao}
            </h2>
          </div>
        </div>
      </div>

      <div style={styles.premiumGrid}>
        <div style={styles.apartmentsPanel}>
          <div style={styles.tableHeader}>
            <div>
              <span style={styles.sectionMini}>
                Unidades
              </span>

              <h2 style={styles.sectionTitle}>
                Mapa residencial cadastrado
              </h2>

              <p style={styles.sectionSubtitle}>
                Visualização executiva dos apartamentos reais do condomínio.
              </p>
            </div>

            <span style={styles.sectionBadge}>
              {apartamentosFiltrados.length} resultado(s)
            </span>
          </div>

          {apartamentosFiltrados.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>
                🏢
              </div>

              <h3 style={styles.emptyTitle}>
                Nenhum apartamento encontrado
              </h3>

              <p style={styles.emptyText}>
                Cadastre a primeira unidade real para ela aparecer nos módulos integrados.
              </p>

              <button
                style={styles.emptyButton}
                onClick={() => {
                  setEditId(null);
                  setNovoAp(estadoInicialApartamento);
                  setMostrarModal(true);
                }}
              >
                Cadastrar primeira unidade
              </button>
            </div>
          ) : (
            <div style={styles.grid}>
              {apartamentosFiltrados.map((ap) => {
                const status = corStatus(ap.status);

                return (
                  <div
                    key={ap.id}
                    style={{
                      ...styles.apCard,
                      border: `1px solid ${status.border}`
                    }}
                  >
                    <div style={styles.cardGlow}></div>

                    <div style={styles.apCardTop}>
                      <div style={styles.apIcon}>
                        🏢
                      </div>

                      <span
                        style={{
                          ...styles.statusBadge,
                          background: status.background,
                          color: status.color
                        }}
                      >
                        {status.icon} {ap.status}
                      </span>
                    </div>

                    <div style={styles.apIdentity}>
                      <span style={styles.apLabel}>
                        Unidade
                      </span>

                      <h3 style={styles.apTitle}>
                        Bloco {ap.bloco} • Apto {ap.numero}
                      </h3>
                    </div>

                    <div style={styles.infoGrid}>
                      <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>
                          Andar
                        </span>

                        <strong>
                          {ap.andar}
                        </strong>
                      </div>

                      <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>
                          Morador vinculado
                        </span>

                        <strong>
                          {ap.morador || "Sem morador"}
                        </strong>
                      </div>
                    </div>

                    <div style={styles.integrationBox}>
                      <span>
                        🔗 Integração
                      </span>

                      <p>
                        Esta unidade pode aparecer em portaria, reservas,
                        moradores e relatórios.
                      </p>
                    </div>

                    <div style={styles.cardFooter}>
                      <button
                        style={styles.editButton}
                        onClick={() => editarApartamento(ap)}
                      >
                        Editar unidade
                      </button>

                      <button
                        style={styles.deleteButton}
                        onClick={() => excluirApartamento(ap.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={styles.sidePanel}>
          <div style={styles.sideCardDark}>
            <span style={styles.sideBadge}>
              Visão premium
            </span>

            <h2 style={styles.sideTitle}>
              Ocupação geral
            </h2>

            <div style={styles.progressCircle}>
              {taxaOcupacao}%
            </div>

            <p style={styles.sideText}>
              Taxa calculada somente com apartamentos cadastrados
              no painel do síndico.
            </p>
          </div>

          <div style={styles.sideCard}>
            <h3 style={styles.sideCardTitle}>
              Blocos cadastrados
            </h3>

            {blocosUnicos.length === 0 ? (
              <p style={styles.sideEmpty}>
                Nenhum bloco cadastrado.
              </p>
            ) : (
              <div style={styles.blockList}>
                {blocosUnicos.map((bloco) => {
                  const totalBloco = apartamentos.filter(
                    (ap) => ap.bloco === bloco
                  ).length;

                  return (
                    <div key={bloco} style={styles.blockItem}>
                      <span style={styles.blockIcon}>
                        🏬
                      </span>

                      <div>
                        <strong>
                          Bloco {bloco}
                        </strong>

                        <p>
                          {totalBloco} unidade(s)
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={styles.sideCard}>
            <h3 style={styles.sideCardTitle}>
              Próxima evolução
            </h3>

            <p style={styles.sideTextLight}>
              Depois vamos fazer o painel do porteiro mostrar somente os
              apartamentos cadastrados aqui.
            </p>
          </div>
        </div>
      </div>

      {mostrarModal && (
        <div style={styles.modalBackground}>
          <div style={styles.modal}>
            <div style={styles.modalHero}>
              <div>
                <span style={styles.modalBadge}>
                  {editId !== null ? "Editar unidade" : "Nova unidade"}
                </span>

                <h2 style={styles.modalTitle}>
                  {editId !== null
                    ? "Editar apartamento"
                    : "Cadastrar apartamento"}
                </h2>

                <p style={styles.modalSubtitle}>
                  Os dados salvos aqui passam a compor a base real do condomínio.
                </p>
              </div>

              <button
                style={styles.closeButton}
                onClick={fecharModal}
              >
                ✕
              </button>
            </div>

            <div style={styles.formPanel}>
              <div style={styles.formRow}>
                <label style={styles.label}>
                  Bloco
                </label>

                <input
                  placeholder="Ex: A"
                  value={novoAp.bloco}
                  onChange={(e) =>
                    setNovoAp({
                      ...novoAp,
                      bloco: e.target.value
                    })
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>
                  Número
                </label>

                <input
                  placeholder="Ex: 101"
                  value={novoAp.numero}
                  onChange={(e) =>
                    setNovoAp({
                      ...novoAp,
                      numero: e.target.value
                    })
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>
                  Andar
                </label>

                <input
                  placeholder="Ex: 1"
                  value={novoAp.andar}
                  onChange={(e) =>
                    setNovoAp({
                      ...novoAp,
                      andar: e.target.value
                    })
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>
                  Morador
                </label>

                <select
                  value={
                    moradores.find((m) => m.nome === novoAp.morador)?.id || ""
                  }
                  onChange={(e) => selecionarMorador(e.target.value)}
                  style={styles.input}
                >
                  <option value="">
                    Selecione um morador
                  </option>

                  {moradores.map((morador) => (
                    <option key={morador.id} value={morador.id}>
                      {morador.nome} - Apto{" "}
                      {morador.apartamento || morador.apto || "-"}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>
                  Status
                </label>

                <select
                  value={novoAp.status}
                  onChange={(e) =>
                    setNovoAp({
                      ...novoAp,
                      status: e.target.value
                    })
                  }
                  style={styles.input}
                >
                  <option>Ocupado</option>
                  <option>Disponível</option>
                  <option>Manutenção</option>
                </select>
              </div>
            </div>

            <div style={styles.modalButtons}>
              <button
                style={styles.saveButton}
                onClick={salvarApartamento}
              >
                Salvar apartamento
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
    fontFamily: "Arial",
    color: "#111827"
  },

  hero: {
    background:
      "radial-gradient(circle at top right,rgba(187,247,208,0.36),transparent 36%), radial-gradient(circle at bottom left,rgba(34,197,94,0.16),transparent 34%), linear-gradient(135deg,#031b0f,#064e3b,#166534)",
    borderRadius: "38px",
    padding: "38px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "34px",
    marginBottom: "26px",
    boxShadow: "0 28px 70px rgba(22,101,52,0.34)",
    overflow: "hidden"
  },

  heroContent: {
    flex: 1
  },

  heroBadge: {
    background: "rgba(255,255,255,0.14)",
    padding: "10px 15px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "900",
    display: "inline-block",
    marginBottom: "16px",
    border: "1px solid rgba(255,255,255,0.14)"
  },

  title: {
    margin: 0,
    fontSize: "44px",
    letterSpacing: "-1px"
  },

  subtitle: {
    margin: "13px 0 0",
    color: "rgba(255,255,255,0.78)",
    maxWidth: "780px",
    lineHeight: "1.6",
    fontSize: "15px"
  },

  heroChips: {
    marginTop: "22px",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap"
  },

  heroChip: {
    background: "rgba(255,255,255,0.13)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "#dcfce7",
    padding: "9px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  heroPanel: {
    background:
      "linear-gradient(145deg,rgba(255,255,255,0.16),rgba(255,255,255,0.08))",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: "30px",
    padding: "26px",
    minWidth: "260px",
    textAlign: "center",
    backdropFilter: "blur(16px)",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)"
  },

  heroPanelIcon: {
    width: "64px",
    height: "64px",
    borderRadius: "23px",
    background: "rgba(255,255,255,0.15)",
    margin: "0 auto 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px"
  },

  heroLabel: {
    margin: 0,
    color: "rgba(255,255,255,0.70)",
    fontSize: "13px"
  },

  heroNumber: {
    margin: "8px 0 12px",
    color: "white",
    fontSize: "46px"
  },

  heroStatus: {
    background: "#dcfce7",
    color: "#166534",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  commandBar: {
    background: "white",
    border: "1px solid #eef2f7",
    borderRadius: "28px",
    padding: "18px",
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    marginBottom: "26px",
    boxShadow: "0 14px 35px rgba(15,23,42,0.06)"
  },

  searchBox: {
    display: "flex",
    gap: "12px",
    flex: 1
  },

  search: {
    flex: 1,
    padding: "15px 16px",
    borderRadius: "17px",
    border: "1px solid #d1d5db",
    outline: "none",
    background: "#f9fafb",
    fontSize: "14px"
  },

  filter: {
    width: "180px",
    padding: "15px 16px",
    borderRadius: "17px",
    border: "1px solid #d1d5db",
    outline: "none",
    background: "#f9fafb",
    fontSize: "14px"
  },

  button: {
    background:
      "linear-gradient(135deg,#064e3b,#16a34a)",
    color: "white",
    border: "none",
    padding: "15px 20px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900",
    boxShadow: "0 14px 28px rgba(22,163,74,0.24)",
    display: "flex",
    alignItems: "center",
    gap: "9px"
  },

  buttonIcon: {
    fontSize: "18px"
  },

  resumeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "18px",
    marginBottom: "26px"
  },

  cardPrimary: {
    background:
      "linear-gradient(135deg,#064e3b,#16a34a)",
    borderRadius: "28px",
    padding: "24px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 18px 38px rgba(22,163,74,0.24)"
  },

  cardLabelLight: {
    margin: 0,
    color: "rgba(255,255,255,0.76)",
    fontSize: "14px"
  },

  cardNumberLight: {
    margin: "10px 0 2px",
    color: "white",
    fontSize: "42px"
  },

  cardHintLight: {
    color: "rgba(255,255,255,0.72)",
    fontSize: "13px"
  },

  cardIconLight: {
    width: "62px",
    height: "62px",
    borderRadius: "22px",
    background: "rgba(255,255,255,0.16)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "31px"
  },

  resumeCard: {
    background: "white",
    borderRadius: "28px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow: "0 14px 35px rgba(15,23,42,0.07)",
    border: "1px solid #eef2f7"
  },

  cardIconGreen: {
    width: "58px",
    height: "58px",
    borderRadius: "20px",
    background: "#dcfce7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px"
  },

  cardIconBlue: {
    width: "58px",
    height: "58px",
    borderRadius: "20px",
    background: "#dbeafe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px"
  },

  cardIconRed: {
    width: "58px",
    height: "58px",
    borderRadius: "20px",
    background: "#fee2e2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px"
  },

  resumeLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px"
  },

  resumeNumberGreen: {
    margin: "8px 0 0",
    color: "#166534",
    fontSize: "36px"
  },

  resumeNumberBlue: {
    margin: "8px 0 0",
    color: "#1d4ed8",
    fontSize: "36px"
  },

  resumeNumberRed: {
    margin: "8px 0 0",
    color: "#dc2626",
    fontSize: "36px"
  },

  premiumGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 330px",
    gap: "24px",
    alignItems: "flex-start"
  },

  apartmentsPanel: {
    background: "white",
    borderRadius: "34px",
    padding: "28px",
    boxShadow: "0 18px 55px rgba(15,23,42,0.08)",
    border: "1px solid #eef2f7"
  },

  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "24px"
  },

  sectionMini: {
    display: "inline-block",
    background: "#dcfce7",
    color: "#166534",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900",
    marginBottom: "10px"
  },

  sectionTitle: {
    margin: 0,
    color: "#052e16",
    fontSize: "26px"
  },

  sectionSubtitle: {
    margin: "7px 0 0",
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "1.5"
  },

  sectionBadge: {
    background: "#dcfce7",
    color: "#166534",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    whiteSpace: "nowrap"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(310px,1fr))",
    gap: "18px"
  },

  apCard: {
    position: "relative",
    overflow: "hidden",
    background: "linear-gradient(180deg,#ffffff,#f9fafb)",
    borderRadius: "28px",
    padding: "22px",
    boxShadow: "0 14px 35px rgba(15,23,42,0.06)"
  },

  cardGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "6px",
    background: "linear-gradient(135deg,#16a34a,#22c55e)"
  },

  apCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px"
  },

  apIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg,#dcfce7,#f0fdf4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    border: "1px solid #bbf7d0"
  },

  apIdentity: {
    marginBottom: "16px"
  },

  apLabel: {
    color: "#6b7280",
    fontSize: "12px",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: "1px"
  },

  apTitle: {
    margin: "6px 0 0",
    color: "#111827",
    fontSize: "22px"
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
    padding: "14px"
  },

  infoLabel: {
    display: "block",
    color: "#6b7280",
    fontSize: "12px",
    marginBottom: "6px"
  },

  statusBadge: {
    padding: "8px 12px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "12px"
  },

  integrationBox: {
    marginTop: "14px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "17px",
    padding: "13px",
    color: "#166534",
    fontSize: "13px"
  },

  cardFooter: {
    marginTop: "18px",
    display: "flex",
    gap: "10px"
  },

  editButton: {
    flex: 1,
    background: "#dbeafe",
    color: "#1d4ed8",
    border: "none",
    padding: "12px",
    borderRadius: "15px",
    cursor: "pointer",
    fontWeight: "900"
  },

  deleteButton: {
    flex: 1,
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    padding: "12px",
    borderRadius: "15px",
    cursor: "pointer",
    fontWeight: "900"
  },

  sidePanel: {
    display: "flex",
    flexDirection: "column",
    gap: "18px"
  },

  sideCardDark: {
    background:
      "radial-gradient(circle at top right,rgba(187,247,208,0.24),transparent 34%), linear-gradient(135deg,#052e16,#14532d)",
    color: "white",
    borderRadius: "30px",
    padding: "26px",
    boxShadow: "0 18px 45px rgba(20,83,45,0.22)"
  },

  sideBadge: {
    background: "rgba(255,255,255,0.14)",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  sideTitle: {
    margin: "18px 0 16px",
    fontSize: "24px"
  },

  progressCircle: {
    width: "150px",
    height: "150px",
    borderRadius: "50%",
    background:
      "conic-gradient(#22c55e 0deg, #22c55e 220deg, rgba(255,255,255,0.16) 220deg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "34px",
    fontWeight: "900",
    marginBottom: "18px",
    boxShadow: "inset 0 0 0 13px rgba(255,255,255,0.10)"
  },

  sideText: {
    color: "rgba(255,255,255,0.76)",
    lineHeight: "1.5",
    margin: 0
  },

  sideCard: {
    background: "white",
    border: "1px solid #eef2f7",
    borderRadius: "28px",
    padding: "24px",
    boxShadow: "0 14px 35px rgba(15,23,42,0.07)"
  },

  sideCardTitle: {
    margin: "0 0 14px",
    color: "#052e16"
  },

  sideEmpty: {
    color: "#6b7280",
    margin: 0
  },

  blockList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },

  blockItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "#f9fafb",
    border: "1px solid #eef2f7",
    borderRadius: "17px",
    padding: "13px"
  },

  blockIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "15px",
    background: "#dcfce7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  sideTextLight: {
    color: "#6b7280",
    lineHeight: "1.5",
    margin: 0
  },

  empty: {
    background: "#f9fafb",
    border: "1px dashed #d1d5db",
    borderRadius: "24px",
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

  modalBackground: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.62)",
    backdropFilter: "blur(8px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    padding: "20px",
    boxSizing: "border-box"
  },

  modal: {
    width: "620px",
    background: "#f8fafc",
    padding: "26px",
    borderRadius: "36px",
    boxShadow: "0 30px 80px rgba(0,0,0,0.28)",
    border: "1px solid rgba(255,255,255,0.55)"
  },

  modalHero: {
    background:
      "linear-gradient(135deg,#052e16,#166534)",
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

  modalSubtitle: {
    margin: 0,
    color: "rgba(255,255,255,0.75)",
    lineHeight: "1.5"
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

  formPanel: {
    background: "white",
    border: "1px solid #eef2f7",
    borderRadius: "26px",
    padding: "20px",
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

  modalButtons: {
    display: "flex",
    gap: "12px",
    marginTop: "18px"
  },

  saveButton: {
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

  cancelButton: {
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

export default Apartamentos;