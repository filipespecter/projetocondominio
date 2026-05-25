import { useState, useEffect } from "react";

function Reservas() {

  const [reservas, setReservas] = useState([]);

  const [mostrarModal, setMostrarModal] =
    useState(false);

  const [novaReserva, setNovaReserva] =
    useState({
      area: "",
      data: "",
      horario: "",
      obs: "",
      status: "pendente"
    });

  const [editId, setEditId] =
    useState(null);

  useEffect(() => {

    carregarReservas();

  }, []);

  function carregarReservas() {

    const dados =
      JSON.parse(
        localStorage.getItem("reservas")
      ) || [];

    setReservas(dados);

  }

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
          ? {
              ...novaReserva,
              id: editId
            }
          : r

      );

      localStorage.setItem(
        "reservas",
        JSON.stringify(lista)
      );

      setReservas(lista);

      setEditId(null);

    } else {

      const nova = {

        id: Date.now(),

        ...novaReserva,

        criadoEm:
          new Date().toLocaleString()

      };

      const atualizadas = [
        ...reservas,
        nova
      ];

      localStorage.setItem(
        "reservas",
        JSON.stringify(atualizadas)
      );

      setReservas(atualizadas);

    }

    setNovaReserva({
      area: "",
      data: "",
      horario: "",
      obs: "",
      status: "pendente"
    });

    setMostrarModal(false);

  }

  function excluirReserva(id) {

    const lista = reservas.filter(
      (r) => r.id !== id
    );

    localStorage.setItem(
      "reservas",
      JSON.stringify(lista)
    );

    setReservas(lista);

  }

  function editarReserva(reserva) {

    setNovaReserva(reserva);

    setEditId(reserva.id);

    setMostrarModal(true);

  }

  function aprovarReserva(id) {

    const lista = reservas.map((r) =>

      r.id === id
        ? {
            ...r,
            status: "aprovada"
          }
        : r

    );

    localStorage.setItem(
      "reservas",
      JSON.stringify(lista)
    );

    setReservas(lista);

  }

  function recusarReserva(id) {

    const lista = reservas.map((r) =>

      r.id === id
        ? {
            ...r,
            status: "recusada"
          }
        : r

    );

    localStorage.setItem(
      "reservas",
      JSON.stringify(lista)
    );

    setReservas(lista);

  }

  const pendentes = reservas.filter(
    (r) => r.status === "pendente"
  );

  const aprovadas = reservas.filter(
    (r) => r.status === "aprovada"
  );

  const recusadas = reservas.filter(
    (r) => r.status === "recusada"
  );

  return (

    <div style={styles.container}>

      {/* HEADER */}

      <div style={styles.header}>

        <div>

          <h1 style={styles.title}>
            Reservas
          </h1>

          <p style={styles.subtitle}>
            Gerencie reservas das áreas comuns
          </p>

        </div>

        <button
          style={styles.button}
          onClick={() => {

            setEditId(null);

            setNovaReserva({
              area: "",
              data: "",
              horario: "",
              obs: "",
              status: "pendente"
            });

            setMostrarModal(true);

          }}
        >

          + Nova Reserva

        </button>

      </div>

      {/* CARDS */}

      <div style={styles.cardsGrid}>

        <div style={styles.card}>

          <div style={styles.cardIcon}>
            📅
          </div>

          <div>

            <p style={styles.cardLabel}>
              Total
            </p>

            <h2 style={styles.cardNumber}>
              {reservas.length}
            </h2>

          </div>

        </div>

        <div style={styles.card}>

          <div style={styles.cardIcon}>
            ⏳
          </div>

          <div>

            <p style={styles.cardLabel}>
              Pendentes
            </p>

            <h2 style={styles.cardNumber}>
              {pendentes.length}
            </h2>

          </div>

        </div>

        <div style={styles.card}>

          <div style={styles.cardIcon}>
            ✅
          </div>

          <div>

            <p style={styles.cardLabel}>
              Aprovadas
            </p>

            <h2 style={styles.cardNumber}>
              {aprovadas.length}
            </h2>

          </div>

        </div>

        <div style={styles.card}>

          <div style={styles.cardIcon}>
            ❌
          </div>

          <div>

            <p style={styles.cardLabel}>
              Recusadas
            </p>

            <h2 style={styles.cardNumber}>
              {recusadas.length}
            </h2>

          </div>

        </div>

      </div>

      {/* TABELA */}

      <div style={styles.tableCard}>

        <table style={styles.table}>

          <thead>

            <tr>

              <th style={styles.th}>
                Área
              </th>

              <th style={styles.th}>
                Data
              </th>

              <th style={styles.th}>
                Horário
              </th>

              <th style={styles.th}>
                Observação
              </th>

              <th style={styles.th}>
                Status
              </th>

              <th style={styles.th}>
                Ações
              </th>

            </tr>

          </thead>

          <tbody>

            {reservas.length === 0 && (

              <tr>

                <td
                  colSpan="6"
                  style={styles.empty}
                >

                  Nenhuma reserva encontrada

                </td>

              </tr>

            )}

            {reservas.map((r) => (

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
                  {r.obs || "-"}
                </td>

                <td style={styles.td}>

                  <span
                    style={{
                      ...styles.status,

                      background:
                        r.status === "pendente"
                          ? "#fef9c3"
                          : r.status === "aprovada"
                          ? "#dcfce7"
                          : "#fee2e2",

                      color:
                        r.status === "pendente"
                          ? "#854d0e"
                          : r.status === "aprovada"
                          ? "#166534"
                          : "#991b1b"
                    }}
                  >

                    {r.status}

                  </span>

                </td>

                <td style={styles.td}>

                  <div style={styles.actions}>

                    {r.status === "pendente" && (

                      <>

                        <button
                          style={styles.approve}
                          onClick={() =>
                            aprovarReserva(r.id)
                          }
                        >

                          Aprovar

                        </button>

                        <button
                          style={styles.reject}
                          onClick={() =>
                            recusarReserva(r.id)
                          }
                        >

                          Recusar

                        </button>

                      </>

                    )}

                    <button
                      style={styles.edit}
                      onClick={() =>
                        editarReserva(r)
                      }
                    >

                      Editar

                    </button>

                    <button
                      style={styles.delete}
                      onClick={() =>
                        excluirReserva(r.id)
                      }
                    >

                      Excluir

                    </button>

                  </div>

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

            <h2 style={styles.modalTitle}>

              {editId
                ? "Editar Reserva"
                : "Nova Reserva"}

            </h2>

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

            <textarea
              placeholder="Observação"
              value={novaReserva.obs}
              onChange={(e) =>
                setNovaReserva({
                  ...novaReserva,
                  obs: e.target.value
                })
              }
              style={styles.textarea}
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

  container: {
    width: "100%"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px"
  },

  title: {
    margin: 0,
    fontSize: "32px",
    color: "#14532d"
  },

  subtitle: {
    marginTop: "6px",
    color: "#6b7280"
  },

  button: {
    background:
      "linear-gradient(135deg,#14532d,#16a34a)",
    color: "white",
    border: "none",
    padding: "14px 18px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px"
  },

  cardsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "20px",
    marginBottom: "30px"
  },

  card: {
    background:
      "linear-gradient(135deg,#dcfce7,#ffffff)",
    borderRadius: "18px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)"
  },

  cardIcon: {
    fontSize: "38px"
  },

  cardLabel: {
    color: "#6b7280",
    marginBottom: "5px"
  },

  cardNumber: {
    margin: 0,
    fontSize: "30px",
    color: "#14532d"
  },

  tableCard: {
    background: "white",
    borderRadius: "18px",
    padding: "24px",
    overflowX: "auto",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse"
  },

  th: {
    textAlign: "left",
    padding: "16px",
    borderBottom: "2px solid #e5e7eb",
    color: "#374151"
  },

  td: {
    padding: "16px",
    borderBottom: "1px solid #f3f4f6"
  },

  empty: {
    textAlign: "center",
    padding: "30px",
    color: "#6b7280"
  },

  status: {
    padding: "8px 14px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700"
  },

  actions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap"
  },

  approve: {
    background: "#16a34a",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600"
  },

  reject: {
    background: "#dc2626",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600"
  },

  edit: {
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600"
  },

  delete: {
    background: "#6b7280",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600"
  },

  modalBackground: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background:
      "rgba(0,0,0,0.45)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999
  },

  modal: {
    background: "white",
    borderRadius: "20px",
    padding: "30px",
    width: "420px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.15)"
  },

  modalTitle: {
    margin: 0,
    color: "#14532d"
  },

  input: {
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: "14px"
  },

  textarea: {
    minHeight: "100px",
    resize: "none",
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: "14px"
  },

  modalButtons: {
    display: "flex",
    gap: "12px",
    marginTop: "10px"
  },

  saveButton: {
    flex: 1,
    background: "#16a34a",
    color: "white",
    border: "none",
    padding: "14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700"
  },

  cancelButton: {
    flex: 1,
    background: "#e5e7eb",
    color: "#374151",
    border: "none",
    padding: "14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700"
  }

};

export default Reservas;