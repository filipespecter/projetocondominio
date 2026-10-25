import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../Services/api.js";
const labels = {
  id: "Identificador",
  number: "Apartamento",
  block: "Bloco",
  floor: "Andar",
  name: "Nome",
  description: "Descrição",
  trackingCode: "Rastreamento",
  status: "Situação",
  receivedAt: "Recebida em",
  deliveredAt: "Retirada em",
  enteredAt: "Entrada",
  exitedAt: "Saída",
  reservationDate: "Data",
  startTime: "Início",
  endTime: "Fim",
  purpose: "Finalidade",
  reviewReason: "Motivo da decisão",
  title: "Título",
  category: "Categoria",
  createdAt: "Registrada em",
  resolvedAt: "Resolvida em",
  resolution: "Solução",
  commonArea: "Área",
  apartment: "Apartamento",
  user: "Morador",
  apartmentId: "Identificador do apartamento"
};
const display = v => v === null || v === undefined ? "Não registrado" : typeof v === "object" ? Object.values(v).filter(Boolean).join(" / ") : String(v);
export default function SearchRecord() {
  const [params, setParams] = useSearchParams();
  const id = params.get("registro"),
    type = params.get("tipo");
  const [result, setResult] = useState(null),
    [error, setError] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    if (!id || !type) return;
    let live = true;
    api.get(`/v1/search/record?${new URLSearchParams({
      id,
      type
    })}`).then(r => {
      if (live) {
        setResult(r.data);
        setError("");
      }
    }).catch(e => {
      if (live) {
        setError(e.message);
        setResult(null);
      }
    });
    return () => {
      live = false;
    };
  }, [id, type]);
  useEffect(() => {
    if (id && type && !ref.current?.open) ref.current?.showModal();
  }, [id, type]);
  function close() {
    const next = new URLSearchParams(params);
    next.delete("registro");
    next.delete("tipo");
    next.delete("q");
    setParams(next, {
      replace: true
    });
    setResult(null);
  }
  if (!id || !type) return null;
  return <dialog ref={ref} className="ic-record-dialog" onCancel={close} aria-labelledby="ic-record-title"><h2 id="ic-record-title">{type} selecionado</h2><button autoFocus onClick={close}>Fechar registro</button>{error ? <p role="alert">{error}</p> : result ? <><dl>{Object.entries(result.record).map(([k, v]) => <div key={k}><dt>{labels[k] || k}</dt><dd>{display(v)}</dd></div>)}</dl>{result.linked && Object.entries(result.linked).map(([k, rows]) => <section key={k}><h3>{{
            packages: "Últimas encomendas",
            visitors: "Últimos visitantes",
            reservations: "Últimas reservas"
          }[k]}</h3>{rows.length ? rows.map(row => <p key={row.id}><button onClick={() => {
            const next = new URLSearchParams(params);
            next.set("registro", row.id);
            next.set("tipo", {
              packages: "Encomenda",
              visitors: "Visitante",
              reservations: "Reserva"
            }[k]);
            setResult(null);
            setParams(next);
          }}>{row.description || row.name || row.reservationDate || "Reserva"} · {row.status}</button></p>) : <p>Sem registros autorizados.</p>}<small>Até 10 registros recentes por módulo.</small></section>)}</> : <p role="status">Carregando registro autorizado…</p>}</dialog>;
}
