import { useState } from "react";

function AreasComuns() {

  const [areas, setAreas] = useState([
    {
      nome: "Salão de festas",
      capacidade: "50 pessoas",
      horario: "08:00 - 22:00",
      status: "Disponível"
    },
    {
      nome: "Churrasqueira",
      capacidade: "15 pessoas",
      horario: "09:00 - 23:00",
      status: "Ocupado"
    },
    {
      nome: "Piscina",
      capacidade: "30 pessoas",
      horario: "07:00 - 20:00",
      status: "Manutenção"
    }
  ]);

  const [mostrarModal, setMostrarModal] = useState(false);

  const [novaArea, setNovaArea] = useState({
    nome: "",
    capacidade: "",
    horario: "",
    status: "Disponível"
  });

  const [editIndex, setEditIndex] = useState(null);


  function salvarArea() {

    if (editIndex !== null) {

      const lista = [...areas];
      lista[editIndex] = novaArea;

      setAreas(lista);

      setEditIndex(null);

    } else {

      setAreas([...areas, novaArea]);

    }

    setNovaArea({
      nome: "",
      capacidade: "",
      horario: "",
      status: "Disponível"
    });

    setMostrarModal(false);
  }


  function excluirArea(index) {

    const lista = areas.filter((_, i) => i !== index);

    setAreas(lista);
  }


  function editarArea(index) {

    setNovaArea(areas[index]);

    setEditIndex(index);

    setMostrarModal(true);
  }


  return (

    <div>

      {/* TOPO */}

      <div style={styles.header}>

        <h2>Áreas Comuns</h2>

        <button
          style={styles.button}
          onClick={() => {

            setEditIndex(null);

            setNovaArea({
              nome: "",
              capacidade: "",
              horario: "",
              status: "Disponível"
            });

            setMostrarModal(true);

          }}
        >
          + Nova área
        </button>

      </div>


      {/* TABELA */}

      <div style={styles.card}>

        <table style={styles.table}>

          <thead>

            <tr>

              <th style={styles.th}>Área</th>
              <th style={styles.th}>Capacidade</th>
              <th style={styles.th}>Horário</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Ações</th>

            </tr>

          </thead>

          <tbody>

            {areas.map((area, index) => (

              <tr key={index}>

                <td style={styles.td}>
                  {area.nome}
                </td>

                <td style={styles.td}>
                  {area.capacidade}
                </td>

                <td style={styles.td}>
                  {area.horario}
                </td>

                <td style={styles.td}>
                  {area.status}
                </td>

                <td style={styles.td}>

                  <span
                    style={styles.icon}
                    onClick={() => editarArea(index)}
                  >
                    ✏️
                  </span>

                  <span
                    style={styles.icon}
                    onClick={() => excluirArea(index)}
                  >
                    🗑️
                  </span>

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

            <h3>
              {editIndex !== null
                ? "Editar área"
                : "Nova área"}
            </h3>

            <input
              placeholder="Nome da área"
              value={novaArea.nome}
              onChange={(e) =>
                setNovaArea({
                  ...novaArea,
                  nome: e.target.value
                })
              }
              style={styles.input}
            />

            <input
              placeholder="Capacidade"
              value={novaArea.capacidade}
              onChange={(e) =>
                setNovaArea({
                  ...novaArea,
                  capacidade: e.target.value
                })
              }
              style={styles.input}
            />

            <input
              placeholder="Horário"
              value={novaArea.horario}
              onChange={(e) =>
                setNovaArea({
                  ...novaArea,
                  horario: e.target.value
                })
              }
              style={styles.input}
            />

            <select
              value={novaArea.status}
              onChange={(e) =>
                setNovaArea({
                  ...novaArea,
                  status: e.target.value
                })
              }
              style={styles.input}
            >
              <option>Disponível</option>
              <option>Ocupado</option>
              <option>Manutenção</option>
            </select>

            <div style={styles.modalButtons}>

              <button
                style={styles.saveButton}
                onClick={salvarArea}
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

export default AreasComuns;