import { useState } from "react";
import { registrarAuditoria } from "../../Services/auditoriaService";
import { criarNotificacao } from "../../Services/notificacaoService";

function Porteiros() {
  const STORAGE_KEY = "porteiros";
  const STORAGE_MOVIMENTACOES = "movimentacoes";
  const STORAGE_RELATORIOS = "relatorios_operacionais";

  const estadoInicialPorteiro = {
    nome: "",
    turno: "",
    telefone: "",
    usuario: "",
    senha: "",
    status: "Ativo",
    codigoPorteiro: "",
    ultimoLogin: null,
    ultimoLogout: null,
    ultimoPlantao: null,
    condominioId: null,
    nomeCondominio: ""
  };

  const [porteiros, setPorteiros] = useState(() => {
    const dados = localStorage.getItem(STORAGE_KEY);

    if (!dados) return [];

    const lista = JSON.parse(dados);

    return lista.map((porteiro, index) => ({
      ...porteiro,
      codigoPorteiro: porteiro.codigoPorteiro || gerarCodigoPorteiro(index + 1),
      status: porteiro.status || "Ativo",
      ultimoLogin: porteiro.ultimoLogin || null,
      ultimoLogout: porteiro.ultimoLogout || null,
      ultimoPlantao: porteiro.ultimoPlantao || null
    }));
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroTurno, setFiltroTurno] = useState("Todos");
  const [novoPorteiro, setNovoPorteiro] = useState(estadoInicialPorteiro);
  const [editId, setEditId] = useState(null);

  const porteirosFiltrados = porteiros.filter((p) => {
    const texto = busca.toLowerCase();

    const correspondeBusca =
      p.nome?.toLowerCase().includes(texto) ||
      p.turno?.toLowerCase().includes(texto) ||
      p.telefone?.toLowerCase().includes(texto) ||
      p.usuario?.toLowerCase().includes(texto) ||
      p.codigoPorteiro?.toLowerCase().includes(texto) ||
      p.status?.toLowerCase().includes(texto);

    const correspondeStatus =
      filtroStatus === "Todos" ||
      p.status === filtroStatus;

    const correspondeTurno =
      filtroTurno === "Todos" ||
      p.turno === filtroTurno;

    return correspondeBusca && correspondeStatus && correspondeTurno;
  });

  const totalAtivos = porteiros.filter(
    (p) => p.status === "Ativo"
  ).length;

  const totalInativos = porteiros.filter(
    (p) => p.status === "Inativo"
  ).length;

  const totalManha = porteiros.filter(
    (p) => p.turno === "Manhã"
  ).length;

  const totalTarde = porteiros.filter(
    (p) => p.turno === "Tarde"
  ).length;

  const totalNoite = porteiros.filter(
    (p) => p.turno === "Noite"
  ).length;

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

  function limparTelefone(valor) {
    return String(valor || "").replace(/\D/g, "");
  }

  function gerarCodigoPorteiro(numero) {
    return `P${String(numero).padStart(3, "0")}`;
  }

  function proximoCodigoPorteiro() {
    const numeros = porteiros
      .map((p) => Number(String(p.codigoPorteiro || "").replace(/\D/g, "")))
      .filter((n) => !isNaN(n));

    const proximo = numeros.length > 0 ? Math.max(...numeros) + 1 : porteiros.length + 1;

    return gerarCodigoPorteiro(proximo);
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

  function registrarMovimentacaoPorteiro(acao, porteiro) {
    const movimentacoes = lerStorage(STORAGE_MOVIMENTACOES);

    const nova = {
      id: Date.now(),
      tipo: "Porteiro",
      origem: "Síndico",
      titulo: `${acao}: ${porteiro?.nome || "Porteiro"}`,
      descricao: `${porteiro?.codigoPorteiro || "-"} • Turno ${porteiro?.turno || "-"}`,
      status: porteiro?.status || "",
      data: new Date().toLocaleDateString("pt-BR"),
      hora: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      }),
      criadoEm: new Date().toISOString()
    };

    salvarStorage(STORAGE_MOVIMENTACOES, [nova, ...movimentacoes]);

    const relatorios = lerStorage(STORAGE_RELATORIOS);
    salvarStorage(STORAGE_RELATORIOS, [nova, ...relatorios]);
  }

  function registrarAuditoriaPorteiro({
    acao,
    detalhes,
    antes = null,
    depois = null,
    referenciaId = null
  }) {
    registrarAuditoria({
      acao,
      modulo: "Porteiros",
      detalhes,
      antes,
      depois,
      referenciaId
    });
  }

  function criarNotificacaoPorteiro({
    titulo,
    mensagem,
    referenciaId = null,
    prioridade = "normal"
  }) {
    criarNotificacao({
      titulo,
      mensagem,
      tipo: "Porteiros",
      origem: "Porteiros",
      perfilDestino: "sindico",
      moduloOrigem: "Porteiros",
      referenciaId,
      prioridade
    });
  }

  function validarPorteiro() {
    const nome = String(novoPorteiro.nome || "").trim();
    const telefone = limparTelefone(novoPorteiro.telefone);
    const usuario = String(novoPorteiro.usuario || "").trim();
    const senha = String(novoPorteiro.senha || "").trim();

    if (nome.length < 3) {
      alert("Informe um nome válido com pelo menos 3 caracteres.");
      return false;
    }

    if (!novoPorteiro.turno) {
      alert("Selecione o turno do porteiro.");
      return false;
    }

    if (telefone.length < 10 || telefone.length > 11) {
      alert("Informe um telefone válido com DDD. Use apenas números.");
      return false;
    }

    if (usuario.length < 4) {
      alert("O usuário de login deve ter pelo menos 4 caracteres.");
      return false;
    }

    if (/\s/.test(usuario)) {
      alert("O usuário de login não pode conter espaços.");
      return false;
    }

    if (senha.length < 4) {
      alert("A senha deve ter pelo menos 4 caracteres.");
      return false;
    }

    if (!novoPorteiro.status) {
      alert("Selecione o status do porteiro.");
      return false;
    }

    return true;
  }


  function limparFormulario() {
    setNovoPorteiro(estadoInicialPorteiro);
    setEditId(null);
  }

  function salvarPorteiro() {
    if (!validarPorteiro()) {
      return;
    }

    const usuarioExistente = porteiros.find(
      (p) =>
        p.usuario?.trim().toLowerCase() ===
          novoPorteiro.usuario.trim().toLowerCase() &&
        p.id !== editId
    );

    if (usuarioExistente) {
      alert("Esse usuário já existe");
      return;
    }

    const perfilCondominio = obterPerfilCondominio();
    const usuarioAtual = obterUsuarioAtual();

    const porteiroFormatado = {
      ...novoPorteiro,
      nome: String(novoPorteiro.nome || "").trim(),
      turno: novoPorteiro.turno,
      telefone: limparTelefone(novoPorteiro.telefone),
      usuario: String(novoPorteiro.usuario || "").trim(),
      senha: String(novoPorteiro.senha || "").trim(),
      status: novoPorteiro.status || "Ativo",
      codigoPorteiro: novoPorteiro.codigoPorteiro || proximoCodigoPorteiro(),
      condominioId: perfilCondominio.condominioId,
      nomeCondominio: perfilCondominio.nomeCondominio,
      criadoPor: usuarioAtual.nome || usuarioAtual.usuario || "Administrador",
      atualizadoEm: new Date().toISOString()
    };

    let listaAtualizada = [];

    if (editId !== null) {
      const porteiroAntes = porteiros.find((p) => p.id === editId);

      listaAtualizada = porteiros.map((p) =>
        p.id === editId
          ? {
              ...p,
              ...porteiroFormatado,
              id: editId
            }
          : p
      );

      const porteiroDepois = listaAtualizada.find((p) => p.id === editId);

      registrarAuditoriaPorteiro({
        acao: "Editou porteiro",
        detalhes: `${porteiroFormatado.nome} - ${porteiroFormatado.codigoPorteiro}`,
        antes: porteiroAntes,
        depois: porteiroDepois,
        referenciaId: editId
      });

      criarNotificacaoPorteiro({
        titulo: "Porteiro atualizado",
        mensagem: `${porteiroFormatado.nome} teve o cadastro atualizado.`,
        referenciaId: editId
      });

      registrarMovimentacaoPorteiro("Editou porteiro", porteiroDepois);

      setEditId(null);
    } else {
      const novo = {
        id: Date.now(),
        ...porteiroFormatado,
        dataCadastro: new Date().toLocaleDateString("pt-BR"),
        criadoEm: new Date().toISOString()
      };

      listaAtualizada = [
        ...porteiros,
        novo
      ];

      registrarAuditoriaPorteiro({
        acao: "Cadastrou porteiro",
        detalhes: `${novo.nome} - ${novo.codigoPorteiro}`,
        depois: novo,
        referenciaId: novo.id
      });

      criarNotificacaoPorteiro({
        titulo: "Novo porteiro cadastrado",
        mensagem: `${novo.nome} foi cadastrado no turno ${novo.turno}.`,
        referenciaId: novo.id
      });

      registrarMovimentacaoPorteiro("Cadastrou porteiro", novo);
    }

    setPorteiros(listaAtualizada);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(listaAtualizada)
    );

    limparFormulario();
    setMostrarModal(false);
  }

  function editarPorteiro(porteiro) {
    setNovoPorteiro({
      ...estadoInicialPorteiro,
      ...porteiro
    });

    setEditId(porteiro.id);
    setMostrarModal(true);
  }

  function excluirPorteiro(id) {
    const confirmar = window.confirm(
      "Deseja excluir este porteiro?"
    );

    if (!confirmar) return;

    const porteiroExcluido = porteiros.find((p) => p.id === id);

    const lista = porteiros.filter(
      (p) => p.id !== id
    );

    setPorteiros(lista);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(lista)
    );

    registrarAuditoriaPorteiro({
      acao: "Excluiu porteiro",
      detalhes: `${porteiroExcluido?.nome || "Porteiro"} - ${porteiroExcluido?.codigoPorteiro || "-"}`,
      antes: porteiroExcluido,
      referenciaId: id
    });

    criarNotificacaoPorteiro({
      titulo: "Porteiro removido",
      mensagem: `${porteiroExcluido?.nome || "Um porteiro"} foi removido do cadastro.`,
      referenciaId: id,
      prioridade: "alta"
    });

    registrarMovimentacaoPorteiro("Excluiu porteiro", porteiroExcluido);
  }

  function fecharModal() {
    limparFormulario();
    setMostrarModal(false);
  }

  function obterStatus(status) {
    if (status === "Ativo") {
      return {
        background: "#dcfce7",
        color: "#166534",
        border: "#bbf7d0",
        label: "Operando"
      };
    }

    return {
      background: "#fee2e2",
      color: "#b91c1c",
      border: "#fecaca",
      label: "Bloqueado"
    };
  }

  function obterTurno(turno) {
    if (turno === "Manhã") {
      return {
        icon: "🌤️",
        background: "#ecfdf5",
        color: "#047857",
        border: "#a7f3d0"
      };
    }

    if (turno === "Tarde") {
      return {
        icon: "☀️",
        background: "#fef3c7",
        color: "#92400e",
        border: "#fde68a"
      };
    }

    if (turno === "Noite") {
      return {
        icon: "🌙",
        background: "#e0e7ff",
        color: "#3730a3",
        border: "#c7d2fe"
      };
    }

    return {
      icon: "🕒",
      background: "#f3f4f6",
      color: "#374151",
      border: "#e5e7eb"
    };
  }

  function iniciais(nome) {
    if (!nome) return "P";

    const partes = nome.trim().split(" ");

    if (partes.length === 1) {
      return partes[0].charAt(0).toUpperCase();
    }

    return `${partes[0].charAt(0)}${partes[partes.length - 1].charAt(0)}`.toUpperCase();
  }

  return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <div style={styles.heroLeft}>
          <span style={styles.heroBadge}>
            🛡️ Central operacional
          </span>

          <h1 style={styles.title}>
            Equipe de Portaria
          </h1>

          <p style={styles.subtitle}>
            Controle de operadores, turnos, credenciais e acesso ao painel da portaria.
          </p>
        </div>

        <div style={styles.heroRight}>
          <div style={styles.shiftBoard}>
            <div style={styles.shiftItem}>
              <span>🌤️</span>
              <strong>{totalManha}</strong>
              <small>manhã</small>
            </div>

            <div style={styles.shiftItem}>
              <span>☀️</span>
              <strong>{totalTarde}</strong>
              <small>tarde</small>
            </div>

            <div style={styles.shiftItem}>
              <span>🌙</span>
              <strong>{totalNoite}</strong>
              <small>noite</small>
            </div>
          </div>

          <button
            style={styles.heroButton}
            onClick={() => {
              limparFormulario();
              setMostrarModal(true);
            }}
          >
            + Novo operador
          </button>
        </div>
      </section>

      <section style={styles.controlStrip}>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>⌕</span>

          <input
            placeholder="Buscar por nome, turno, telefone ou usuário..."
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
          <option>Ativo</option>
          <option>Inativo</option>
        </select>

        <select
          value={filtroTurno}
          onChange={(e) => setFiltroTurno(e.target.value)}
          style={styles.filter}
        >
          <option>Todos</option>
          <option>Manhã</option>
          <option>Tarde</option>
          <option>Noite</option>
        </select>

        <div style={styles.compactStats}>
          <span>
            <b>{porteiros.length}</b> operadores
          </span>

          <span>
            <b>{totalAtivos}</b> ativos
          </span>

          <span>
            <b>{totalInativos}</b> inativos
          </span>
        </div>
      </section>

      <section style={styles.operatorPanel}>
        <div style={styles.panelHeader}>
          <div>
            <span style={styles.panelLabel}>
              Operadores cadastrados
            </span>

            <h2 style={styles.panelTitle}>
              Escala da portaria
            </h2>
          </div>

          <span style={styles.resultBadge}>
            {porteirosFiltrados.length} resultado(s)
          </span>
        </div>

        {porteirosFiltrados.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              🛡️
            </div>

            <h3 style={styles.emptyTitle}>
              Nenhum porteiro encontrado
            </h3>

            <p style={styles.emptyText}>
              Cadastre operadores para liberar acesso ao painel da portaria.
            </p>

            <button
              style={styles.emptyButton}
              onClick={() => {
                limparFormulario();
                setMostrarModal(true);
              }}
            >
              Cadastrar operador
            </button>
          </div>
        ) : (
          <div style={styles.operatorGrid}>
            {porteirosFiltrados.map((p) => {
              const status = obterStatus(p.status);
              const turno = obterTurno(p.turno);

              return (
                <article
                  key={p.id}
                  style={{
                    ...styles.operatorCard,
                    borderColor: status.border
                  }}
                >
                  <div style={styles.operatorHeader}>
                    <div style={styles.operatorAvatar}>
                      {iniciais(p.nome)}
                    </div>

                    <div style={styles.operatorIdentity}>
                      <h3 style={styles.operatorName}>
                        {p.nome}
                      </h3>

                      <p style={styles.operatorUser}>
                        @{p.usuario} • {p.codigoPorteiro || "P---"}
                      </p>
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

                  <div
                    style={{
                      ...styles.shiftBadge,
                      background: turno.background,
                      color: turno.color,
                      border: `1px solid ${turno.border}`
                    }}
                  >
                    <span>{turno.icon}</span>
                    <strong>Turno {p.turno || "-"}</strong>
                  </div>

                  <div style={styles.operatorData}>
                    <div style={styles.dataItem}>
                      <span>Código</span>
                      <strong>{p.codigoPorteiro || "P---"}</strong>
                    </div>

                    <div style={styles.dataItem}>
                      <span>Telefone</span>
                      <strong>{p.telefone || "-"}</strong>
                    </div>

                    <div style={styles.dataItem}>
                      <span>Usuário</span>
                      <strong>{p.usuario || "-"}</strong>
                    </div>

                    <div style={styles.dataItem}>
                      <span>Último acesso</span>
                      <strong>{p.ultimoLogin || "Ainda sem acesso"}</strong>
                    </div>
                  </div>

                  <div style={styles.operatorFooter}>
                    <button
                      style={styles.editButton}
                      onClick={() => editarPorteiro(p)}
                    >
                      Editar
                    </button>

                    <button
                      style={styles.deleteButton}
                      onClick={() => excluirPorteiro(p.id)}
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
                  {editId !== null ? "Editar operador" : "Novo operador"}
                </span>

                <h2 style={styles.modalTitle}>
                  {editId !== null
                    ? "Editar porteiro"
                    : "Cadastrar porteiro"}
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
                Dados do operador
              </h3>

              <div style={styles.formGrid}>
                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Nome completo
                  </label>

                  <input
                    minLength="3"
                    placeholder="Ex: Carlos Henrique"
                    value={novoPorteiro.nome}
                    onChange={(e) =>
                      setNovoPorteiro({
                        ...novoPorteiro,
                        nome: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Turno
                  </label>

                  <select
                    value={novoPorteiro.turno}
                    onChange={(e) =>
                      setNovoPorteiro({
                        ...novoPorteiro,
                        turno: e.target.value
                      })
                    }
                    style={styles.input}
                  >
                    <option value="">
                      Escolha o turno
                    </option>

                    <option>Manhã</option>
                    <option>Tarde</option>
                    <option>Noite</option>
                  </select>
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Telefone
                  </label>

                  <input
                    inputMode="numeric"
                    maxLength="11"
                    placeholder="Ex: 81999999999"
                    value={novoPorteiro.telefone}
                    onChange={(e) =>
                      setNovoPorteiro({
                        ...novoPorteiro,
                        telefone: limparTelefone(e.target.value)
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
                    value={novoPorteiro.status}
                    onChange={(e) =>
                      setNovoPorteiro({
                        ...novoPorteiro,
                        status: e.target.value
                      })
                    }
                    style={styles.input}
                  >
                    <option>Ativo</option>
                    <option>Inativo</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={styles.modalSection}>
              <h3 style={styles.modalSectionTitle}>
                Credenciais de acesso
              </h3>

              <div style={styles.formGrid}>
                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Usuário de login
                  </label>

                  <input
                    minLength="4"
                    placeholder="Ex: porteiro01"
                    value={novoPorteiro.usuario}
                    onChange={(e) =>
                      setNovoPorteiro({
                        ...novoPorteiro,
                        usuario: e.target.value.replace(/\s/g, "")
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Senha
                  </label>

                  <input
                    type="password"
                    minLength="4"
                    placeholder="Senha de acesso"
                    value={novoPorteiro.senha}
                    onChange={(e) =>
                      setNovoPorteiro({
                        ...novoPorteiro,
                        senha: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            <div style={styles.modalButtons}>
              <button
                style={styles.saveBtn}
                onClick={salvarPorteiro}
              >
                Salvar operador
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

  shiftBoard: {
    display: "flex",
    gap: "10px",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    padding: "12px",
    borderRadius: "24px"
  },

  shiftItem: {
    width: "78px",
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

  operatorPanel: {
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

  operatorGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))",
    gap: "18px"
  },

  operatorCard: {
    background: "linear-gradient(180deg,#ffffff,#f8fafc)",
    borderRadius: "30px",
    padding: "22px",
    boxShadow: "0 15px 38px rgba(15,23,42,0.06)",
    border: "1px solid #eef2f7"
  },

  operatorHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "18px"
  },

  operatorAvatar: {
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

  operatorIdentity: {
    flex: 1
  },

  operatorName: {
    margin: 0,
    color: "#111827",
    fontSize: "21px"
  },

  operatorUser: {
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

  shiftBadge: {
    borderRadius: "18px",
    padding: "13px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "14px"
  },

  operatorData: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px"
  },

  dataItem: {
    background: "white",
    border: "1px solid #eef2f7",
    borderRadius: "17px",
    padding: "13px"
  },

  operatorFooter: {
    display: "flex",
    gap: "10px",
    marginTop: "18px"
  },

  editButton: {
    flex: 1,
    background: "#dcfce7",
    color: "#166534",
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
    width: "760px",
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

export default Porteiros;