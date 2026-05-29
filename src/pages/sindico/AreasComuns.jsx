import { useState } from "react";

function AreasComuns() {

  const STORAGE_KEY = "areasComuns";

  const estadoInicialArea = {
    nome: "",
    capacidade: "",
    horario: "",
    status: "Disponível"
  };

  const [areas, setAreas] =
    useState(() => {

      const dados =
        localStorage.getItem(
          STORAGE_KEY
        );

      return dados
        ? JSON.parse(dados)
        : [];

    });

  const [mostrarModal, setMostrarModal] =
    useState(false);

  const [busca, setBusca] =
    useState("");

  const [novaArea, setNovaArea] =
    useState(estadoInicialArea);

  const [editId, setEditId] =
    useState(null);

  const areasFiltradas =
    areas.filter((area) =>

      area.nome
        ?.toLowerCase()
        .includes(
          busca.toLowerCase()
        ) ||

      area.capacidade
        ?.toLowerCase()
        .includes(
          busca.toLowerCase()
        ) ||

      area.status
        ?.toLowerCase()
        .includes(
          busca.toLowerCase()
        )

    );

  function salvarArea() {

    if (
      !novaArea.nome ||
      !novaArea.capacidade ||
      !novaArea.horario
    ) {

      alert(
        "Preencha todos os campos"
      );

      return;

    }

    const areaExiste =
      areas.find(
        (area) =>

          area.nome
            ?.toLowerCase() ===
            novaArea.nome
              .toLowerCase() &&
          area.id !== editId

      );

    if (areaExiste) {

      alert(
        "Essa área já existe"
      );

      return;

    }

    let listaAtualizada = [];

    if (editId !== null) {

      listaAtualizada =
        areas.map((area) =>

          area.id === editId
            ? {
                ...novaArea,
                id: editId
              }
            : area

        );

      setEditId(null);

    } else {

      const nova = {
        id: Date.now(),
        ...novaArea
      };

      listaAtualizada = [
        ...areas,
        nova
      ];

    }

    setAreas(listaAtualizada);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(listaAtualizada)
    );

    setNovaArea(estadoInicialArea);

    setMostrarModal(false);

  }

  function editarArea(area) {

    setNovaArea({
      ...estadoInicialArea,
      ...area
    });

    setEditId(area.id);

    setMostrarModal(true);

  }

  function excluirArea(id) {

    const confirmar =
      window.confirm(
        "Deseja excluir essa área?"
      );

    if (!confirmar) return;

    const listaAtualizada =
      areas.filter(
        (area) =>
          area.id !== id
      );

    setAreas(listaAtualizada);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(listaAtualizada)
    );

  }

  function fecharModal() {

    setMostrarModal(false);

    setEditId(null);

    setNovaArea(estadoInicialArea);

  }

  function corStatus(status) {

    switch (status) {

      case "Disponível":

        return {
          background: "#dcfce7",
          color: "#166534"
        };

      case "Ocupado":

        return {
          background: "#fef3c7",
          color: "#92400e"
        };

      case "Manutenção":

        return {
          background: "#fee2e2",
          color: "#dc2626"
        };

      default:

        return {
          background: "#e5e7eb",
          color: "#374151"
        };

    }

  }

  return (

    <div style={styles.container}>

      <div style={styles.header}>

        <div>

          <h1 style={styles.title}>
            Áreas Comuns
          </h1>

          <p style={styles.subtitle}>
            Gerencie os espaços do condomínio
          </p>

        </div>

        <div style={styles.headerActions}>

          <input
            placeholder="Buscar área..."
            value={busca}
            onChange={(e) =>
              setBusca(
                e.target.value
              )
            }
            style={styles.search}
          />

          <button
            style={styles.button}
            onClick={() => {

              setEditId(null);

              setNovaArea(
                estadoInicialArea
              );

              setMostrarModal(true);

            }}
          >

            + Nova área

          </button>

        </div>

      </div>

      <div style={styles.resumeGrid}>

        <div style={styles.resumeCard}>

          <div style={styles.resumeIcon}>
            🏢
          </div>

          <div>

            <p style={styles.resumeLabel}>
              Total de áreas
            </p>

            <h2 style={styles.resumeNumber}>
              {areas.length}
            </h2>

          </div>

        </div>

        <div style={styles.resumeCard}>

          <div style={styles.resumeIcon}>
            ✅
          </div>

          <div>

            <p style={styles.resumeLabel}>
              Disponíveis
            </p>

            <h2 style={styles.resumeNumber}>
              {
                areas.filter(
                  (a) =>
                    a.status ===
                    "Disponível"
                ).length
              }
            </h2>

          </div>

        </div>

      </div>

      <div style={styles.card}>

        <table style={styles.table}>

          <thead>

            <tr>

              <th style={styles.th}>
                Área
              </th>

              <th style={styles.th}>
                Capacidade
              </th>

              <th style={styles.th}>
                Horário
              </th>

              <th style={styles.th}>
                Status
              </th>

              <th style={styles.thCenter}>
                Ações
              </th>

            </tr>

          </thead>

          <tbody>

            {areasFiltradas.length === 0 ? (

              <tr>

                <td
                  colSpan="5"
                  style={styles.empty}
                >

                  Nenhuma área encontrada

                </td>

              </tr>

            ) : (

              areasFiltradas.map(
                (area) => (

                <tr key={area.id}>

                  <td style={styles.td}>

                    <div style={styles.areaInfo}>

                      <div style={styles.areaIcon}>
                        🏢
                      </div>

                      <strong>
                        {area.nome}
                      </strong>

                    </div>

                  </td>

                  <td style={styles.td}>
                    {area.capacidade}
                  </td>

                  <td style={styles.td}>
                    {area.horario}
                  </td>

                  <td style={styles.td}>

                    <span
                      style={{
                        ...styles.statusBadge,
                        ...corStatus(
                          area.status
                        )
                      }}
                    >

                      {area.status}

                    </span>

                  </td>

                  <td style={styles.tdCenter}>

                    <button
                      style={
                        styles.editButton
                      }
                      onClick={() =>
                        editarArea(area)
                      }
                    >

                      Editar

                    </button>

                    <button
                      style={
                        styles.deleteButton
                      }
                      onClick={() =>
                        excluirArea(
                          area.id
                        )
                      }
                    >

                      Excluir

                    </button>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

      {mostrarModal && (

        <div style={styles.modalBackground}>

          <div style={styles.modal}>

            <h2 style={styles.modalTitle}>

              {editId !== null
                ? "Editar área"
                : "Nova área"}

            </h2>

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
                  capacidade:
                    e.target.value
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
                  horario:
                    e.target.value
                })

              }
              style={styles.input}
            />

            <select
              value={novaArea.status}
              onChange={(e) =>

                setNovaArea({
                  ...novaArea,
                  status:
                    e.target.value
                })

              }
              style={styles.input}
            >

              <option>
                Disponível
              </option>

              <option>
                Ocupado
              </option>

              <option>
                Manutenção
              </option>

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
                onClick={fecharModal}
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
    marginTop: "8px",
    color: "#6b7280"
  },

  headerActions: {
    display: "flex",
    gap: "12px"
  },

  search: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    outline: "none",
    minWidth: "220px"
  },

  button: {
    background:
      "linear-gradient(135deg,#14532d,#166534)",
    color: "white",
    border: "none",
    padding: "12px 18px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700",
    boxShadow:
      "0 4px 14px rgba(20,83,45,0.25)"
  },

  resumeGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(260px,1fr))",
    gap: "20px",
    marginBottom: "30px"
  },

  resumeCard: {
    background:
      "linear-gradient(135deg,#14532d,#166534)",
    color: "white",
    borderRadius: "22px",
    padding: "25px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow:
      "0 10px 30px rgba(20,83,45,0.18)"
  },

  resumeIcon: {
    fontSize: "40px"
  },

  resumeLabel: {
    margin: 0,
    opacity: 0.8
  },

  resumeNumber: {
    margin: "6px 0 0",
    fontSize: "34px"
  },

  card: {
    background: "white",
    borderRadius: "24px",
    padding: "25px",
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.06)"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse"
  },

  th: {
    textAlign: "left",
    padding: "18px",
    borderBottom: "2px solid #f3f4f6",
    color: "#374151"
  },

  thCenter: {
    textAlign: "center",
    padding: "18px",
    borderBottom: "2px solid #f3f4f6",
    color: "#374151"
  },

  td: {
    padding: "18px",
    borderBottom: "1px solid #f3f4f6"
  },

  tdCenter: {
    padding: "18px",
    textAlign: "center",
    borderBottom: "1px solid #f3f4f6"
  },

  empty: {
    textAlign: "center",
    padding: "40px",
    color: "#6b7280"
  },

  areaInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },

  areaIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background:
      "linear-gradient(135deg,#14532d,#166534)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700"
  },

  statusBadge: {
    padding: "8px 14px",
    borderRadius: "999px",
    fontWeight: "700",
    fontSize: "13px"
  },

  editButton: {
    background: "#dcfce7",
    color: "#166534",
    border: "none",
    padding: "10px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
    marginRight: "10px"
  },

  deleteButton: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    padding: "10px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700"
  },

  modalBackground: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: "blur(4px)"
  },

  modal: {
    width: "400px",
    background: "white",
    padding: "30px",
    borderRadius: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    boxShadow:
      "0 20px 40px rgba(0,0,0,0.15)"
  },

  modalTitle: {
    margin: 0,
    color: "#14532d"
  },

  input: {
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: "14px"
  },

  modalButtons: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "10px"
  },

  saveButton: {
    background:
      "linear-gradient(135deg,#14532d,#166534)",
    color: "white",
    border: "none",
    padding: "12px 18px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700"
  },

  cancelButton: {
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    padding: "12px 18px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700"
  }

};

export default AreasComuns;