import { useState, useEffect } from "react";

function Reservas() {

  const [reservas, setReservas] = useState([]);

  const [mostrarModal, setMostrarModal] = useState(false);

  const [novaReserva, setNovaReserva] = useState({
    area: "",
    data: "",
    horario: "",
    obs: ""
  });

  const [editId, setEditId] = useState(null);


  useEffect(() => {

    const dados = localStorage.getItem("reservas");

    if (dados) {
      setReservas(JSON.parse(dados));
    }

  }, []);


  useEffect(() => {

    localStorage.setItem(
      "reservas",
      JSON.stringify(reservas)
    );

  }, [reservas]);


  function salvarReserva() {

    if (
      !novaReserva.area ||
      !novaReserva.data ||
      !novaReserva.horario
    ) {

      alert("Preencha os campos obrigatórios");

      return;
    }


    if (editId !== null) {

      const lista = reservas.map((r) =>
        r.id === editId
          ? { ...novaReserva, id: editId }
          : r
      );

      setReservas(lista);

      setEditId(null);

    } else {

      const nova = {
        id: Date.now(),
        ...novaReserva
      };

      setReservas([
        ...reservas,
        nova
      ]);
    }


    setNovaReserva({
      area: "",
      data: "",
      horario: "",
      obs: ""
    });

    setMostrarModal(false);
  }


  function excluirReserva(id) {

    const lista = reservas.filter(
      (r) => r.id !== id
    );

    setReservas(lista);
  }


  function editarReserva(reserva) {

    setNovaReserva(reserva);

    setEditId(reserva.id);

    setMostrarModal(true);
  }


  return (

    <div>

      {/* TOPO */}

      <div style={styles.header}>

        <h2>Reservas</h2>

        <button
          style={styles.button}
          onClick={() => {

            setEditId(null);

            setNovaReserva({
              area: "",
              data: "",
              horario: "",
              obs: ""
            });

            setMostrarModal(true);

          }}
        >
          + Nova reserva
        </button>

      </div>


      {/* TABELA */}

      <div style={styles.card}>

        <table style={styles.table}>

          <thead>

            <tr>

              <th style={styles.th}>Área</th>
              <th style={styles.th}>Data</th>
              <th style={styles.th}>Horário</th>
              <th style={styles.th}>Observação</th>
              <th style={styles.th}>Ações</th>

            </tr>

          </thead>

          <tbody>

            {reservas.length === 0 ? (

              <tr>

                <td
                  colSpan="5"
                  style={styles.empty}
                >
                  Nenhuma reserva cadastrada
                </td>

              </tr>

            ) : (

              reservas.map((r) => (

                <tr key={r.id}>

                  <td style={styles.td}>
                    {r.area}
                  </td>

                  <td style={styles.td}>
                    {r.data}
                  </td>

                  <td style={styles.td}>
                    {r.horario}
                  </td>

                  <td style={styles.td}>
                    {r.obs}
                  </td>

                  <td style={styles.td}>

                    <span
                      style={styles.icon}
                      onClick={() =>
                        editarReserva(r)
                      }
                    >
                      ✏️
                    </span>

                    <span
                      style={styles.icon}
                      onClick={() =>
                        excluirReserva(r.id)
                      }
                    >
                      🗑️
                    </span>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>


      {/* MODAL */}

      {mostrarModal && (

        <div style={styles.modalBackground}>

          <div style={styles.modal}>

            <h3>

              {editId
                ? "Editar reserva"
                : "Nova reserva"}

            </h3>

            <select
              value={novaReserva.area}
              onChange={(e) =>
                setNovaReserva({
                  ...novaReserva,
                  area: e.target.value
                })
              }
              style={styles.input}
            >

              <option value="">
                Selecione uma área
              </option>

              <option>
                Salão de festas
              </option>

              <option>
                Churrasqueira
              </option>

              <option>
                Piscina
              </option>

              <option>
                Quadra
              </option>

            </select>


            <input
              type="date"
              value={novaReserva.data}
              onChange={(e) =>
                setNovaReserva({
                  ...novaReserva,
                  data: e.target.value
                })
              }
              style={styles.input}
            />


            <input
              type="time"
              value={novaReserva.horario}
              onChange={(e) =>
                setNovaReserva({
                  ...novaReserva,
                  horario: e.target.value
                })
              }
              style={styles.input}
            />


            <input
              placeholder="Observação"
              value={novaReserva.obs}
              onChange={(e) =>
                setNovaReserva({
                  ...novaReserva,
                  obs: e.target.value
                })
              }
              style={styles.input}
            />


            <div style={styles.modalButtons}>

              <button
                style={styles.saveButton}
                onClick={salvarReserva}
              >
                Salvar
              </button>

              <button
                style={styles.cancelButton}
                onClick={() =>
                  setMostrarModal(false)
                }
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

  empty: {
    textAlign: "center",
    padding: "20px"
  },

  icon: {
    cursor: "pointer",
    marginRight: "10px"
  },

  modalBackground: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  modal: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "10px",
    width: "320px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },

  input: {
    padding: "10px",
    borderRadius: "6px",
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
    padding: "8px 14px",
    borderRadius: "5px",
    cursor: "pointer"
  },

  cancelButton: {
    backgroundColor: "#ccc",
    border: "none",
    padding: "8px 14px",
    borderRadius: "5px",
    cursor: "pointer"
  }

};

export default Reservas;