import { confirmDialog } from "../../components/GlobalDialogs.jsx";
import { useEffect, useState } from "react";
import apartmentApi from "../../Services/apartmentApi";
import residentApi from "../../Services/residentApi";

function limparTelefone(valor) {
  return String(valor ?? "")
    .replace(/\D/g, "")
    .slice(0, 11);
}

function Moradores() {
  const estadoInicialMorador = {
    id: null, nome: "", apto: "", apartamento: "", telefone: "", documento: "", email: "",
    usuario: "", senha: "", status: "Ativo", tipoMorador: "Proprietário",
    moradorPrincipal: false, perfilMorador: "principal", apartamentoId: null,
    permissoesMorador: { podeReservar: true, podeAbrirSugestao: true, podeVisualizarEncomendas: true }
  };

  const [moradores, setMoradores] = useState([]);
  const [apartamentos, setApartamentos] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [novoMorador, setNovoMorador] = useState(estadoInicialMorador);
  const [editId, setEditId] = useState(null);

  const typeFront = { OWNER:"Proprietário", TENANT:"Inquilino", DEPENDENT:"Dependente", OTHER:"Outro" };
  const typeBack = { "Proprietário":"OWNER", "Inquilino":"TENANT", "Dependente":"DEPENDENT", "Cônjuge":"DEPENDENT", "Outro":"OTHER" };
  const statusFront = { ACTIVE:"Ativo", INACTIVE:"Inativo", BLOCKED:"Bloqueado", PENDING:"Pendente" };
  const statusBack = { "Ativo":"ACTIVE", "Inativo":"INACTIVE", "Bloqueado":"BLOCKED", "Pendente":"PENDING" };

  function mapApartment(ap) {
    return { ...ap, bloco: ap.block ?? "", numero: ap.number ?? "", andar: String(ap.floor ?? "") };
  }

  function mapResident(r) {
    const user = r.user ?? r;
    const number = r.apartment?.number ?? r.apartmentNumber ?? "";
    return {
      ...r,
      nome: user.name ?? r.name ?? "",
      usuario: user.username ?? r.username ?? "",
      email: user.email ?? r.email ?? "",
      telefone: user.phone ?? r.phone ?? "",
      documento: user.document ?? r.document ?? "",
      apto: number,
      apartamento: number,
      apartamentoId: r.apartmentId ?? r.apartment?.id ?? null,
      tipoMorador: typeFront[r.residentType] ?? r.residentType ?? "Proprietário",
      moradorPrincipal: Boolean(r.isPrimary),
      perfilMorador: r.isPrimary ? "principal" : "dependente",
      permissoesMorador: {
        podeReservar: r.canReserve !== false,
        podeAbrirSugestao: r.canOpenOccurrence !== false,
        podeVisualizarEncomendas: r.canViewPackages !== false
      },
      status: statusFront[user.status ?? r.status] ?? user.status ?? r.status ?? "Ativo"
    };
  }

  async function carregar() {
    try {
      const [residents, aps] = await Promise.all([residentApi.list(), apartmentApi.list()]);
      setMoradores((residents ?? []).map(mapResident));
      setApartamentos((aps ?? []).map(mapApartment));
    } catch (error) {
      alert(error?.message ?? "Não foi possível carregar moradores.");
    }
  }

  useEffect(() => { carregar(); }, []);

  const moradoresFiltrados = moradores.filter((morador) => {
    const texto = busca.toLowerCase();
    const correspondeBusca =
      morador.nome?.toLowerCase().includes(texto) ||
      morador.apto?.toLowerCase().includes(texto) ||
      morador.telefone?.toLowerCase().includes(texto) ||
      morador.documento?.toLowerCase().includes(texto) ||
      morador.email?.toLowerCase().includes(texto) ||
      morador.usuario?.toLowerCase().includes(texto) ||
      morador.tipoMorador?.toLowerCase().includes(texto) ||
      morador.status?.toLowerCase().includes(texto);
    return correspondeBusca && (filtroStatus === "Todos" || morador.status === filtroStatus);
  });

  const totalAtivos = moradores.filter((m) => m.status === "Ativo").length;
  const totalInativos = moradores.filter((m) => m.status === "Inativo").length;
  const totalBloqueados = moradores.filter((m) => m.status === "Bloqueado").length;
  const totalPrincipais = moradores.filter((m) => m.moradorPrincipal).length;
  const totalDependentes = moradores.filter((m) => !m.moradorPrincipal).length;
  const apartamentosVinculados = new Set(moradores.map((m) => m.apartamentoId).filter(Boolean)).size;

  const apartamentosDisponiveisParaSelect = apartamentos.map((ap) => ({
    id: ap.id, label: `Bloco ${ap.bloco} - Apto ${ap.numero}`, value: ap.numero,
    bloco: ap.bloco, numero: ap.numero
  }));

  function selecionarApartamento(valor) {
    const ap = apartamentos.find((a) => String(a.numero) === String(valor) || String(a.id) === String(valor));
    setNovoMorador((prev) => ({ ...prev, apto: ap?.numero ?? valor, apartamento: ap?.numero ?? valor, apartamentoId: ap?.id ?? null }));
  }

  function validarMorador() {
    if (!novoMorador.nome.trim() || !novoMorador.usuario.trim() || !novoMorador.apartamentoId) {
      alert("Preencha nome, usuário e apartamento.");
      return false;
    }
    if (!editId && String(novoMorador.senha || "").length < 8) {
      alert("A senha inicial deve possuir pelo menos 8 caracteres.");
      return false;
    }
    return true;
  }

  async function salvarMorador() {
    if (!validarMorador()) return;
    const payload = {
      apartmentId: novoMorador.apartamentoId,
      name: novoMorador.nome.trim(),
      username: novoMorador.usuario.trim(),
      email: novoMorador.email?.trim() || null,
      phone: novoMorador.telefone?.trim() || null,
      document: novoMorador.documento?.trim() || null,
      residentType: typeBack[novoMorador.tipoMorador] ?? "OWNER",
      isPrimary: Boolean(novoMorador.moradorPrincipal),
      canReserve: novoMorador.permissoesMorador?.podeReservar !== false,
      canOpenOccurrence: novoMorador.permissoesMorador?.podeAbrirSugestao !== false,
      canViewPackages: novoMorador.permissoesMorador?.podeVisualizarEncomendas !== false,
      status: statusBack[novoMorador.status] ?? "ACTIVE"
    };
    try {
      if (editId) await residentApi.update(editId, payload);
      else await residentApi.create({ ...payload, password: novoMorador.senha, mustChangePassword: true });
      await carregar();
      fecharModal();
    } catch (error) {
      alert(error?.message ?? "Erro ao salvar morador.");
    }
  }

  async function excluirMorador(id) {
    if (!await confirmDialog("Deseja realmente excluir este morador?")) return;
    try { await residentApi.remove(id); await carregar(); }
    catch (error) { alert(error?.message ?? "Não foi possível excluir o morador."); }
  }

  function editarMorador(morador) {
    setEditId(morador.id);
    setNovoMorador({ ...estadoInicialMorador, ...morador, senha: "" });
    setMostrarModal(true);
  }

  function fecharModal() {
    setMostrarModal(false);
    setEditId(null);
    setNovoMorador(estadoInicialMorador);
  }

  function corStatus(status) {
    if (status === "Ativo") {
      return {
        background: "var(--ic-primary-soft)",
        color: "var(--ic-primary)",
        border: "var(--ic-primary-border-soft)"
      };
    }

    if (status === "Bloqueado") {
      return {
        background: "#fef3c7",
        color: "#92400e",
        border: "#fde68a"
      };
    }

    return {
      background: "#fee2e2",
      color: "#b91c1c",
      border: "#fecaca"
    };
  }

  return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <div style={styles.heroLeft}>
          <span style={styles.heroBadge}>
            Diretório residencial
          </span>

          <h1 style={styles.title}>
            Moradores
          </h1>

          <p style={styles.subtitle}>
            Central de cadastro, acesso e vínculo residencial dos moradores.
          </p>
        </div>

        <div style={styles.heroRight}>
          <div style={styles.heroCounter}>
            <strong>{moradores.length}</strong>
            <span>moradores</span>
          </div>

          <button
            style={styles.heroButton}
            onClick={() => {
              setEditId(null);
              setNovoMorador(estadoInicialMorador);
              setMostrarModal(true);
            }}
          >
            + Novo morador
          </button>
        </div>
      </section>

      <section style={styles.toolbar}>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>⌕</span>

          <input
            placeholder="Buscar por nome, apartamento, telefone, e-mail, usuário ou tipo..."
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
          <option>Bloqueado</option>
        </select>

        <div style={styles.inlineNumbers}>
          <span>
            <b>{totalAtivos}</b> ativos
          </span>

          <span>
            <b>{totalInativos}</b> inativos
          </span>

          <span>
            <b>{totalBloqueados}</b> bloqueados
          </span>

          <span>
            <b>{apartamentosVinculados}</b> aptos
          </span>

          <span>
            <b>{totalPrincipais}</b> principais
          </span>

          <span>
            <b>{totalDependentes}</b> dependentes
          </span>
        </div>
      </section>

      <section style={styles.registry}>
        <div style={styles.registryHeader}>
          <div>
            <span style={styles.registryLabel}>
              Cadastro geral
            </span>

            <h2 style={styles.registryTitle}>
              Lista de moradores
            </h2>
          </div>

          <span style={styles.resultBadge}>
            {moradoresFiltrados.length} resultado(s)
          </span>
        </div>

        {moradoresFiltrados.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              👥
            </div>

            <h3 style={styles.emptyTitle}>
              Nenhum morador encontrado
            </h3>

            <p style={styles.emptyText}>
              Cadastre moradores para liberar acesso ao portal e integrar com reservas, encomendas e portaria.
            </p>

            <button
              style={styles.emptyButton}
              onClick={() => {
                setEditId(null);
                setNovoMorador(estadoInicialMorador);
                setMostrarModal(true);
              }}
            >
              Cadastrar morador
            </button>
          </div>
        ) : (
          <div style={styles.roster}>
            {moradoresFiltrados.map((morador) => {
              const status = corStatus(morador.status);

              return (
                <article
                  key={morador.id}
                  style={{
                    ...styles.residentCard,
                    borderColor: status.border
                  }}
                >
                  <div style={styles.cardAccent}></div>

                  <div style={styles.residentMain}>
                    <div style={styles.avatarBox}>
                      {morador.nome
                        ? morador.nome.charAt(0).toUpperCase()
                        : "M"}
                    </div>

                    <div style={styles.residentIdentity}>
                      <div style={styles.nameLine}>
                        <h3 style={styles.residentName}>
                          {morador.nome}
                        </h3>

                        <span
                          style={{
                            ...styles.status,
                            background: status.background,
                            color: status.color
                          }}
                        >
                          {morador.status}
                        </span>
                      </div>

                      <p style={styles.residentEmail}>
                        {morador.email || "Sem e-mail cadastrado"}
                      </p>
                    </div>
                  </div>

                  <div style={styles.residentData}>
                    <div style={styles.dataPill}>
                      <span>Apto</span>
                      <strong>
                        {morador.apto || morador.apartamento || "-"}
                      </strong>
                    </div>

                    <div style={styles.dataPill}>
                      <span>Tipo</span>
                      <strong>
                        {morador.tipoMorador || "Proprietário"}
                      </strong>
                    </div>

                    <div style={styles.dataPill}>
                      <span>Perfil</span>
                      <strong>
                        {morador.moradorPrincipal ? "Principal" : "Dependente"}
                      </strong>
                    </div>

                    <div style={styles.dataPill}>
                      <span>Telefone</span>
                      <strong>{morador.telefone || "-"}</strong>
                    </div>

                    <div style={styles.dataPill}>
                      <span>Login</span>
                      <strong>{morador.usuario || "-"}</strong>
                    </div>
                  </div>

                  <div style={styles.residentActions}>
                    <button
                      style={styles.editButton}
                      onClick={() => editarMorador(morador)}
                    >
                      Editar
                    </button>

                    <button
                      style={styles.deleteButton}
                      onClick={() => excluirMorador(morador.id)}
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
          <div style={styles.modal}>
            <div style={styles.modalTop}>
              <div>
                <span style={styles.modalBadge}>
                  {editId !== null ? "Editar cadastro" : "Novo cadastro"}
                </span>

                <h2 style={styles.modalTitle}>
                  {editId !== null
                    ? "Editar morador"
                    : "Cadastrar morador"}
                </h2>
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
                  Nome completo
                </label>

                <input
                  minLength="3"
                  placeholder="Ex: João Silva"
                  value={novoMorador.nome}
                  onChange={(e) =>
                    setNovoMorador({
                      ...novoMorador,
                      nome: e.target.value
                    })
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>
                  Apartamento
                </label>

                {apartamentosDisponiveisParaSelect.length > 0 ? (
                  <select
                    value={novoMorador.apto}
                    onChange={(e) =>
                      selecionarApartamento(e.target.value)
                    }
                    style={styles.input}
                  >
                    <option value="">
                      Selecione um apartamento
                    </option>

                    {apartamentosDisponiveisParaSelect.map((ap) => (
                      <option
                        key={ap.id}
                        value={ap.value}
                      >
                        {ap.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    inputMode="numeric"
                    placeholder="Ex: 101"
                    value={novoMorador.apto}
                    onChange={(e) =>
                      setNovoMorador({
                        ...novoMorador,
                        apto: e.target.value.replace(/\D/g, "").slice(0, 6),
                        apartamento: e.target.value.replace(/\D/g, "").slice(0, 6),
                        apartamentoId: null
                      })
                    }
                    style={styles.input}
                  />
                )}
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>
                  Tipo de morador
                </label>

                <select
                  value={novoMorador.tipoMorador}
                  onChange={(e) =>
                    setNovoMorador({
                      ...novoMorador,
                      tipoMorador: e.target.value
                    })
                  }
                  style={styles.input}
                >
                  <option>Proprietário</option>
                  <option>Inquilino</option>
                  <option>Dependente</option>
                  <option>Cônjuge</option>
                </select>
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>
                  Morador principal deste apartamento?
                </label>

                <select
                  value={novoMorador.moradorPrincipal ? "Sim" : "Não"}
                  onChange={(e) => {
                    const principal = e.target.value === "Sim";

                    setNovoMorador({
                      ...novoMorador,
                      moradorPrincipal: principal,
                      perfilMorador: principal ? "principal" : "dependente"
                    });
                  }}
                  style={styles.input}
                >
                  <option>Não</option>
                  <option>Sim</option>
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
                  value={novoMorador.telefone}
                  onChange={(e) =>
                    setNovoMorador({
                      ...novoMorador,
                      telefone: limparTelefone(e.target.value)
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
                  maxLength="30"
                  placeholder="CPF, RG ou documento de identificação"
                  value={novoMorador.documento}
                  onChange={(e) =>
                    setNovoMorador({
                      ...novoMorador,
                      documento: e.target.value
                    })
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>
                  E-mail
                </label>

                <input
                  type="email"
                  required
                  placeholder="Ex: morador@email.com"
                  value={novoMorador.email}
                  onChange={(e) =>
                    setNovoMorador({
                      ...novoMorador,
                      email: e.target.value
                    })
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>
                  Usuário de login
                </label>

                <input
                  minLength="4"
                  placeholder="Ex: joao101"
                  value={novoMorador.usuario}
                  onChange={(e) =>
                    setNovoMorador({
                      ...novoMorador,
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
                  value={novoMorador.senha}
                  onChange={(e) =>
                    setNovoMorador({
                      ...novoMorador,
                      senha: e.target.value
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
                  value={novoMorador.status}
                  onChange={(e) =>
                    setNovoMorador({
                      ...novoMorador,
                      status: e.target.value
                    })
                  }
                  style={styles.input}
                >
                  <option>Ativo</option>
                  <option>Inativo</option>
                  <option>Bloqueado</option>
                </select>
              </div>
            </div>

            <div style={styles.modalActions}>
              <button
                style={styles.saveButton}
                onClick={salvarMorador}
              >
                Salvar morador
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
    color: "#111827",
    position: "relative"
  },

  hero: {
    background:
      "radial-gradient(circle at top right,rgba(255,255,255,0.18),transparent 30%), radial-gradient(circle at bottom left,rgb(var(--ic-primary-bright-rgb) / 0.24),transparent 34%), linear-gradient(135deg,var(--ic-primary-deepest),var(--ic-primary-deep),var(--ic-primary))",
    borderRadius: "42px",
    padding: "38px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "26px",
    color: "white",
    boxShadow:
      "0 30px 80px rgba(88,28,135,0.26), 0 0 46px rgb(var(--ic-primary-bright-rgb) / 0.16)",
    border: "1px solid rgba(255,255,255,0.18)",
    marginBottom: "24px",
    position: "relative",
    overflow: "hidden"
  },

  heroLeft: {
    maxWidth: "720px",
    position: "relative",
    zIndex: 2
  },

  heroBadge: {
    display: "inline-block",
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.22)",
    color: "var(--ic-primary-soft-4)",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    marginBottom: "15px",
    boxShadow: "0 10px 26px rgba(0,0,0,0.10)"
  },

  title: {
    margin: 0,
    fontSize: "46px",
    letterSpacing: "-1px",
    fontWeight: "900"
  },

  subtitle: {
    margin: "10px 0 0",
    color: "rgba(255,255,255,0.78)",
    lineHeight: "1.6"
  },

  heroRight: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    position: "relative",
    zIndex: 2
  },

  heroCounter: {
    background: "rgba(255,255,255,0.13)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: "26px",
    padding: "19px 24px",
    textAlign: "center",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)"
  },

  heroButton: {
    background: "linear-gradient(135deg,#ffffff,var(--ic-primary-soft))",
    color: "var(--ic-primary-strong)",
    border: "1px solid rgba(255,255,255,0.28)",
    padding: "16px 22px",
    borderRadius: "18px",
    cursor: "pointer",
    fontWeight: "900",
    whiteSpace: "nowrap",
    boxShadow: "0 16px 34px rgba(0,0,0,0.16)"
  },

  toolbar: {
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.10),transparent 34%), white",
    border: "1px solid var(--ic-primary-border-soft)",
    borderRadius: "30px",
    padding: "18px",
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    boxShadow: "0 18px 45px rgba(88,28,135,0.09)"
  },

  searchWrap: {
    flex: 1,
    background: "#fbfaff",
    border: "1px solid var(--ic-primary-border)",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    padding: "0 14px",
    boxShadow: "inset 0 0 0 1px rgb(var(--ic-primary-bright-rgb) / 0.04)"
  },

  searchIcon: {
    color: "var(--ic-primary)",
    fontSize: "20px",
    marginRight: "8px"
  },

  search: {
    flex: 1,
    padding: "15px 0",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "14px",
    color: "#111827"
  },

  filter: {
    width: "160px",
    padding: "15px",
    borderRadius: "18px",
    border: "1px solid var(--ic-primary-border)",
    outline: "none",
    background: "#fbfaff",
    color: "#111827"
  },

  inlineNumbers: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    fontSize: "12px",
    color: "#4b5563"
  },

  registry: {
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.10),transparent 34%), linear-gradient(180deg,#ffffff,#fbfaff)",
    border: "1px solid var(--ic-primary-border-soft)",
    borderRadius: "36px",
    padding: "28px",
    boxShadow: "0 20px 60px rgba(88,28,135,0.10)"
  },

  registryHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px"
  },

  registryLabel: {
    background: "var(--ic-primary-soft)",
    color: "var(--ic-primary)",
    border: "1px solid var(--ic-primary-border-soft)",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900"
  },

  registryTitle: {
    margin: "12px 0 0",
    color: "var(--ic-primary-deep)",
    fontSize: "28px",
    letterSpacing: "-0.4px"
  },

  resultBadge: {
    background: "var(--ic-primary-soft-3)",
    color: "var(--ic-primary)",
    border: "1px solid var(--ic-primary-border-soft)",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  roster: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))",
    gap: "18px"
  },

  residentCard: {
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.10),transparent 34%), linear-gradient(180deg,#ffffff,#fbfaff)",
    borderRadius: "30px",
    padding: "22px",
    boxShadow: "0 18px 42px rgba(88,28,135,0.10)",
    border: "1px solid var(--ic-primary-soft-2)"
  },

  cardAccent: {
    position: "absolute",
    inset: "0 auto 0 0",
    width: "7px",
    background:
      "linear-gradient(180deg,var(--ic-primary-strong),var(--ic-primary-bright),var(--ic-primary-border-soft))"
  },

  residentMain: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "18px"
  },

  avatarBox: {
    width: "62px",
    height: "62px",
    borderRadius: "23px",
    background:
      "linear-gradient(135deg,var(--ic-primary-deep),var(--ic-primary),var(--ic-primary-bright))",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px",
    fontWeight: "900",
    boxShadow: "0 16px 30px rgb(var(--ic-primary-rgb) / 0.24)"
  },

  residentIdentity: {
    flex: 1
  },

  nameLine: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "center"
  },

  residentName: {
    margin: 0,
    color: "#111827",
    fontSize: "21px"
  },

  residentEmail: {
    margin: "5px 0 0",
    color: "#6b7280",
    fontSize: "13px"
  },

  status: {
    padding: "7px 11px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "12px",
    whiteSpace: "nowrap",
    border: "1px solid transparent"
  },

  residentData: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px"
  },

  dataPill: {
    background: "#ffffff",
    border: "1px solid var(--ic-primary-soft-2)",
    borderRadius: "17px",
    padding: "13px",
    boxShadow: "0 8px 20px rgba(88,28,135,0.04)"
  },

  residentActions: {
    display: "flex",
    gap: "10px",
    marginTop: "18px"
  },

  editButton: {
    flex: 1,
    background: "var(--ic-primary-soft)",
    color: "var(--ic-primary)",
    border: "1px solid var(--ic-primary-border-soft)",
    padding: "12px",
    borderRadius: "15px",
    cursor: "pointer",
    fontWeight: "900"
  },

  deleteButton: {
    flex: 1,
    background: "#fee2e2",
    color: "#dc2626",
    border: "1px solid #fecaca",
    padding: "12px",
    borderRadius: "15px",
    cursor: "pointer",
    fontWeight: "900"
  },

  empty: {
    background: "#fbfaff",
    border: "1px dashed var(--ic-primary-border)",
    borderRadius: "28px",
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
      "linear-gradient(135deg,var(--ic-primary-strong),var(--ic-primary-bright))",
    color: "white",
    border: "none",
    padding: "13px 18px",
    borderRadius: "15px",
    cursor: "pointer",
    fontWeight: "900",
    boxShadow: "0 16px 32px rgb(var(--ic-primary-rgb) / 0.22)"
  },

  modalBackground: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.62)",
    backdropFilter: "blur(10px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    padding: "20px"
  },

  modal: {
    width: "720px",
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.10),transparent 34%), #fbfaff",
    padding: "26px",
    borderRadius: "36px",
    boxShadow: "0 34px 90px rgba(88,28,135,0.30)",
    border: "1px solid rgba(255,255,255,0.55)"
  },

  modalTop: {
    background:
      "radial-gradient(circle at top right,rgba(255,255,255,0.16),transparent 34%), linear-gradient(135deg,var(--ic-primary-deep),var(--ic-primary))",
    color: "white",
    borderRadius: "28px",
    padding: "26px",
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
    boxShadow: "0 18px 38px rgba(88,28,135,0.18)"
  },

  modalBadge: {
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.18)",
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

  formPanel: {
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.08),transparent 34%), white",
    border: "1px solid var(--ic-primary-soft-2)",
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
    border: "1px solid var(--ic-primary-border)",
    outline: "none",
    fontSize: "14px",
    background: "#fbfaff",
    color: "#111827",
    boxSizing: "border-box"
  },

  modalActions: {
    display: "flex",
    gap: "12px",
    marginTop: "18px"
  },

  saveButton: {
    flex: 1,
    background:
      "linear-gradient(135deg,var(--ic-primary-strong),var(--ic-primary-light),var(--ic-primary-bright))",
    color: "white",
    border: "none",
    padding: "14px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900",
    boxShadow: "0 18px 34px rgb(var(--ic-primary-rgb) / 0.28), 0 0 28px rgb(var(--ic-primary-bright-rgb) / 0.18)"
  },

  cancelButton: {
    flex: 1,
    background: "var(--ic-primary-soft-4)",
    color: "var(--ic-primary-deep)",
    border: "1px solid var(--ic-primary-border-soft)",
    padding: "14px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900"
  }
};

export default Moradores;
