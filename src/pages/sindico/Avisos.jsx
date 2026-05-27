import { useState } from "react";

function Avisos() {

  // CARREGA DIRETO DO LOCALSTORAGE
  const [avisos, setAvisos] = useState(() => {

    const dados =
      localStorage.getItem("avisos");

    return dados
      ? JSON.parse(dados)
      : [];

  });

  const [mostrarModal, setMostrarModal] =
    useState(false);

  const [busca, setBusca] =
    useState("");

  const [novoAviso, setNovoAviso] =
    useState({
      titulo: "",
      descricao: "",
      prioridade: "Média",
      data: new Date()
        .toLocaleDateString("pt-BR")
    });

  const [editId, setEditId] =
    useState(null);

  // FILTRO

  const avisosFiltrados =
    avisos.filter((a) =>

      a.titulo
        .toLowerCase()
        .includes(
          busca.toLowerCase()
        ) ||

      a.descricao
        .toLowerCase()
        .includes(
          busca.toLowerCase()
        ) ||

      a.prioridade
        .toLowerCase()
        .includes(
          busca.toLowerCase()
        )

    );

  // SALVAR AVISO

  function salvarAviso() {

    if (
      !novoAviso.titulo ||
      !novoAviso.descricao
    ) {

      alert(
        "Preencha todos os campos"
      );

      return;

    }

    let listaAtualizada = [];

    if (editId !== null) {

      listaAtualizada =
        avisos.map((a) =>

          a.id === editId
            ? {
                ...novoAviso,
                id: editId
              }
            : a

        );

      setEditId(null);

    } else {

      const novo = {

        id: Date.now(),

        ...novoAviso,

        data:
          new Date()
            .toLocaleDateString(
              "pt-BR"
            )

      };

      listaAtualizada = [
        ...avisos,
        novo
      ];

    }

    setAvisos(listaAtualizada);

    localStorage.setItem(
      "avisos",
      JSON.stringify(listaAtualizada)
    );

    setNovoAviso({
      titulo: "",
      descricao: "",
      prioridade: "Média",
      data: new Date()
        .toLocaleDateString("pt-BR")
    });

    setMostrarModal(false);

  }

  // EDITAR

  function editarAviso(aviso) {

    setNovoAviso(aviso);

    setEditId(aviso.id);

    setMostrarModal(true);

  }

  // EXCLUIR

  function excluirAviso(id) {

    const confirmar =
      window.confirm(
        "Deseja realmente excluir este aviso?"
      );

    if (!confirmar) return;

    const lista =
      avisos.filter(
        (a) => a.id !== id
      );

    setAvisos(lista);

    localStorage.setItem(
      "avisos",
      JSON.stringify(lista)
    );

  }

  // COR PRIORIDADE

  function corPrioridade(
    prioridade
  ) {

    switch (prioridade) {

      case "Alta":
        return {
          background:
            "#fee2e2",
          color:
            "#dc2626"
        };

      case "Média":
        return {
          background:
            "#fef3c7",
          color:
            "#d97706"
        };

      case "Baixa":
        return {
          background:
            "#dcfce7",
          color:
            "#166534"
        };

      default:
        return {
          background:
            "#f3f4f6",
          color:
            "#374151"
        };

    }

  }

  const alta =
    avisos.filter(
      (a) =>
        a.prioridade === "Alta"
    ).length;

  const media =
    avisos.filter(
      (a) =>
        a.prioridade === "Média"
    ).length;

  const baixa =
    avisos.filter(
      (a) =>
        a.prioridade === "Baixa"
    ).length;

  return (

    <div style={styles.container}>

      {/* HEADER */}

      <div style={styles.header}>

        <div>

          <h1 style={styles.title}>
            Avisos
          </h1>

          <p style={styles.subtitle}>
            Gerencie comunicados do condomínio
          </p>

        </div>

        <div style={styles.headerActions}>

          <input
            placeholder="Buscar aviso..."
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

              setNovoAviso({
                titulo: "",
                descricao: "",
                prioridade:
                  "Média",
                data:
                  new Date()
                    .toLocaleDateString(
                      "pt-BR"
                    )
              });

              setMostrarModal(
                true
              );

            }}
          >

            + Novo aviso

          </button>

        </div>

      </div>

      {/* RESUMO */}

      <div style={styles.resumeGrid}>

        <div style={styles.resumeCard}>

          <div style={styles.resumeIcon}>
            📢
          </div>

          <div>

            <p style={styles.resumeLabel}>
              Total
            </p>

            <h2 style={styles.resumeNumber}>
              {avisos.length}
            </h2>

          </div>

        </div>

        <div style={styles.resumeCard}>

          <div style={styles.resumeIcon}>
            🚨
          </div>

          <div>

            <p style={styles.resumeLabel}>
              Alta prioridade
            </p>

            <h2 style={styles.resumeNumber}>
              {alta}
            </h2>

          </div>

        </div>

        <div style={styles.resumeCard}>

          <div style={styles.resumeIcon}>
            ⚠️
          </div>

          <div>

            <p style={styles.resumeLabel}>
              Média prioridade
            </p>

            <h2 style={styles.resumeNumber}>
              {media}
            </h2>

          </div>

        </div>

        <div style={styles.resumeCard}>

          <div style={styles.resumeIcon}>
            ✅
          </div>

          <div>

            <p style={styles.resumeLabel}>
              Baixa prioridade
            </p>

            <h2 style={styles.resumeNumber}>
              {baixa}
            </h2>

          </div>

        </div>

      </div>

      {/* TABELA */}

      <div style={styles.card}>

        <table style={styles.table}>

          <thead>

            <tr>

              <th style={styles.th}>
                Título
              </th>

              <th style={styles.th}>
                Descrição
              </th>

              <th style={styles.th}>
                Prioridade
              </th>

              <th style={styles.th}>
                Data
              </th>

              <th style={styles.thCenter}>
                Ações
              </th>

            </tr>

          </thead>

          <tbody>

            {avisosFiltrados.length === 0 ? (

              <tr>

                <td
                  colSpan="5"
                  style={styles.empty}
                >

                  Nenhum aviso cadastrado

                </td>

              </tr>

            ) : (

              avisosFiltrados.map(
                (aviso) => (

                <tr key={aviso.id}>

                  <td style={styles.td}>
                    <strong>
                      {aviso.titulo}
                    </strong>
                  </td>

                  <td style={styles.td}>
                    {aviso.descricao}
                  </td>

                  <td style={styles.td}>

                    <span
                      style={{
                        ...styles.badge,
                        ...corPrioridade(
                          aviso.prioridade
                        )
                      }}
                    >

                      {aviso.prioridade}

                    </span>

                  </td>

                  <td style={styles.td}>
                    {aviso.data}
                  </td>

                  <td style={styles.tdCenter}>

                    <button
                      style={
                        styles.editButton
                      }
                      onClick={() =>
                        editarAviso(
                          aviso
                        )
                      }
                    >

                      Editar

                    </button>

                    <button
                      style={
                        styles.deleteButton
                      }
                      onClick={() =>
                        excluirAviso(
                          aviso.id
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

      {/* MODAL */}

      {mostrarModal && (

        <div style={styles.modalBg}>

          <div style={styles.modal}>

            <h2 style={styles.modalTitle}>

              {editId !== null
                ? "Editar aviso"
                : "Novo aviso"}

            </h2>

            <input
              placeholder="Título"
              value={novoAviso.titulo}
              onChange={(e) =>
                setNovoAviso({
                  ...novoAviso,
                  titulo:
                    e.target.value
                })
              }
              style={styles.input}
            />

            <textarea
              placeholder="Descrição"
              value={
                novoAviso.descricao
              }
              onChange={(e) =>
                setNovoAviso({
                  ...novoAviso,
                  descricao:
                    e.target.value
                })
              }
              style={styles.textarea}
            />

            <select
              value={
                novoAviso.prioridade
              }
              onChange={(e) =>
                setNovoAviso({
                  ...novoAviso,
                  prioridade:
                    e.target.value
                })
              }
              style={styles.input}
            >

              <option>
                Alta
              </option>

              <option>
                Média
              </option>

              <option>
                Baixa
              </option>

            </select>

            <div style={styles.modalButtons}>

              <button
                style={styles.saveBtn}
                onClick={
                  salvarAviso
                }
              >

                Salvar

              </button>

              <button
                style={styles.cancelBtn}
                onClick={() => {

                  setMostrarModal(false);

                  setEditId(null);

                  setNovoAviso({
                    titulo: "",
                    descricao: "",
                    prioridade: "Média",
                    data: new Date()
                      .toLocaleDateString("pt-BR")
                  });

                }}
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
    justifyContent:
      "space-between",
    alignItems: "center",
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

  headerActions: {
    display: "flex",
    gap: "12px"
  },

  search: {
    padding: "14px",
    borderRadius: "12px",
    border:
      "1px solid #d1d5db",
    outline: "none",
    minWidth: "240px"
  },

  button: {
    background:
      "linear-gradient(135deg,#166534,#14532d)",
    color: "white",
    border: "none",
    padding: "14px 22px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700"
  },

  resumeGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "20px",
    marginBottom: "30px"
  },

  resumeCard: {
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

  resumeIcon: {
    fontSize: "40px"
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

  card: {
    background: "white",
    borderRadius: "18px",
    padding: "25px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)"
  },

  table: {
    width: "100%",
    borderCollapse:
      "collapse"
  },

  th: {
    textAlign: "left",
    padding: "16px",
    borderBottom:
      "2px solid #e5e7eb",
    color: "#14532d"
  },

  thCenter: {
    textAlign: "center",
    padding: "16px",
    borderBottom:
      "2px solid #e5e7eb",
    color: "#14532d"
  },

  td: {
    padding: "16px",
    borderBottom:
      "1px solid #f3f4f6"
  },

  tdCenter: {
    padding: "16px",
    textAlign: "center",
    borderBottom:
      "1px solid #f3f4f6"
  },

  badge: {
    padding: "8px 14px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700"
  },

  editButton: {
    background: "#16a34a",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    marginRight: "10px"
  },

  deleteButton: {
    background: "#dc2626",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer"
  },

  empty: {
    textAlign: "center",
    padding: "30px",
    color: "#6b7280"
  },

  modalBg: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background:
      "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent:
      "center",
    alignItems: "center",
    backdropFilter:
      "blur(4px)"
  },

  modal: {
    background: "white",
    width: "420px",
    borderRadius: "18px",
    padding: "28px",
    display: "flex",
    flexDirection:
      "column",
    gap: "14px"
  },

  modalTitle: {
    margin: 0,
    color: "#14532d"
  },

  input: {
    padding: "14px",
    borderRadius: "10px",
    border:
      "1px solid #d1d5db",
    outline: "none"
  },

  textarea: {
    padding: "14px",
    borderRadius: "10px",
    border:
      "1px solid #d1d5db",
    resize: "none",
    minHeight: "120px",
    outline: "none"
  },

  modalButtons: {
    display: "flex",
    justifyContent:
      "space-between",
    marginTop: "10px",
    gap: "12px"
  },

  saveBtn: {
    flex: 1,
    background: "#166534",
    color: "white",
    border: "none",
    padding: "12px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700"
  },

  cancelBtn: {
    flex: 1,
    background: "#d1d5db",
    border: "none",
    padding: "12px 18px",
    borderRadius: "10px",
    cursor: "pointer"
  }

};

export default Avisos;