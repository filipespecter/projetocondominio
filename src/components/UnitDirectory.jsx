import {useState} from "react";
import "./UnitDirectory.css";
export function unitLabel(unit) {
  return [unit.block ?? unit.bloco, unit.number ?? unit.numero].filter(Boolean).join(" · ") || "Sem unidade";
}
export default function UnitDirectory({units,onOpen,noun,action}) {
  const [block,setBlock]=useState("");
  const [page,setPage]=useState(1);
  const blocks=[...new Set(units.map(u=>u.block ?? u.bloco).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR",{numeric:true}));
  const filtered=units.filter(u=>!block||(u.block??u.bloco)===block).sort((a,b)=>unitLabel(a).localeCompare(unitLabel(b),"pt-BR",{numeric:true}));
  const pages=Math.max(1,Math.ceil(filtered.length/12)),current=Math.min(page,pages);
  return <div className="ic-unit-directory">
    <label>Bloco <select value={block} onChange={e=>{setBlock(e.target.value);setPage(1);}}><option value="">Todos os blocos</option>{blocks.map(b=><option key={b}>{b}</option>)}</select></label>
    {!filtered.length&&<p>Nenhuma unidade corresponde aos filtros.</p>}
    <div className="ic-unit-directory-grid">{filtered.slice((current-1)*12,current*12).map(u=><article key={u.id}>
      <span className="ic-unit-tag">Unidade</span>
      <h3>{unitLabel(u)}</h3>
      <p>{u.count} {noun}</p>
      <button type="button" onClick={()=>onOpen(u)}>{action} <span aria-hidden="true">→</span></button>
    </article>)}</div>
    {pages>1&&<nav aria-label="Páginas de unidades"><button type="button" disabled={current===1} onClick={()=>setPage(current-1)}>Anterior</button><span>Página {current} de {pages}</span><button type="button" disabled={current===pages} onClick={()=>setPage(current+1)}>Próxima</button></nav>}
  </div>;
}
