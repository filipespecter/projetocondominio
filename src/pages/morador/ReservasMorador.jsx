import { useEffect, useState } from "react";

function ReservasMorador() {

  const [reservas, setReservas] = useState([]);

  const [area, setArea] = useState("");

  const [data, setData] = useState("");

  const [horario, setHorario] = useState("");

  useEffect(() => {

    carregarReservas();

  }, []);

  function carregarReservas() {

    const dataStorage =
      JSON.parse(localStorage.getItem("reservas")) || [];

    setReservas(dataStorage);

  }

  function solicitarReserva() {

    if (!area || !data || !horario) return;

    const nova = {

      id: Date.now(),

      area,

      data,

      horario,

      status: "pendente",

      criadoEm: new Date().toLocaleString()

    };

    const atualizadas = [...reservas, nova];

    localStorage.setItem(
      "reservas",
      JSON.stringify(atualizadas)
    );

    setReservas(atualizadas);

    setArea("");

    setData("");

    setHorario("");

  }

  function cancelarReserva(id) {

    const atualizadas = reservas.filter(
      (r) => r.id !== id
    );

    localStorage.setItem(
      "reservas",
      JSON.stringify(atualizadas)
    );

    setReservas(atualizadas);

  }

  return (

    <div style={styles.container}>

      {/* HEADER */}

      <div style={styles.header}>

        <h1 style={styles.title}>
          Reservas
        </h1>

        <p style={styles.subtitle}>
          Reserve áreas comuns do condomínio
        </p>

      </div>

      {/* RESUMO */}

      <div style={styles.resumeGrid}>

        <div style={styles.resumeCard}>

          <div style={styles.resumeIcon}>
            📅
          </div>

          <div>

            <p style={styles.resumeLabel}>
              Reservas
            </p>

            <h2 style={styles.resumeNumber}>
              {reservas.length}
            </h2>

          </div>

        </div>

      </div>

      {/* FORM */}

      <div style={styles.formCard}>

        <h2 style={styles.formTitle}>
          Nova Reserva
        </h2>

        <div style={styles.form}>

          <select
            value={area}
            onChange={(e) =>
              setArea(e.target.value)
            }
            style={styles.input}
          >

            <option value="">
              Selecione a área
            </option>

            <option value="Salão de Festas">
              Salão de Festas
            </option>

            <option value="Churrasqueira">
              Churrasqueira
            </option>

            <option value="Piscina">
              Piscina
            </option>

            <option value="Quadra">
              Quadra
            </option>

          </select>

          <input
            type="date"
            value={data}
            onChange={(e) =>
              setData(e.target.value)
            }
            style={styles.input}
          />

          <input
            type="time"
            value={horario}
            onChange={(e) =>
              setHorario(e.target.value)
            }
            style={styles.input}
          />

          <button
            style={styles.button}
            onClick={solicitarReserva}
          >

            Solicitar Reserva

          </button>

        </div>

      </div>

      {/* LISTA */}

      <div style={styles.list}>

        {reservas.length === 0 && (

          <div style={styles.empty}>

            <h3>
              Nenhuma reserva encontrada
            </h3>

            <p>
              Você ainda não possui reservas cadastradas.
            </p>

          </div>

        )}

        {reservas.map((item) => (

          <div
            key={item.id}
            style={styles.card}
          >

            <div style={styles.cardTop}>

              <div>

                <h2 style={styles.area}>
                  🏢 {item.area}
                </h2>

                <p style={styles.date}>
                  {item.data} às {item.horario}
                </p>

              </div>

              <div
                style={{
                  ...styles.status,

                  background:
                    item.status === "pendente"
                      ? "#fef9c3"
                      : "#dcfce7",

                  color:
                    item.status === "pendente"
                      ? "#854d0e"
                      : "#166534"
                }}
              >

                {item.status}

              </div>

            </div>

            <div style={styles.footer}>

              <span style={styles.created}>
                Solicitação:
                {" "}
                {item.criadoEm}
              </span>

              <button
                style={styles.cancelButton}
                onClick={() =>
                  cancelarReserva(item.id)
                }
              >

                Cancelar

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
    width: "100%",
    padding: "30px",
    boxSizing: "border-box"
  },

  header: {
    marginBottom: "30px"
  },

  title: {
    fontSize: "34px",
    margin: 0,
    color: "#14532d"
  },

  subtitle: {
    marginTop: "8px",
    color: "#6b7280"
  },

  resumeGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "20px",
    marginBottom: "30px"
  },

  resumeCard: {
    background:
      "linear-gradient(135deg,#dcfce7,#ffffff)",
    borderRadius: "18px",
    padding: "25px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)"
  },

  resumeIcon: {
    fontSize: "42px"
  },

  resumeLabel: {
    color: "#6b7280",
    marginBottom: "6px"
  },

  resumeNumber: {
    margin: 0,
    fontSize: "32px",
    color: "#14532d"
  },

  formCard: {
    background: "white",
    borderRadius: "18px",
    padding: "25px",
    marginBottom: "30px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)"
  },

  formTitle: {
    marginTop: 0,
    marginBottom: "20px",
    color: "#14532d"
  },

  form: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px,1fr))",
    gap: "16px"
  },

  input: {
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: "14px"
  },

  button: {
    background: "#16a34a",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "15px"
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "18px"
  },

  empty: {
    background: "white",
    borderRadius: "18px",
    padding: "40px",
    textAlign: "center",
    color: "#6b7280",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)"
  },

  card: {
    background: "white",
    borderRadius: "18px",
    padding: "24px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)"
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px"
  },

  area: {
    margin: 0,
    color: "#111827"
  },

  date: {
    marginTop: "8px",
    color: "#4b5563"
  },

  status: {
    padding: "8px 14px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "700"
  },

  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "10px"
  },

  created: {
    color: "#6b7280",
    fontSize: "13px"
  },

  cancelButton: {
    background: "#dc2626",
    color: "white",
    border: "none",
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600"
  }

};

export default ReservasMorador;