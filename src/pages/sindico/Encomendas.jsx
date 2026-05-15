import { useState, useEffect } from "react";

function Encomendas() {

  const [morador, setMorador] = useState("");
  const [descricao, setDescricao] = useState("");

  const [encomendas, setEncomendas] = useState([]);

  useEffect(() => {
    const dados = localStorage.getItem("encomendas");
    if (dados) {
      setEncomendas(JSON.parse(dados));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("encomendas", JSON.stringify(encomendas));
  }, [encomendas]);

  function adicionarEncomenda() {

    if (!morador || !descricao) {
      alert("Preencha todos os campos");
      return;
    }

    const nova = {
      id: Date.now(),
      morador,
      descricao,
      data: new Date().toLocaleString(),
      status: "Recebido"
    };

    setEncomendas([...encomendas, nova]);

    setMorador("");
    setDescricao("");
  }

  function entregarEncomenda(id) {

    const atualizadas = encomendas.map((e) =>
      e.id === id ? { ...e, status: "Entregue" } : e
    );

    setEncomendas(atualizadas);
  }

  return (

    <div style={styles.container}>

      <h1>📦 Encomendas</h1>

      {/* FORMULÁRIO */}
      <div style={styles.card}>

        <h2>Registrar encomenda</h2>

        <div style={styles.form}>

          <input
            placeholder="Nome do morador"
            value={morador}
            onChange={(e) => setMorador(e.target.value)}
            style={styles.input}
          />

          <input
            placeholder="Descrição da encomenda"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            style={styles.input}
          />

          <button onClick={adicionarEncomenda} style={styles.button}>
            Registrar
          </button>

        </div>

      </div>

      {/* LISTA */}
      <div style={styles.card}>

        <h2>Lista de Encomendas</h2>

        {encomendas.length === 0 && (
          <p>Nenhuma encomenda registrada.</p>
        )}

        {encomendas.map((e) => (

          <div key={e.id} style={styles.item}>

            <div>

              <strong>{e.morador}</strong><br />
              📦 {e.descricao}<br />
              🕒 {e.data}<br />

              Status:
              <span
                style={{
                  color: e.status === "Entregue" ? "green" : "orange",
                  fontWeight: "bold"
                }}
              >
                {" "}{e.status}
              </span>

            </div>

            <div>

              {e.status === "Recebido" && (
                <button
                  style={styles.btn}
                  onClick={() => entregarEncomenda(e.id)}
                >
                  Marcar como entregue
                </button>
              )}

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}

const styles = {

  container: {
    padding: "20px"
  },

  card: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "10px",
    marginBottom: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
  },

  form: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "10px"
  },

  input: {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc"
  },

  button: {
    backgroundColor: "#6c3eb8",
    color: "white",
    border: "none",
    padding: "10px 15px",
    borderRadius: "6px",
    cursor: "pointer"
  },

  item: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #eee"
  },

  btn: {
    backgroundColor: "green",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer"
  }

};

export default Encomendas;