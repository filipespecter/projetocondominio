import {useEffect,useState} from "react";
import {FaEdit,FaCheck,FaTimes} from "react-icons/fa";
import authApi from "../Services/authApi.js";
import api from "../Services/api.js";
import "./ClientProfileEditor.css";

const condominiumFields=[["name","Nome do condomínio","text",true],["legalName","Razão social"],["document","Documento (CPF / CNPJ)"],["contactName","Contato principal"],["email","E-mail do condomínio","email"],["phone","Telefone do condomínio","tel"],["postalCode","CEP"],["addressLine","Rua / avenida"],["addressNumber","Número"],["addressExtra","Complemento"],["neighborhood","Bairro"],["city","Cidade"],["state","UF"]];
const administratorFields=[["name","Nome do administrador","text",true],["username","Usuário de acesso","text",true],["email","E-mail da conta / recuperação","email"],["phone","Telefone do administrador","tel"],["document","Documento do administrador"]];
const billingFields=[["name","Responsável financeiro"],["email","E-mail financeiro","email"],["phone","Telefone financeiro","tel"]];
const limits={name:160,legalName:200,document:30,contactName:160,email:200,phone:30,postalCode:10,addressLine:250,addressNumber:30,addressExtra:120,neighborhood:120,city:120,state:2,username:100};
export default function ClientProfileEditor({client,onSaved}){
 const [allowed,setAllowed]=useState(false),[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[profile,setProfile]=useState(null),[message,setMessage]=useState(""),[success,setSuccess]=useState(false);
 useEffect(()=>{let active=true;authApi.me().then(user=>{if(active)setAllowed(["PLATFORM_OWNER","PLATFORM_ADMIN"].includes(user?.role)&&user?.condominiumId==null);}).catch(()=>{});return()=>{active=false;};},[]);
 if(!allowed)return null;
 async function start(){
  setBusy(true);setMessage("");setSuccess(false);
  try{const response=await api.get(`/v1/platform/condominiums/${client.id}/profile${client.administrator?.id?`?administratorId=${encodeURIComponent(client.administrator.id)}`:""}`);setProfile(response.data);setOpen(true);}catch(error){setMessage(error.message||"Não foi possível abrir a edição.");}finally{setBusy(false);}
 }
 function fieldset(group,title,fields,description){
  if(!profile?.[group])return null;
  return <fieldset><legend>{title}</legend>{description&&<p className="ic-client-edit-note">{description}</p>}<div className="ic-client-edit-grid">{fields.map(([key,label,type="text",required=false])=><label key={key}>{label}{required&&" *"}<input type={type} required={required} maxLength={limits[key]||160} autoComplete="off" value={profile[group][key]||""} onChange={e=>setProfile(current=>({...current,[group]:{...current[group],[key]:e.target.value}}))}/></label>)}</div></fieldset>;
 }
 async function submit(event){
  event.preventDefault();if(busy)return;setBusy(true);setMessage("");setSuccess(false);
  const values=(source,fields)=>Object.fromEntries(fields.map(([key])=>[key,source[key]||""]));
  const data={condominium:{...values(profile.condominium,condominiumFields),expectedUpdatedAt:profile.condominium.updatedAt},administrator:profile.administrator?{...values(profile.administrator,administratorFields),id:profile.administrator.id,expectedUpdatedAt:profile.administrator.updatedAt}:null,billingContact:profile.billingContact?{...values(profile.billingContact,billingFields),id:profile.billingContact.id,expectedUpdatedAt:profile.billingContact.updatedAt}:null};
  try{const response=await api.patch(`/v1/platform/condominiums/${client.id}/profile`,data);onSaved(response.data);setOpen(false);setProfile(null);setSuccess(true);setMessage("Ficha salva. Novos acessos, recuperações e novos documentos usam os dados atualizados. Documentos já emitidos permanecem preservados.");}
  catch(error){setMessage(Array.isArray(error.details)?error.details.map(item=>item.message).join(" "):error.message||"Não foi possível salvar a ficha.");}
  finally{setBusy(false);}
 }
 return <section className="ic-client-editor"><div className="ic-client-editor-head"><div><span>CADASTRO DO CLIENTE</span><h3>Dados cadastrais e contatos</h3><p>Altere os dados nesta ficha. As informações de acesso e financeiras têm campos próprios.</p></div>{!open&&<button type="button" className="ic-client-edit-primary" disabled={busy} onClick={start}><FaEdit/> {busy?"Carregando…":"Editar ficha"}</button>}</div>
 {message&&<p role="status" className={success?"ic-client-edit-success":"ic-client-edit-error"}>{message}</p>}
 {open&&profile&&<form onSubmit={submit}>
 {fieldset("condominium","Condomínio e endereço",condominiumFields)}
 {fieldset("administrator","Administrador e acesso",administratorFields,"Alterar somente o e-mail do condomínio não muda o e-mail de recuperação. Use o campo abaixo. Ao mudar usuário ou e-mail da conta, sessões e códigos antigos são encerrados; a senha permanece a mesma.")}
 {!profile.administrator&&<p className="ic-client-edit-note">Este cliente não possui administrador cadastrado para edição.</p>}
 {fieldset("billingContact","Contato financeiro",billingFields,"Atualiza os contatos da assinatura vigente; plano, valores, vencimentos e status permanecem nos controles existentes.")}
 <div className="ic-client-edit-actions"><button type="button" disabled={busy} className="ic-client-edit-secondary" onClick={()=>{setOpen(false);setProfile(null);setMessage("");}}><FaTimes/> Cancelar</button><button type="submit" disabled={busy} className="ic-client-edit-primary"><FaCheck/> {busy?"Salvando…":"Salvar alterações"}</button></div>
 </form>}
 </section>;
}
