import { Building2, Layers3, DoorOpen, ShieldCheck, Plus, ChevronRight, Check, X, Trash2 } from "lucide-react";
import "./CondominiumStructure.css";
import "./OperationalReview.css";
import {useEffect,useState} from "react";
import api from "../Services/api.js";
export default function CondominiumStructure({onChange,requestOpen=0}){
 const [data,setData]=useState(null),[open,setOpen]=useState(false),[blocks,setBlocks]=useState([{name:"",floors:[{floor:0,text:""}]}]),[hasBlocks,setHasBlocks]=useState(false),[preview,setPreview]=useState(false),[generate,setGenerate]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 useEffect(()=>{api.get("/v1/apartments/structure").then(r=>{setData(r.data);onChange?.(r.data);if(r.data.structure){setHasBlocks(r.data.structure.hasBlocks);setBlocks(r.data.structure.blocks.map(b=>({...b,floors:b.floors.map(f=>({...f,text:f.numbers.join(", ")}))})));}else if(r.data.existingUnits?.length){const grouped=new Map();for(const u of r.data.existingUnits){if(!grouped.has(u.block))grouped.set(u.block,new Map());const floors=grouped.get(u.block);floors.set(u.floor,[...(floors.get(u.floor)||[]),u.number]);}setHasBlocks([...grouped.keys()].some(b=>b!=="Sem bloco"));setBlocks([...grouped].map(([name,floors])=>({name,floors:[...floors].sort(([a],[b])=>a-b).map(([floor,numbers])=>({floor,text:numbers.join(", ")}))})));}}).catch(e=>setError(e.message));},[]);
 useEffect(()=>{if(requestOpen){setOpen(true);document.getElementById("ic-condominium-structure")?.scrollIntoView({behavior:"smooth",block:"start"});}},[requestOpen]);
 const payload={hasBlocks,generate,blocks:blocks.map(b=>({name:b.name,floors:b.floors.map(f=>({floor:Number(f.floor),numbers:f.text.split(/[,;\n]/).map(n=>n.trim()).filter(Boolean)}))}))};
 const total=payload.blocks.reduce((n,b)=>n+b.floors.reduce((x,f)=>x+f.numbers.length,0),0);
 const change=(i,b)=>{setBlocks(old=>old.map((x,j)=>i===j?b:x));setPreview(false);};
 async function save(){if(busy)return;setBusy(true);setError("");try{const r=await api.put("/v1/apartments/structure",payload);setData(r.data);setPreview(false);setOpen(false);onChange?.(r.data);}catch(e){setError(e.message);}finally{setBusy(false);}}
 const floorCount=blocks.reduce((n,b)=>n+b.floors.length,0);
 return (
  <section id="ic-condominium-structure" className="ic-structure ic-structure-final">
   <header className="ic-structure-heading">
    <span className="ic-structure-brand"><Building2 size={28}/></span>
    <div><span className="ic-structure-eyebrow">GESTÃO DE UNIDADES</span><h2>Estrutura do condomínio</h2><p>Defina blocos, andares e apartamentos para acompanhar a ocupação real.</p></div>
    <button type="button" className={open?"ic-structure-secondary":"ic-structure-primary"} aria-expanded={open} onClick={()=>setOpen(!open)}>{open?<><X size={17}/> Fechar configuração</>:<><Plus size={18}/> {data?.structure?"Editar estrutura":"Configurar estrutura"}</>}</button>
   </header>
   <div className="ic-structure-status"><ShieldCheck size={18}/><span>{data?.metrics.total?`${data.metrics.registered} de ${data.metrics.total} unidades cadastradas · ${data.metrics.registrationPercent.toFixed(1)}% de cadastro concluído · ${data.metrics.occupied} unidades com ocupação confirmada.`:"Seus apartamentos e moradores existentes serão preservados. A capacidade será calculada pela estrutura que você informar."}</span></div>
   {error&&<p className="ic-structure-error" role="alert">{error}</p>}
   {open&&<>
    <nav className="ic-structure-steps" aria-label="Etapas da estrutura"><span className={!preview?"is-current":"is-done"}><b>{preview?<Check size={15}/>:"1"}</b> Definir estrutura</span><i/><span className={preview?"is-current":""}><b>2</b> Conferir e salvar</span></nav>
    <div className="ic-structure-workspace">
     <div className="ic-structure-editor">
      <label className="ic-structure-choice"><input type="checkbox" checked={hasBlocks} onChange={e=>{if(blocks.length>1&&!e.target.checked){setError("Remova os blocos adicionais antes de selecionar edifício sem blocos.");return;}setHasBlocks(e.target.checked);setPreview(false);}}/><span><strong>O condomínio possui blocos</strong><small>Desmarcado: um edifício sem divisão em blocos.</small></span></label>
      {blocks.map((b,i)=><fieldset className="ic-structure-block" key={i}>
       <legend><Building2 size={18}/> {hasBlocks?`Bloco ${i+1}`:"Edifício sem blocos"}</legend>
       {hasBlocks&&<label className="ic-structure-field">Nome do bloco<input value={b.name} placeholder="Ex.: A ou Torre Norte" onChange={e=>change(i,{...b,name:e.target.value})}/></label>}
       <div className="ic-structure-floor-header"><span>Andar</span><span>Apartamentos neste andar</span><span/></div>
       {b.floors.map((f,j)=><div className="ic-structure-floor" key={j}>
        <label className="ic-structure-field"><span className="ic-structure-mobile-label">Andar</span><input aria-label={`Andar ${j+1} do bloco ${i+1}`} type="number" min="-10" max="300" value={f.floor} onChange={e=>change(i,{...b,floors:b.floors.map((x,k)=>j===k?{...x,floor:e.target.value}:x)})}/></label>
        <label className="ic-structure-field"><span className="ic-structure-mobile-label">Apartamentos</span><input aria-label={`Apartamentos do andar ${j+1} do bloco ${i+1}`} required placeholder="Ex.: 101, 102, 103" value={f.text} onChange={e=>change(i,{...b,floors:b.floors.map((x,k)=>j===k?{...x,text:e.target.value}:x)})}/><small>Separe os números por vírgula.</small></label>
        <button type="button" className="ic-structure-remove" aria-label={`Remover andar ${j+1} da prévia do bloco ${i+1}`} onClick={()=>change(i,{...b,floors:b.floors.filter((_,k)=>j!==k)})}><Trash2 size={17}/><span>Remover</span></button>
       </div>)}
       <div className="ic-structure-block-actions"><button type="button" className="ic-structure-secondary" onClick={()=>change(i,{...b,floors:[...b.floors,{floor:b.floors.length,text:""}]})}><Plus size={17}/> Adicionar andar</button>{hasBlocks&&blocks.length>1&&<button type="button" className="ic-structure-remove" onClick={()=>{setBlocks(blocks.filter((_,j)=>j!==i));setPreview(false);}}>Remover bloco da prévia</button>}</div>
      </fieldset>)}
      {hasBlocks&&<button type="button" className="ic-structure-secondary" onClick={()=>{setBlocks([...blocks,{name:"",floors:[{floor:0,text:""}]}]);setPreview(false);}}><Plus size={17}/> Adicionar bloco</button>}
      <label className="ic-structure-choice ic-structure-generate"><input type="checkbox" checked={generate} onChange={e=>{setGenerate(e.target.checked);setPreview(false);}}/><span><strong>Gerar apartamentos ainda não cadastrados</strong><small>Opcional. Serão criados com ocupação “Não informado”, sem duplicar os existentes.</small></span></label>
     </div>
     <aside className="ic-structure-summary" aria-label="Resumo da estrutura preenchida"><span className="ic-structure-eyebrow">RESUMO DA CONFIGURAÇÃO</span><h3>Capacidade prevista</h3><div className="ic-structure-capacity"><DoorOpen size={28}/><strong>{total}</strong><span>apartamentos</span></div><dl><div><dt><Building2 size={16}/>{hasBlocks?"Blocos":"Edifício"}</dt><dd>{blocks.length}</dd></div><div><dt><Layers3 size={16}/>Andares informados</dt><dd>{floorCount}</dd></div><div><dt>Já cadastrados</dt><dd>{data?.metrics.registered??"—"}</dd></div></dl><p><ShieldCheck size={18}/> Preencher a estrutura não marca apartamentos como ocupados.</p><button type="button" className="ic-structure-primary" onClick={()=>setPreview(true)}>Conferir prévia <ChevronRight size={18}/></button><small>Revise antes de confirmar. Nenhuma unidade existente será apagada.</small></aside>
    </div>
    {preview&&<section className="ic-structure-preview" aria-label="Prévia para confirmação"><div className="ic-structure-preview-title"><span><Check size={22}/></span><div><h3>Confira a estrutura antes de salvar</h3><p>{total} apartamentos previstos em {floorCount} andares informados.</p></div></div><div className="ic-structure-preview-blocks">{payload.blocks.map((b,i)=><article key={i}><strong>{hasBlocks?b.name:"Edifício sem blocos"}</strong>{b.floors.map((f,j)=><p key={j}><b>Andar {f.floor}</b><span>{f.numbers.join(", ")||"Nenhum apartamento informado"}</span></p>)}</article>)}</div><div className="ic-structure-footer"><p>{generate?"Serão criadas somente unidades ausentes, sem ocupação presumida.":"A estrutura será salva; apartamentos poderão ser cadastrados individualmente depois."}</p><button type="button" className="ic-structure-primary" disabled={busy||!total} onClick={save}><Check size={18}/>{busy?"Salvando…":"Confirmar e salvar estrutura"}</button></div></section>}
   </>}
  </section>
 );
}
