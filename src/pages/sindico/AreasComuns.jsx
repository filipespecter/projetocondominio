import { useState } from "react";
import { registrarAuditoria } from "../../Services/auditoriaService";
import { criarNotificacao } from "../../Services/notificacaoService";

function AreasComuns() {
  const STORAGE_KEY = "areasComuns";
  const STORAGE_MOVIMENTACOES = "movimentacoes";
  const STORAGE_RELATORIOS = "relatorios_operacionais";
  const STORAGE_AVISOS_SINDICO = "avisos_sindico";

  const estadoInicialArea = {
    nome: "",
    capacidade: "",
    horario: "",
    status: "Disponível",
    condominioId: null,
    nomeCondominio: "",
    criadoPor: ""
  };

  const [areas, setAreas] = useState(() => {
    const dados = localStorage.getItem(STORAGE_KEY);

    if (!dados) return [];

    const lista = JSON.parse(dados);

    return lista.map((area) => ({
      ...area,
      capacidade: area.capacidade || "",
      status: area.status || "Disponível"
    }));
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [novaArea, setNovaArea] = useState(estadoInicialArea);
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

  function limparCapacidade(valor) {
    return String(valor || "").replace(/\D/g, "");
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
        {}
      );
    } catch {
      return {};
    }
  }

  function registrarAuditoriaArea({
    acao,
    detalhes,
    antes = null,
    depois = null,
    referenciaId = null
  }) {
    registrarAuditoria({
      acao,
      modulo: "Áreas Comuns",
      detalhes,
      antes,
      depois,
      referenciaId
    });
  }

  function criarNotificacaoArea({
    titulo,
    mensagem,
    referenciaId = null,
    prioridade = "normal"
  }) {
    criarNotificacao({
      titulo,
      mensagem,
      tipo: "Áreas Comuns",
      origem: "Áreas Comuns",
      perfilDestino: "sindico",
      moduloOrigem: "AreasComuns",
      referenciaId,
      prioridade
    });
  }

  function validarArea() {
    const nome = String(novaArea.nome || "").trim();
    const horario = String(novaArea.horario || "").trim();
    const capacidade = String(novaArea.capacidade || "").trim();

    if (nome.length < 3) {
      alert("Informe um nome válido para a área comum.");
      return false;
    }

    if (capacidade && limparCapacidade(capacidade).length === 0) {
      alert("A capacidade deve conter apenas números ou ficar em branco.");
      return false;
    }

    if (!horario) {
      alert("Informe o horário de funcionamento.");
      return false;
    }

    if (!novaArea.status) {
      alert("Selecione o status da área.");
      return false;
    }

    return true;
  }

  function registrarMovimentacao(acao, area) {
    const movimentacoes = lerStorage(STORAGE_MOVIMENTACOES);

    const nova = {
      id: Date.now(),
      tipo: "Área Comum",
      acao,
      origem: "Síndico",
      titulo: area.nome,
      areaId: area.id,
      status: area.status,
      descricao: `Área comum ${area.nome} - ${acao}`,
      data: new Date().toLocaleDateString("pt-BR"),
      hora: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      }),
      timestamp: Date.now(),
      impactaBI: true,
      origemModulo: "AreasComuns"
    };

    salvarStorage(STORAGE_MOVIMENTACOES, [nova, ...movimentacoes]);
  }

  function registrarRelatorio(acao, area) {
    const relatorios = lerStorage(STORAGE_RELATORIOS);

    const novo = {
      id: Date.now() + 1,
      tipo: "Área Comum",
      acao,
      origem: "Síndico",
      titulo: area.nome,
      areaId: area.id,
      nome: area.nome,
      capacidade: area.capacidade,
      horario: area.horario,
      status: area.status,
      data: new Date().toLocaleDateString("pt-BR"),
      hora: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      }),
      impactaRelatorio: true,
      origemModulo: "AreasComuns"
    };

    salvarStorage(STORAGE_RELATORIOS, [novo, ...relatorios]);
  }

  function registrarAvisoSindico(acao, area) {
    const avisos = lerStorage(STORAGE_AVISOS_SINDICO);

    const novo = {
      id: Date.now() + 2,
      categoria: "Aviso",
      origem: "Síndico",
      titulo: `Área comum ${acao} - ${area.nome}`,
      descricao: `A área ${area.nome} foi ${acao}. Status atual: ${area.status}.`,
      apartamento: "",
      morador: "",
      responsavel: "Síndico",
      status: "Novo",
      respostaSindico: "",
      cienciaSindico: true,
      data: new Date().toLocaleDateString("pt-BR"),
      areaId: area.id,
      impactaBI: true,
      impactaRelatorio: true,
      exibirNaCentral: true,
      origemModulo: "AreasComuns"
    };

    salvarStorage(STORAGE_AVISOS_SINDICO, [novo, ...avisos]);
  }

  function registrarFluxo(acao, area, antes = null) {
    registrarMovimentacao(acao, area);
    registrarRelatorio(acao, area);

    registrarAuditoriaArea({
      acao: `Área comum - ${acao}`,
      detalhes: `${area.nome} • Status: ${area.status}`,
      antes,
      depois: area,
      referenciaId: area.id
    });

    if (
      acao === "status alterado para Manutenção" ||
      acao === "status alterado para Disponível"
    ) {
      criarNotificacaoArea({
        titulo:
          acao === "status alterado para Manutenção"
            ? "Área em manutenção"
            : "Área liberada",
        mensagem: `${area.nome} agora está com status ${area.status}.`,
        referenciaId: area.id,
        prioridade:
          acao === "status alterado para Manutenção" ? "alta" : "normal"
      });
    }
  }

  const areasFiltradas = areas.filter((area) => {
    const texto = busca.toLowerCase();

    const correspondeBusca =
      area.nome?.toLowerCase().includes(texto) ||
      area.capacidade?.toLowerCase().includes(texto) ||
      area.horario?.toLowerCase().includes(texto) ||
      area.status?.toLowerCase().includes(texto);

    const correspondeStatus =
      filtroStatus === "Todos" ||
      area.status === filtroStatus;

    return correspondeBusca && correspondeStatus;
  });

  const disponiveis = areas.filter(
    (area) => area.status === "Disponível"
  );

  const ocupadas = areas.filter(
    (area) => area.status === "Ocupado"
  );

  const manutencao = areas.filter(
    (area) => area.status === "Manutenção"
  );

  function salvarArea() {
    if (!validarArea()) {
      return;
    }

    const areaExiste = areas.find(
      (area) =>
        area.nome?.toLowerCase() === novaArea.nome.toLowerCase() &&
        area.id !== editId
    );

    if (areaExiste) {
      alert("Essa área já existe");
      return;
    }

    const perfilCondominio = obterPerfilCondominio();
    const usuarioAtual = obterUsuarioAtual();

    const areaFormatada = {
      ...novaArea,
      nome: String(novaArea.nome || "").trim(),
      capacidade: limparCapacidade(novaArea.capacidade),
      horario: String(novaArea.horario || "").trim(),
      status: novaArea.status || "Disponível",
      condominioId: perfilCondominio.condominioId,
      nomeCondominio: perfilCondominio.nomeCondominio,
      criadoPor: usuarioAtual.nome || usuarioAtual.usuario || "Administrador"
    };

    let listaAtualizada = [];
    let areaFinal = null;

    if (editId !== null) {
      const areaAntes = areas.find((area) => area.id === editId);

      areaFinal = {
        ...areaFormatada,
        id: editId,
        impactaBI: true,
        impactaRelatorio: true,
        origemModulo: "AreasComuns",
        atualizadoEm: new Date().toLocaleString("pt-BR"),
        atualizadoEmISO: new Date().toISOString()
      };

      listaAtualizada = areas.map((area) =>
        area.id === editId ? areaFinal : area
      );

      registrarFluxo("editada", areaFinal, areaAntes);
      setEditId(null);
    } else {
      areaFinal = {
        id: Date.now(),
        ...areaFormatada,
        reservasAtivas: 0,
        impactaBI: true,
        impactaRelatorio: true,
        origemModulo: "AreasComuns",
        criadoEm: new Date().toLocaleString("pt-BR"),
        criadoEmISO: new Date().toISOString()
      };

      listaAtualizada = [
        areaFinal,
        ...areas
      ];

      registrarFluxo("cadastrada", areaFinal);
    }

    setAreas(listaAtualizada);
    salvarStorage(STORAGE_KEY, listaAtualizada);

    setNovaArea(estadoInicialArea);
    setMostrarModal(false);
  }

  function editarArea(area) {
    setNovaArea({
      ...estadoInicialArea,
      ...area
    });

    setEditId(area.id);
    setMostrarModal(true);
  }

  function excluirArea(id) {
    const confirmar = window.confirm(
      "Deseja excluir essa área?"
    );

    if (!confirmar) return;

    const areaExcluida = areas.find((area) => area.id === id);

    const listaAtualizada = areas.filter(
      (area) => area.id !== id
    );

    setAreas(listaAtualizada);
    salvarStorage(STORAGE_KEY, listaAtualizada);

    if (areaExcluida) {
      registrarFluxo("excluída", areaExcluida, areaExcluida);
    }
  }

  function alterarStatus(id, status) {
    let areaAtualizada = null;
    const areaAntes = areas.find((area) => area.id === id);

    const listaAtualizada = areas.map((area) => {
      if (area.id !== id) return area;

      areaAtualizada = {
        ...area,
        status,
        impactaBI: true,
        impactaRelatorio: true,
        origemModulo: "AreasComuns",
        atualizadoEm: new Date().toLocaleString("pt-BR")
      };

      return areaAtualizada;
    });

    setAreas(listaAtualizada);
    salvarStorage(STORAGE_KEY, listaAtualizada);

    if (areaAtualizada) {
      registrarFluxo(`status alterado para ${status}`, areaAtualizada, areaAntes);
    }
  }

  function fecharModal() {
    setMostrarModal(false);
    setEditId(null);
    setNovaArea(estadoInicialArea);
  }

  function corStatus(status) {
    switch (status) {
      case "Disponível":
        return {
          background: "#dcfce7",
          color: "#166534",
          border: "#bbf7d0",
          label: "Disponível"
        };

      case "Ocupado":
        return {
          background: "#fef3c7",
          color: "#92400e",
          border: "#fde68a",
          label: "Ocupado"
        };

      case "Manutenção":
        return {
          background: "#fee2e2",
          color: "#b91c1c",
          border: "#fecaca",
          label: "Manutenção"
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

    return "🏢";
  }
    return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <div style={styles.heroLeft}>
          <span style={styles.heroBadge}>
            🏢 Centro de estruturas
          </span>

          <h1 style={styles.title}>
            Áreas Comuns
          </h1>

          <p style={styles.subtitle}>
            Catálogo operacional dos espaços do condomínio para reservas,
            manutenção e controle administrativo.
          </p>
        </div>

        <div style={styles.heroRight}>
          <div style={styles.structureBoard}>
            <div style={styles.structureItem}>
              <span>✅</span>
              <strong>{disponiveis.length}</strong>
              <small>disponíveis</small>
            </div>

            <div style={styles.structureItem}>
              <span>🟡</span>
              <strong>{ocupadas.length}</strong>
              <small>ocupadas</small>
            </div>

            <div style={styles.structureItem}>
              <span>🛠️</span>
              <strong>{manutencao.length}</strong>
              <small>manutenção</small>
            </div>
          </div>

          <button
            style={styles.heroButton}
            onClick={() => {
              setEditId(null);
              setNovaArea(estadoInicialArea);
              setMostrarModal(true);
            }}
          >
            + Nova área
          </button>
        </div>
      </section>

      <section style={styles.controlStrip}>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>⌕</span>

          <input
            placeholder="Buscar por área, capacidade, horário ou status..."
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
          <option>Disponível</option>
          <option>Ocupado</option>
          <option>Manutenção</option>
        </select>

        <div style={styles.compactStats}>
          <span>
            <b>{areas.length}</b> áreas
          </span>

          <span>
            <b>{disponiveis.length}</b> disponíveis
          </span>

          <span>
            <b>{manutencao.length}</b> manutenção
          </span>
        </div>
      </section>

      <section style={styles.catalogPanel}>
        <div style={styles.panelHeader}>
          <div>
            <span style={styles.panelLabel}>
              Catálogo
            </span>

            <h2 style={styles.panelTitle}>
              Estruturas cadastradas
            </h2>
          </div>

          <span style={styles.resultBadge}>
            {areasFiltradas.length} resultado(s)
          </span>
        </div>

        {areasFiltradas.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              🏢
            </div>

            <h3 style={styles.emptyTitle}>
              Nenhuma área comum encontrada
            </h3>

            <p style={styles.emptyText}>
              Cadastre espaços como piscina, salão, churrasqueira,
              quadra ou academia para liberar uso nas reservas.
            </p>

            <button
              style={styles.emptyButton}
              onClick={() => {
                setEditId(null);
                setNovaArea(estadoInicialArea);
                setMostrarModal(true);
              }}
            >
              Cadastrar área
            </button>
          </div>
        ) : (
          <div style={styles.areaGrid}>
            {areasFiltradas.map((area) => {
              const status = corStatus(area.status);

              return (
                <article
                  key={area.id}
                  style={{
                    ...styles.areaCard,
                    borderColor: status.border
                  }}
                >
                  <div style={styles.cardCover}>
                    <div style={styles.areaIcon}>
                      {iconeArea(area.nome)}
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

                  <div style={styles.areaBody}>
                    <h3 style={styles.areaName}>
                      {area.nome}
                    </h3>

                    <div style={styles.infoGrid}>
                      <div style={styles.infoItem}>
                        <span>Capacidade</span>
                        <strong>{area.capacidade || "Opcional"}</strong>
                      </div>

                      <div style={styles.infoItem}>
                        <span>Funcionamento</span>
                        <strong>{area.horario}</strong>
                      </div>
                    </div>

                    <div style={styles.integrationBox}>
                      <span>🔗 Reservas</span>
                      <p>
                        Essa área pode ser usada nos módulos de reservas do síndico e morador.
                      </p>
                    </div>

                    <div style={styles.actionRow}>
                      {area.status !== "Disponível" && (
                        <button
                          style={styles.availableButton}
                          onClick={() => alterarStatus(area.id, "Disponível")}
                        >
                          Liberar
                        </button>
                      )}

                      {area.status !== "Manutenção" && (
                        <button
                          style={styles.maintenanceButton}
                          onClick={() => alterarStatus(area.id, "Manutenção")}
                        >
                          Manutenção
                        </button>
                      )}

                      <button
                        style={styles.editButton}
                        onClick={() => editarArea(area)}
                      >
                        Editar
                      </button>

                      <button
                        style={styles.deleteButton}
                        onClick={() => excluirArea(area.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {mostrarModal && (
        <div style={styles.modalBackground}>
          <div style={styles.modal}>
            <div style={styles.modalTop}>
              <div>
                <span style={styles.modalBadge}>
                  {editId !== null ? "Editar estrutura" : "Nova estrutura"}
                </span>

                <h2 style={styles.modalTitle}>
                  {editId !== null
                    ? "Editar área comum"
                    : "Cadastrar área comum"}
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
                Dados da área
              </h3>

              <div style={styles.formGrid}>
                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Nome da área
                  </label>

                  <input
                    minLength="3"
                    placeholder="Ex: Piscina, Salão de Festas..."
                    value={novaArea.nome}
                    onChange={(e) =>
                      setNovaArea({
                        ...novaArea,
                        nome: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Capacidade
                  </label>

                  <input
                    inputMode="numeric"
                    placeholder="Opcional. Ex: 50"
                    value={novaArea.capacidade}
                    onChange={(e) =>
                      setNovaArea({
                        ...novaArea,
                        capacidade: limparCapacidade(e.target.value)
                      })
                    }
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            <div style={styles.modalSection}>
              <h3 style={styles.modalSectionTitle}>
                Funcionamento
              </h3>

              <div style={styles.formGrid}>
                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Horário
                  </label>

                  <input
                    placeholder="Ex: 08:00 às 22:00"
                    value={novaArea.horario}
                    onChange={(e) =>
                      setNovaArea({
                        ...novaArea,
                        horario: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Status
                  </label>

                  <select
                    value={novaArea.status}
                    onChange={(e) =>
                      setNovaArea({
                        ...novaArea,
                        status: e.target.value
                      })
                    }
                    style={styles.input}
                  >
                    <option>Disponível</option>
                    <option>Ocupado</option>
                    <option>Manutenção</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={styles.modalButtons}>
              <button
                style={styles.saveButton}
                onClick={salvarArea}
              >
                Salvar área
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

  structureBoard: {
    display: "flex",
    gap: "10px",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    padding: "12px",
    borderRadius: "24px"
  },

  structureItem: {
    width: "88px",
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

  catalogPanel: {
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

  areaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))",
    gap: "18px"
  },

  areaCard: {
    background: "linear-gradient(180deg,#ffffff,#f8fafc)",
    borderRadius: "30px",
    overflow: "hidden",
    boxShadow: "0 15px 38px rgba(15,23,42,0.06)",
    border: "1px solid #eef2f7"
  },

  cardCover: {
    height: "130px",
    background:
      "radial-gradient(circle at top right,rgba(187,247,208,0.60),transparent 34%), linear-gradient(135deg,#052e16,#166534)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: "20px"
  },

  areaIcon: {
    width: "72px",
    height: "72px",
    borderRadius: "26px",
    background: "rgba(255,255,255,0.16)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "36px",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)"
  },

  statusBadge: {
    padding: "7px 11px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "12px",
    whiteSpace: "nowrap"
  },

  areaBody: {
    padding: "22px"
  },

  areaName: {
    margin: "0 0 16px",
    color: "#111827",
    fontSize: "23px"
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

  integrationBox: {
    marginTop: "12px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
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

  availableButton: {
    background: "#dcfce7",
    color: "#166534",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  maintenanceButton: {
    background: "#fef3c7",
    color: "#92400e",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  editButton: {
    background: "#dbeafe",
    color: "#1d4ed8",
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

  modalBackground: {
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
    width: "720px",
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

export default AreasComuns;