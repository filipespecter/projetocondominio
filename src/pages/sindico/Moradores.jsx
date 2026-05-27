import { useState } from "react";

function Moradores() {

  const [moradores, setMoradores] = useState(() => {

    const dados =
      localStorage.getItem("moradores");

    return dados
      ? JSON.parse(dados)
      : [];

  });

  const [mostrarModal, setMostrarModal] =
    useState(false);

  const [busca, setBusca] = useState("");

  const [novoMorador, setNovoMorador] =
    useState({
      id: null,
      nome: "",
      apto: "",
      telefone: "",
      email: "",
      usuario: "",
      senha: "",
      status: "Ativo"
    });

  const [editId, setEditId] =
    useState(null);

  /* =========================
     FILTRO
  ========================= */

  const moradoresFiltrados =
    moradores.filter((morador) =>

      morador.nome
        ?.toLowerCase()
        .includes(busca.toLowerCase()) ||

      morador.apto
        ?.toLowerCase()
        .includes(busca.toLowerCase()) ||

      morador.telefone
        ?.toLowerCase()
        .includes(busca.toLowerCase()) ||

      morador.usuario
        ?.toLowerCase()
        .includes(busca.toLowerCase())

    );

  /* =========================
     SALVAR
  ========================= */

  function salvarMorador() {

    if (
      !novoMorador.nome ||
      !novoMorador.apto ||
      !novoMorador.telefone ||
      !novoMorador.usuario ||
      !novoMorador.senha
    ) {

      alert("Preencha todos os campos");

      return;

    }

    const usuarioExistente =
      moradores.find(
        (m) =>

          m.usuario
            ?.toLowerCase() ===
            novoMorador.usuario.toLowerCase() &&

          m.id !== editId
      );

    if (usuarioExistente) {

      alert("Esse usuário já existe");

      return;

    }

    if (editId !== null) {

      const listaAtualizada =
        moradores.map((morador) =>

          morador.id === editId
            ? {
                ...novoMorador,
                id: editId
              }
            : morador

        );

      setMoradores(listaAtualizada);

      localStorage.setItem(
        "moradores",
        JSON.stringify(listaAtualizada)
      );

      setEditId(null);

    } else {

      const novo = {
        ...novoMorador,
        id: Date.now()
      };

      const listaAtualizada = [
        ...moradores,
        novo
      ];

      setMoradores(listaAtualizada);

      localStorage.setItem(
        "moradores",
        JSON.stringify(listaAtualizada)
      );

    }

    setNovoMorador({
      id: null,
      nome: "",
      apto: "",
      telefone: "",
      email: "",
      usuario: "",
      senha: "",
      status: "Ativo"
    });

    setMostrarModal(false);

  }

  /* =========================
     EXCLUIR
  ========================= */

  function excluirMorador(id) {

    const lista =
      moradores.filter(
        (morador) =>
          morador.id !== id
      );

    setMoradores(lista);

    localStorage.setItem(
      "moradores",
      JSON.stringify(lista)
    );

  }

  /* =========================
     EDITAR
  ========================= */

  function editarMorador(morador) {

    setNovoMorador(morador);

    setEditId(morador.id);

    setMostrarModal(true);

  }

  return (

    <div style={styles.container}>

      {/* HEADER */}

      <div style={styles.header}>

        <div>

          <h1 style={styles.title}>
            Moradores
          </h1>

          <p style={styles.subtitle}>
            Gestão completa dos moradores do condomínio
          </p>

        </div>

        <div style={styles.actions}>

          <input
            placeholder="Buscar morador..."
            value={busca}
            onChange={(e) =>
              setBusca(e.target.value)
            }
            style={styles.search}
          />

          <button
            style={styles.button}
            onClick={() => {

              setEditId(null);

              setNovoMorador({
                id: null,
                nome: "",
                apto: "",
                telefone: "",
                email: "",
                usuario: "",
                senha: "",
                status: "Ativo"
              });

              setMostrarModal(true);

            }}
          >

            + Novo Morador

          </button>

        </div>

      </div>

      {/* CARDS RESUMO */}

      <div style={styles.resumeGrid}>

        <div style={styles.resumeCard}>

          <div style={styles.resumeIcon}>
            👥
          </div>

          <div>

            <p style={styles.resumeLabel}>
              Total de moradores
            </p>

            <h2 style={styles.resumeNumber}>
              {moradores.length}
            </h2>

          </div>

        </div>

        <div style={styles.resumeCard}>

          <div style={styles.resumeIcon}>
            🏢
          </div>

          <div>

            <p style={styles.resumeLabel}>
              Apartamentos ocupados
            </p>

            <h2 style={styles.resumeNumber}>
              {moradores.length}
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
                Morador
              </th>

              <th style={styles.th}>
                Apartamento
              </th>

              <th style={styles.th}>
                Contato
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

            {moradoresFiltrados.length === 0 && (

              <tr>

                <td
                  colSpan="6"
                  style={styles.empty}
                >

                  Nenhum morador encontrado

                </td>

              </tr>

            )}

            {moradoresFiltrados.map(
              (morador) => (

              <tr key={morador.id}>

                <td style={styles.td}>

                  <div style={styles.userArea}>

                    <div style={styles.avatar}>

                      {morador.nome
                        .charAt(0)
                        .toUpperCase()}

                    </div>

                    <div>

                      <strong>
                        {morador.nome}
                      </strong>

                      <p style={styles.email}>

                        {morador.email ||
                          "Sem email"}

                      </p>

                    </div>

                  </div>

                </td>

                <td style={styles.td}>

                  <span style={styles.aptoBadge}>

                    {morador.apto}

                  </span>

                </td>

                <td style={styles.td}>

                  {morador.telefone}

                </td>

                <td style={styles.td}>

                  {morador.usuario}

                </td>

                <td style={styles.td}>

                  <span style={styles.status}>

                    {morador.status}

                  </span>

                </td>

                <td style={styles.tdCenter}>

                  <button
                    style={styles.editButton}
                    onClick={() =>
                      editarMorador(morador)
                    }
                  >

                    Editar

                  </button>

                  <button
                    style={styles.deleteButton}
                    onClick={() =>
                      excluirMorador(
                        morador.id
                      )
                    }
                  >

                    Excluir

                  </button>

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

            <div style={styles.modalHeader}>

              <h2 style={styles.modalTitle}>

                {editId !== null
                  ? "Editar morador"
                  : "Novo morador"}

              </h2>

              <button
                style={styles.close}
                onClick={() =>
                  setMostrarModal(false)
                }
              >
                ✕
              </button>

            </div>

            <div style={styles.form}>

              <input
                placeholder="Nome completo"
                value={novoMorador.nome}
                onChange={(e) =>
                  setNovoMorador({
                    ...novoMorador,
                    nome: e.target.value
                  })
                }
                style={styles.input}
              />

              <input
                placeholder="Apartamento"
                value={novoMorador.apto}
                onChange={(e) =>
                  setNovoMorador({
                    ...novoMorador,
                    apto: e.target.value
                  })
                }
                style={styles.input}
              />

              <input
                placeholder="Telefone"
                value={novoMorador.telefone}
                onChange={(e) =>
                  setNovoMorador({
                    ...novoMorador,
                    telefone: e.target.value
                  })
                }
                style={styles.input}
              />

              <input
                placeholder="Email"
                value={novoMorador.email}
                onChange={(e) =>
                  setNovoMorador({
                    ...novoMorador,
                    email: e.target.value
                  })
                }
                style={styles.input}
              />

              <input
                placeholder="Usuário de login"
                value={novoMorador.usuario}
                onChange={(e) =>
                  setNovoMorador({
                    ...novoMorador,
                    usuario: e.target.value
                  })
                }
                style={styles.input}
              />

              <input
                type="password"
                placeholder="Senha"
                value={novoMorador.senha}
                onChange={(e) =>
                  setNovoMorador({
                    ...novoMorador,
                    senha: e.target.value
                  })
                }
                style={styles.input}
              />

              <select
                value={novoMorador.status}
                onChange={(e) =>
                  setNovoMorador({
                    ...novoMorador,
                    status: e.target.value
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

            </div>

            <div style={styles.modalButtons}>

              <button
                style={styles.saveButton}
                onClick={salvarMorador}
              >

                Salvar Morador

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
    fontSize: "34px",
    color: "#14532d"
  },

  subtitle: {
    marginTop: "8px",
    color: "#6b7280"
  },

  actions: {
    display: "flex",
    gap: "12px"
  },

  search: {
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    outline: "none",
    width: "240px",
    background: "#fff"
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
      "0 4px 12px rgba(20,83,45,0.25)"
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
    borderRadius: "20px",
    padding: "24px",
    color: "white",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow:
      "0 8px 25px rgba(20,83,45,0.18)"
  },

  resumeIcon: {
    fontSize: "42px"
  },

  resumeLabel: {
    marginBottom: "6px",
    opacity: 0.9
  },

  resumeNumber: {
    margin: 0,
    fontSize: "34px"
  },

  card: {
    background: "white",
    borderRadius: "22px",
    overflow: "hidden",
    boxShadow:
      "0 4px 20px rgba(0,0,0,0.05)"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse"
  },

  th: {
    textAlign: "left",
    padding: "20px",
    background: "#f0fdf4",
    color: "#14532d",
    fontWeight: "700",
    borderBottom: "1px solid #dcfce7"
  },

  thCenter: {
    textAlign: "center",
    padding: "20px",
    background: "#f0fdf4",
    color: "#14532d",
    fontWeight: "700",
    borderBottom: "1px solid #dcfce7"
  },

  td: {
    padding: "20px",
    borderBottom: "1px solid #f3f4f6"
  },

  tdCenter: {
    padding: "20px",
    textAlign: "center",
    borderBottom: "1px solid #f3f4f6"
  },

  empty: {
    padding: "40px",
    textAlign: "center",
    color: "#6b7280"
  },

  userArea: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },

  avatar: {
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    background:
      "linear-gradient(135deg,#166534,#22c55e)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700"
  },

  email: {
    marginTop: "5px",
    color: "#6b7280",
    fontSize: "13px"
  },

  aptoBadge: {
    background: "#dcfce7",
    color: "#166534",
    padding: "8px 14px",
    borderRadius: "999px",
    fontWeight: "700",
    fontSize: "13px"
  },

  status: {
    background: "#dcfce7",
    color: "#166534",
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
    marginRight: "8px"
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
    zIndex: 999
  },

  modal: {
    width: "450px",
    background: "white",
    borderRadius: "24px",
    padding: "28px",
    boxShadow:
      "0 10px 40px rgba(0,0,0,0.15)"
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px"
  },

  modalTitle: {
    margin: 0,
    color: "#14532d"
  },

  close: {
    background: "#f3f4f6",
    border: "none",
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    cursor: "pointer"
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px"
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
    marginTop: "24px",
    gap: "12px"
  },

  saveButton: {
    flex: 1,
    background:
      "linear-gradient(135deg,#14532d,#166534)",
    color: "white",
    border: "none",
    padding: "14px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700"
  },

  cancelButton: {
    flex: 1,
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    padding: "14px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700"
  }

};

export default Moradores;