import { useEffect, useState } from "react";
import platformApi from "../../Services/platformApi.js";
import { PlatformButton, PlatformCard, PlatformEmpty, PlatformError, PlatformLoading, PlatformPageHeader } from "../../components/PlatformUi.jsx";

const premiumCodes = new Set(["EXPENSES","EXPENSE_EXPORT","PACKAGE_PROOF","ADVANCED_REPORTS","BI_DASHBOARD","WHATSAPP","AI_ASSISTANT"]);

function money(cents){ return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(cents??0)/100); }

function PlatformPlans(){
  const [items,setItems]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
  async function load(){setLoading(true);setError("");try{let plans=await platformApi.plans.list();if(!Array.isArray(plans)||plans.length===0){plans=await platformApi.plans.active();}setItems(Array.isArray(plans)?plans:[]);}catch(err){setError(err?.message??"Falha ao carregar planos.");}finally{setLoading(false);}}
  useEffect(()=>{load();},[]);
  async function toggle(plan){try{if(plan.active===true||plan.status==="ACTIVE"||plan.isActive===true) await platformApi.plans.deactivate(plan.id); else await platformApi.plans.activate(plan.id); await load();}catch(err){setError(err?.message??"Não foi possível alterar o plano.");}}
  if(loading) return <PlatformLoading text="Carregando planos..."/>;
  return <div>
    <PlatformPageHeader eyebrow="COMERCIAL" title="Planos InfinityCondo" description="Básico para a operação essencial. Completo para gestão avançada, financeiro, BI, comprovantes e automações." />
    <PlatformError message={error}/>
    {items.length===0?<PlatformCard><PlatformEmpty text="Nenhum plano cadastrado."/></PlatformCard>:
      <div style={styles.grid}>{items.map(plan=>{
        const enabled=(plan.planFeatures??[]).filter(x=>x.enabled).map(x=>x.feature).filter(Boolean);
        const disabled=(plan.planFeatures??[]).filter(x=>!x.enabled).map(x=>x.feature).filter(Boolean);
        const complete=String(plan.code).toUpperCase()==="COMPLETO";
        return <article key={plan.id} style={{...styles.card,...(complete?styles.complete:{})}}>
          {complete&&<div style={styles.ribbon}>RECOMENDADO</div>}
          <div style={styles.top}><div><span style={styles.code}>{plan.code}</span><h2 style={styles.title}>{plan.name}</h2><p style={styles.desc}>{plan.description}</p></div><span style={{...styles.status,background:plan.active?"#dcfce7":"#f3f4f6",color:plan.active?"#166534":"#6b7280"}}>{plan.active?"ATIVO":"INATIVO"}</span></div>
          <div style={styles.price}><strong>{money(plan.monthlyPriceInCents)}</strong><span>/ mês</span></div>
          <div style={styles.section}><h3>Recursos do plano</h3>
            {enabled.length===0&&String(plan.code).toUpperCase()==="BASICO"?<p style={styles.baseText}>Inclui toda a operação essencial: apartamentos, moradores, porteiros, visitantes, prestadores, encomendas, reservas, áreas comuns, avisos, ocorrências, sugestões, notificações e PWA.</p>:null}
            {enabled.map(f=><div style={styles.feature} key={f.id}><span style={styles.check}>✓</span><div><strong>{f.name}</strong><small>{f.description}</small></div></div>)}
            {disabled.filter(f=>premiumCodes.has(f.code)).map(f=><div style={{...styles.feature,opacity:.55}} key={f.id}><span style={styles.lock}>🔒</span><div><strong>{f.name}</strong><small>Disponível no Plano Completo</small></div></div>)}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}><span style={{fontSize:12,color:"#6b7280",fontWeight:700}}>{plan._count?.subscriptions ?? 0} assinatura(s) vinculada(s)</span><PlatformButton variant="secondary" onClick={()=>toggle(plan)}>{plan.active?"Desativar plano":"Ativar plano"}</PlatformButton></div>
        </article>;
      })}</div>}
    <PlatformCard style={{marginTop:18}}><strong>Regra comercial aplicada</strong><p style={styles.note}>Segurança, recuperação de senha, PWA, isolamento de dados e suporte básico nunca são bloqueados por plano. Mercado Pago é infraestrutura de cobrança da Star Infinity Code e não é benefício do Completo.</p></PlatformCard>
  </div>;
}
const styles={grid:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:18},card:{position:"relative",padding:26,borderRadius:28,background:"linear-gradient(145deg,#fff,#faf7ff)",border:"1px solid #ede9fe",boxShadow:"0 18px 50px rgba(76,29,149,.10)",overflow:"hidden"},complete:{background:"radial-gradient(circle at top right,rgba(168,85,247,.18),transparent 32%),linear-gradient(145deg,#fff,#f7f0ff)",border:"1px solid #c4b5fd",boxShadow:"0 24px 65px rgba(91,33,182,.18)"},ribbon:{position:"absolute",right:18,top:18,padding:"7px 11px",borderRadius:999,background:"linear-gradient(135deg,#6d28d9,#a855f7)",color:"white",fontSize:10,fontWeight:900,letterSpacing:1},top:{display:"flex",justifyContent:"space-between",gap:14,alignItems:"flex-start"},code:{fontSize:10,fontWeight:900,letterSpacing:1.5,color:"#7c3aed"},title:{fontSize:27,margin:"6px 0",color:"#24113c"},desc:{color:"#6b7280",lineHeight:1.5,maxWidth:520},status:{padding:"7px 10px",borderRadius:999,fontSize:10,fontWeight:900},price:{display:"flex",alignItems:"baseline",gap:7,margin:"22px 0",paddingBottom:20,borderBottom:"1px solid #ede9fe"},section:{display:"grid",gap:10,marginBottom:20},feature:{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 0"},featureSmall:{},check:{width:24,height:24,borderRadius:8,background:"#ede9fe",color:"#6d28d9",display:"grid",placeItems:"center",fontWeight:900},lock:{width:24},baseText:{padding:14,borderRadius:14,background:"#faf7ff",color:"#5b4b67",lineHeight:1.55},note:{marginBottom:0,color:"#6b7280",lineHeight:1.6}};
export default PlatformPlans;
