import { FiHome, FiPlus, FiSettings, FiCheckCircle, FiUsers, FiTool, FiSearch, FiUser, FiEdit2, FiMoreHorizontal, FiPieChart } from "react-icons/fi";
import "./GestaoVisual.css";
import "./EncomendasReferencia.css";
import "../../components/UnitDirectory.css";
import CondominiumStructure from "../../components/CondominiumStructure.jsx";
import api from "../../Services/api.js";
import { confirmDialog, notify } from "../../components/GlobalDialogs.jsx";
import { useEffect, useState } from "react";
import apartmentApi from "../../Services/apartmentApi";
import { Link } from "react-router-dom";

function limparNumero(valor) {
  return String(valor ?? "")
    .replace(/\D/g, "");
}

function Apartamentos() {
  const estadoInicialApartamento = {
    bloco: "",
    numero: "",
    andar: "",
    morador: "",
    moradoresIds: [],
    moradoresNomes: [],
    moradorPrincipalId: null,
    moradorPrincipalNome: "",
    status: "Não informado"
  };

  const [apartamentos, setApartamentos] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [novoAp, setNovoAp] = useState(estadoInicialApartamento);
  const [editId, setEditId] = useState(null);

  const [abrirEstrutura,setAbrirEstrutura] = useState(0);
  const [capacidade,setCapacidade] = useState(null);
  useEffect(()=>{api.get("/v1/apartments/structure").then(r=>setCapacidade(r.data.metrics.total)).catch(()=>{});},[]);
  const statusFront = {
    UNKNOWN:"Não informado",
    OCCUPIED: "Ocupado",
    VACANT: "Disponível",
    MAINTENANCE: "Manutenção",
    INACTIVE: "Inativo"
  };

  const statusBack = {
    "Não informado":"UNKNOWN",
    "Ocupado": "OCCUPIED",
    "Disponível": "VACANT",
    "Manutenção": "MAINTENANCE",
    "Inativo": "INACTIVE"
  };

  function mapApartment(ap) {
    const residents = ap.residents ?? ap.moradores ?? [];
    const principal = residents.find((r) => r.isPrimary || r.moradorPrincipal);
    return {
      ...ap,
      bloco: ap.block ?? ap.bloco ?? "",
      numero: ap.number ?? ap.numero ?? "",
      andar: String(ap.floor ?? ap.andar ?? ""),
      status: statusFront[ap.status] ?? ap.status ?? "Disponível",
      moradoresIds: residents.map((r) => r.id),
      moradoresNomes: residents.map((r) => r.user?.name ?? r.name ?? r.nome).filter(Boolean),
      morador: principal?.user?.name ?? principal?.name ?? residents[0]?.user?.name ?? residents[0]?.name ?? "",
      moradorPrincipalId: principal?.id ?? null,
      moradorPrincipalNome: principal?.user?.name ?? principal?.name ?? ""
    };
  }

  async function carregar() { try {setApartamentos((await apartmentApi.list()??[]).map(mapApartment));} catch(error){notify(error.message, "error");} }
  useEffect(() => { carregar(); }, []);

  const apartamentosFiltrados = apartamentos.filter((ap) => {
    const texto = busca.toLowerCase();
    const correspondeBusca =
      ap.bloco?.toLowerCase().includes(texto) ||
      ap.numero?.toLowerCase().includes(texto) ||
      ap.andar?.toLowerCase().includes(texto) ||
      ap.morador?.toLowerCase().includes(texto) ||
      ap.moradoresNomes?.join(" ").toLowerCase().includes(texto) ||
      ap.status?.toLowerCase().includes(texto);
    return correspondeBusca && (filtroStatus === "Todos" || ap.status === filtroStatus);
  });

  function validarApartamento() {
    if (!novoAp.bloco.trim() || !novoAp.numero.trim() || String(novoAp.andar).trim() === "") {
      notify("Preencha bloco, número e andar.", "error");
      return false;
    }
    return true;
  }

  async function salvarApartamento() {
    if (!validarApartamento()) return;
    const payload = {
      block: novoAp.bloco.trim(),
      number: novoAp.numero.trim(),
      floor: Number(novoAp.andar),
      status: statusBack[novoAp.status] ?? "VACANT",
      notes: null
    };
    try {
      if (editId) await apartmentApi.update(editId, payload);
      else await apartmentApi.create(payload);
      await carregar();
      fecharModal();
    } catch (error) {
      notify(error?.message ?? "Erro ao salvar apartamento.", "error");
    }
  }

  function editarApartamento(ap) {
    setEditId(ap.id);
    setNovoAp({ ...estadoInicialApartamento, ...ap });
    setMostrarModal(true);
  }

  async function excluirApartamento(id) {
    if (!await confirmDialog("Deseja realmente excluir este apartamento?")) return;
    try {
      await apartmentApi.remove(id);
      await carregar();
    } catch (error) {
      notify(error?.message ?? "Não foi possível excluir o apartamento.", "error");
    }
  }

  function fecharModal() {
    setMostrarModal(false);
    setEditId(null);
    setNovoAp(estadoInicialApartamento);
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

  const taxaOcupacao = capacidade ? (totalOcupados / capacidade * 100).toFixed(1) : null;

  return (
    <div className="ic-pkg-reference ic-gestao-visual">
      <header className="ic-pkg-hero"><div className="ic-pkg-heading"><span className="ic-pkg-icon"><FiHome/></span><div><h1>Apartamentos</h1><p>Gerencie as unidades e a ocupação do condomínio.</p></div></div><div className="ic-pkg-actions"><button type="button" onClick={()=>setAbrirEstrutura(v=>v+1)}><FiSettings/> Configurar estrutura</button><button type="button" onClick={()=>{if(!capacidade)return notify("Configure primeiro a estrutura do condomínio.", "error");setEditId(null);setNovoAp(estadoInicialApartamento);setMostrarModal(true);}}><FiPlus/> Novo apartamento</button></div></header>
      <CondominiumStructure requestOpen={abrirEstrutura} onChange={d=>{setCapacidade(d.metrics.total);carregar();}}/>
      <div className="ic-gestao-metrics ic-gestao-metrics-four"><div><span className="ic-pkg-icon"><FiHome/></span><div><strong>{apartamentos.length}</strong><span>Total de unidades</span></div></div><div><span className="ic-pkg-icon"><FiCheckCircle/></span><div><strong>{totalDisponiveis}</strong><span>Disponíveis</span></div></div><div><span className="ic-pkg-icon"><FiUsers/></span><div><strong>{totalOcupados}</strong><span>Ocupadas</span></div></div><div><span className="ic-pkg-icon"><FiTool/></span><div><strong>{totalManutencao}</strong><span>Em manutenção</span></div></div></div>
      <div className="ic-gestao-searchbar">
        <label className="ic-pkg-search"><FiSearch/><input aria-label="Buscar" placeholder="Buscar por bloco, número, andar ou morador..." value={busca} onChange={e=>setBusca(e.target.value)}/></label>
        <select aria-label="Status" value={filtroStatus} onChange={e=>setFiltroStatus(e.target.value)}><option value="Todos">Todos os status</option>{Object.keys(statusBack).map(t=><option key={t}>{t}</option>)}</select>
      </div>
      <section className="ic-gestao-list">
        <h2 className="ic-pkg-section-title"><FiHome/> Unidades cadastradas</h2>
        <div className="ic-pkg-unit-grid">{apartamentosFiltrados.map(ap=><article key={ap.id} className="ic-pkg-unit">
          <div className="ic-pkg-unit-head"><span className="ic-pkg-icon"><FiHome/></span><div><h3>Apartamento {ap.numero}</h3><p>{ap.bloco?`Bloco ${ap.bloco}`:"Sem bloco"} · Andar {ap.andar||"—"}</p></div><span className="ic-pkg-tag" data-tone={ap.status==="Ocupado"?"green":undefined}>{ap.status}</span></div>
          <p className="ic-pkg-received"><FiUser/> {ap.morador||"Sem morador principal"}{ap.moradoresNomes.length>1?` · ${ap.moradoresNomes.length} vinculados`:""}</p>
          <div className="ic-pkg-row-actions"><button type="button" className="ic-pkg-primary" onClick={()=>editarApartamento(ap)}><FiEdit2/> Editar unidade</button><details className="ic-pkg-action-menu"><summary aria-label="Mais ações"><FiMoreHorizontal/></summary><div><small>Moradores: {ap.moradoresNomes.join(", ")||"—"}</small><button type="button" onClick={()=>excluirApartamento(ap.id)}>Excluir</button></div></details></div>
        </article>)}</div>
        {!apartamentosFiltrados.length&&<p className="ic-pkg-empty">Nenhuma unidade encontrada.</p>}
      </section>
      <section className="ic-gestao-occupation"><FiPieChart/><div><strong>Ocupação geral · {taxaOcupacao==null?"—":`${taxaOcupacao}%`}</strong><p>{capacidade?`${totalOcupados} unidades ocupadas de ${capacidade} previstas.`:"Configure a estrutura para calcular a ocupação real."}</p></div></section>

      {mostrarModal && (
        <div style={styles.modalBackground}>
          <div style={styles.modal} className="ic-apartment-modal ic-apartment-reference">
            <div style={styles.modalHero} className="ic-apartment-reference-hero">
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
                aria-label="Fechar formulário"
                onClick={fecharModal}
              >
                ✕
              </button>
            </div>

            <div style={styles.formPanel} className="ic-apartment-form">
              <div style={styles.formRow}>
                <label style={styles.label}>
                  Bloco
                </label>

                <input
                  maxLength="3"
                  placeholder="Ex: A"
                  value={novoAp.bloco}
                  onChange={(e) =>
                    setNovoAp({
                      ...novoAp,
                      bloco: e.target.value.replace(/[^\p{L}\p{N} ]/gu, "").toUpperCase()
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
                  inputMode="numeric"
                  placeholder="Ex: 101"
                  value={novoAp.numero}
                  onChange={(e) =>
                    setNovoAp({
                      ...novoAp,
                      numero: e.target.value.replace(/[^\p{L}\p{N}]/gu, "")
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
                  inputMode="numeric"
                  placeholder="Ex: 1"
                  value={novoAp.andar}
                  onChange={(e) =>
                    setNovoAp({
                      ...novoAp,
                      andar: limparNumero(e.target.value)
                    })
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}><strong>Moradores desta unidade</strong>
                {(novoAp.residents??[]).map(r=><small key={r.id}>{r.user?.name} · {({OWNER:"Proprietário",TENANT:"Inquilino",DEPENDENT:"Dependente",OTHER:"Outro"})[r.residentType]}{r.isPrimary?" · 1º responsável":r.isSecondary?" · 2º responsável":""}</small>)}
                {editId?<Link className="ic-pkg-outline" to={`/dashboard/moradores?apartamento=${encodeURIComponent(editId)}`}>Gerenciar moradores desta unidade</Link>:<small>Salve a unidade antes de cadastrar moradores.</small>}
              </div>
              <div style={styles.formRow} className="ic-apartment-reference-status">
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
                  <option>Não informado</option><option>Ocupado</option>
                  <option>Disponível</option>
                  <option>Manutenção</option>
                </select>
              </div>
            </div>

            <div style={styles.modalButtons} className="ic-apartment-reference-actions">
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
    color: "#111827",
    position: "relative"
  },

  hero: {
    background:
      "radial-gradient(circle at top right,rgba(255,255,255,0.16),transparent 30%), radial-gradient(circle at bottom left,rgb(var(--ic-primary-bright-rgb) / 0.24),transparent 34%), linear-gradient(135deg,var(--ic-primary-deepest),var(--ic-primary-deep),var(--ic-primary))",
    borderRadius: "42px",
    padding: "40px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "34px",
    marginBottom: "26px",
    boxShadow: "0 30px 80px rgba(88,28,135,0.26), 0 0 46px rgb(var(--ic-primary-bright-rgb) / 0.16)",
    overflow: "hidden",
    position: "relative",
    border: "1px solid rgba(255,255,255,0.18)"
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
    fontSize: "46px",
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
    color: "var(--ic-primary-soft)",
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
    background: "var(--ic-primary-soft)",
    color: "var(--ic-primary)",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  commandBar: {
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.10),transparent 34%), white",
    border: "1px solid var(--ic-primary-border-soft)",
    borderRadius: "30px",
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    marginBottom: "26px",
    boxShadow: "0 16px 40px rgba(88,28,135,0.08)"
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
    border: "1px solid var(--ic-primary-border)",
    outline: "none",
    background: "#fbfaff",
    fontSize: "14px"
  },

  filter: {
    width: "180px",
    padding: "15px 16px",
    borderRadius: "17px",
    border: "1px solid var(--ic-primary-border)",
    outline: "none",
    background: "#fbfaff",
    fontSize: "14px"
  },

  button: {
    background:
      "linear-gradient(135deg,var(--ic-primary-dark),var(--ic-primary-light))",
    color: "white",
    border: "none",
    padding: "15px 20px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900",
    boxShadow: "0 18px 34px rgb(var(--ic-primary-rgb) / 0.28), 0 0 28px rgb(var(--ic-primary-bright-rgb) / 0.18)",
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
      "linear-gradient(135deg,var(--ic-primary-dark),var(--ic-primary-light))",
    borderRadius: "28px",
    padding: "24px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 18px 38px rgb(var(--ic-primary-rgb) / 0.22)"
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
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.10),transparent 34%), white",
    borderRadius: "30px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow: "0 16px 40px rgba(88,28,135,0.08)",
    border: "1px solid var(--ic-primary-soft-2)"
  },

  cardIconGreen: {
    width: "58px",
    height: "58px",
    borderRadius: "20px",
    background: "var(--ic-primary-soft)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px"
  },

  cardIconBlue: {
    width: "58px",
    height: "58px",
    borderRadius: "20px",
    background: "var(--ic-primary-soft-2)",
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
    color: "var(--ic-primary)",
    fontSize: "36px"
  },

  resumeNumberBlue: {
    margin: "8px 0 0",
    color: "var(--ic-primary-strong)",
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
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.10),transparent 34%), linear-gradient(180deg,#ffffff,#fbfaff)",
    borderRadius: "36px",
    padding: "28px",
    boxShadow: "0 20px 60px rgba(88,28,135,0.10)",
    border: "1px solid var(--ic-primary-soft-2)"
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
    background: "var(--ic-primary-soft)",
    color: "var(--ic-primary)",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900",
    marginBottom: "10px"
  },

  sectionTitle: {
    margin: 0,
    color: "var(--ic-primary-deep)",
    fontSize: "26px"
  },

  sectionSubtitle: {
    margin: "7px 0 0",
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "1.5"
  },

  sectionBadge: {
    background: "var(--ic-primary-soft)",
    color: "var(--ic-primary)",
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
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.12),transparent 34%), linear-gradient(180deg,#ffffff,#fbfaff)",
    borderRadius: "30px",
    padding: "22px",
    boxShadow: "0 16px 40px rgba(88,28,135,0.08)"
  },

  cardGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "6px",
    background: "linear-gradient(135deg,var(--ic-primary-light),var(--ic-primary-bright))"
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
      "linear-gradient(135deg,var(--ic-primary-soft),var(--ic-primary-soft-3))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    border: "1px solid var(--ic-primary-border-soft)"
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
    border: "1px solid var(--ic-primary-soft-2)",
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
    background: "var(--ic-primary-soft-3)",
    border: "1px solid var(--ic-primary-border-soft)",
    borderRadius: "17px",
    padding: "13px",
    color: "var(--ic-primary)",
    fontSize: "13px"
  },

  cardFooter: {
    marginTop: "18px",
    display: "flex",
    gap: "10px"
  },

  editButton: {
    flex: 1,
    background: "var(--ic-primary-soft-2)",
    color: "var(--ic-primary-strong)",
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
    gap: "18px",
    position: "sticky",
    top: "24px"
  },

  sideCardDark: {
    background:
      "radial-gradient(circle at top right,rgba(255,255,255,0.18),transparent 34%), radial-gradient(circle at bottom left,rgb(var(--ic-primary-bright-rgb) / 0.24),transparent 34%), linear-gradient(135deg,var(--ic-primary-deepest),var(--ic-primary-deep),var(--ic-primary))",
    color: "white",
    borderRadius: "34px",
    padding: "26px",
    boxShadow: "0 18px 45px rgba(88,28,135,0.20)"
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
    width: "164px",
    height: "164px",
    borderRadius: "50%",
    background:
      "conic-gradient(#c084fc 0deg, var(--ic-primary-bright) 220deg, rgba(255,255,255,0.16) 220deg)",
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
    border: "1px solid var(--ic-primary-soft-2)",
    borderRadius: "28px",
    padding: "24px",
    boxShadow: "0 14px 35px rgba(15,23,42,0.07)"
  },

  sideCardTitle: {
    margin: "0 0 14px",
    color: "var(--ic-primary-deep)"
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
    background: "#fbfaff",
    border: "1px solid var(--ic-primary-soft-2)",
    borderRadius: "17px",
    padding: "13px"
  },

  blockIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "15px",
    background: "var(--ic-primary-soft)",
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
    background: "#fbfaff",
    border: "1px dashed var(--ic-primary-border)",
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
      "linear-gradient(135deg,var(--ic-primary-dark),var(--ic-primary-light))",
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
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.10),transparent 34%), #fbfaff",
    padding: "26px",
    borderRadius: "36px",
    boxShadow: "0 34px 90px rgba(88,28,135,0.30)",
    border: "1px solid rgba(255,255,255,0.55)"
  },

  modalHero: {
    background:
      "radial-gradient(circle at top right,rgba(255,255,255,0.16),transparent 34%), linear-gradient(135deg,var(--ic-primary-deep),var(--ic-primary))",
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

  linkedResidents: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "10px"
  },

  linkedResident: {
    background: "var(--ic-primary-soft)",
    color: "var(--ic-primary)",
    border: "1px solid var(--ic-primary-border-soft)",
    borderRadius: "999px",
    padding: "7px 10px",
    fontSize: "12px",
    fontWeight: "900",
    display: "inline-flex",
    alignItems: "center",
    gap: "7px"
  },

  removeResidentButton: {
    border: "none",
    background: "var(--ic-primary)",
    color: "white",
    borderRadius: "50%",
    width: "18px",
    height: "18px",
    cursor: "pointer",
    fontWeight: "900",
    lineHeight: "18px"
  },

  modalButtons: {
    display: "flex",
    gap: "12px",
    marginTop: "18px"
  },

  saveButton: {
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

  cancelButton: {
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

export default Apartamentos;
