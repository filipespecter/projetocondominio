import { useState } from "react";
import api from "../Services/api.js";
import ContextHelp from "./ContextHelp.jsx";
export default function OperationalEvidence({
  id,
  kind
}) {
  const maintenance = kind === "maintenance",
    url = maintenance ? `/v1/assets/${id}/maintenance` : `/v1/notices/${id}/assembly`;
  const [open, setOpen] = useState(false),
    [rows, setRows] = useState([]),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
      description: "",
      scheduledAt: "",
      completedAt: "",
      cost: "",
      apartmentId: "",
      present: true,
      topic: "",
      vote: "",
      evidence: "",
      eligibleUnits: "",
      voteFinalized: false
    }),
    [apartments, setApartments] = useState([]);
  async function load() {
    setBusy(true);
    try {
      const result = await api.get(url);
      setRows(result.data);
      if (!maintenance) {
        const a = await api.get("/v1/apartments");
        setApartments(a.data || []);
      }
      setOpen(true);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const payload = maintenance ? {
        description: form.description,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        completedAt: form.completedAt ? new Date(form.completedAt).toISOString() : null,
        costInCents: form.cost === "" ? null : Math.round(Number(form.cost) * 100)
      } : {
        apartmentId: form.apartmentId,
        present: form.present,
        topic: form.topic,
        vote: form.present && form.vote ? form.vote : null,
        evidence: form.evidence,
        voteFinalized: form.voteFinalized,
        eligibleUnits: form.eligibleUnits ? Number(form.eligibleUnits) : null
      };
      await api.post(url, payload);
      await load();
      setMessage("Evidência registrada. O histórico anterior foi preservado.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }
  const input = (label, name, type = "text", required = false) => <label>{label}<input type={type} required={required} value={form[name]} onChange={e => setForm({
      ...form,
      [name]: e.target.value
    })} step={type === "number" ? "0.01" : undefined} min={type === "number" ? 0 : undefined} /></label>;
  return <section className="ic-evidence"><button type="button" disabled={busy} onClick={() => open ? setOpen(false) : load()}>{maintenance ? "Histórico de manutenção" : "Presença e votos da ata"}</button><p role="status">{message}</p>{open && <><ContextHelp label="Como registrar corretamente">{maintenance ? "Agende a manutenção e registre a conclusão real. Não use a alteração de status do ativo como prova de serviço concluído." : "Lançamento administrativo com base em ata/lista de presença. Uma unidade por pauta. Informe a mesma base comprovada de unidades elegíveis para calcular participação. Não representa votação eletrônica ou certificação de quórum."}</ContextHelp><form className="ic-filter-grid" onSubmit={save}>{maintenance ? <>{input("Descrição *", "description", "text", true)}{input("Agendada em *", "scheduledAt", "datetime-local", true)}{input("Concluída em (opcional)", "completedAt", "datetime-local")}{input("Custo em reais", "cost", "number")}</> : <><label>Unidade *<select required value={form.apartmentId} onChange={e => setForm({
              ...form,
              apartmentId: e.target.value
            })}><option value="">Selecione</option>{apartments.map(a => <option key={a.id} value={a.id}>{a.block || ""}/{a.number}</option>)}</select></label>{input("Pauta *", "topic", "text", true)}<label>Presença<select value={String(form.present)} onChange={e => setForm({
              ...form,
              present: e.target.value === "true",
              vote: ""
            })}><option value="true">Presente</option><option value="false">Ausente</option></select></label><label>Voto documentado<select disabled={!form.present} value={form.vote} onChange={e => setForm({
              ...form,
              vote: e.target.value
            })}><option value="">Sem voto registrado</option><option value="YES">Sim</option><option value="NO">Não</option><option value="ABSTAIN">Abstenção</option></select></label><label>Pauta com votação encerrada conforme ata<select value={String(form.voteFinalized)} onChange={e => setForm({
              ...form,
              voteFinalized: e.target.value === "true"
            })}><option value="false">Não atestado</option><option value="true">Sim, consta na ata</option></select></label>{input("Referência da ata/lista *", "evidence", "text", true)}{input("Unidades elegíveis conforme ata", "eligibleUnits", "number")}</>}<button disabled={busy}>Registrar evidência</button></form><div className="ic-table-scroll"><table><thead><tr>{(maintenance ? ["Descrição", "Agendada", "Concluída", "Custo (centavos)", "Ação"] : ["Unidade", "Pauta", "Presença", "Voto", "Evidência"]).map(x => <th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map(x => <tr key={x.id}>{(maintenance ? [x.description, new Date(x.scheduledAt).toLocaleString("pt-BR"), x.completedAt ? new Date(x.completedAt).toLocaleString("pt-BR") : "Pendente", x.costInCents ?? "Não informado"] : [apartments.find(a => a.id === x.apartmentId)?.number || x.apartmentId, x.topic, x.present ? "Presente" : "Ausente", x.vote || "Não registrado", x.evidence]).map((v, i) => <td key={i}>{v}</td>)}{maintenance && <td>{!x.completedAt && <button disabled={busy} onClick={async () => {
                  setBusy(true);
                  try {
                    await api.patch(`/v1/assets/maintenance/${x.id}/complete`, {
                      completedAt: new Date().toISOString()
                    });
                    await load();
                  } catch (e) {
                    setMessage(e.message);
                  } finally {
                    setBusy(false);
                  }
                }}>Registrar conclusão agora</button>}</td>}</tr>)}</tbody></table></div><small>Até 500 evidências recentes. Indicadores respeitam o período selecionado.</small></>}</section>;
}
