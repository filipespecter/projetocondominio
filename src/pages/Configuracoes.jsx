import { useState, useEffect } from "react";

function Configuracoes() {

  const [config, setConfig] = useState({
    nomeCondominio: "",
    endereco: "",
    telefone: "",
    sindico: ""
  });


  useEffect(() => {

    const dados = localStorage.getItem("configuracoes");

    if (dados) {
      setConfig(JSON.parse(dados));
    }

  }, []);


  function salvar() {

    localStorage.setItem(
      "configuracoes",
      JSON.stringify(config)
    );

    alert("Configurações salvas com sucesso");

  }


  return (

    <div>

      <h2 style={styles.title}>
        ⚙️ Configurações
      </h2>


      <div style={styles.card}>


        <div style={styles.group}>

          <label>Nome do condomínio</label>

          <input
            type="text"
            value={config.nomeCondominio}
            onChange={(e) =>
              setConfig({
                ...config,
                nomeCondominio: e.target.value
              })
            }
            style={styles.input}
          />

        </div>


        <div style={styles.group}>

          <label>Endereço</label>

          <input
            type="text"
            value={config.endereco}
            onChange={(e) =>
              setConfig({
                ...config,
                endereco: e.target.value
              })
            }
            style={styles.input}
          />

        </div>


        <div style={styles.group}>

          <label>Telefone</label>

          <input
            type="text"
            value={config.telefone}
            onChange={(e) =>
              setConfig({
                ...config,
                telefone: e.target.value
              })
            }
            style={styles.input}
          />

        </div>


        <div style={styles.group}>

          <label>Nome do Síndico</label>

          <input
            type="text"
            value={config.sindico}
            onChange={(e) =>
              setConfig({
                ...config,
                sindico: e.target.value
              })
            }
            style={styles.input}
          />

        </div>


        <button
          style={styles.button}
          onClick={salvar}
        >
          Salvar configurações
        </button>

      </div>

    </div>

  );

}


const styles = {

  title: {
    marginBottom: "20px"
  },

  card: {
    background: "white",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    maxWidth: "700px"
  },

  group: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },

  input: {
    padding: "12px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "14px"
  },

  button: {
    background: "#6c3eb8",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    marginTop: "10px"
  }

};

export default Configuracoes;