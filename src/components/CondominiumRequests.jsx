import {useEffect,useState} from "react";
import QRCode from "qrcode";
import api from "../Services/api.js";
import {confirmDialog} from "./GlobalDialogs.jsx";
import {mascaraCNPJ} from "../utils/mascaras.js";

const brl=cents=>(cents/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const endpoint="/v1/configuration/requests";
function PixInstructions({code,base64}) {
 const [qr,setQr]=useState("");
 const [feedback,setFeedback]=useState("");
 useEffect(()=>{
  let active=true;
  setQr("");
  setFeedback("");
  if(code) QRCode.toDataURL(code,{width:220,margin:4}).then(value=>{if(active)setQr(value);}).catch(()=>{});
  return ()=>{active=false;};
 },[code]);
 return <div>
  {(base64||qr)&&<img src={base64?`data:image/png;base64,${base64}`:qr} width="220" height="220" style={{maxWidth:"100%",height:"auto"}} alt="QR Code para pagar esta cobrança por Pix"/>}
  {code&&<><label>Pix copia e cola<textarea readOnly value={code}/></label>
  <button type="button" className="ic-pkg-outline" onClick={async()=>{
   try{await navigator.clipboard.writeText(code);setFeedback("Código Pix copiado.");}
   catch{setFeedback("Selecione e copie o código no campo acima.");}
  }}>Copiar Pix</button></>}
  {feedback&&<span role="status"> {feedback}</span>}
 </div>;
}

export default function CondominiumRequests({mode,condominium}){
 const [charges,setCharges]=useState([]),[expanded,setExpanded]=useState(null),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{if(mode!=="PAY")return;let active=true;api.get("/v1/configuration/subscription-charges").then(r=>{if(active)setCharges(r.data);}).catch(e=>{if(active)setMessage(e.message);});const reload=()=>api.get("/v1/configuration/subscription-charges").then(r=>{if(active)setCharges(r.data);}).catch(e=>{if(active)setMessage(e.message);});window.addEventListener("focus",reload);return()=>{active=false;window.removeEventListener("focus",reload);};},[mode]);
 async function refresh(){
  const result=await api.get("/v1/configuration/subscription-charges");
  setCharges(result.data);
 }
 async function issue(id,method,switchFromPix=false,switchFromBoleto=false){
  if(busy)return;
  if(switchFromPix&&!await confirmDialog("O Pix anterior será cancelado antes da emissão do boleto. Deseja continuar?",{title:"Trocar para boleto?",danger:true}))return;
  if(switchFromBoleto&&!await confirmDialog("O boleto será cancelado antes de abrir o cartão. Não prossiga se você já pagou o boleto, mesmo se ainda estiver pendente no sistema. Deseja continuar?",{title:"Trocar para cartão?",danger:true}))return;
  setBusy(true);setMessage("");
  try{
   const response=await api.post(`/v1/configuration/subscription-charges/${id}/issue`,{method,switchFromPix,switchFromBoleto});
   if(method==="CARD"){window.location.assign(response.data.url);return;}
   setExpanded(id);
   setMessage("Confira os dados da cobrança.");
  }catch(error){setMessage(error.message);}
  finally{
   try{await refresh();}catch(error){setMessage(error.message);}
   setBusy(false);
  }
 }
 async function send(e){
  e.preventDefault();if(busy)return;setBusy(true);setMessage("");
  const form=e.currentTarget,fields=Object.fromEntries(new FormData(form));
  if(fields.cnpj)fields.cnpj=String(fields.cnpj).replace(/\D/g,"");
  try{const r=await api.post(endpoint,{kind:mode,...fields});setMessage(`Solicitação #${r.data.ticketNumber} enviada. Aguardando a Central.`);form.reset();}
  catch(error){setMessage(error.message);}finally{if(form.elements.password)form.elements.password.value="";setBusy(false);}
 }
 return <section className="ic-nov-card">
  <h2>{mode==="PAY"?"Assinatura InfinityCondo":mode==="RESET"?"Área de risco":"Alterar CNPJ"}</h2>
  {mode==="PAY"&&<>
   <p>Mensalidades do condomínio. A primeira cobrança fica disponível a partir de 30 dias de uso, conforme o ciclo da assinatura.</p>
   <button type="button" className="ic-pkg-outline" disabled={busy} onClick={()=>refresh().catch(e=>setMessage(e.message))}>Atualizar cobranças</button>
   {!charges.length&&<p>Nenhuma cobrança disponível.</p>}
   <ul>{charges.map(c=>{
     const pix=Boolean(c.pixCopyPaste||c.pixQrCodeBase64);
     const boleto=Boolean(c.boletoBarcode||(!pix&&c.paymentUrl?.startsWith("https://")));
     const date=value=>value?.slice(0,10).split("-").reverse().join("/");
     return <li key={c.id}><strong>{brl(c.amountInCents)}</strong> · Vencimento: {date(c.dueDate)} · {c.checking?"Em verificação":({PENDING:"Pendente",OVERDUE:"Vencida",PAID:"Paga",FAILED:"Falhou",CANCELED:"Cancelada",REFUNDED:"Estornada"})[c.status]??c.status}
      {c.status==="PAID"&&c.paidAt&&<p>Pagamento confirmado em {date(c.paidAt)}.</p>}
      {c.discountInCents>0&&<p>Preço oficial: {brl(c.officialPriceInCents)} · Desconto: {brl(c.discountInCents)}</p>}
      {c.canChoose&&<p>
       <button type="button" className="ic-pkg-primary" disabled={busy} onClick={()=>issue(c.id,"PIX")}>Pagar com Pix</button>{" "}
       <button type="button" className="ic-pkg-outline" disabled={busy} onClick={()=>issue(c.id,"BOLETO")}>Pagar com boleto</button>
      </p>}
      {(c.canStartCard||c.hasOpenCardCheckout)&&<p><button type="button" className="ic-pkg-outline" disabled={busy} onClick={()=>issue(c.id,"CARD")}>{c.hasOpenCardCheckout?"Continuar pagamento com cartão":"Pagar com cartão de crédito"}</button></p>}
      {c.canSwitchBoletoToCard&&<p><button type="button" className="ic-pkg-outline" disabled={busy} onClick={()=>issue(c.id,"CARD",false,true)}>Trocar boleto por cartão</button></p>}
      {c.canSwitchToBoleto&&<p><button type="button" className="ic-pkg-outline" disabled={busy} onClick={()=>issue(c.id,"BOLETO",true)}>Trocar Pix por boleto</button></p>}
      {(pix||boleto)&&<p><button type="button" className="ic-pkg-outline" aria-expanded={expanded===c.id} onClick={()=>setExpanded(expanded===c.id?null:c.id)}>{expanded===c.id?"Ocultar dados":pix?"Ver Pix":"Ver boleto"}</button></p>}
      {expanded===c.id&&<>
       {pix&&<PixInstructions code={c.pixCopyPaste} base64={c.pixQrCodeBase64}/>}
       {boleto&&c.paymentUrl?.startsWith("https://")&&<p><a href={c.paymentUrl} target="_blank" rel="noreferrer">Abrir boleto</a></p>}
       {c.boletoBarcode&&<label>Linha digitável<input readOnly value={c.boletoBarcode}/><button type="button" className="ic-pkg-outline" onClick={async()=>{try{await navigator.clipboard.writeText(c.boletoBarcode);setMessage("Linha digitável copiada.");}catch{setMessage("Selecione e copie a linha digitável.");}}}>Copiar linha digitável</button></label>}
      </>}
      {c.hasPayment&&!c.checking&&!pix&&!boleto&&!c.hasOpenCardCheckout&&["PENDING","OVERDUE","FAILED"].includes(c.status)&&<p>Os dados do pagamento emitido não estão disponíveis. Peça a conferência da Central antes de tentar outro meio.</p>}
     </li>;
   })}</ul>
   <h3>Pagamento antecipado</h3><p>Antes do ciclo normal, solicite a liberação da próxima mensalidade à Central.</p>
  </>}
  <form onSubmit={send}>
   {mode==="PAY"?<label>Próxima mensalidade<select name="method"><option value="PIX">Pix</option><option value="BOLETO">Boleto</option><option value="CARD">Cartão de crédito</option></select></label>:mode==="CNPJ"?<label>Novo CNPJ<input name="cnpj" inputMode="numeric" pattern="[0-9]{2}\.[0-9]{3}\.[0-9]{3}/[0-9]{4}-[0-9]{2}" title="Informe os 14 dígitos do CNPJ." placeholder="00.000.000/0000-00" maxLength={18} onChange={e=>{e.target.value=mascaraCNPJ(e.target.value.replace(/\D/g,""));}} required/></label>:<>
   <p>O pedido vai para revisão da Central. Nenhum dado é apagado nesta etapa.</p>
   <label>Digite REINICIAR {condominium}<input name="confirmation" required/></label>
   <label>Seu usuário<input name="username" autoComplete="username" required/></label>
   <label>Sua senha<input name="password" type="password" autoComplete="current-password" required/></label>
   </>}
   <button className="ic-pkg-primary" disabled={busy}>{mode==="PAY"?"Solicitar pagamento antecipado":"Enviar solicitação à Central"}</button>
  </form>
  {message&&<p role="status">{message}</p>}
 </section>;
}
