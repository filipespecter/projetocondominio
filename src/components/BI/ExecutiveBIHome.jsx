import {biWindowUrl,biChoice} from "../../utils/biWindows.js";
import {useRouteFilters} from "../../utils/useRouteFilters.js";
import {reportLabel} from "../../utils/reportLabels.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line, PieChart, Pie, Cell } from "recharts";
import { Users, UserRoundCheck, Package, PackageCheck, CalendarCheck, ShieldAlert, ChartNoAxesCombined, RefreshCw, Lightbulb, Maximize2, Layers, DoorOpen, ClipboardList } from "lucide-react";
import api from "../../Services/api.js";
import { buildCondominiumThemeVariables } from "../../utils/condominiumTheme.js";

const palette = ["var(--ic-primary-light, #a78bfa)", "#258762", "#9b70ba", "#bd5270", "#4b8eb3", "#b98035", "#70618c"];
const format = (value, suffix = "") => value == null ? "Não disponível" : `${Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}${suffix}`;
const duration = value => value == null ? "Sem amostra" : `${format(value / 3600)} h`;
const filtersQuery = filters => new URLSearchParams(Object.entries(filters).filter(([,v])=>v!=="" && v!=null)).toString();
const periodDay = (value, zone) => new Intl.DateTimeFormat("sv-SE", { timeZone: zone, year:"numeric",month:"2-digit",day:"2-digit" }).format(new Date(value));
const views = [
  ["combined", "Indicadores combinados"], ["packages", "Encomendas × Visitantes"],
  ["reservations", "Reservas × Ocorrências"], ["operations", "Utilização do sistema"],
  ["sessions", "Porteiros e sessões"], ["handovers", "Passagem de serviço"],
  ["modules", "Movimentações por módulo"], ["apartments", "Encomendas por apartamento"],
  ["areas", "Reservas por área"], ["blocks", "Encomendas por bloco"], ["administration", "Gestão administrativa"],
  ["withdrawal","Tempo de retirada"], ["serviceTimes","Tempos de atendimento"], ["communication","Comunicação"],
  ["maintenance","Manutenções"], ["participation","Participação em assembleias"], ["activeUsers","Usuários ativos"]
];
function Rank({ title, rows = [], icon: Icon = Layers }) {
  const max = Math.max(1, ...rows.map(x=>x.total));
  return <section className="ic-v2-panel ic-v2-ranking"><h3><Icon size={19}/>{title}</h3>{rows.length ? rows.slice(0,5).map((row,i)=><div className="ic-v2-rank" key={`${row.name}-${i}`}><span className="ic-v2-position">{i+1}</span><span className="ic-v2-rank-name" title={row.name}>{row.name}</span><span className="ic-v2-track"><i style={{width:`${row.total/max*100}%`}}/></span><strong>{format(row.total)}</strong></div>):<p className="ic-v2-empty-small">Sem registros para os filtros.</p>}</section>;
}
function Ratio({ label, value, index }) {
  return <div className="ic-v2-ratio"><div style={{background:`conic-gradient(${palette[index]} ${value==null?0:Math.min(100,Math.max(0,value))}%, #38354d 0)`}}><strong>{value==null?"—":`${Math.round(value)}%`}</strong></div><span>{label}</span></div>;
}
export default function ExecutiveBIHome({ mode = "analytics" }) {
  const [data,setData] = useState(null), [error,setError] = useState(""), [busy,setBusy] = useState(false);
  const [filters,setFilters] = useRouteFilters({start:"",end:"",operator:"",profile:"",status:"",category:"",module:"",action:""});
  const [view,setView] = useState(()=>biChoice("view",views.map(([id])=>id),"combined")), [unit,setUnit] = useState(()=>biChoice("unit",["daily","weekly","monthly"],"daily")), [kind,setKind] = useState(()=>biChoice("kind",["combined","bar","line"],"combined"));
  const [advanced,setAdvanced] = useState(false);
  const standalone=window.location.pathname==="/bi-analytics";
  const [paused,setPaused]=useState(false),[appliedFilters,setAppliedFilters]=useState({});
  const applied=useRef({}), seq=useRef(0), alive=useRef(true), pending=useRef(false), panel=useRef(null),lastLoaded=useRef(0);
  const load = useCallback(async (params = {}, automatic = false) => {
    if(pending.current)return;
    const current=++seq.current;pending.current=true;setBusy(true);setError("");
    try {
      const response = await api.get(`/v1/analytics/intelligence?${filtersQuery(params)}`);
      if(!alive.current || current!==seq.current)return;
      const next=response.data;
      if(next?.schemaVersion!==2)throw Error("O backend ainda não está na versão deste BI. Atualize o container da Homolog.");
      setData(next);lastLoaded.current=Date.now();
      const canonical={...params,start:periodDay(next.period.start,next.period.timezone),end:periodDay(next.period.end,next.period.timezone)};
      applied.current=canonical;setAppliedFilters(canonical);if(!automatic)setFilters(f=>({...f,...canonical}));
    } catch(e){if(alive.current){setError(e.message || "Não foi possível consultar os indicadores.");if([401,403].includes(e.status))setData(null);}}
    finally{pending.current=false;if(alive.current)setBusy(false);}
  },[]);
  useEffect(()=>{
    alive.current=true;
    const initial=Object.fromEntries(Object.entries(Object.fromEntries(new URLSearchParams(window.location.search))).filter(([k])=>k.startsWith("f_")).map(([k,v])=>[k.slice(2),v]));
    void load(initial);
    return ()=>{alive.current=false;};
  },[load,mode]);
  useEffect(()=>{
    if(!standalone||paused)return;
    const refresh=()=>void load(applied.current,true),onVisible=()=>{if(document.visibilityState==="visible"&&Date.now()-lastLoaded.current>=15000)refresh();};
    const timer=setInterval(refresh,60000);window.addEventListener("focus",onVisible);document.addEventListener("visibilitychange",onVisible);
    return()=>{clearInterval(timer);window.removeEventListener("focus",onVisible);document.removeEventListener("visibilitychange",onVisible);};
  },[standalone,paused,load]);
  const d=data, dash=d?.dashboard;
  const chart = (()=>{
    if(!d)return {rows:[], keys:[]};
    const temporal=dash[unit];
    const timed={combined:[["visitors","Visitantes"],["packages","Encomendas"],["reservations","Reservas"],["occurrences","Ocorrências"]],packages:[["packages","Encomendas"],["visitors","Visitantes"]],reservations:[["reservations","Reservas"],["occurrences","Ocorrências"]],operations:[["operations","Operações auditadas"],["sessions","Sessões iniciadas"]],sessions:[["sessions","Sessões iniciadas"]],handovers:[["handovers","Passagens registradas"]]};
    if(timed[view])return {rows:temporal,keys:view==="operations"&&!d.sessionSummary ? timed[view].slice(0,1) : timed[view], temporal:true};
    if(dash.metricGroups[view])return {rows:dash.metricGroups[view].rows,keys:[["total",dash.metricGroups[view].unit]],temporal:view==="activeUsers", unit:dash.metricGroups[view].unit};
    const rows={modules:d.adoption.byModule,apartments:d.packages.byApartment,areas:d.reservations.byArea,blocks:dash.byBlock,administration:[{name:"Manutenções pendentes",total:d.administration.maintenancePending},{name:"Manutenções concluídas",total:d.administration.maintenanceCompleted},{name:"Contratos a vencer (30d)",total:d.administration.expiring30Days},{name:"Assembleias no período",total:d.administration.assembliesScheduled}]}[view] || [];
    return {rows:rows.slice(0,15),keys:[["total","Registros"]],temporal:false};
  })();
  const hasRecords=chart.rows.some(row=>chart.keys.some(([key])=>Number(row[key])>0));
  const selectView = value => {setView(value);};
  const title=views.find(([id])=>id===view)?.[1];
  const secondary = !d ? [] : ({
    packages:[["Recebimentos",d.packages.total],["Média diária",d.packages.averagePerDay],["Retirada média",duration(d.packages.withdrawalMeanSeconds)],["Retirada mediana",duration(d.packages.withdrawalMedianSeconds)],["Aguardando há 48 h (agora)",d.packages.older48h]],
    reservations:[["Solicitações",d.reservations.total],["Decisão média",duration(d.reservations.decisionMeanSeconds)],["Ocorrências",d.occurrences.total],["Resolução média",duration(d.occurrences.resolutionTime)],["Abertas há 30 dias",d.occurrences.older30Days]],
    sessions:[["Sessões iniciadas",d.sessionSummary?.total],["Operadores com sessão",d.sessionSummary?.operators],["Sessões abertas agora",d.sessionSummary?.open],["Intervalo observado médio",duration(d.sessionSummary?.observedMeanSeconds)]],
    operations:[["Usuários com operação",d.adoption.activeUsers],["Operações auditadas",d.adoption.operations],["Falhas de comunicação",d.communications.failures]],
    handovers:[["Registradas",d.handovers.total],["Pendentes na amostra",d.handovers.pending],["Com ciência",d.handovers.acknowledged],["Resolvidas",d.handovers.resolved],["Alta prioridade pendente",d.handovers.highPriorityPending]],
    administration:[["Manutenções pendentes",d.administration.maintenancePending],["Atrasadas",d.administration.maintenanceOverdue],["Concluídas",d.administration.maintenanceCompleted],["Contratos vencendo em 30 dias",d.administration.expiring30Days],["Assembleias no período",d.administration.assembliesScheduled]]
  }[view] || [["Operações auditadas",d.adoption.operations],["Usuários com operação",d.adoption.activeUsers],["Passagens de serviço",d.handovers.total],["Sessões iniciadas",d.sessionSummary?.total]]);
  const cards = !d?[]:[
    ["Moradores cadastrados",dash.residentsNow,Users,"Estoque atual do condomínio",null],
    ["Visitantes registrados",d.visitors.total,UserRoundCheck,"No período selecionado",d.visitors.variationPercent],
    ["Encomendas pendentes",d.packages.pendingNow,Package,"Posição atual, não histórica",null],
    ["Encomendas retiradas",dash.deliveredFromPeriod,PackageCheck,"Recebidas no período e já retiradas",null],
    ["Reservas aprovadas",dash.approvedReservations,CalendarCheck,"Solicitações criadas no período",null],
    ["Ocorrências registradas",d.occurrences.total,ShieldAlert,"No período selecionado",null]
  ];
  const formatTick=name=>chart.temporal ? (unit==="monthly" && view!=="activeUsers" ? `${name.slice(5,7)}/${name.slice(2,4)}` : `${name.slice(8,10)}/${name.slice(5,7)}`) : String(name).replaceAll("_"," ");
  const enterFullscreen=async()=>{try {await panel.current?.requestFullscreen?.();}catch {setError("O navegador não permitiu tela cheia. Você pode ampliar usando F11.");}};
  return <div className="ic-bi-v2" data-mode={mode} style={d?.theme ? buildCondominiumThemeVariables(d.theme) : undefined}>
    <header className="ic-v2-header"><div className="ic-v2-brand"><span className="ic-v2-brand-icon"><ChartNoAxesCombined size={28}/></span><div><h1>{mode==="monitor"?"BI Monitor":"Central de BI"}</h1><p>{mode==="monitor"?"Acompanhamento operacional do condomínio":"Análise operacional e indicadores do condomínio"}</p></div></div><form className="ic-v2-filters" onSubmit={e=>{e.preventDefault();void load(filters);}}><label>Condomínio<span className="ic-v2-tenant">{d?.condominiumName || "Condomínio autenticado"}</span></label><label>Início<input aria-label="Data inicial" type="date" value={filters.start} onChange={e=>setFilters({...filters,start:e.target.value})}/></label><label>Fim<input aria-label="Data final" type="date" value={filters.end} onChange={e=>setFilters({...filters,end:e.target.value})}/></label><button className="ic-v2-primary" disabled={busy}><RefreshCw size={16} className={busy?"ic-v2-spin":""}/>{busy?"Consultando…":"Atualizar"}</button></form></header>
    <div className="ic-v2-toolbar"><span>{d?`Consulta ${periodDay(d.period.start,d.period.timezone)} a ${periodDay(d.period.end,d.period.timezone)} · Atualizado ${new Date(d.generatedAt).toLocaleString("pt-BR",{timeZone:d.period.timezone})} · ${d.period.timezone}`:"Consulta autorizada ao condomínio da sessão"}{mode==="monitor"?" · Atualização a cada 60 s quando visível":""}</span><div><a className="ic-bi-window-link" href={biWindowUrl("analytics",{filters:appliedFilters,view,unit,kind})} target="_blank" rel="noopener noreferrer">Abrir este gráfico em outra janela</a>{standalone&&<button onClick={()=>{setPaused(!paused);if(paused)void load(applied.current,true);}}>{paused?"Retomar atualização":"Pausar atualização"}</button>}<button onClick={()=>setAdvanced(!advanced)} aria-expanded={advanced}>Filtros avançados</button></div></div>
    {standalone&&<p role="status">{paused?"Atualização pausada":"Atualização automática a cada 60 segundos"}. O navegador pode reduzir a frequência em abas em segundo plano.</p>}
    {advanced && <form className="ic-v2-advanced" onSubmit={e=>{e.preventDefault();void load(filters);}}>{[["module","Módulo",["PACKAGE","VISITOR","RESERVATION","OCCURRENCE","ASSET","CONTRACT","ASSEMBLY","AUTH","SHIFT_HANDOVER"]],["status","Status",d?.options.statuses||[]],["category","Categoria",d?.options.categories||[]]].map(([key,label,options])=><label key={key}>{label}<select value={filters[key]} onChange={e=>setFilters({...filters,[key]:e.target.value})}><option value="">Todos</option>{options.map(o=><option key={o} value={o}>{reportLabel(o)}</option>)}</select></label>)}{d?.options.operators.length>0&&<label>Operador<select value={filters.operator} onChange={e=>setFilters({...filters,operator:e.target.value})}><option value="">Todos</option>{d.options.operators.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label>}{d?.sessionSummary&&<label>Perfil<select value={filters.profile} onChange={e=>setFilters({...filters,profile:e.target.value})}><option value="">Todos</option>{["DOORMAN","MANAGER","CONDOMINIUM_ADMIN","RESIDENT"].map(role=><option key={role} value={role}>{reportLabel(role)}</option>)}</select></label>}<label>Operação<select value={filters.action} onChange={e=>setFilters({...filters,action:e.target.value})}><option value="">Todas</option>{["CREATE","UPDATE","DELETE","LOGIN","LOGOUT"].map(v=><option key={v} value={v}>{reportLabel(v)}</option>)}</select></label><button className="ic-v2-primary" disabled={busy}>Aplicar filtros</button><button type="button" onClick={()=>void load({})} disabled={busy}>Limpar filtros</button></form>}
    {error&&<div className="ic-v2-error" role="alert">{error}</div>}
    {!d&&<div className="ic-v2-loading" role="status">{busy?"Consultando os registros reais do condomínio…":"Nenhum indicador carregado. Clique em Atualizar para tentar novamente."}</div>}
    {d&&<><section className="ic-v2-kpis" aria-label="Indicadores principais">{cards.map(([label,value,Icon,note,change],i)=><article className={`ic-v2-kpi ic-v2-kpi-${i}`} key={label}><span className="ic-v2-kpi-icon"><Icon size={30}/></span><div><strong>{format(value)}</strong><h2>{label}</h2></div><p>{change!=null&&<b>{change>=0?"↑":"↓"} {format(Math.abs(change),"%")} </b>}{change!=null?"vs. período anterior equivalente":note}</p></article>)}</section>
    <div className="ic-v2-main"><section className="ic-v2-panel ic-v2-comparison" ref={panel}><div className="ic-v2-panel-header"><div><h2>Quadro Comparativo</h2><p>Selecione as métricas e explore os registros do período</p></div><div><select aria-label="Agrupamento do gráfico" value={unit} onChange={e=>setUnit(e.target.value)}><option value="daily">Diário</option><option value="weekly">Semanal</option><option value="monthly">Mensal</option></select><select aria-label="Tipo do gráfico" value={kind} onChange={e=>setKind(e.target.value)}><option value="combined">Combinado</option><option value="bar">Barras</option><option value="line">Linhas</option></select><button aria-label="Ampliar gráfico em tela cheia" onClick={enterFullscreen}><Maximize2 size={17}/></button></div></div>
    <div className="ic-v2-views" role="group" aria-label="Quadros comparativos">{views.slice(0,6).filter(([id])=>id!=="sessions"||d.sessionSummary).map(([id,label])=><button key={id} aria-pressed={view===id} className={view===id?"selected":""} onClick={()=>selectView(id)}> {label}</button>)}<select aria-label="Todos os quadros e métricas" value={view} onChange={e=>selectView(e.target.value)}>{views.filter(([id])=>id!=="sessions"||d.sessionSummary).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></div><h3 className="ic-v2-chart-title">{title}</h3>
    <div className="ic-v2-bigchart">{hasRecords?<ResponsiveContainer width="100%" height="100%"><ComposedChart data={chart.rows} margin={{top:12,right:20,bottom:16,left:0}}><CartesianGrid stroke="#8b83a51a" vertical={false}/><XAxis dataKey="name" tickFormatter={formatTick} tick={{fill:"#c3bdd7",fontSize:11}} minTickGap={25} axisLine={{stroke:"#77708e"}}/><YAxis allowDecimals={false} tick={{fill:"#c3bdd7",fontSize:11}} axisLine={false} tickLine={false}/><Tooltip labelFormatter={value=>chart.temporal?`${value} · ${d.period.timezone}`:value} contentStyle={{background:"#252237",border:"1px solid #59516b",borderRadius:10,color:"#fff"}}/><Legend wrapperStyle={{fontSize:12,paddingTop:18}}/>{chart.keys.map(([key,label],i)=>(kind==="bar" || (kind==="combined"&&i===0))?<Bar isAnimationActive={false} key={key} dataKey={key} name={label} fill={palette[i%palette.length]} radius={[4,4,0,0]} maxBarSize={48}/>:<Line isAnimationActive={false} key={key} dataKey={key} name={label} stroke={palette[i%palette.length]} type="monotone" strokeWidth={3} dot={{r:3,fill:palette[i%palette.length]}}/>)}</ComposedChart></ResponsiveContainer>:<div className="ic-v2-empty"><ChartNoAxesCombined size={45}/><strong>Sem registros para este quadro</strong><p>Não há amostra para os filtros selecionados. Nenhuma série foi inventada.</p></div>}</div><div className="ic-v2-metric-strip">{secondary.map(([label,value])=><div key={label}><span>{label}</span><strong>{typeof value==="string"?value:format(value)}</strong></div>)}</div>{view==="sessions"&&<p className="ic-v2-note">Intervalos de sessão e de interação observada não representam jornada ou horas trabalhadas.</p>}{view==="administration"&&<p className="ic-v2-note">Manutenções são a amostra do período. Contratos a vencer são a posição atual de 30 dias; não são parcelas ou contas geradas.</p>}<p className="ic-v2-note">As séries usam datas de cadastro/recebimento. Pendências e situação dos registros refletem a consulta atual. Máximo de 90 dias.</p></section>
    <aside className="ic-v2-panel ic-v2-insights"><h2><Lightbulb size={25}/>Resumo Inteligente</h2><p>Destaques calculados a partir dos registros</p><div className="ic-v2-insight-list">{d.insights.length?d.insights.slice(0,5).map((text,i)=><article key={text}><span style={{color:palette[i%palette.length]}}>{i+1}</span><p>{text}</p></article>):<div className="ic-v2-empty-small">Sem amostra suficiente para gerar destaques verificáveis.</div>}</div><h3>Indicadores do período</h3><div className="ic-v2-ratios"><Ratio label="Retirada da amostra" value={dash.withdrawalPercent} index={0}/><Ratio label="Resolução da amostra" value={dash.resolutionPercent} index={1}/><Ratio label="WhatsApp entregue" value={d.communications.confirmedDeliveryPercent} index={3}/></div><p className="ic-v2-note">— indica falta de base para calcular. Ocupação e satisfação não são inferidas sem dados.</p></aside></div>
    <div className="ic-v2-bottom"><Rank title="Apartamentos com mais encomendas" rows={d.packages.byApartment} icon={Package}/><section className="ic-v2-panel ic-v2-distribution"><h3><DoorOpen size={19}/>Distribuição de movimentações</h3><div>{dash.distribution.some(x=>x.total>0)?<ResponsiveContainer width="100%" height="100%"><PieChart><Pie isAnimationActive={false} data={dash.distribution} nameKey="name" dataKey="total" innerRadius="58%" outerRadius="82%" stroke="none">{dash.distribution.map((row,i)=><Cell key={row.name} fill={palette[i]}/>)}</Pie><Tooltip contentStyle={{background:"#252237",borderRadius:8,color:"#fff"}}/></PieChart></ResponsiveContainer>:<p className="ic-v2-empty-small">Sem movimentações</p>}</div><ul>{dash.distribution.map((row,i)=><li key={row.name}><i style={{background:palette[i]}}/>{row.name}<strong>{format(row.total)}</strong></li>)}</ul></section><Rank title="Reservas por área comum" rows={d.reservations.byArea} icon={CalendarCheck}/><Rank title="Encomendas por bloco" rows={dash.byBlock} icon={Layers}/></div>
    <details className="ic-v2-methodology"><summary><ClipboardList size={16}/>Metodologia e origem dos indicadores</summary><ul>{d.methodology.map(text=><li key={text}>{text}</li>)}</ul></details></>}
  </div>;
}
