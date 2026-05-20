import { useEffect, useState } from "react";

function VisitantesPorteiro() {

  const [visitantes, setVisitantes] = useState([]);

  const [nome, setNome] = useState("");

  const [apartamento, setApartamento] = useState("");

  const [observacao, setObservacao] = useState("");

  useEffect(() => {

    carregarVisitantes();

  }, []);

  function carregarVisitantes() {

    const data =
      JSON.parse(localStorage.getItem("visitantes")) || [];

    setVisitantes(data);

  }

  function cadastrarVisitante() {

    if (!nome || !apartamento) return;

    const novo = {

      id: Date.now(),

      nome,

      apartamento,

      observacao,

      horario: new Date().toLocaleTimeString(),

      status: "aguardando"

    };

    const atualizados = [...visitantes, novo];

    localStorage.setItem(
      "visitantes",
      JSON.stringify(atualizados)
    );

    setVisitantes(atualizados);

    setNome("");

    setApartamento("");

    setObservacao("");

  }

  function alterarStatus(id, novoStatus) {

    const atualizados = visitantes.map((v) =>

      v.id === id
        ? { ...v, status: novoStatus }
        : v

    );

    localStorage.setItem(
      "visitantes",
      JSON.stringify(atualizados)
    );

    setVisitantes(atualizados);

  }

  function excluirVisitante(id) {

    const atualizados = visitantes.filter(
      (v) => v.id !== id
    );

    localStorage.setItem(
      "visitantes",
      JSON.stringify(atualizados)
    );

    setVisitantes(atualizados);

  }

  function corStatus(status) {

    if (status === "aguardando") return "#f59e0b";

    if (status === "liberado") return "#2563eb";

    if (status === "entrou") return "#16a34a";

    if (status === "saiu") return "#6b7280";

    return "#111827";

  }

  return (

    <div style={styles.container}>

      <div style={styles.header}>

        <h1 style={styles.title}>
          Controle de Visitantes
        </h1>

        <p style={styles.subtitle}>
          Gerencie entradas e saídas do condomínio
        </p>

      </div>

      {/* FORM */}

      <div style={styles.form}>

        <input
          placeholder="Nome visitante"
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
          placeholder="Observação"
          value={observacao}
          onChange={(e) =>
            setObservacao(e.target.value)
          }
          style={styles.input}
        />

        <button
          style={styles.button}
          onClick={cadastrarVisitante}
        >
          Cadastrar
        </button>

      </div>

      {/* LISTA */}

      <div style={styles.grid}>

        {visitantes.map((item) => (

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
                {item.horario}
              </p>

              {item.observacao && (

                <p style={styles.obs}>
                  {item.observacao}
                </p>

              )}

              <p
                style={{
                  ...styles.status,
                  color: corStatus(item.status)
                }}
              >

                ● {item.status}

              </p>

            </div>

            <div style={styles.actions}>

              <button
                style={styles.blue}
                onClick={() =>
                  alterarStatus(item.id, "liberado")
                }
              >
                Liberar
              </button>

              <button
                style={styles.green}
                onClick={() =>
                  alterarStatus(item.id, "entrou")
                }
              >
                Entrada
              </button>

              <button
                style={styles.gray}
                onClick={() =>
                  alterarStatus(item.id, "saiu")
                }
              >
                Saída
              </button>

              <button
                style={styles.red}
                onClick={() =>
                  excluirVisitante(item.id)
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
    gridTemplateColumns: "repeat(4,1fr)",
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

  obs: {
    marginTop: "10px",
    fontStyle: "italic",
    color: "#374151"
  },

  status: {
    marginTop: "12px",
    fontWeight: "bold"
  },

  actions: {
    display: "grid",
    gridTemplateColumns: "repeat(2,1fr)",
    gap: "10px"
  },

  blue: {
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    cursor: "pointer"
  },

  green: {
    background: "#16a34a",
    color: "white",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    cursor: "pointer"
  },

  gray: {
    background: "#6b7280",
    color: "white",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    cursor: "pointer"
  },

  red: {
    background: "#dc2626",
    color: "white",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    cursor: "pointer"
  }

};

export default VisitantesPorteiro;