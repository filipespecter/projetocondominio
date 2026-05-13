import { useState } from "react";

function Apartamentos() {

  const [apartamentos, setApartamentos] = useState([
    { bloco: "A", numero: "101", andar: "1º", morador: "João da Silva" },
    { bloco: "A", numero: "102", andar: "1º", morador: "Maria Oliveira" },
    { bloco: "A", numero: "201", andar: "2º", morador: "Carlos Santos" },
    { bloco: "B", numero: "101", andar: "1º", morador: "Ana Paula" }
  ]);

  const [mostrarModal, setMostrarModal] = useState(false);

  const [novoAp, setNovoAp] = useState({
    bloco: "",
    numero: "",
    andar: "",
    morador: ""
  });

  function adicionarApartamento() {

    setApartamentos([...apartamentos, novoAp]);

    setNovoAp({
      bloco: "",
      numero: "",
      andar: "",
      morador: ""
    });

    setMostrarModal(false);
  }

  return (

    <div>

      {/* TOPO */}
      <div style={styles.header}>

        <h2>Apartamentos</h2>

        <button
          style={styles.button}
          onClick={() => setMostrarModal(true)}
        >
          + Novo apartamento
        </button>

      </div>


      {/* TABELA */}

      <div style={styles.card}>

        <table style={styles.table}>

          <thead>

            <tr>
              <th style={styles.th}>Bloco</th>
              <th style={styles.th}>Número</th>
              <th style={styles.th}>Andar</th>
              <th style={styles.th}>Morador</th>
              <th style={styles.th}>Ações</th>
            </tr>

          </thead>

          <tbody>

            {apartamentos.map((ap, index) => (

              <tr key={index}>

                <td style={styles.td}>{ap.bloco}</td>
                <td style={styles.td}>{ap.numero}</td>
                <td style={styles.td}>{ap.andar}</td>
                <td style={styles.td}>{ap.morador}</td>

                <td style={styles.td}>
                  ✏️ 🗑️
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>


      {/* MODAL */}

      {mostrarModal && (

        <div style={styles.modalBackground}>

          <div style={styles.modal}>

            <h3>Novo apartamento</h3>

            <input
              placeholder="Bloco"
              value={novoAp.bloco}
              onChange={(e) =>
                setNovoAp({ ...novoAp, bloco: e.target.value })
              }
              style={styles.input}
            />

            <input
              placeholder="Número"
              value={novoAp.numero}
              onChange={(e) =>
                setNovoAp({ ...novoAp, numero: e.target.value })
              }
              style={styles.input}
            />

            <input
              placeholder="Andar"
              value={novoAp.andar}
              onChange={(e) =>
                setNovoAp({ ...novoAp, andar: e.target.value })
              }
              style={styles.input}
            />

            <input
              placeholder="Morador"
              value={novoAp.morador}
              onChange={(e) =>
                setNovoAp({ ...novoAp, morador: e.target.value })
              }
              style={styles.input}
            />

            <div style={styles.modalButtons}>

              <button
                style={styles.saveButton}
                onClick={adicionarApartamento}
              >
                Salvar
              </button>

              <button
                style={styles.cancelButton}
                onClick={() => setMostrarModal(false)}
              >
                Cancelar
              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}

const styles = {

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },

  button: {
    backgroundColor: "#6c3eb8",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold"
  },

  card: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse"
  },

  th: {
    textAlign: "left",
    padding: "14px",
    borderBottom: "2px solid #e5e7eb"
  },

  td: {
    padding: "14px",
    borderBottom: "1px solid #e5e7eb"
  },

  modalBackground: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  modal: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "10px",
    width: "300px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },

  input: {
    padding: "8px",
    borderRadius: "5px",
    border: "1px solid #ccc"
  },

  modalButtons: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "10px"
  },

  saveButton: {
    backgroundColor: "#6c3eb8",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "5px",
    cursor: "pointer"
  },

  cancelButton: {
    backgroundColor: "#ccc",
    border: "none",
    padding: "8px 12px",
    borderRadius: "5px",
    cursor: "pointer"
  }

};

export default Apartamentos;