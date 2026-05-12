import { useState, useEffect } from "react";

function Visitantes() {

  const [nome, setNome] = useState("");
  const [documento, setDocumento] = useState("");
  const [data, setData] = useState("");

  const [visitantes, setVisitantes] = useState([]);

  useEffect(() => {

    const dados = localStorage.getItem("visitantes");

    if (dados) {
      setVisitantes(JSON.parse(dados));
    }

  }, []);

  useEffect(() => {

    localStorage.setItem("visitantes", JSON.stringify(visitantes));

  }, [visitantes]);

  function cadastrarVisitante() {

    if (!nome || !documento || !data) {
      alert("Preencha todos os campos");
      return;
    }

    const novoVisitante = {
      id: Date.now(),
      nome,
      documento,
      data,
      status: "Aguardando"
    };

    setVisitantes([...visitantes, novoVisitante]);

    setNome("");
    setDocumento("");
    setData("");
  }

  function liberarEntrada(id) {

    const atualizados = visitantes.map((v) =>
      v.id === id ? { ...v, status: "Liberado" } : v
    );

    setVisitantes(atualizados);

  }

  return (

    <div style={{ padding: 30 }}>

      <h1>🚪 Controle de Visitantes</h1>

      <div style={{
        background:"#fff",
        padding:20,
        borderRadius:10,
        marginBottom:30
      }}>

        <h2>Cadastrar Visitante</h2>

        <div style={{display:"flex",gap:10}}>

          <input
            placeholder="Nome do visitante"
            value={nome}
            onChange={(e)=>setNome(e.target.value)}
          />

          <input
            placeholder="Documento"
            value={documento}
            onChange={(e)=>setDocumento(e.target.value)}
          />

          <input
            type="date"
            value={data}
            onChange={(e)=>setData(e.target.value)}
          />

          <button onClick={cadastrarVisitante}>
            Autorizar
          </button>

        </div>

      </div>

      <div style={{
        background:"#fff",
        padding:20,
        borderRadius:10
      }}>

        <h2>Visitantes Autorizados</h2>

        {visitantes.length === 0 && (
          <p>Nenhum visitante cadastrado.</p>
        )}

        {visitantes.map((v)=>(
          <div
            key={v.id}
            style={{
              display:"flex",
              justifyContent:"space-between",
              borderBottom:"1px solid #eee",
              padding:"10px 0"
            }}
          >

            <div>
              <strong>{v.nome}</strong><br/>
              Documento: {v.documento}<br/>
              Data: {v.data}<br/>
              Status: {v.status}
            </div>

            {v.status === "Aguardando" && (
              <button onClick={()=>liberarEntrada(v.id)}>
                Liberar Entrada
              </button>
            )}

          </div>
        ))}

      </div>

    </div>

  );

}

export default Visitantes;