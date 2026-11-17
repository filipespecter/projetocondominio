import { FiUser, FiPlus, FiUsers, FiCheckCircle, FiXCircle, FiSearch, FiMoon, FiSun, FiCheck, FiX, FiEye, FiEdit2, FiMoreHorizontal } from "react-icons/fi";
import "./GestaoVisual.css";
import { confirmDialog } from "../../components/GlobalDialogs.jsx";
import { useEffect, useState } from "react";
import doormanApi from "../../Services/doormanApi";
import "../../styles/infinityModules.css";

function limparTelefone(valor) {
  return String(valor ?? "")
    .replace(/\D/g, "")
    .slice(0, 11);
}

function Porteiros() {
  const estadoInicialPorteiro = {
    nome: "", turno: "", telefone: "", email: "", usuario: "", senha: "",
    status: "Ativo", codigoPorteiro: "", ultimoLogin: null,
    ultimoLogout: null, ultimoPlantao: null
  };

  const [porteiros, setPorteiros] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroTurno, setFiltroTurno] = useState("Todos");
  const [novoPorteiro, setNovoPorteiro] = useState(estadoInicialPorteiro);
  const [editId, setEditId] = useState(null);
  const [supervisao, setSupervisao] = useState(null);
  const [porteiroSupervisionado, setPorteiroSupervisionado] = useState(null);
  const [carregandoSupervisao, setCarregandoSupervisao] = useState(false);

  const shiftFront = { MORNING:"Manhã", AFTERNOON:"Tarde", NIGHT:"Noite", TWELVE_BY_THIRTY_SIX:"12x36", OTHER:"Outro" };
  const shiftBack = { "Manhã":"MORNING", "Tarde":"AFTERNOON", "Noite":"NIGHT", "12x36":"TWELVE_BY_THIRTY_SIX", "Outro":"OTHER" };
  const statusFront = { ACTIVE:"Ativo", INACTIVE:"Inativo", BLOCKED:"Bloqueado", PENDING:"Pendente" };
  const statusBack = { "Ativo":"ACTIVE", "Inativo":"INACTIVE", "Bloqueado":"BLOCKED", "Pendente":"PENDING" };

  function mapDoorman(d) {
    const user = d.user ?? d;
    return {
      ...d,
      nome: user.name ?? d.name ?? "",
      usuario: user.username ?? d.username ?? "",
      email: user.email ?? d.email ?? "",
      telefone: user.phone ?? d.phone ?? "",
      codigoPorteiro: d.code ?? d.codigoPorteiro ?? "",
      turno: shiftFront[d.shift] ?? d.customShift ?? d.shift ?? "",
      status: statusFront[user.status ?? d.status] ?? user.status ?? d.status ?? "Ativo",
      ultimoLogin: user.lastLoginAt ?? d.lastLoginAt ?? null,
      ultimoLogout: user.lastLogoutAt ?? d.lastLogoutAt ?? null,
      ultimoPlantao: d.lastDutyAt ?? null
    };
  }

  async function carregar() {
    try {
      const data = await doormanApi.list();
      setPorteiros((data ?? []).map(mapDoorman));
    } catch (error) {
      alert(error?.message ?? "Não foi possível carregar porteiros.");
    }
  }

  useEffect(() => { carregar(); }, []);

  const porteirosFiltrados = porteiros.filter((p) => {
    const texto = busca.toLowerCase();
    const correspondeBusca =
      p.nome?.toLowerCase().includes(texto) ||
      p.turno?.toLowerCase().includes(texto) ||
      p.telefone?.toLowerCase().includes(texto) ||
      p.usuario?.toLowerCase().includes(texto) ||
      p.codigoPorteiro?.toLowerCase().includes(texto) ||
      p.status?.toLowerCase().includes(texto);
    return correspondeBusca &&
      (filtroStatus === "Todos" || p.status === filtroStatus) &&
      (filtroTurno === "Todos" || p.turno === filtroTurno);
  });

  const totalAtivos = porteiros.filter((p) => p.status === "Ativo").length;
  const totalInativos = porteiros.filter((p) => p.status === "Inativo").length;

  function gerarCodigoPorteiro(numero) {
    return `P${String(numero).padStart(3, "0")}`;
  }

  function proximoCodigoPorteiro() {
    const numeros = porteiros.map((p) => Number(String(p.codigoPorteiro || "").replace(/\D/g, ""))).filter(Number.isFinite);
    return gerarCodigoPorteiro(numeros.length ? Math.max(...numeros) + 1 : 1);
  }

  function validarPorteiro() {
    if (!novoPorteiro.nome.trim() || !novoPorteiro.usuario.trim() || !novoPorteiro.turno) {
      alert("Preencha nome, usuário e turno.");
      return false;
    }
    if ((!editId || novoPorteiro.senha) && String(novoPorteiro.senha || "").length < 12) {
      alert("A senha inicial deve possuir pelo menos 12 caracteres.");
      return false;
    }
    return true;
  }

  function limparFormulario() {
    setNovoPorteiro(estadoInicialPorteiro);
    setEditId(null);
  }

  async function salvarPorteiro() {
    if (!validarPorteiro()) return;
    const shift = shiftBack[novoPorteiro.turno] ?? "OTHER";
    const payload = {
      name: novoPorteiro.nome.trim(),
      username: novoPorteiro.usuario.trim(),
      email: novoPorteiro.email?.trim() || null,
      phone: novoPorteiro.telefone?.trim() || null,
      code: novoPorteiro.codigoPorteiro || proximoCodigoPorteiro(),
      shift,
      customShift: shift === "OTHER" ? novoPorteiro.turno : null,
      status: statusBack[novoPorteiro.status] ?? "ACTIVE"
    };
    try {
      if (editId) {
        await doormanApi.update(editId, payload);
        if (novoPorteiro.senha) await doormanApi.resetPassword(editId, novoPorteiro.senha);
      }
      else await doormanApi.create({ ...payload, password: novoPorteiro.senha, mustChangePassword: true });
      await carregar();
      fecharModal();
    } catch (error) {
      alert(error?.message ?? "Erro ao salvar porteiro.");
    }
  }

  function editarPorteiro(porteiro) {
    setEditId(porteiro.id);
    setNovoPorteiro({ ...estadoInicialPorteiro, ...porteiro, senha: "" });
    setMostrarModal(true);
  }

  async function excluirPorteiro(id) {
    if (!await confirmDialog("Deseja realmente excluir este porteiro?")) return;
    try { await doormanApi.remove(id); await carregar(); }
    catch (error) { alert(error?.message ?? "Não foi possível excluir o porteiro."); }
  }

  function fecharModal() {
    setMostrarModal(false);
    limparFormulario();
  }

  function iniciais(nome) {
    if (!nome) return "P";

    const partes = nome.trim().split(" ");

    if (partes.length === 1) {
      return partes[0].charAt(0).toUpperCase();
    }

    return `${partes[0].charAt(0)}${partes[partes.length - 1].charAt(0)}`.toUpperCase();
  }

  async function abrirSupervisao(porteiro) {
    setPorteiroSupervisionado(porteiro);
    setSupervisao(null);
    setCarregandoSupervisao(true);
    try {
      setSupervisao(await doormanApi.supervision(porteiro.id, 30));
    } catch (error) {
      alert(error?.message ?? "Não foi possível carregar a supervisão deste porteiro.");
      setPorteiroSupervisionado(null);
    } finally {
      setCarregandoSupervisao(false);
    }
  }

  function fecharSupervisao() {
    setPorteiroSupervisionado(null);
    setSupervisao(null);
  }

  function duracao(segundos = 0) {
    const total = Math.max(0, Number(segundos) || 0);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    return `${h}h ${String(m).padStart(2, "0")}min`;
  }

  function dataHora(valor) {
    if (!valor) return "—";
    return new Date(valor).toLocaleString("pt-BR");
  }

  return (
    <div className="ic-pkg-reference ic-gestao-visual">
      <header className="ic-pkg-hero"><div className="ic-pkg-heading"><span className="ic-pkg-icon"><FiUser/></span><div><h1>Porteiros</h1><p>Gerencie a equipe de portaria, os turnos e os acessos.</p></div></div><div className="ic-pkg-actions"><button type="button" onClick={()=>{limparFormulario();setMostrarModal(true);}}><FiPlus/> Novo operador</button></div></header>
      <div className="ic-gestao-metrics"><div><span className="ic-pkg-icon"><FiUsers/></span><div><strong>{porteiros.length}</strong><span>Total de operadores</span></div></div><div><span className="ic-pkg-icon"><FiCheckCircle/></span><div><strong>{totalAtivos}</strong><span>Ativos</span></div></div><div><span className="ic-pkg-icon"><FiXCircle/></span><div><strong>{totalInativos}</strong><span>Inativos</span></div></div></div>
      <div className="ic-pkg-filters">
        <label className="ic-pkg-search"><FiSearch/><input aria-label="Buscar" placeholder="Buscar por nome, telefone ou usuário..." value={busca} onChange={e=>setBusca(e.target.value)}/></label>
        <select aria-label="Turno" value={filtroTurno} onChange={e=>setFiltroTurno(e.target.value)}><option value="Todos">Todos os turnos</option>{[...new Set([...Object.values(shiftFront),...porteiros.map(p=>p.turno).filter(Boolean)])].map(t=><option key={t}>{t}</option>)}</select>
        <select aria-label="Status" value={filtroStatus} onChange={e=>setFiltroStatus(e.target.value)}><option value="Todos">Todos os status</option>{Object.values(statusFront).map(t=><option key={t}>{t}</option>)}</select>
      </div>
      <section className="ic-gestao-list">
        <h2 className="ic-pkg-section-title"><FiUsers/> Equipe de portaria</h2>
        <div className="ic-pkg-table-wrap"><table className="ic-pkg-table"><thead><tr><th>Porteiro</th><th>Usuário</th><th>Turno</th><th>Status</th><th>Último acesso</th><th>Ações</th></tr></thead>
        <tbody>{porteirosFiltrados.map(p=><tr key={p.id}>
          <td data-label="Porteiro"><span className="ic-pkg-description"><span className="ic-gestao-avatar">{iniciais(p.nome)}</span><strong>{p.nome}</strong></span></td>
          <td data-label="Usuário">{p.usuario||"—"}</td>
          <td data-label="Turno"><span className="ic-pkg-tag">{p.turno==="Noite"?<FiMoon/>:<FiSun/>} {p.turno||"—"}</span></td>
          <td data-label="Status"><span className="ic-pkg-tag" data-tone={p.status==="Ativo"?"green":p.status==="Inativo"||p.status==="Bloqueado"?"red":undefined}>{p.status==="Ativo"?<FiCheck/>:<FiX/>} {p.status}</span></td>
          <td data-label="Último acesso">{dataHora(p.ultimoLogin)}</td>
          <td data-label="Ações"><div className="ic-pkg-row-actions">
            <button type="button" className="ic-pkg-primary" onClick={()=>abrirSupervisao(p)}><FiEye/> Supervisão</button>
            <button type="button" className="ic-pkg-outline" onClick={()=>editarPorteiro(p)}><FiEdit2/> Editar</button>
            <details className="ic-pkg-action-menu"><summary aria-label="Mais ações"><FiMoreHorizontal/></summary><div><small>Telefone: {p.telefone||"—"} · Código: {p.codigoPorteiro||"—"}</small><button type="button" onClick={()=>excluirPorteiro(p.id)}>Excluir</button></div></details>
          </div></td>
        </tr>)}</tbody></table>{!porteirosFiltrados.length&&<p className="ic-pkg-empty">Nenhum porteiro encontrado.</p>}</div>
      </section>

      {porteiroSupervisionado && (
        <div className="icm-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) fecharSupervisao(); }}>
          <section className="icm-modal" aria-label="Supervisão da portaria">
            <div className="icm-modal-head">
              <div>
                <span className="icm-kicker" style={{background:"var(--ic-primary-soft)",color:"var(--ic-primary-strong)"}}>🛡️ Supervisão operacional · últimos 30 dias</span>
                <h2>{porteiroSupervisionado.nome}</h2>
                <div className="icm-muted">@{porteiroSupervisionado.usuario} · {porteiroSupervisionado.codigoPorteiro || "Sem código"} · turno {porteiroSupervisionado.turno || "não informado"}</div>
              </div>
              <button className="icm-btn icm-btn-neutral" onClick={fecharSupervisao}>Fechar</button>
            </div>

            {carregandoSupervisao ? <div className="icm-empty">Carregando atividade...</div> : supervisao && <>
              <div className="icm-metrics">
                <div className="icm-metric"><span>Tempo conectado</span><strong style={{fontSize:20}}>{duracao(supervisao.metrics?.totalOnlineSeconds)}</strong></div>
                <div className="icm-metric"><span>Sessões</span><strong>{supervisao.metrics?.sessions ?? 0}</strong></div>
                <div className="icm-metric"><span>Ocorrências registradas</span><strong>{supervisao.metrics?.occurrences ?? 0}</strong></div>
                <div className="icm-metric"><span>Alertas pendentes</span><strong>{supervisao.metrics?.pendingAlerts ?? 0}</strong></div>
              </div>
              <div className="icm-metrics">
                <div className="icm-metric"><span>Encomendas recebidas</span><strong>{supervisao.metrics?.packagesReceived ?? 0}</strong></div>
                <div className="icm-metric"><span>Encomendas entregues</span><strong>{supervisao.metrics?.packagesDelivered ?? 0}</strong></div>
                <div className="icm-metric"><span>Visitantes registrados</span><strong>{supervisao.metrics?.visitorsRegistered ?? 0}</strong></div>
                <div className="icm-metric"><span>Entradas de prestadores</span><strong>{supervisao.metrics?.providerEntries ?? 0}</strong></div>
              </div>

              <h3 className="icm-section-title">Alertas e inconsistências</h3>
              <div className="icm-stack">{(supervisao.alerts ?? []).length === 0 ? <div className="icm-alert icm-alert-ok">Nenhuma inconsistência operacional objetiva encontrada no período.</div> : supervisao.alerts.map((alert,index)=><div key={`${alert.type}-${index}`} className="icm-alert">{alert.message}</div>)}</div>

              <div className="icm-divider"/>
              <h3 className="icm-section-title">Sessões de acesso</h3>
              {(supervisao.sessions ?? []).length === 0 ? <div className="icm-muted">Sem sessões registradas neste período.</div> : <div className="icm-table-wrap"><table className="icm-table"><thead><tr><th>Entrada</th><th>Saída</th><th>Duração</th><th>Encerramento</th></tr></thead><tbody>{supervisao.sessions.map(session=><tr key={session.id}><td>{dataHora(session.startedAt)}</td><td>{session.endedAt?dataHora(session.endedAt):"Em andamento"}</td><td>{duracao(session.durationSeconds)}</td><td>{session.endReason || (session.endedAt?"Encerrada":"Ativa")}</td></tr>)}</tbody></table></div>}

              <div className="icm-divider"/>
              <h3 className="icm-section-title">Linha do tempo auditável</h3>
              {(supervisao.timeline ?? []).length === 0 ? <div className="icm-muted">Nenhuma ação auditada no período.</div> : <div className="icm-timeline">{supervisao.timeline.slice(0,80).map(log=><div className="icm-timeline-item" key={log.id}><strong>{dataHora(log.createdAt)}</strong><span>{log.module} · {log.action}</span><span>{log.details || "Ação registrada no sistema."}</span></div>)}</div>}
            </>}
          </section>
        </div>
      )}

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
    color: "#111827",
    position: "relative"
  },

  hero: {
    background:
      "linear-gradient(135deg,#02140b,var(--ic-primary-dark) 55%,#15803d)",
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
    color: "var(--ic-primary-soft)",
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
    background: "var(--ic-primary-soft)",
    color: "var(--ic-primary)",
    border: "none",
    padding: "15px 20px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900",
    whiteSpace: "nowrap"
  },

  controlStrip: {
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.10),transparent 34%), white",
    border: "1px solid var(--ic-primary-border-soft)",
    borderRadius: "28px",
    padding: "18px",
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    boxShadow: "0 14px 35px rgba(88,28,135,0.07)"
  },

  searchWrap: {
    flex: 1,
    background: "#fbfaff",
    border: "1px solid var(--ic-primary-border)",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    padding: "0 14px"
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
    fontSize: "14px"
  },

  filter: {
    width: "150px",
    padding: "15px",
    borderRadius: "18px",
    border: "1px solid var(--ic-primary-border)",
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

  operatorPanel: {
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.10),transparent 34%), white",
    border: "1px solid var(--ic-primary-border-soft)",
    borderRadius: "34px",
    padding: "28px",
    boxShadow: "0 18px 55px rgba(88,28,135,0.09)"
  },

  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px"
  },

  panelLabel: {
    background: "var(--ic-primary-soft)",
    color: "var(--ic-primary)",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900"
  },

  panelTitle: {
    margin: "12px 0 0",
    color: "var(--ic-primary-deep)",
    fontSize: "28px"
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

  operatorGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))",
    gap: "18px"
  },

  operatorCard: {
    background: "linear-gradient(180deg,#ffffff,#fbfaff)",
    borderRadius: "30px",
    padding: "22px",
    boxShadow: "0 15px 38px rgba(88,28,135,0.07)",
    border: "1px solid var(--ic-primary-border-soft)"
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
      "linear-gradient(135deg,var(--ic-primary-deep),var(--ic-primary-light))",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "900",
    boxShadow: "0 14px 26px rgb(var(--ic-primary-rgb) / 0.18)"
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
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.10),transparent 34%), white",
    border: "1px solid var(--ic-primary-border-soft)",
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
    background: "var(--ic-primary-soft)",
    color: "var(--ic-primary)",
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
    background: "#fbfaff",
    border: "1px dashed var(--ic-primary-border)",
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
      "linear-gradient(135deg,var(--ic-primary-dark),var(--ic-primary-light))",
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
    background: "#fbfaff",
    padding: "26px",
    borderRadius: "36px",
    boxShadow: "0 30px 80px rgba(0,0,0,0.28)"
  },

  modalTop: {
    background:
      "linear-gradient(135deg,var(--ic-primary-deep),var(--ic-primary))",
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
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.10),transparent 34%), white",
    border: "1px solid var(--ic-primary-border-soft)",
    borderRadius: "26px",
    padding: "20px",
    marginBottom: "15px"
  },

  modalSectionTitle: {
    margin: "0 0 16px",
    color: "var(--ic-primary-deep)"
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
    border: "1px solid var(--ic-primary-border)",
    outline: "none",
    fontSize: "14px",
    background: "#fbfaff"
  },

  modalButtons: {
    display: "flex",
    gap: "12px",
    marginTop: "18px"
  },

  saveBtn: {
    flex: 1,
    background:
      "linear-gradient(135deg,var(--ic-primary-dark),var(--ic-primary-light))",
    color: "white",
    border: "none",
    padding: "14px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900"
  },

  cancelBtn: {
    flex: 1,
    background: "var(--ic-primary-soft-4)",
    color: "#374151",
    border: "none",
    padding: "14px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900"
  }
};

export default Porteiros;
