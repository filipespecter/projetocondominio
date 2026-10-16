import { useState } from "react";
import api from "../Services/api.js";

const empty = () => ({name:"",email:"",phone:"",relationship:"",receiveNotices:true,whatsappOptIn:false,canPickup:false});
const unwrap = r => r.data?.data ?? r.data;
export default function ApartmentContacts({ apartments, residents = [] }) {
  const [apartmentId,setApartmentId]=useState("");
  const [contacts,setContacts]=useState([]);
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const [loaded,setLoaded]=useState(false);
  async function load(id) {
    setApartmentId(id);setLoaded(false);setContacts([]);setMessage("");
    if(!id)return;
    setBusy(true);
    try {
      const data=unwrap(await api.get(`/v1/apartments/${id}/contacts`));
      const saved=data.contacts;
      const suggestions=saved.length?saved:residents.filter(r=>r.apartamentoId===id).map(r=>({...empty(),name:r.nome||"",email:r.email||"",phone:r.telefone||"",relationship:r.tipoMorador||"Morador",whatsappOptIn:r.whatsappOptIn===true}));
      setContacts([...suggestions,...Array.from({length:Math.max(0,2-suggestions.length)},empty)]);
      setLoaded(true);
      setMessage(data.complete?"Cadastro completo. Revise as autorizações de cada pessoa.":"Cadastro incompleto: informe no mínimo duas pessoas. Os acessos existentes continuam funcionando.");
    } catch(e) {setMessage(e.message||"Não foi possível carregar os contatos.");}
    finally {setBusy(false);}
  }
  function change(index,key,value) {setContacts(list=>list.map((c,i)=>i===index?{...c,[key]:value}:c));}
  async function save(event) {
    event.preventDefault();setBusy(true);setMessage("");
    try {
      const payload=contacts.map(({id,name,email,phone,relationship,receiveNotices,whatsappOptIn,canPickup})=>({...id?{id}:{},name,email,phone,relationship,receiveNotices,whatsappOptIn,canPickup}));
      const data=unwrap(await api.put(`/v1/apartments/${apartmentId}/contacts`,{contacts:payload}));
      setContacts(data.contacts);setMessage("Contatos e permissões salvos. Nenhum login foi criado para estas pessoas.");
    } catch(e) {setMessage(e.message||"Não foi possível salvar os contatos.");}
    finally {setBusy(false);}
  }
  return <details style={{background:"white",padding:20,borderRadius:16,marginBottom:20}}>
    <summary style={{cursor:"pointer",fontWeight:700}}>Contatos autorizados dos apartamentos — mínimo de duas pessoas</summary>
    <p>Cadastre familiares ou responsáveis com e-mail e celular, sem criar login. Conceder retirada permite receber o código da encomenda.</p>
    <label>Apartamento <select value={apartmentId} disabled={busy} onChange={e=>load(e.target.value)}><option value="">Selecione</option>{apartments.map(a=><option key={a.id} value={a.id}>Bloco {a.block??a.bloco} — {a.number??a.numero}</option>)}</select></label>
    <p role="status">{message}</p>
    {loaded&&<form onSubmit={save}>
      {contacts.map((c,i)=><fieldset key={c.id??i} disabled={busy} style={{marginBottom:12,border:"1px solid #ddd",borderRadius:12,padding:12}}>
        <legend>Pessoa {i+1}</legend>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,220px),1fr))",gap:12}}>
          {[["name","Nome","text"],["email","E-mail","email"],["phone","Celular com DDD/DDI","tel"],["relationship","Vínculo: familiar, responsável…","text"]].map(([key,label,type])=><label key={key} style={{display:"grid",gap:4}}>{label}<input required type={type} value={c[key]} maxLength={key==="phone"?25:key==="email"?254:key==="relationship"?80:150} onChange={e=>change(i,key,e.target.value)}/></label>)}
        </div>
        {[["receiveNotices","Receber avisos de encomendas"],["whatsappOptIn","Esta pessoa autorizou receber avisos por WhatsApp"],["canPickup","Autorizar retirada e envio do código de retirada"]].map(([key,label])=><label key={key} style={{display:"block",marginTop:10}}><input type="checkbox" checked={c[key]} onChange={e=>change(i,key,e.target.checked)}/>{label}</label>)}
        {contacts.length>2&&<button type="button" onClick={()=>setContacts(list=>list.filter((_,index)=>index!==i))}>Remover contato</button>}
      </fieldset>)}
      <button type="button" disabled={busy||contacts.length>=30} onClick={()=>setContacts(list=>[...list,empty()])}>Adicionar pessoa</button>{" "}
      <button disabled={busy} type="submit">{busy?"Salvando…":"Salvar contatos e permissões"}</button>
    </form>}
  </details>;
}
