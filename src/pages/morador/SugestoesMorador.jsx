import { useEffect, useState } from "react";
import { me as getAuthenticatedUser } from "../../Services/authApi.js";
import occurrenceApi from "../../Services/occurrenceApi.js";

function SugestoesMorador() {
  const estadoInicial={tipo:"Reclamação",categoria:"",prioridade:"Média",titulo:"",descricao:""};
  const [morador,setMorador]=useState(null);
  const [ocorrencias,setOcorrencias]=useState([]);
  const [form,setForm]=useState(estadoInicial);
  const [busca,setBusca]=useState("");
  const [filtroStatus,setFiltroStatus]=useState("Todos");
  const typeBack={"Reclamação":"COMPLAINT","Sugestão":"SUGGESTION"};
  const priorityBack={"Baixa":"LOW","Média":"MEDIUM","Alta":"HIGH","Urgente":"URGENT"};
  const statusFront={NEW:"Novo",FORWARDED:"Novo",IN_REVIEW:"Ciente",IN_PROGRESS:"Em Tratamento",RESOLVED:"Resolvido",CLOSED:"Resolvido",CANCELED:"Cancelado"};
  function mapItem(i){const replies=(i.replies??[]).filter(r=>!r.internal).map(r=>({texto:r.message,data:r.createdAt,autor:r.author?.name??"Síndico"}));return {...i,tipo:i.type==="SUGGESTION"?"Sugestão":"Reclamação",tipoRegistro:i.type,categoria:i.category??"",prioridade:i.priority==="LOW"?"Baixa":i.priority==="HIGH"?"Alta":i.priority==="URGENT"?"Urgente":"Média",titulo:i.title??"",descricao:i.description??"",status:statusFront[i.status]??i.status,apartamento:i.apartment?.number??"",moradorNome:i.createdBy?.name??"",data:i.createdAt?new Date(i.createdAt).toLocaleDateString("pt-BR"):"",hora:i.createdAt?new Date(i.createdAt).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}):"",respostasSindico:replies,respostaSindico:i.resolution??null};}
  async function carregar(){try{const [u,data]=await Promise.all([getAuthenticatedUser(),occurrenceApi.my()]);setMorador(u);setOcorrencias((data??[]).map(mapItem));}catch(e){alert(e?.message??"Não foi possível carregar suas solicitações.");}}
  useEffect(()=>{carregar();},[]);
  function limparFormulario(){setForm(estadoInicial);}
  async function enviarSolicitacao(){if(!form.categoria||String(form.titulo).trim().length<3||String(form.descricao).trim().length<5){alert("Preencha categoria, título e descrição.");return;}try{await occurrenceApi.create({type:typeBack[form.tipo]??"COMPLAINT",category:form.categoria,priority:priorityBack[form.prioridade]??"MEDIUM",title:form.titulo.trim(),description:form.descricao.trim()});limparFormulario();await carregar();alert("Solicitação enviada ao síndico.");}catch(e){alert(e?.message??"Não foi possível enviar sua solicitação.");}}
  function obterStatus(status){if(status==="Resolvido")return{texto:"Resolvido",fundo:"#dcfce7",cor:"#166534"};if(status==="Ciente")return{texto:"Ciente",fundo:"#dbeafe",cor:"#1d4ed8"};if(status==="Em Tratamento")return{texto:"Em Tratamento",fundo:"#ede9fe",cor:"#6d28d9"};if(status==="Cancelado")return{texto:"Cancelado",fundo:"#fee2e2",cor:"#b91c1c"};return{texto:"Novo",fundo:"#fef3c7",cor:"#92400e"};}
  const minhasSolicitacoes=ocorrencias.filter(i=>{const t=busca.toLowerCase();const ok=!t||i.titulo?.toLowerCase().includes(t)||i.descricao?.toLowerCase().includes(t)||i.categoria?.toLowerCase().includes(t);return ok&&(filtroStatus==="Todos"||obterStatus(i.status).texto===filtroStatus);});
  const pendentes=ocorrencias.filter(i=>!["Resolvido","Cancelado"].includes(i.status)).length;
  const resolvidas=ocorrencias.filter(i=>i.status==="Resolvido").length;
  const reclamacoes=ocorrencias.filter(i=>i.tipo==="Reclamação").length;
  const sugestoes=ocorrencias.filter(i=>i.tipo==="Sugestão").length;

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div>
          <span style={styles.heroBadge}>
            💬 Canal do morador
          </span>

          <h1 style={styles.title}>
            Sugestões / Reclamações
          </h1>

          <p style={styles.subtitle}>
            Envie solicitações para o condomínio e acompanhe
            o retorno da administração.
          </p>

          {morador && (
            <div style={styles.userLine}>
              <span style={styles.statusDot}></span>

              <span>
                Morador:{" "}
                <strong>{morador.nome}</strong>
              </span>

              <span style={styles.apBadge}>
                Apto {morador.apartamento || morador.apto || "-"}
              </span>

              <span style={styles.apBadge}>
                {morador.moradorPrincipal ? "Principal" : "Dependente"}
              </span>
            </div>
          )}
        </div>

        <div style={styles.heroPanel}>
          <p style={styles.heroLabel}>
            Minhas solicitações
          </p>

          <h3 style={styles.heroNumber}>
            {minhasSolicitacoes.length}
          </h3>

          <span style={styles.heroStatus}>
            Central integrada
          </span>
        </div>
      </div>

      <div style={styles.cards}>
        <div style={styles.cardPrimary}>
          <div>
            <p style={styles.cardLabelLight}>
              Aguardando retorno
            </p>

            <h2 style={styles.cardNumberLight}>
              {pendentes}
            </h2>

            <span style={styles.cardHintLight}>
              encaminhadas ao síndico
            </span>
          </div>

          <div style={styles.cardIconLight}>
            📤
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIconGreen}>
            ✅
          </div>

          <div>
            <p style={styles.cardLabel}>
              Resolvidas
            </p>

            <h2 style={styles.cardNumberGreen}>
              {resolvidas}
            </h2>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIconYellow}>
            ⚠️
          </div>

          <div>
            <p style={styles.cardLabel}>
              Reclamações
            </p>

            <h2 style={styles.cardNumberYellow}>
              {reclamacoes}
            </h2>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIconBlue}>
            💡
          </div>

          <div>
            <p style={styles.cardLabel}>
              Sugestões
            </p>

            <h2 style={styles.cardNumberBlue}>
              {sugestoes}
            </h2>
          </div>
        </div>
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.formCard}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                Nova solicitação
              </h2>

              <p style={styles.sectionSubtitle}>
                Sua mensagem será registrada e encaminhada
                para análise do síndico.
              </p>
            </div>

            <span style={styles.sectionBadge}>
              Envio direto
            </span>
          </div>

          <label style={styles.label}>
            Tipo
          </label>

          <select
            value={form.tipo}
            onChange={(e) =>
              setForm({
                ...form,
                tipo: e.target.value
              })
            }
            style={styles.input}
          >
            <option>Reclamação</option>
            <option>Sugestão</option>
          </select>

          <label style={styles.label}>
            Categoria
          </label>

          <select
            value={form.categoria}
            onChange={(e) =>
              setForm({
                ...form,
                categoria: e.target.value
              })
            }
            style={styles.input}
          >
            <option value="">
              Selecione uma categoria
            </option>
            <option>Barulho</option>
            <option>Limpeza</option>
            <option>Segurança</option>
            <option>Manutenção</option>
            <option>Área comum</option>
            <option>Garagem</option>
            <option>Convivência</option>
            <option>Outros</option>
          </select>

          <label style={styles.label}>
            Prioridade
          </label>

          <select
            value={form.prioridade}
            onChange={(e) =>
              setForm({
                ...form,
                prioridade: e.target.value
              })
            }
            style={styles.input}
          >
            <option>Baixa</option>
            <option>Média</option>
            <option>Alta</option>
            <option>Urgente</option>
          </select>

          <label style={styles.label}>
            Título
          </label>

          <input
            minLength="4"
            placeholder="Ex: Barulho após as 22h"
            value={form.titulo}
            onChange={(e) =>
              setForm({
                ...form,
                titulo: e.target.value
              })
            }
            style={styles.input}
          />

          <label style={styles.label}>
            Descrição
          </label>

          <textarea
            minLength="10"
            placeholder="Descreva sua solicitação com detalhes..."
            value={form.descricao}
            onChange={(e) =>
              setForm({
                ...form,
                descricao: e.target.value
              })
            }
            style={styles.textarea}
          />

          <button
            style={styles.submitButton}
            onClick={enviarSolicitacao}
          >
            Enviar ao síndico
          </button>

          <p style={styles.formHint}>
            O porteiro poderá visualizar o registro no livro de
            ocorrências, e o síndico poderá responder pelo painel administrativo.
          </p>
        </div>

        <div style={styles.listCard}>
          <div style={styles.listHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                Minhas solicitações
              </h2>

              <p style={styles.sectionSubtitle}>
                Acompanhe o andamento das suas reclamações e sugestões.
              </p>
            </div>

            <div style={styles.filters}>
              <input
                placeholder="Buscar..."
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
                <option>Novo</option>
                <option>Ciente</option>
                <option>Em Tratamento</option>
                <option>Resolvido</option>
              </select>
            </div>
          </div>

          {minhasSolicitacoes.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>
                📭
              </div>

              <h3 style={styles.emptyTitle}>
                Nenhuma solicitação encontrada
              </h3>

              <p style={styles.emptyText}>
                Quando você enviar uma sugestão ou reclamação,
                ela aparecerá aqui.
              </p>
            </div>
          ) : (
            <div style={styles.timeline}>
              {minhasSolicitacoes.map((item) => {
                const status = obterStatus(item.status);

                return (
                  <div
                    key={item.id}
                    style={styles.solicitacaoCard}
                  >
                    <div style={styles.cardTop}>
                      <div>
                        <div style={styles.badges}>
                          <span style={styles.typeBadge}>
                            {item.tipoRegistro || item.tipo}
                          </span>

                          <span style={styles.categoryBadge}>
                            {item.categoria}
                          </span>

                          <span style={styles.priorityBadge}>
                            {item.prioridade}
                          </span>
                        </div>

                        <h3 style={styles.solicitacaoTitle}>
                          {item.titulo}
                        </h3>
                      </div>

                      <span
                        style={{
                          ...styles.statusBadge,
                          background: status.fundo,
                          color: status.cor
                        }}
                      >
                        {status.texto}
                      </span>
                    </div>

                    <p style={styles.description}>
                      {item.descricao}
                    </p>

                    <div style={styles.meta}>
                      <span>
                        📅 {item.data} às {item.hora}
                      </span>

                      <span>
                        🏠 Apto {item.apartamento || "-"}
                      </span>

                      <span>
                        👤 {item.moradorNome || morador?.nome}
                      </span>
                    </div>

                    {item.respostasSindico?.length > 0 ? (
                      <div style={styles.responseBox}>
                        <strong>
                          Resposta do síndico:
                        </strong>

                        <p style={styles.responseText}>
                          {
                            item.respostasSindico[
                              item.respostasSindico.length - 1
                            ].texto
                          }
                        </p>
                      </div>
                    ) : item.respostaSindico ? (
                      <div style={styles.responseBox}>
                        <strong>
                          Resposta do síndico:
                        </strong>

                        <p style={styles.responseText}>
                          {item.respostaSindico}
                        </p>
                      </div>
                    ) : (
                      <div style={styles.waitBox}>
                        Solicitação encaminhada e aguardando retorno.
                      </div>
                    )}
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
    boxSizing: "border-box",
    fontFamily: "Arial",
    color: "#111827",
    position: "relative"
  },

  hero: {
    minWidth: 0,
    flexWrap: "wrap",
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

  cards: {
    display: "grid",
    minWidth: 0,
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

  card: {
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

  cardIconYellow: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#fef3c7",
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

  cardLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px"
  },

  cardNumberGreen: {
    margin: "8px 0 0",
    color: "#7c3aed",
    fontSize: "34px"
  },

  cardNumberYellow: {
    margin: "8px 0 0",
    color: "#92400e",
    fontSize: "34px"
  },

  cardNumberBlue: {
    margin: "8px 0 0",
    color: "#7c3aed",
    fontSize: "34px"
  },

  mainGrid: {
    display: "grid",
    minWidth: 0,
    gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,400px),1fr))",
    gap: "24px",
    alignItems: "flex-start"
  },

  formCard: {
    minWidth: 0,
    overflow: "hidden",
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
    overflow: "hidden",
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
    flexWrap: "wrap",
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
    minWidth: 0,
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
    minWidth: 0,
    maxWidth: "100%",
    minHeight: "140px",
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

  submitButton: {
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
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "20px"
  },

  filters: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px"
  },

  search: {
    width: "100%",
    minWidth: "180px",
    flex: "1 1 210px",
    padding: "13px 14px",
    borderRadius: "15px",
    border: "1px solid #c4b5fd",
    outline: "none",
    background: "#fbfaff",
    boxSizing: "border-box"
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

  timeline: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },

  solicitacaoCard: {
    background: "#fbfaff",
    border: "1px solid #ddd6fe",
    borderRadius: "24px",
    padding: "22px"
  },

  cardTop: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "flex-start",
    marginBottom: "14px"
  },

  badges: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "10px"
  },

  typeBadge: {
    background: "#ede9fe",
    color: "#6d28d9",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  categoryBadge: {
    background: "#faf5ff",
    color: "#7c3aed",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  priorityBadge: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  solicitacaoTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "20px"
  },

  statusBadge: {
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    whiteSpace: "nowrap"
  },

  description: {
    color: "#374151",
    lineHeight: "1.6",
    margin: "0 0 15px"
  },

  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    color: "#6b7280",
    fontSize: "13px",
    marginBottom: "14px"
  },

  responseBox: {
    background: "#faf5ff",
    border: "1px solid #ddd6fe",
    color: "#7c3aed",
    padding: "14px",
    borderRadius: "16px",
    fontSize: "14px"
  },

  responseText: {
    margin: "8px 0 0",
    color: "#374151",
    lineHeight: "1.5"
  },

  waitBox: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    color: "#92400e",
    padding: "14px",
    borderRadius: "16px",
    fontSize: "14px",
    fontWeight: "700"
  }
};

export default SugestoesMorador;