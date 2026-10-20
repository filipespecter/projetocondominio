import { useEffect, useState } from "react";
import authApi from "../Services/authApi.js";
import api from "../Services/api.js";
export default function ClientPasswordReset({ client }) {
  const [allowed, setAllowed] = useState(false);
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => { let active = true; authApi.me().then(user => { if (active) setAllowed(["PLATFORM_OWNER", "PLATFORM_ADMIN"].includes(user?.role)); }).catch(() => {}); return () => { active = false; }; }, []);
  if (!allowed || !client.administrator?.id) return null;
  async function submit(event) {
    event.preventDefault(); if (busy) return;
    if (password.length < 12 || password.length > 128) return setMessage("Use entre 12 e 128 caracteres.");
    if (password !== confirmation) return setMessage("A confirmação da senha não corresponde.");
    setBusy(true); setMessage("");
    try {
      await api.post(`/v1/platform/condominiums/${client.id}/users/${client.administrator.id}/temporary-password`, { temporaryPassword: password, passwordConfirmation: confirmation });
      setPassword(""); setConfirmation(""); setOpen(false);
      setMessage(`Senha temporária definida para ${client.administrator.username || client.administrator.email}. Repasse pelo canal combinado. O cliente deverá alterá-la no próximo acesso. Sessões antigas foram encerradas.`);
    } catch (error) { setMessage(error?.message || "Não foi possível redefinir. Confira a ficha antes de repetir."); }
    finally { setBusy(false); }
  }
  return <section style={{marginTop:20,padding:16,border:"1px solid #ddd6fe",borderRadius:12}}>
    <h3>Acesso do administrador do cliente</h3>
    <p>Usuário: <strong>{client.administrator.username || "—"}</strong> · E-mail: {client.administrator.email || "—"}</p>
    <p>Entre pelo portal Síndico / Adm usando o usuário ou e-mail. O código do condomínio não é uma senha.</p>
    {!open && <button type="button" onClick={()=>{setOpen(true);setMessage("");}}>Definir senha temporária</button>}
    {open && <form onSubmit={submit}>
      <p>Esta ação encerra as sessões deste usuário e exige nova senha no primeiro acesso. O status do condomínio e do usuário não será alterado.</p>
      <label style={{display:"block"}}>Senha temporária<input style={{display:"block",maxWidth:"100%"}} type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={password} onChange={e=>setPassword(e.target.value)}/></label>
      <label style={{display:"block"}}>Confirmar senha temporária<input style={{display:"block",maxWidth:"100%"}} type="password" autoComplete="new-password" required maxLength={128} value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label>
      <button disabled={busy} type="submit">{busy?"Salvando…":"Confirmar redefinição"}</button>{" "}
      <button disabled={busy} type="button" onClick={()=>{setPassword("");setConfirmation("");setOpen(false);}}>Cancelar</button>
    </form>}
    {message && <p role="status">{message}</p>}
  </section>;
}
