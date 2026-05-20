import { useEffect, useState } from "react";

function PackageModal({
  apartamento,
  onClose
}) {

  const [descricao, setDescricao] = useState("");

  const [encomendas, setEncomendas] = useState([]);

  useEffect(() => {
    carregarEncomendas();
  }, []);

  function carregarEncomendas() {

    const data =
      JSON.parse(localStorage.getItem("encomendas")) || [];

    const filtradas = data.filter(
      (e) => e.apartamento === apartamento
    );

    setEncomendas(filtradas);

  }

  function registrarEncomenda() {

    if (!descricao) return;

    const todas =
      JSON.parse(localStorage.getItem("encomendas")) || [];

    const nova = {

      id: Date.now(),

      apartamento,

      descricao,

      status: "pendente",

      data: new Date().toLocaleString()

    };

    const atualizadas = [...todas, nova];

    localStorage.setItem(
      "encomendas",
      JSON.stringify(atualizadas)
    );

    setDescricao("");

    carregarEncomendas();

  }

  function retirarEncomenda(id) {

    const todas =
      JSON.parse(localStorage.getItem("encomendas")) || [];

    const atualizadas = todas.map((e) =>

      e.id === id
        ? { ...e, status: "retirada" }
        : e

    );

    localStorage.setItem(
      "encomendas",
      JSON.stringify(atualizadas)
    );

    carregarEncomendas();

  }

  function excluirEncomenda(id) {

    const todas =
      JSON.parse(localStorage.getItem("encomendas")) || [];

    const atualizadas = todas.filter(
      (e) => e.id !== id
    );

    localStorage.setItem(
      "encomendas",
      JSON.stringify(atualizadas)
    );

    carregarEncomendas();

  }

  return (

    <div style={styles.overlay}>

      <div style={styles.modal}>

        <h2>
          Apartamento {apartamento}
        </h2>

        <input
          placeholder="Descrição da encomenda"
          value={descricao}
          onChange={(e) =>
            setDescricao(e.target.value)
          }
          style={styles.input}
        />

        <button
          style={styles.primary}
          onClick={registrarEncomenda}
        >
          Registrar Encomenda
        </button>

        <div style={styles.list}>

          {encomendas.length === 0 && (
            <p>
              Nenhuma encomenda
            </p>
          )}

          {encomendas.map((item) => (

            <div
              key={item.id}
              style={styles.package}
            >

              <div>

                <strong>
                  📦 {item.descricao}
                </strong>

                <p style={styles.info}>
                  {item.data}
                </p>

                <p
                  style={{
                    color:
                      item.status === "pendente"
                        ? "#d97706"
                        : "#16a34a"
                  }}
                >

                  {item.status}

                </p>

              </div>

              <div style={styles.actions}>

                {item.status === "pendente" && (

                  <button
                    style={styles.success}
                    onClick={() =>
                      retirarEncomenda(item.id)
                    }
                  >
                    Retirar
                  </button>

                )}

                <button
                  style={styles.delete}
                  onClick={() =>
                    excluirEncomenda(item.id)
                  }
                >
                  Excluir
                </button>

              </div>

            </div>

          ))}

        </div>

        <button
          style={styles.close}
          onClick={onClose}
        >
          Fechar
        </button>

      </div>

    </div>

  );

}

const styles = {

  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  modal: {
    background: "white",
    width: "500px",
    borderRadius: "12px",
    padding: "25px",
    maxHeight: "80vh",
    overflowY: "auto"
  },

  input: {
    width: "100%",
    padding: "12px",
    marginTop: "15px",
    marginBottom: "15px",
    borderRadius: "8px",
    border: "1px solid #ddd"
  },

  primary: {
    width: "100%",
    padding: "12px",
    background: "#166534",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    marginBottom: "20px"
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },

  package: {
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "15px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  info: {
    fontSize: "12px",
    color: "#6b7280"
  },

  actions: {
    display: "flex",
    gap: "8px"
  },

  success: {
    background: "#16a34a",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer"
  },

  delete: {
    background: "#dc2626",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer"
  },

  close: {
    width: "100%",
    marginTop: "20px",
    padding: "12px",
    background: "#6b7280",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer"
  }

};

export default PackageModal;