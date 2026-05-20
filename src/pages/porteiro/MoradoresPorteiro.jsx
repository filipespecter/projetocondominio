import { useEffect, useState } from "react";

function MoradoresPorteiro() {

  const [moradores, setMoradores] = useState([]);

  const [nome, setNome] = useState("");

  const [apartamento, setApartamento] = useState("");

  const [bloco, setBloco] = useState("");

  const [telefone, setTelefone] = useState("");

  useEffect(() => {

    carregarMoradores();

  }, []);

  function carregarMoradores() {

    const data =
      JSON.parse(localStorage.getItem("moradores")) || [];

    setMoradores(data);

  }

  function cadastrarMorador() {

    if (!nome || !apartamento) return;

    const novo = {

      id: Date.now(),

      nome,

      apartamento,

      bloco,

      telefone,

      status: "ativo"

    };

    const atualizados = [...moradores, novo];

    localStorage.setItem(
      "moradores",
      JSON.stringify(atualizados)
    );

    setMoradores(atualizados);

    setNome("");

    setApartamento("");

    setBloco("");

    setTelefone("");

  }

  function alterarStatus(id) {

    const atualizados = moradores.map((m) =>

      m.id === id
        ? {
            ...m,
            status:
              m.status === "ativo"
                ? "inativo"
                : "ativo"
          }
        : m

    );

    localStorage.setItem(
      "moradores",
      JSON.stringify(atualizados)
    );

    setMoradores(atualizados);

  }

  function excluirMorador(id) {

    const atualizados = moradores.filter(
      (m) => m.id !== id
    );

    localStorage.setItem(
      "moradores",
      JSON.stringify(atualizados)
    );

    setMoradores(atualizados);

  }

  return (

    <div style={styles.container}>

      <div style={styles.header}>

        <h1 style={styles.title}>
          Moradores
        </h1>

        <p style={styles.subtitle}>
          Gerencie os moradores cadastrados
        </p>

      </div>

      {/* FORM */}

      <div style={styles.form}>

        <input
          placeholder="Nome"
          value={nome}
          onChange={(e) =>
            setNome(e.target.value)
          }
          style={styles.input}
        />

        <input
          placeholder="Apartamento"
          value={apartamento}
          onChange={(e) =>
            setApartamento(e.target.value)
          }
          style={styles.input}
        />

        <input
          placeholder="Bloco"
          value={bloco}
          onChange={(e) =>
            setBloco(e.target.value)
          }
          style={styles.input}
        />

        <input
          placeholder="Telefone"
          value={telefone}
          onChange={(e) =>
            setTelefone(e.target.value)
          }
          style={styles.input}
        />

        <button
          style={styles.button}
          onClick={cadastrarMorador}
        >
          Cadastrar
        </button>

      </div>

      {/* LISTA */}

      <div style={styles.grid}>

        {moradores.map((item) => (

          <div
            key={item.id}
            style={styles.card}
          >

            <div>

              <h3 style={styles.nome}>
                {item.nome}
              </h3>

              <p style={styles.info}>
                Apartamento: {item.apartamento}
              </p>

              <p style={styles.info}>
                Bloco: {item.bloco || "-"}
              </p>

              <p style={styles.info}>
                {item.telefone || "-"}
              </p>

              <p
                style={{
                  ...styles.status,
                  color:
                    item.status === "ativo"
                      ? "#16a34a"
                      : "#dc2626"
                }}
              >

                ● {item.status}

              </p>

            </div>

            <div style={styles.actions}>

              <button
                style={styles.statusButton}
                onClick={() =>
                  alterarStatus(item.id)
                }
              >

                {item.status === "ativo"
                  ? "Inativar"
                  : "Ativar"}

              </button>

              <button
                style={styles.deleteButton}
                onClick={() =>
                  excluirMorador(item.id)
                }
              >
                Excluir
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}

const styles = {

  container: {
    width: "100%"
  },

  header: {
    marginBottom: "30px"
  },

  title: {
    fontSize: "30px",
    marginBottom: "5px",
    color: "#111827"
  },

  subtitle: {
    color: "#6b7280"
  },

  form: {
    background: "white",
    padding: "20px",
    borderRadius: "14px",
    display: "grid",
    gridTemplateColumns: "repeat(5,1fr)",
    gap: "15px",
    marginBottom: "30px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
  },

  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    outline: "none"
  },

  button: {
    background: "#166534",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: "20px"
  },

  card: {
    background: "white",
    borderRadius: "14px",
    padding: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "20px"
  },

  nome: {
    marginBottom: "10px",
    color: "#111827"
  },

  info: {
    color: "#6b7280",
    marginBottom: "5px"
  },

  status: {
    marginTop: "12px",
    fontWeight: "bold"
  },

  actions: {
    display: "flex",
    gap: "10px"
  },

  statusButton: {
    flex: 1,
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    cursor: "pointer"
  },

  deleteButton: {
    flex: 1,
    background: "#dc2626",
    color: "white",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    cursor: "pointer"
  }

};

export default MoradoresPorteiro;