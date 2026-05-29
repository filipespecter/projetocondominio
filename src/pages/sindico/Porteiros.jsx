import { useState } from "react";

function Porteiros() {

  const STORAGE_KEY = "porteiros";

  const estadoInicialPorteiro = {
    nome: "",
    turno: "",
    telefone: "",
    usuario: "",
    senha: "",
    status: "Ativo",
    ultimoLogin: null
  };

  const [porteiros, setPorteiros] =
    useState(() => {

      const dados =
        localStorage.getItem(STORAGE_KEY);

      return dados
        ? JSON.parse(dados)
        : [];

    });

  const [mostrarModal, setMostrarModal] =
    useState(false);

  const [busca, setBusca] =
    useState("");

  const [novoPorteiro, setNovoPorteiro] =
    useState(estadoInicialPorteiro);

  const [editId, setEditId] =
    useState(null);

  const porteirosFiltrados =
    porteiros.filter((p) =>

      p.nome
        ?.toLowerCase()
        .includes(
          busca.toLowerCase()
        ) ||

      p.turno
        ?.toLowerCase()
        .includes(
          busca.toLowerCase()
        ) ||

      p.telefone
        ?.toLowerCase()
        .includes(
          busca.toLowerCase()
        ) ||

      p.usuario
        ?.toLowerCase()
        .includes(
          busca.toLowerCase()
        )

    );

  function limparFormulario() {

    setNovoPorteiro(
      estadoInicialPorteiro
    );

    setEditId(null);

  }

  function salvarPorteiro() {

    if (
      !novoPorteiro.nome ||
      !novoPorteiro.turno ||
      !novoPorteiro.telefone ||
      !novoPorteiro.usuario ||
      !novoPorteiro.senha
    ) {

      alert(
        "Preencha todos os campos"
      );

      return;

    }

    const usuarioExistente =
      porteiros.find(

        (p) =>

          p.usuario
            ?.trim()
            .toLowerCase() ===

          novoPorteiro.usuario
            .trim()
            .toLowerCase() &&

          p.id !== editId

      );

    if (usuarioExistente) {

      alert(
        "Esse usuário já existe"
      );

      return;

    }

    let listaAtualizada = [];

    if (editId !== null) {

      listaAtualizada =
        porteiros.map((p) =>

          p.id === editId
            ? {
                ...p,
                ...novoPorteiro,
                id: editId
              }
            : p

        );

      setEditId(null);

    } else {

      const novo = {
        id: Date.now(),
        ...novoPorteiro
      };

      listaAtualizada = [
        ...porteiros,
        novo
      ];

    }

    setPorteiros(
      listaAtualizada
    );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        listaAtualizada
      )
    );

    limparFormulario();

    setMostrarModal(false);

  }

  function editarPorteiro(
    porteiro
  ) {

    setNovoPorteiro({
      ...estadoInicialPorteiro,
      ...porteiro
    });

    setEditId(
      porteiro.id
    );

    setMostrarModal(true);

  }

  function excluirPorteiro(id) {

    const confirmar =
      window.confirm(
        "Deseja excluir este porteiro?"
      );

    if (!confirmar) return;

    const lista =
      porteiros.filter(
        (p) => p.id !== id
      );

    setPorteiros(lista);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(lista)
    );

  }

  function fecharModal() {

    limparFormulario();

    setMostrarModal(false);

  }

  return (

    <div style={styles.container}>

      {/* HEADER */}

      <div style={styles.header}>

        <div>

          <h1 style={styles.title}>
            Porteiros
          </h1>

          <p style={styles.subtitle}>
            Gerenciamento da equipe da portaria
          </p>

        </div>

        <div style={styles.headerActions}>

          <input
            placeholder="Buscar porteiro..."
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

              limparFormulario();

              setMostrarModal(
                true
              );

            }}
          >

            + Novo porteiro

          </button>

        </div>

      </div>

      {/* CARDS */}

      <div style={styles.resumeGrid}>

        <div style={styles.resumeCard}>

          <div style={styles.resumeIcon}>
            🛡️
          </div>

          <div>

            <p style={styles.resumeLabel}>
              Total de porteiros
            </p>

            <h2 style={styles.resumeNumber}>
              {porteiros.length}
            </h2>

          </div>

        </div>

        <div style={styles.resumeCard}>

          <div style={styles.resumeIcon}>
            🌙
          </div>

          <div>

            <p style={styles.resumeLabel}>
              Turno noturno
            </p>

            <h2 style={styles.resumeNumber}>
              {
                porteiros.filter(
                  (p) =>
                    p.turno ===
                    "Noite"
                ).length
              }
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
                Nome
              </th>

              <th style={styles.th}>
                Turno
              </th>

              <th style={styles.th}>
                Telefone
              </th>

              <th style={styles.th}>
                Usuário
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

            {porteirosFiltrados.length === 0 ? (

              <tr>

                <td
                  colSpan="6"
                  style={styles.empty}
                >

                  Nenhum porteiro encontrado

                </td>

              </tr>

            ) : (

              porteirosFiltrados.map((p) => (

                <tr key={p.id}>

                  <td style={styles.td}>

                    <div style={styles.userInfo}>

                      <div style={styles.avatar}>

                        {p.nome.charAt(0)}

                      </div>

                      <div>

                        <strong>
                          {p.nome}
                        </strong>

                      </div>

                    </div>

                  </td>

                  <td style={styles.td}>

                    <span
                      style={{
                        ...styles.turnoBadge,

                        background:
                          p.turno ===
                          "Noite"
                            ? "#dcfce7"
                            : "#ecfdf5",

                        color:
                          p.turno ===
                          "Noite"
                            ? "#14532d"
                            : "#166534"
                      }}
                    >

                      {p.turno}

                    </span>

                  </td>

                  <td style={styles.td}>
                    {p.telefone}
                  </td>

                  <td style={styles.td}>
                    {p.usuario}
                  </td>

                  <td style={styles.td}>

                    <span
                      style={{
                        ...styles.statusBadge,

                        background:
                          p.status === "Ativo"
                            ? "#dcfce7"
                            : "#fee2e2",

                        color:
                          p.status === "Ativo"
                            ? "#166534"
                            : "#dc2626"
                      }}
                    >

                      {p.status}

                    </span>

                  </td>

                  <td style={styles.tdCenter}>

                    <button
                      style={styles.editButton}
                      onClick={() =>
                        editarPorteiro(p)
                      }
                    >

                      Editar

                    </button>

                    <button
                      style={styles.deleteButton}
                      onClick={() =>
                        excluirPorteiro(
                          p.id
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
                ? "Editar porteiro"
                : "Novo porteiro"}

            </h2>

            <input
              placeholder="Nome completo"
              value={novoPorteiro.nome}
              onChange={(e) =>

                setNovoPorteiro({
                  ...novoPorteiro,
                  nome:
                    e.target.value
                })

              }
              style={styles.input}
            />

            <select
              value={novoPorteiro.turno}
              onChange={(e) =>

                setNovoPorteiro({
                  ...novoPorteiro,
                  turno:
                    e.target.value
                })

              }
              style={styles.input}
            >

              <option value="">
                Escolha o turno
              </option>

              <option>
                Manhã
              </option>

              <option>
                Tarde
              </option>

              <option>
                Noite
              </option>

            </select>

            <input
              placeholder="Telefone"
              value={novoPorteiro.telefone}
              onChange={(e) =>

                setNovoPorteiro({
                  ...novoPorteiro,
                  telefone:
                    e.target.value
                })

              }
              style={styles.input}
            />

            <input
              placeholder="Usuário de login"
              value={novoPorteiro.usuario}
              onChange={(e) =>

                setNovoPorteiro({
                  ...novoPorteiro,
                  usuario:
                    e.target.value
                })

              }
              style={styles.input}
            />

            <input
              type="password"
              placeholder="Senha"
              value={novoPorteiro.senha}
              onChange={(e) =>

                setNovoPorteiro({
                  ...novoPorteiro,
                  senha:
                    e.target.value
                })

              }
              style={styles.input}
            />

            <select
              value={novoPorteiro.status}
              onChange={(e) =>

                setNovoPorteiro({
                  ...novoPorteiro,
                  status:
                    e.target.value
                })

              }
              style={styles.input}
            >

              <option>
                Ativo
              </option>

              <option>
                Inativo
              </option>

            </select>

            <div style={styles.modalButtons}>

              <button
                style={styles.saveBtn}
                onClick={
                  salvarPorteiro
                }
              >

                Salvar

              </button>

              <button
                style={styles.cancelBtn}
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

  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },

  avatar: {
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

  turnoBadge: {
    padding: "8px 14px",
    borderRadius: "999px",
    fontWeight: "700",
    fontSize: "13px"
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

  modalBg: {
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
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    outline: "none",
    fontSize: "14px"
  },

  modalButtons: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "10px"
  },

  saveBtn: {
    background:
      "linear-gradient(135deg,#14532d,#166534)",
    color: "white",
    border: "none",
    padding: "12px 18px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700"
  },

  cancelBtn: {
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    padding: "12px 18px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700"
  }

};

export default Porteiros;