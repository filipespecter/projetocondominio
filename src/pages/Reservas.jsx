import { useState, useEffect } from "react";

function Reservas() {

  const [area, setArea] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [obs, setObs] = useState("");

  const [reservas, setReservas] = useState([]);

  // carregar reservas salvas
  useEffect(() => {

    const reservasSalvas = localStorage.getItem("reservas");

    if (reservasSalvas) {
      setReservas(JSON.parse(reservasSalvas));
    }

  }, []);

  // salvar sempre que mudar
  useEffect(() => {

    localStorage.setItem("reservas", JSON.stringify(reservas));

  }, [reservas]);

  function criarReserva() {

    if (!area || !data || !horario) {
      alert("Preencha todos os campos");
      return;
    }

    const novaReserva = {
      id: Date.now(),
      area: area,
      data: data,
      horario: horario,
      obs: obs
    };

    setReservas([...reservas, novaReserva]);

    setArea("");
    setData("");
    setHorario("");
    setObs("");
  }

  function cancelarReserva(id) {
    setReservas(reservas.filter((r) => r.id !== id));
  }

  return (
    <div style={{ padding: 30 }}>

      <h1 style={{ fontSize: 28, marginBottom: 20 }}>
        📅 Reservas
      </h1>

      <div style={{
        background: "#fff",
        padding: 20,
        borderRadius: 10,
        marginBottom: 30,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>

        <h2>Nova Reserva</h2>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>

          <select
            value={area}
            onChange={(e)=>setArea(e.target.value)}
          >
            <option value="">Escolher Área</option>
            <option>Churrasqueira</option>
            <option>Salão de Festas</option>
            <option>Piscina</option>
            <option>Quadra</option>
          </select>

          <input
            type="date"
            value={data}
            onChange={(e)=>setData(e.target.value)}
          />

          <input
            type="time"
            value={horario}
            onChange={(e)=>setHorario(e.target.value)}
          />

          <input
            placeholder="Observação"
            value={obs}
            onChange={(e)=>setObs(e.target.value)}
          />

          <button onClick={criarReserva}>
            Reservar
          </button>

        </div>
      </div>

      <div style={{
        background: "#fff",
        padding: 20,
        borderRadius: 10
      }}>

        <h2>Reservas Feitas</h2>

        {reservas.length === 0 && (
          <p>Nenhuma reserva ainda.</p>
        )}

        {reservas.map((r)=>(
          <div
            key={r.id}
            style={{
              display:"flex",
              justifyContent:"space-between",
              borderBottom:"1px solid #eee",
              padding:"10px 0"
            }}
          >

            <div>
              <strong>{r.area}</strong><br/>
              {r.data} - {r.horario}<br/>
              <small>{r.obs}</small>
            </div>

            <button onClick={()=>cancelarReserva(r.id)}>
              Cancelar
            </button>

          </div>
        ))}

      </div>

    </div>
  );
}

export default Reservas;