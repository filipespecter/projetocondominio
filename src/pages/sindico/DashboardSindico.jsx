import { Building2, Users, UserRound, BriefcaseBusiness, Package, CalendarDays, MessageSquareWarning, Shield, Layers3, Megaphone, Bell, ClipboardList, Wrench, ChevronRight, Plus, Trash2, BookOpen, X, Check, Activity, BarChart3, Flag } from "lucide-react";
import "../../styles/dashboardFinal.css";
import api from "../../Services/api.js";
import {confirmDialog} from "../../components/GlobalDialogs.jsx";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import dashboardApi from "../../Services/dashboardApi.js";

function DashboardSindico() {
  const navigate = useNavigate();

  const [mostrarManual, setMostrarManual] = useState(false);

  const [perfilCondominio, setPerfilCondominio] = useState({
    condominioId: null,
    nomeCondominio: "InfinityCondo",
    plano: "Plano não informado",
    statusComercial: "Ativo",
    quantidadeUnidades: ""
  });

  const [dados, setDados] = useState({
    moradores: 0,
    apartamentos: 0,
    porteiros: 0,
    prestadores: 0,
    encomendas: 0,
    visitantes: 0,
    reservas: 0,
    avisos: 0,
    areasComuns: 0,
    ocorrencias: 0,
    movimentacoes: 0,
    sugestoes: 0,
    reclamacoes: 0,
    notificacoes: 0,
    auditoria: 0,
    moradoresPrincipais: 0,
    dependentes: 0,
    apartamentosOcupados: 0,
    areasManutencao: 0,
    prestadoresExecucao: 0,
    prestadoresFinalizados: 0
  });

  const [atividades, setAtividades] = useState([]);
  const [clearedThrough,setClearedThrough]=useState(null),[clearBusy,setClearBusy]=useState(false),[feedError,setFeedError]=useState("");
  const visibleActivities=atividades.filter(item=>!clearedThrough||new Date(item.tempo)>new Date(clearedThrough));
  async function clearHistory(){if(clearBusy||!visibleActivities.length)return;if(!await confirmDialog("Limpar somente as movimentações exibidas no seu painel? Os registros continuam nos módulos e relatórios."))return;setClearBusy(true);try{const through=new Date(Math.max(...visibleActivities.map(x=>new Date(x.tempo).getTime()).filter(Number.isFinite))).toISOString();const r=await api.post("/v1/dashboard/feed-clear",{through});setClearedThrough(r.data.clearedThrough);setFeedError("");}catch(e){setFeedError(e.message);}finally{setClearBusy(false);}}


  useEffect(() => {
    carregarDados();

    const interval = setInterval(() => {
      carregarDados();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  function normalizarTexto(valor) {
    return String(valor || "").trim().toLowerCase();
  }

  async function carregarDados() {
    try {
      const [payload,feed]=await Promise.all([dashboardApi.manager(),api.get("/v1/dashboard/feed-state")]);
      setClearedThrough(old=>old&&old>feed.data.clearedThrough?old:feed.data.clearedThrough);setFeedError("");
      const base = payload.dashboard || {};
      const residents = base.residents || {};
      const apartments = base.apartments || {};
      const packages = base.packages || {};
      const visitorsInfo = base.visitors || {};
      const reservationsInfo = base.reservations || {};
      const commonAreas = base.commonAreas || {};
      const notices = base.notices || {};
      const occurrencesInfo = base.occurrences || {};
      const providers = payload.providers || [];
      const occurrences = payload.occurrences || [];
      const notifications = payload.notifications || [];
      const audit = Array.isArray(payload.audit) ? payload.audit : (payload.audit?.items || []);
      const me = payload.me?.user || payload.me || {};

      const principais = Number(residents.principals ?? residents.primary ?? residents.total ?? 0);
      const dependentes = Number(residents.dependents ?? Math.max(Number(residents.total || 0) - principais, 0));
      const sugestoes = occurrences.filter((o) => normalizarTexto(o.type || o.category).includes("suggest"));
      const reclamacoes = occurrences.filter((o) => normalizarTexto(o.type || o.category).includes("complaint") || normalizarTexto(o.type || o.category).includes("reclama"));
      const abertas = (lista) => lista.filter((o) => !["resolved","closed","cancelled","resolvido","resolvida","finalizado","finalizada"].includes(normalizarTexto(o.status)));
      const prestadoresExecucao = providers.filter((p) => ["in_progress","em execução","em execucao","active"].includes(normalizarTexto(p.status))).length;
      const prestadoresFinalizados = providers.filter((p) => ["completed","finalizado","finalizada"].includes(normalizarTexto(p.status))).length;

      setPerfilCondominio({
        condominioId: me.condominiumId || null,
        nomeCondominio: me.condominium?.name || me.condominiumName || "Condomínio",
        plano: me.condominium?.plan?.name || me.planName || "Plano não informado",
        statusComercial: me.condominium?.status || "Ativo",
        quantidadeUnidades: apartments.total || ""
      });

      setDados({
        moradores: Number(residents.total || 0), apartamentos: Number(apartments.total || 0),
        porteiros: payload.doormen.length, prestadores: providers.length, encomendas: Number(packages.pending || 0),
        visitantes: Number(visitorsInfo.total || 0), reservas: Number(reservationsInfo.pending || 0),
        avisos: Number(notices.published || 0), areasComuns: Number(commonAreas.total || 0),
        ocorrencias: Number(occurrencesInfo.active || 0), movimentacoes: payload.visitors.length + payload.packages.length + payload.reservations.length + occurrences.length,
        sugestoes: abertas(sugestoes).length, reclamacoes: abertas(reclamacoes).length, notificacoes: payload.unread,
        auditoria: audit.length, moradoresPrincipais: principais, dependentes, apartamentosOcupados: Number(apartments.occupied || 0),
        areasManutencao: Math.max(Number(commonAreas.total || 0) - Number(commonAreas.active || 0), 0),
        prestadoresExecucao, prestadoresFinalizados
      });

      const historico = [
        ...notifications.slice(0, 5).map((n) => ({ id:n.id, apartamento:n.apartmentLabel, icon:n.readAt ? "🔔" : "🟡", titulo:n.title || "Notificação", texto:n.message || "Nova notificação do sistema", tempo:n.createdAt || "", tipo:n.readAt ? "Notificação lida" : "Notificação pendente" })),
        ...audit.filter(a => !["AUTH", "CONFIGURATION_SECURITY", "PLATFORM_CLIENT_ACCESS", "DASHBOARD_FEED"].includes(a.module) && !/LOGIN|LOGOUT|PASSWORD|SESSION|SECURITY/.test(a.action || "")).slice(0, 5).map((a) => ({ id:a.id, operador:a.userName || a.user?.name || a.usuario, icon:"🧾", titulo:a.action || a.acao || "Registro de auditoria", texto:`${a.userName || a.user?.name || a.usuario || "Sistema"} • ${a.module || a.modulo || "Sistema"}`, tempo:a.createdAt || a.criadoEm || "", tipo:"Auditoria" })),
        ...occurrences.slice(0, 4).map((o) => ({ id:o.id, icon:"💬", titulo:o.title || o.type || "Ocorrência registrada", texto:o.description || o.descricao || "Ocorrência do condomínio", tempo:o.createdAt || "", tipo:"Ocorrência" })),
        ...payload.packages.slice(0, 4).map((e) => ({ id:e.id, apartamento:[e.apartment?.block,e.apartment?.number].filter(Boolean).join(" · "), operador:e.deliveredBy?.name || e.receivedBy?.name, icon:"📦", titulo:e.status==="DELIVERED"?"Retirada confirmada":"Encomenda registrada", texto:`Apartamento ${e.apartment?.number || e.apartmentNumber || "N/A"} • ${e.deliveredBy?.name || e.receivedBy?.name || "Operador não informado"}`, tempo:e.updatedAt || e.receivedAt || e.createdAt || "", tipo:"Encomenda" })),
        ...payload.reservations.slice(0, 4).map((r) => ({ id:r.id, apartamento:[r.apartment?.block,r.apartment?.number].filter(Boolean).join(" · "), icon:"📅", titulo:"Reserva solicitada", texto:r.commonArea?.name || r.area || "Área comum", tempo:r.createdAt || "", tipo:"Reserva" })),
        ...payload.visitors.slice(0, 4).map((v) => ({ id:v.id, apartamento:[v.apartment?.block,v.apartment?.number].filter(Boolean).join(" · "), operador:v.registeredBy?.name, icon:"👤", titulo:"Visitante registrado", texto:`${v.name || v.nome || "Visitante"} • Apartamento ${v.apartment?.number || "N/A"} • ${v.registeredBy?.name || "Operador não informado"}`, tempo:v.updatedAt || v.createdAt || v.entryAt || "", tipo:"Visitante" }))
      ];
      setAtividades(historico.filter(x=>Number.isFinite(new Date(x.tempo).getTime())).sort((a,b)=>new Date(b.tempo)-new Date(a.tempo)).slice(0, 30));
    } catch (error) {
      setFeedError(error.message || "Não foi possível atualizar o painel.");
    }
  }

  const totalOperacao =
    dados.encomendas +
    dados.visitantes +
    dados.reservas +
    dados.ocorrencias +
    dados.sugestoes +
    dados.reclamacoes +
    dados.notificacoes;

  const maxGrafico = Math.max(
    dados.moradores,
    dados.apartamentos,
    dados.porteiros,
    dados.prestadores,
    dados.encomendas,
    dados.visitantes,
    dados.reservas,
    dados.ocorrencias,
    dados.sugestoes,
    dados.reclamacoes,
    dados.movimentacoes,
    dados.notificacoes,
    dados.auditoria,
    1
  );

  const onboardingSteps = [
    { label: "Cadastrar apartamentos", done: dados.apartamentos > 0, to: "/dashboard/apartamentos" },
    { label: "Cadastrar moradores", done: dados.moradores > 0, to: "/dashboard/moradores" },
    { label: "Cadastrar porteiros", done: dados.porteiros > 0, to: "/dashboard/porteiros" },
    { label: "Configurar áreas comuns", done: dados.areasComuns > 0, to: "/dashboard/areas-comuns" },
  ];
  const onboardingDone = onboardingSteps.filter((step) => step.done).length;
  const onboardingComplete = onboardingDone === onboardingSteps.length;

  const cadastros = [
    {key:"apartamentos",label:"Apartamentos",icon:Building2},
    {key:"moradores",label:"Moradores",icon:Users},
    {key:"dependentes",label:"Dependentes",icon:UserRound},
    {key:"prestadores",label:"Prestadores",icon:BriefcaseBusiness},
  ];
  const operacao = [
    {key:"encomendas",label:"Encomendas pendentes",icon:Package,tone:"amber"},
    {key:"visitantes",label:"Visitantes",icon:UserRound},
    {key:"reservas",label:"Reservas pendentes",icon:CalendarDays},
    {key:"ocorrencias",label:"Ocorrências abertas",icon:MessageSquareWarning,tone:"red"},
  ];
  const complementares = [
    {key:"apartamentosOcupados",label:"Apartamentos ocupados",icon:Building2},
    {key:"moradoresPrincipais",label:"Moradores principais",icon:Users},
    {key:"porteiros",label:"Porteiros",icon:Shield},
    {key:"prestadoresExecucao",label:"Prestadores em execução",icon:Wrench},
    {key:"prestadoresFinalizados",label:"Prestadores finalizados",icon:Check},
    {key:"sugestoes",label:"Sugestões abertas",icon:MessageSquareWarning},
    {key:"reclamacoes",label:"Reclamações abertas",icon:Flag},
    {key:"avisos",label:"Central do síndico",icon:Megaphone},
    {key:"notificacoes",label:"Notificações pendentes",icon:Bell},
    {key:"auditoria",label:"Auditoria",icon:ClipboardList},
    {key:"areasManutencao",label:"Áreas em manutenção",icon:Wrench},
  ];
  const grafico = [
    ...cadastros,
    {key:"moradoresPrincipais",label:"Moradores principais",icon:Users},
    {key:"apartamentosOcupados",label:"Apartamentos ocupados",icon:Building2},
    {key:"porteiros",label:"Porteiros",icon:Shield},
    {key:"visitantes",label:"Visitantes",icon:UserRound},
    {key:"encomendas",label:"Encomendas pendentes",icon:Package},
  ];
  const prioridades = [
    {key:"encomendas",label:"Encomendas aguardando retirada",icon:Package,to:"/dashboard/encomendas"},
    {key:"reservas",label:"Reservas aguardando decisão",icon:CalendarDays,to:"/dashboard/reservas"},
    {key:"ocorrencias",label:"Ocorrências abertas",icon:MessageSquareWarning},
    {key:"areasManutencao",label:"Áreas em manutenção",icon:Wrench,to:"/dashboard/areas-comuns"},
    {key:"sugestoes",label:"Sugestões abertas",icon:MessageSquareWarning},
    {key:"reclamacoes",label:"Reclamações abertas",icon:Flag},
    {key:"notificacoes",label:"Notificações pendentes",icon:Bell},
    {key:"visitantes",label:"Visitantes registrados",icon:UserRound,to:"/dashboard/visitantes"},
  ];
  const maxVisivel = Math.max(1,...grafico.map(x=>dados[x.key]));
  const maisGraficos=[
    {key:"reservas",label:"Reservas",icon:CalendarDays},
    {key:"ocorrencias",label:"Ocorrências",icon:MessageSquareWarning},
    {key:"sugestoes",label:"Sugestões",icon:MessageSquareWarning},
    {key:"reclamacoes",label:"Reclamações",icon:Flag},
    {key:"movimentacoes",label:"Movimentações",icon:Activity},
    {key:"notificacoes",label:"Notificações",icon:Bell},
    {key:"auditoria",label:"Auditoria",icon:ClipboardList},
  ];
  function barras(items,maximum){return items.map(({key,label,icon:Icon})=><div className="ic-dr-bar" key={key}><span className="ic-dr-bar-label"><Icon size={16}/><span>{label}</span></span><div className="ic-dr-track"><span style={{width:`${dados[key]/maximum*100}%`}}/></div><strong>{dados[key]}</strong></div>);}
  return <div className="ic-dash-reference">
    <header className="ic-dr-hero"><div><span className="ic-dr-overline"><Layers3 size={13}/> PAINEL EXECUTIVO</span><h1>Painel Executivo InfinityCondo</h1><p>Visão consolidada do condomínio e acompanhamento das atividades em tempo real.</p><div className="ic-dr-identity"><Building2 size={14}/><span>{perfilCondominio.nomeCondominio}</span><span className="ic-dr-divider">•</span><span>{perfilCondominio.plano}</span><span className="ic-dr-commercial">{perfilCondominio.statusComercial}</span></div></div><div className="ic-dr-hero-number"><span>Apartamentos</span><strong>{dados.apartamentos}</strong><button type="button" onClick={()=>navigate("/dashboard/apartamentos")}>Ver detalhes <ChevronRight size={12}/></button></div></header>
    {!onboardingComplete&&<section className="ic-dr-onboarding"><div className="ic-dr-section-head"><div><h2>Configure seu condomínio</h2><p>Conclua as etapas iniciais para organizar a operação.</p></div><strong className="ic-dr-step-count">{onboardingDone}/{onboardingSteps.length}</strong></div><div className="ic-dr-steps">{onboardingSteps.map(step=><button type="button" key={step.label} className={step.done?"is-done":""} onClick={()=>navigate(step.to)}>{step.done?<Check size={16}/>:<Plus size={16}/>}<span>{step.label}</span></button>)}</div></section>}
    <div className="ic-dr-groups">{[["Cadastros","Principais registros do condomínio",Users,cadastros],["Operação","Movimentações e atendimento da portaria",Activity,operacao]].map(([title,subtitle,Icon,items])=><section className="ic-dr-panel ic-dr-group" key={title}><div className="ic-dr-section-head"><span className="ic-dr-heading-icon"><Icon size={23}/></span><div><h2>{title}</h2><p>{subtitle}</p></div></div><div className="ic-dr-metrics">{items.map(({key,label,icon:MetricIcon,tone})=><article className={`ic-dr-metric ${tone||""}`} key={key}><span><MetricIcon size={24}/></span><div><h3>{label}</h3><strong>{dados[key]}</strong></div></article>)}</div></section>)}</div>
    <details className="ic-dr-additional"><summary><ClipboardList size={16}/> Demais indicadores do condomínio <ChevronRight size={16}/></summary><div className="ic-dr-additional-grid"><div><Activity size={18}/><span>Operações ativas</span><strong>{totalOperacao}</strong></div>{complementares.map(({key,label,icon:Icon})=><div key={key}><Icon size={18}/><span>{label}</span><strong>{dados[key]}</strong></div>)}</div></details>
    <div className="ic-dr-middle"><section className="ic-dr-panel"><div className="ic-dr-section-head"><span className="ic-dr-heading-icon"><BarChart3 size={23}/></span><div><h2>Visão operacional</h2><p>Quantidade por categoria · dados atuais</p></div><span className="ic-dr-chip">Cadastro atual</span></div><div className="ic-dr-bars">{barras(grafico,maxVisivel)}</div><details className="ic-dr-more-bars"><summary>Ver demais categorias <ChevronRight size={15}/></summary>{barras(maisGraficos,maxGrafico)}</details></section>
     <section className="ic-dr-panel"><div className="ic-dr-section-head"><span className="ic-dr-heading-icon"><Flag size={23}/></span><div><h2>Central de prioridades</h2><p>Informações para acompanhar e agir</p></div></div><div className="ic-dr-priorities">{prioridades.map(({key,label,icon:Icon,to})=><div className="ic-dr-priority" key={key}><span className="ic-dr-priority-icon"><Icon size={19}/></span><span>{label}</span><strong className={dados[key]>0?"has-value":""}>{dados[key]}</strong>{to&&<button type="button" aria-label={`Abrir ${label.toLowerCase()}`} onClick={()=>navigate(to)}><ChevronRight size={18}/></button>}</div>)}</div></section></div>
    <section className="ic-dr-panel ic-dr-activity"><div className="ic-dr-section-head"><span className="ic-dr-heading-icon"><Activity size={23}/></span><div><h2>Movimentações em tempo real</h2><p>Últimas atividades registradas no sistema</p></div><div className="ic-dr-feed-actions"><span className="ic-dr-live"><i/> Atualização a cada 10 s</span><button type="button" className="ic-dr-outline" disabled={clearBusy||!visibleActivities.length} onClick={clearHistory}><Trash2 size={16}/>{clearBusy?"Limpando…":"Limpar histórico"}</button><button type="button" className="ic-dr-text-button" onClick={()=>navigate("/dashboard/relatorios")}>Ver relatórios <ChevronRight size={15}/></button></div></div>
     {feedError&&<p role="alert" className="ic-dr-error">{feedError} O painel pode estar desatualizado.</p>}
     {visibleActivities.length?<div className="ic-dr-table-wrap"><table><thead><tr><th>Evento</th><th>Apartamento</th><th>Responsável pelo registro</th><th>Data e hora</th></tr></thead><tbody>{visibleActivities.map((item,index)=><tr key={`${item.tipo}-${item.id||index}`}><td><div className="ic-dr-event"><span aria-hidden="true">{item.icon}</span><div><strong>{item.titulo}</strong><small>{item.texto || item.tipo}</small></div></div></td><td>{item.apartamento || "—"}</td><td>{item.operador || "Não informado"}</td><td><time dateTime={item.tempo}>{new Date(item.tempo).toLocaleString("pt-BR")}</time></td></tr>)}</tbody></table></div>:<div className="ic-dr-empty"><Activity size={28}/><strong>Nenhuma movimentação nesta visualização</strong><p>Novas atividades aparecem aqui automaticamente. O histórico completo permanece nos módulos e relatórios.</p></div>}
     <p className="ic-dr-footnote"><Shield size={13}/> Limpar afeta somente a sua visualização. Os registros permanecem no sistema.</p>
    </section>
    <nav className="ic-dr-shortcuts" aria-label="Atalhos do painel"><button type="button" onClick={()=>navigate("/dashboard/moradores")}><Users size={17}/> Gerenciar moradores</button><button type="button" onClick={()=>navigate("/dashboard/apartamentos")}><Building2 size={17}/> Gerenciar apartamentos</button><button type="button" onClick={()=>navigate("/dashboard/avisos")}><Megaphone size={17}/> Central do síndico</button><button type="button" onClick={()=>setMostrarManual(true)}><BookOpen size={17}/> Guia rápido</button></nav>
    {mostrarManual&&<div className="ic-dr-modal-overlay" role="presentation"><section className="ic-dr-modal" role="dialog" aria-modal="true" aria-label="Guia rápido do painel"><header><h2>Como usar o painel do síndico</h2><button type="button" aria-label="Fechar guia" onClick={()=>setMostrarManual(false)}><X size={22}/></button></header><ol><li><strong>Cadastre apartamentos.</strong> Configure a estrutura e as unidades reais usadas pelos módulos.</li><li><strong>Cadastre moradores.</strong> Vincule cada pessoa ao apartamento correto.</li><li><strong>Cadastre porteiros.</strong> Cada operador usa seu próprio login.</li><li><strong>Configure as áreas comuns.</strong> Elas estarão disponíveis para reservas.</li><li><strong>Publique avisos.</strong> Use a Central do síndico para os comunicados.</li><li><strong>Acompanhe a operação.</strong> Confira atividades, prioridades e relatórios.</li></ol><button type="button" className="ic-dr-outline" onClick={()=>setMostrarManual(false)}>Entendi</button></section></div>}
  </div>;
}
export default DashboardSindico;
