import {FiCalendar} from "react-icons/fi";
import {useEffect,useState} from "react";
import api from "../Services/api.js";
import {confirmDialog} from "./GlobalDialogs.jsx";
import {downloadReportDocument} from "../utils/reportWorkspaceDocument.js";
import "./OperationalReview.css";
const previous=()=>{const d=new Date();d.setDate(0);return d.toLocaleDateString("sv-SE");};
const periods={WEEKLY:"Semanal",MONTHLY:"Mensal",QUARTERLY:"Trimestral",SEMIANNUAL:"Semestral",ANNUAL:"Anual"};
const endpoint="/v1/management-reports/closure";
const dateLabel=day=>day?.split("-").reverse().join("/");
export default function MonthlyClosure({embedded=false}={}){
 const [mode,setMode]=useState("MONTHLY"),[reference,setReference]=useState(previous),[data,setData]=useState(null),[error,setError]=useState(""),[busy,setBusy]=useState(false),[snapshot,setSnapshot]=useState(null),[message,setMessage]=useState(""),[revision,setRevision]=useState(0);
 useEffect(()=>{
   let active=true;
   const timer=setTimeout(async()=>{
     if(!reference)return;
     try{
       const query=new URLSearchParams({mode,reference,...(snapshot?{snapshotId:snapshot}:{})});
       const r=await api.get(endpoint+"?"+query);
       if(active){setData(r.data);setError("");}
     }catch(e){if(active){setError(e.message);setData(null);}}
   },250);
   return ()=>{active=false;clearTimeout(timer);};
 },[mode,reference,snapshot,revision]);
 function reset(){setSnapshot(null);setData(null);setMessage("");setError("");}
 async function exportFile(format){
   if(busy)return;setBusy(true);setError("");
   try{
     const r=await api.post(endpoint+"/document",{mode,reference,format});
     await downloadReportDocument(r.data.model,format);
     setSnapshot(r.data.snapshotId);
     window.dispatchEvent(new Event("infinitycondo:report-issued"));
     setMessage("Documento emitido. A plataforma deve validar um backup posterior à emissão para liberar o arquivamento.");
   }catch(e){setError(e.message);}finally{setBusy(false);}
 }
 async function close(){
   if(busy||!snapshot||!data?.backupAvailable)return;
   setBusy(true);setError("");
   try{
     if(!await confirmDialog(`Arquivar os concluídos de ${dateLabel(data.start)} a ${dateLabel(data.end)}? Até ${data.summary.packages.eligible} encomendas e ${data.summary.visitors.eligible} visitas. Pendências permanecem ativas e nenhum registro será apagado.`))return;
     const r=await api.post(endpoint+"/close",{mode,reference,snapshotId:snapshot,confirmed:true});
     setMessage(`${r.data.packages} encomendas e ${r.data.visitors} visitas arquivadas. Registros originais preservados.`);
     setSnapshot(null);setRevision(x=>x+1);
   }catch(e){setError(e.message);}finally{setBusy(false);}
 }
 return <section className="ic-monthly" id={embedded?undefined:"fechamento-mensal"}><details open={embedded||new URLSearchParams(window.location.search).has("fechamento")}><summary>{embedded?<><FiCalendar aria-hidden="true"/> Histórico e fechamento</>:"Histórico e fechamento da portaria"}</summary>
   <p className="ic-review-message">Selecione um período encerrado. A limpeza da operação arquiva apenas registros concluídos; o histórico e as pendências são preservados.</p>
   <div className="ic-monthly-actions"><label>Período <select value={mode} disabled={busy} onChange={e=>{setMode(e.target.value);reset();}}>{Object.entries(periods).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
   <label>Data dentro do período <input type="date" value={reference} disabled={busy} onChange={e=>{setReference(e.target.value);reset();}}/></label></div>
   {error&&<p role="alert" className="ic-review-error">{error}</p>}{message&&<p role="status">{message}</p>}
   {data&&<><p><strong>Intervalo:</strong> {dateLabel(data.start)} a {dateLabel(data.end)}</p>
   <div className="ic-monthly-grid">{[["packages","Encomendas"],["visitors","Visitantes"]].map(([k,label])=><div key={k}><strong>{label}</strong><span>{data.summary[k].total} registros do período</span><p>{data.summary[k].pending} pendências · {data.summary[k].eligible} concluídos elegíveis · {data.summary[k].archived} arquivados</p></div>)}</div>
   <div className="ic-monthly-actions">{["PDF","XLSX","CSV"].map(f=><button disabled={busy} key={f} onClick={()=>exportFile(f)}>{busy?"Processando…":embedded&&f==="PDF"?"Gerar fechamento":`Exportar ${f==="XLSX"?"Excel":f}`}</button>)}
   {snapshot&&<button disabled={busy} onClick={()=>setRevision(x=>x+1)}>Atualizar conferência do backup</button>}
   {data.canClose&&<button disabled={busy||!snapshot||!data.backupAvailable} onClick={close}>{embedded?"Limpar registros elegíveis":"Limpar da operação"}</button>}</div>
   <p className="ic-review-message">{snapshot?(data.backupAvailable?"Backup registrado como validado. A integridade será conferida novamente ao confirmar.":"Aguardando backup validado pela plataforma após a emissão. Atualize a conferência depois."):"Emita o relatório antes de arquivar. PDF, Excel e CSV não substituem o backup do banco."} Somente o síndico pode confirmar.</p>
   <div className="ic-monthly-history"><table><thead><tr><th>Responsável</th><th>Data</th><th>Encomendas</th><th>Visitas</th></tr></thead><tbody>{data.history.map(row=><tr key={row.id}><td>{row.userName}</td><td>{new Date(row.createdAt).toLocaleString("pt-BR")}</td><td>{row.afterData.packages}</td><td>{row.afterData.visitors}</td></tr>)}</tbody></table></div>
   </>}
 </details></section>;
}
