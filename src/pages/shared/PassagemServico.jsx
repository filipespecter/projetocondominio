import { useEffect, useState } from "react";
import authApi from "../../Services/authApi.js";
import api from "../../Services/api.js";
export default function PassagemServico() {
  const [actor,setActor] = useState(null);
  const canOperate=actor?.role==="DOORMAN";
  const [items, setItems] = useState([]),
    [page, setPage] = useState(1),
    [title, setTitle] = useState(""),
    [notes, setNotes] = useState(""),
    [priority, setPriority] = useState("NORMAL"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    const r = await api.get(`/v1/handovers?page=${page}`);
    setItems(r.data);
  }
  useEffect(() => {
    let current = true;
    Promise.all([authApi.me(),api.get(`/v1/handovers?page=${page}`)]).then(([user,r]) => {
      if (current) {setActor(user);setItems(r.data);}
    }).catch(e => {
      if (current) {setActor(null);setItems([]);setMessage(e.message);}
    });
    return () => {
      current = false;
    };
  }, [page]);
  async function action(fn) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await fn();
      await load();
      setMessage("Registro salvo.");
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  return <section className="ic-feature-panel"><h1>Passagem de serviço</h1><p>{canOperate?"Registre pendências para o próximo porteiro. O próximo operador confirma ciência pelo próprio login.":"Acompanhamento das passagens registradas pelos porteiros, com autor, horário e confirmação de ciência."} Ciência não significa resolução nem controle de ponto.</p>{canOperate&&<form onSubmit={e => {
      e.preventDefault();
      action(async () => {
        await api.post("/v1/handovers", {
          title,
          notes,
          priority
        });
        setTitle("");
        setNotes("");
      });
    }}><label>Título<input required minLength={3} maxLength={160} value={title} onChange={e => setTitle(e.target.value)} /></label><label>Observações<textarea required minLength={3} maxLength={4000} value={notes} onChange={e => setNotes(e.target.value)} /></label><label>Prioridade<select value={priority} onChange={e => setPriority(e.target.value)}><option value="NORMAL">Normal</option><option value="HIGH">Atenção</option></select></label><button disabled={busy}>Registrar pendência</button></form>}<p role="status">{message}</p>{items.length === 0 && <p>Nenhuma passagem registrada nesta página.</p>}{items.map(item => <article key={item.id}><h2>{item.title}</h2><p style={{
        whiteSpace: "pre-wrap"
      }}>{item.notes}</p><p>{item.createdBy.name} · {new Date(item.createdAt).toLocaleString("pt-BR")} · {item.priority === "HIGH" ? "Atenção" : "Normal"}</p><p>{item.resolvedAt ? `Resolvida em ${new Date(item.resolvedAt).toLocaleString("pt-BR")}${item.resolvedBy?.name?` por ${item.resolvedBy.name}`:""}` : "Pendente"}</p>{canOperate&&item.createdByUserId!==actor.id&&!item.acknowledgements.some(a=>a.userId===actor.id)&&<button disabled={busy} onClick={() => action(() => api.post(`/v1/handovers/${item.id}/acknowledge`, {}))}>Confirmar ciência</button>}{canOperate&&!item.resolvedAt && <button disabled={busy} onClick={() => action(() => api.post(`/v1/handovers/${item.id}/resolve`, {}))}>Marcar como resolvida</button>}<ul>{item.acknowledgements.map(a => <li key={a.userId}>{a.user.name}: ciência em {new Date(a.acknowledgedAt).toLocaleString("pt-BR")}</li>)}</ul></article>)}<button disabled={page === 1 || busy} onClick={() => setPage(page - 1)}>Anterior</button><span> Página {page} </span><button disabled={items.length < 30 || busy} onClick={() => setPage(page + 1)}>Próxima</button></section>;
}
