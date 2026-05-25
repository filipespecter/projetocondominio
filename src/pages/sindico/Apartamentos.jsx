import { useState, useEffect } from "react";

function Apartamentos() {

  const [apartamentos, setApartamentos] = useState([]);

  const [mostrarModal, setMostrarModal] = useState(false);

  const [busca, setBusca] = useState("");

  const [novoAp, setNovoAp] = useState({
    bloco: "",
    numero: "",
    andar: "",
    morador: "",
    status: "Ocupado"
  });

  const [editId, setEditId] = useState(null);


  // CARREGAR DADOS

  useEffect(() => {

    const dados = localStorage.getItem("apartamentos");

    if (dados) {

      setApartamentos(JSON.parse(dados));

    } else {

      setApartamentos([
        {
          id: 1,
          bloco: "A",
          numero: "101",
          andar: "1º",
          morador: "João da Silva",
          status: "Ocupado"
        },
        {
          id: 2,
          bloco: "A",
          numero: "102",
          andar: "1º",
          morador: "Maria Oliveira",
          status: "Ocupado"
        },
        {
          id: 3,
          bloco: "A",
          numero: "201",
          andar: "2º",
          morador: "Carlos Santos",
          status: "Ocupado"
        },
        {
          id: 4,
          bloco: "B",
          numero: "101",
          andar: "1º",
          morador: "",
          status: "Disponível"
        }
      ]);

    }

  }, []);


  // SALVAR DADOS

  useEffect(() => {

    localStorage.setItem(
      "apartamentos",
      JSON.stringify(apartamentos)
    );

  }, [apartamentos]);


  // FILTRO

  const apartamentosFiltrados = apartamentos.filter((ap) =>

    ap.bloco.toLowerCase().includes(busca.toLowerCase()) ||
    ap.numero.toLowerCase().includes(busca.toLowerCase()) ||
    ap.andar.toLowerCase().includes(busca.toLowerCase()) ||
    ap.morador.toLowerCase().includes(busca.toLowerCase()) ||
    ap.status.toLowerCase().includes(busca.toLowerCase())

  );


  // SALVAR APARTAMENTO

  function salvarApartamento() {

    if (
      !novoAp.bloco ||
      !novoAp.numero ||
      !novoAp.andar
    ) {

      alert("Preencha os campos obrigatórios");

      return;

    }

    if (editId !== null) {

      const lista = apartamentos.map((ap) =>

        ap.id === editId
          ? { ...novoAp, id: editId }
          : ap

      );

      setApartamentos(lista);

      setEditId(null);

    } else {

      const novo = {
        id: Date.now(),
        ...novoAp
      };

      setApartamentos([
        ...apartamentos,
        novo
      ]);

    }

    setNovoAp({
      bloco: "",
      numero: "",
      andar: "",
      morador: "",
      status: "Ocupado"
    });

    setMostrarModal(false);

  }


  // EDITAR

  function editarApartamento(ap) {

    setNovoAp(ap);

    setEditId(ap.id);

    setMostrarModal(true);

  }


  // EXCLUIR

  function excluirApartamento(id) {

    const lista = apartamentos.filter(
      (ap) => ap.id !== id
    );

    setApartamentos(lista);

  }


  // STATUS

  function corStatus(status) {

    switch (status) {

      case "Ocupado":
        return {
          background: "#dbeafe",
          color: "#1d4ed8"
        };

      case "Disponível":
        return {
          background: "#dcfce7",
          color: "#166534"
        };

      case "Manutenção":
        return {
          background: "#fee2e2",
          color: "#dc2626"
        };

      default:
        return {
          background: "#f3f4f6",
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
            Apartamentos
          </h1>

          <p style={styles.subtitle}>
            Gerenciamento completo das unidades
          </p>

        </div>


        <div style={styles.headerActions}>


          <input
            placeholder="Buscar apartamento..."
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

              setNovoAp({
                bloco: "",
                numero: "",
                andar: "",
                morador: "",
                status: "Ocupado"
              });

              setMostrarModal(true);

            }}
          >

            + Novo apartamento

          </button>


        </div>

      </div>



      {/* RESUMO */}


      <div style={styles.resumeGrid}>


        <div style={styles.resumeCard}>

          <div style={styles.resumeIcon}>
            🏢
          </div>

          <div>

            <p style={styles.resumeLabel}>
              Total de unidades
            </p>

            <h2 style={styles.resumeNumber}>
              {apartamentos.length}
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
                apartamentos.filter(
                  (a) => a.status === "Disponível"
                ).length
              }
            </h2>

          </div>

        </div>


        <div style={styles.resumeCard}>

          <div style={styles.resumeIcon}>
            👥
          </div>

          <div>

            <p style={styles.resumeLabel}>
              Ocupados
            </p>

            <h2 style={styles.resumeNumber}>
              {
                apartamentos.filter(
                  (a) => a.status === "Ocupado"
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
                Apartamento
              </th>

              <th style={styles.th}>
                Andar
              </th>

              <th style={styles.th}>
                Morador
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


            {apartamentosFiltrados.length === 0 ? (

              <tr>

                <td
                  colSpan="5"
                  style={styles.empty}
                >

                  Nenhum apartamento encontrado

                </td>

              </tr>

            ) : (

              apartamentosFiltrados.map((ap) => (

                <tr key={ap.id}>


                  <td style={styles.td}>

                    <div style={styles.apInfo}>

                      <div style={styles.apIcon}>
                        🏢
                      </div>

                      <div>

                        <strong>
                          Bloco {ap.bloco} - {ap.numero}
                        </strong>

                      </div>

                    </div>

                  </td>


                  <td style={styles.td}>
                    {ap.andar}
                  </td>


                  <td style={styles.td}>

                    {ap.morador || "Sem morador"}

                  </td>


                  <td style={styles.td}>

                    <span
                      style={{
                        ...styles.statusBadge,
                        ...corStatus(ap.status)
                      }}
                    >

                      {ap.status}

                    </span>

                  </td>


                  <td style={styles.tdCenter}>


                    <button
                      style={styles.editButton}
                      onClick={() =>
                        editarApartamento(ap)
                      }
                    >

                      Editar

                    </button>


                    <button
                      style={styles.deleteButton}
                      onClick={() =>
                        excluirApartamento(ap.id)
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
                ? "Editar apartamento"
                : "Novo apartamento"}

            </h2>


            <input
              placeholder="Bloco"
              value={novoAp.bloco}
              onChange={(e) =>

                setNovoAp({
                  ...novoAp,
                  bloco: e.target.value
                })

              }
              style={styles.input}
            />


            <input
              placeholder="Número"
              value={novoAp.numero}
              onChange={(e) =>

                setNovoAp({
                  ...novoAp,
                  numero: e.target.value
                })

              }
              style={styles.input}
            />


            <input
              placeholder="Andar"
              value={novoAp.andar}
              onChange={(e) =>

                setNovoAp({
                  ...novoAp,
                  andar: e.target.value
                })

              }
              style={styles.input}
            />


            <input
              placeholder="Morador"
              value={novoAp.morador}
              onChange={(e) =>

                setNovoAp({
                  ...novoAp,
                  morador: e.target.value
                })

              }
              style={styles.input}
            />


            <select
              value={novoAp.status}
              onChange={(e) =>

                setNovoAp({
                  ...novoAp,
                  status: e.target.value
                })

              }
              style={styles.input}
            >

              <option>
                Ocupado
              </option>

              <option>
                Disponível
              </option>

              <option>
                Manutenção
              </option>

            </select>


            <div style={styles.modalButtons}>


              <button
                style={styles.saveButton}
                onClick={salvarApartamento}
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
    color: "#1e3a8a"
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
      "linear-gradient(135deg,#1e3a8a,#2563eb)",
    color: "white",
    border: "none",
    padding: "12px 18px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700",
    boxShadow:
      "0 4px 14px rgba(37,99,235,0.25)"
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
      "linear-gradient(135deg,#1e3a8a,#2563eb)",
    color: "white",
    borderRadius: "22px",
    padding: "25px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow:
      "0 10px 30px rgba(37,99,235,0.18)"
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

  apInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },

  apIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background:
      "linear-gradient(135deg,#1e3a8a,#2563eb)",
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

  editButton: {
    background: "#dbeafe",
    color: "#1d4ed8",
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
    color: "#1e3a8a"
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
      "linear-gradient(135deg,#1e3a8a,#2563eb)",
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

export default Apartamentos;