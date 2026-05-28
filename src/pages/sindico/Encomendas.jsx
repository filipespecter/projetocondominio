import { useState, useEffect } from "react";

function Encomendas() {

  const [encomendas, setEncomendas] = useState([]);

  const [mostrarModal, setMostrarModal] = useState(false);

  const [busca, setBusca] = useState("");

  const [carregado, setCarregado] = useState(false);

  const [novaEncomenda, setNovaEncomenda] = useState({
    morador: "",
    descricao: "",
    status: "Recebido"
  });

  const [editId, setEditId] = useState(null);


  // CARREGAR DADOS

  useEffect(() => {

    try {

      const dados =
        localStorage.getItem("encomendas");

      if (dados) {

        setEncomendas(
          JSON.parse(dados)
        );

      } else {

        setEncomendas([
          {
            id: 1,
            morador: "João Silva",
            descricao: "Amazon - Caixa média",
            data: "20/07/2025 14:22",
            status: "Recebido"
          },
          {
            id: 2,
            morador: "Maria Oliveira",
            descricao: "Mercado Livre - Envelope",
            data: "20/07/2025 16:10",
            status: "Entregue"
          }
        ]);

      }

    } catch {

      setEncomendas([]);

    }

    setCarregado(true);

  }, []);


  // SALVAR AUTOMATICAMENTE

  useEffect(() => {

    if (!carregado) return;

    localStorage.setItem(
      "encomendas",
      JSON.stringify(encomendas)
    );

  }, [encomendas, carregado]);


  // FILTRO

  const encomendasFiltradas = encomendas.filter((e) =>

    e.morador
      ?.toLowerCase()
      .includes(busca.toLowerCase()) ||

    e.descricao
      ?.toLowerCase()
      .includes(busca.toLowerCase()) ||

    e.status
      ?.toLowerCase()
      .includes(busca.toLowerCase())

  );


  // SALVAR ENCOMENDA

  function salvarEncomenda() {

    if (
      !novaEncomenda.morador ||
      !novaEncomenda.descricao
    ) {

      alert("Preencha todos os campos");

      return;

    }

    if (editId !== null) {

      const lista = encomendas.map((e) =>

        e.id === editId
          ? {
              ...novaEncomenda,
              id: editId,
              data: encomendas.find(
                (item) => item.id === editId
              )?.data || new Date().toLocaleString()
            }
          : e

      );

      setEncomendas(lista);

      setEditId(null);

    } else {

      const nova = {

        id: Date.now(),

        ...novaEncomenda,

        data:
          new Date().toLocaleString()

      };

      setEncomendas([
        ...encomendas,
        nova
      ]);

    }

    setNovaEncomenda({
      morador: "",
      descricao: "",
      status: "Recebido"
    });

    setMostrarModal(false);

  }


  // EDITAR

  function editarEncomenda(encomenda) {

    setNovaEncomenda(encomenda);

    setEditId(encomenda.id);

    setMostrarModal(true);

  }


  // EXCLUIR

  function excluirEncomenda(id) {

    const lista = encomendas.filter(
      (e) => e.id !== id
    );

    setEncomendas(lista);

  }


  // ALTERAR STATUS

  function alterarStatus(id, status) {

    const lista = encomendas.map((e) =>

      e.id === id
        ? { ...e, status }
        : e

    );

    setEncomendas(lista);

  }


  // CORES STATUS

  function corStatus(status) {

    switch (status) {

      case "Recebido":
        return {
          background: "#fef3c7",
          color: "#92400e"
        };

      case "Entregue":
        return {
          background: "#dcfce7",
          color: "#166534"
        };

      case "Atrasado":
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


      {/* HEADER */}


      <div style={styles.header}>


        <div>

          <h1 style={styles.title}>
            Encomendas
          </h1>

          <p style={styles.subtitle}>
            Controle completo de encomendas
          </p>

        </div>


        <div style={styles.headerActions}>


          <input
            placeholder="Buscar encomenda..."
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

              setNovaEncomenda({
                morador: "",
                descricao: "",
                status: "Recebido"
              });

              setMostrarModal(true);

            }}
          >

            + Nova encomenda

          </button>


        </div>

      </div>



      {/* RESUMO */}


      <div style={styles.resumeGrid}>


        <div style={styles.resumeCard}>

          <div style={styles.resumeIcon}>
            📦
          </div>

          <div>

            <p style={styles.resumeLabel}>
              Total de encomendas
            </p>

            <h2 style={styles.resumeNumber}>
              {encomendas.length}
            </h2>

          </div>

        </div>


        <div style={styles.resumeCard}>

          <div style={styles.resumeIcon}>
            ⏳
          </div>

          <div>

            <p style={styles.resumeLabel}>
              Pendentes
            </p>

            <h2 style={styles.resumeNumber}>
              {
                encomendas.filter(
                  (e) => e.status === "Recebido"
                ).length
              }
            </h2>

          </div>

        </div>


        <div style={styles.resumeCard}>

          <div style={styles.resumeIcon}>
            ✅
          </div>

          <div>

            <p style={styles.resumeLabel}>
              Entregues
            </p>

            <h2 style={styles.resumeNumber}>
              {
                encomendas.filter(
                  (e) => e.status === "Entregue"
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
                Morador
              </th>

              <th style={styles.th}>
                Descrição
              </th>

              <th style={styles.th}>
                Data
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


            {encomendasFiltradas.length === 0 ? (

              <tr>

                <td
                  colSpan="5"
                  style={styles.empty}
                >

                  Nenhuma encomenda encontrada

                </td>

              </tr>

            ) : (

              encomendasFiltradas.map((e) => (

                <tr key={e.id}>


                  <td style={styles.td}>

                    <div style={styles.userInfo}>

                      <div style={styles.avatar}>
                        📦
                      </div>

                      <strong>
                        {e.morador}
                      </strong>

                    </div>

                  </td>


                  <td style={styles.td}>
                    {e.descricao}
                  </td>


                  <td style={styles.td}>
                    {e.data}
                  </td>


                  <td style={styles.td}>

                    <span
                      style={{
                        ...styles.statusBadge,
                        ...corStatus(e.status)
                      }}
                    >

                      {e.status}

                    </span>

                  </td>


                  <td style={styles.tdCenter}>


                    {e.status !== "Entregue" && (

                      <button
                        style={styles.successButton}
                        onClick={() =>
                          alterarStatus(
                            e.id,
                            "Entregue"
                          )
                        }
                      >

                        Entregar

                      </button>

                    )}


                    <button
                      style={styles.editButton}
                      onClick={() =>
                        editarEncomenda(e)
                      }
                    >

                      Editar

                    </button>


                    <button
                      style={styles.deleteButton}
                      onClick={() =>
                        excluirEncomenda(e.id)
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

        <div style={styles.modalBackground}>


          <div style={styles.modal}>


            <h2 style={styles.modalTitle}>

              {editId !== null
                ? "Editar encomenda"
                : "Nova encomenda"}

            </h2>


            <input
              placeholder="Nome do morador"
              value={novaEncomenda.morador}
              onChange={(e) =>

                setNovaEncomenda({
                  ...novaEncomenda,
                  morador: e.target.value
                })

              }
              style={styles.input}
            />


            <input
              placeholder="Descrição da encomenda"
              value={novaEncomenda.descricao}
              onChange={(e) =>

                setNovaEncomenda({
                  ...novaEncomenda,
                  descricao: e.target.value
                })

              }
              style={styles.input}
            />


            <select
              value={novaEncomenda.status}
              onChange={(e) =>

                setNovaEncomenda({
                  ...novaEncomenda,
                  status: e.target.value
                })

              }
              style={styles.input}
            >

              <option>
                Recebido
              </option>

              <option>
                Entregue
              </option>

              <option>
                Atrasado
              </option>

            </select>


            <div style={styles.modalButtons}>


              <button
                style={styles.saveButton}
                onClick={salvarEncomenda}
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
    color: "#7c2d12"
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
    minWidth: "240px"
  },

  button: {
    background:
      "linear-gradient(135deg,#b45309,#d97706)",
    color: "white",
    border: "none",
    padding: "12px 18px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700",
    boxShadow:
      "0 4px 14px rgba(217,119,6,0.25)"
  },

  resumeGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(250px,1fr))",
    gap: "20px",
    marginBottom: "30px"
  },

  resumeCard: {
    background:
      "linear-gradient(135deg,#b45309,#d97706)",
    color: "white",
    borderRadius: "22px",
    padding: "25px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow:
      "0 10px 30px rgba(217,119,6,0.18)"
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
      "linear-gradient(135deg,#b45309,#d97706)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  statusBadge: {
    padding: "8px 14px",
    borderRadius: "999px",
    fontWeight: "700",
    fontSize: "13px"
  },

  successButton: {
    background: "#dcfce7",
    color: "#166534",
    border: "none",
    padding: "10px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
    marginRight: "8px"
  },

  editButton: {
    background: "#fef3c7",
    color: "#92400e",
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
    backdropFilter: "blur(4px)"
  },

  modal: {
    width: "420px",
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
    color: "#92400e"
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
      "linear-gradient(135deg,#b45309,#d97706)",
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

export default Encomendas;