import { useEffect, useState } from "react";

function Visitantes() {

  const [visitantes, setVisitantes] =
    useState([]);

  const [mostrarModal, setMostrarModal] =
    useState(false);

  const [busca, setBusca] =
    useState("");

  const [novoVisitante, setNovoVisitante] =
    useState({
      nome: "",
      documento: "",
      apartamento: "",
      morador: "",
      observacao: "",
      entrada: "",
      autorizado: false,
      bloqueado: false,
      status: "Pendente",
      tipo: "Visita"
    });

  const [editId, setEditId] =
    useState(null);

  /* =========================
     CARREGAR DADOS
  ========================= */

  useEffect(() => {

    const dados =
      localStorage.getItem(
        "visitantes"
      );

    if (dados) {

      try {

        setVisitantes(
          JSON.parse(dados)
        );

      } catch {

        setVisitantes([]);

      }

    } else {

      setVisitantes([]);

    }

  }, []);

  /* =========================
     FILTRO
  ========================= */

  const visitantesFiltrados =
    visitantes.filter((v) =>

      v.nome
        ?.toLowerCase()
        .includes(
          busca.toLowerCase()
        ) ||

      v.documento
        ?.toLowerCase()
        .includes(
          busca.toLowerCase()
        ) ||

      v.apartamento
        ?.toLowerCase()
        .includes(
          busca.toLowerCase()
        )

    );

  const emVisita =
    visitantes.filter(
      (v) =>
        v.status ===
        "Em visita"
    );

  const autorizados =
    visitantes.filter(
      (v) =>
        v.autorizado === true
    );

  const bloqueados =
    visitantes.filter(
      (v) =>
        v.bloqueado === true
    );

  /* =========================
     HISTÓRICO
  ========================= */

  function salvarHistorico(
    acao,
    visitante
  ) {

    const historico =
      JSON.parse(
        localStorage.getItem(
          "movimentacoes"
        )
      ) || [];

    historico.unshift({

      id: Date.now(),

      tipo: "visitante",

      acao,

      nome: visitante.nome,

      apartamento:
        visitante.apartamento,

      data:
        new Date().toLocaleDateString(),

      hora:
        new Date().toLocaleTimeString(),

      timestamp:
        Date.now()

    });

    localStorage.setItem(
      "movimentacoes",
      JSON.stringify(
        historico
      )
    );

  }

  /* =========================
     SALVAR VISITANTE
  ========================= */

  function salvarVisitante() {

    if (
      !novoVisitante.nome ||
      !novoVisitante.documento ||
      !novoVisitante.apartamento
    ) {

      alert(
        "Preencha os campos obrigatórios"
      );

      return;

    }

    const agora =
      new Date();

    let statusFinal =
      "Pendente";

    if (
      novoVisitante.bloqueado
    ) {

      statusFinal =
        "Bloqueado";

    } else if (
      novoVisitante.autorizado
    ) {

      statusFinal =
        "Autorizado";

    }

    const visitanteCompleto = {

      ...novoVisitante,

      status:
        statusFinal,

      data:
        agora.toLocaleDateString(),

      hora:
        agora.toLocaleTimeString(),

      timestamp:
        agora.getTime(),

      mes:
        agora.getMonth() + 1,

      ano:
        agora.getFullYear(),

      porteiro:
        "Porteiro",

      entrada:
        novoVisitante.entrada ||
        agora.toLocaleTimeString()

    };

    /* =========================
       EDITAR
    ========================= */

    if (
      editId !== null
    ) {

      setVisitantes(
        (prev) => {

          const listaAtualizada =
            prev.map((v) =>

              v.id === editId
                ? {
                    ...visitanteCompleto,
                    id: editId
                  }
                : v

            );

          localStorage.setItem(
            "visitantes",
            JSON.stringify(
              listaAtualizada
            )
          );

          return listaAtualizada;

        }
      );

      salvarHistorico(
        "edição",
        visitanteCompleto
      );

      setEditId(null);

    }

    /* =========================
       NOVO VISITANTE
    ========================= */

    else {

      const novo = {

        id: Date.now(),

        ...visitanteCompleto

      };

      setVisitantes(
        (prev) => {

          const novaLista = [
            ...prev,
            novo
          ];

          localStorage.setItem(
            "visitantes",
            JSON.stringify(
              novaLista
            )
          );

          return novaLista;

        }
      );

      salvarHistorico(
        "cadastro",
        novo
      );

    }

    setNovoVisitante({

      nome: "",
      documento: "",
      apartamento: "",
      morador: "",
      observacao: "",
      entrada: "",
      autorizado: false,
      bloqueado: false,
      status: "Pendente",
      tipo: "Visita"

    });

    setMostrarModal(false);

  }

  /* =========================
     EXCLUIR
  ========================= */

  function excluirVisitante(
    id
  ) {

    const visitante =
      visitantes.find(
        (v) =>
          v.id === id
      );

    if (visitante) {

      salvarHistorico(
        "exclusão",
        visitante
      );

    }

    const novaLista =
      visitantes.filter(
        (v) =>
          v.id !== id
      );

    setVisitantes(
      novaLista
    );

    localStorage.setItem(
      "visitantes",
      JSON.stringify(
        novaLista
      )
    );

  }

  /* =========================
     EDITAR
  ========================= */

  function editarVisitante(
    v
  ) {

    setNovoVisitante(v);

    setEditId(v.id);

    setMostrarModal(true);

  }

  /* =========================
     MUDAR STATUS
  ========================= */

  function mudarStatus(
    id,
    status
  ) {

    const lista =
      visitantes.map((v) =>

        v.id === id
          ? {
              ...v,
              status
            }
          : v

      );

    const visitante =
      lista.find(
        (v) =>
          v.id === id
      );

    if (visitante) {

      salvarHistorico(
        `status: ${status}`,
        visitante
      );

    }

    setVisitantes(lista);

    localStorage.setItem(
      "visitantes",
      JSON.stringify(
        lista
      )
    );

  }

  /* =========================
     COR STATUS
  ========================= */

  function corStatus(
    status
  ) {

    switch (status) {

      case "Em visita":

        return {
          bg: "#dcfce7",
          color:
            "#166534"
        };

      case "Autorizado":

        return {
          bg: "#dbeafe",
          color:
            "#1d4ed8"
        };

      case "Bloqueado":

        return {
          bg: "#fee2e2",
          color:
            "#dc2626"
        };

      case "Saiu":

        return {
          bg: "#e5e7eb",
          color:
            "#374151"
        };

      default:

        return {
          bg: "#fef9c3",
          color:
            "#854d0e"
        };

    }

  }

  return (

    <div style={styles.container}>

      {/* HEADER */}

      <div style={styles.header}>

        <div>

          <h1 style={styles.title}>
            Visitantes
          </h1>

          <p style={styles.subtitle}>
            Controle e monitoramento
            de visitantes
          </p>

        </div>

        <div style={styles.actions}>

          <input
            placeholder="Buscar visitante..."
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

              setNovoVisitante({

                nome: "",
                documento: "",
                apartamento: "",
                morador: "",
                observacao: "",
                entrada: "",
                autorizado: false,
                bloqueado: false,
                status: "Pendente",
                tipo: "Visita"

              });

              setMostrarModal(
                true
              );

            }}
          >

            + Novo Visitante

          </button>

        </div>

      </div>

      {/* RESUMO */}

      <div style={styles.resumeGrid}>

        <div style={styles.resumeCard}>

          <div style={styles.resumeIcon}>
            👥
          </div>

          <div>

            <p style={styles.resumeLabel}>
              Total
            </p>

            <h2 style={styles.resumeNumber}>
              {visitantes.length}
            </h2>

          </div>

        </div>

        <div style={styles.resumeCard}>

          <div style={styles.resumeIcon}>
            🟢
          </div>

          <div>

            <p style={styles.resumeLabel}>
              Em visita
            </p>

            <h2 style={styles.resumeNumber}>
              {emVisita.length}
            </h2>

          </div>

        </div>

        <div style={styles.resumeCard}>

          <div style={styles.resumeIcon}>
            🔵
          </div>

          <div>

            <p style={styles.resumeLabel}>
              Autorizados
            </p>

            <h2 style={styles.resumeNumber}>
              {autorizados.length}
            </h2>

          </div>

        </div>

        <div style={styles.resumeCard}>

          <div style={styles.resumeIcon}>
            🔴
          </div>

          <div>

            <p style={styles.resumeLabel}>
              Bloqueados
            </p>

            <h2 style={styles.resumeNumber}>
              {bloqueados.length}
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
                Visitante
              </th>

              <th style={styles.th}>
                Apartamento
              </th>

              <th style={styles.th}>
                Entrada
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

            {visitantesFiltrados.map(
              (v) => (

                <tr key={v.id}>

                  <td style={styles.td}>

                    <div style={styles.userArea}>

                      <div style={styles.avatar}>

                        {v.nome
                          ?.charAt(0)
                          .toUpperCase()}

                      </div>

                      <div>

                        <strong>
                          {v.nome}
                        </strong>

                        <p style={styles.info}>
                          {v.documento}
                        </p>

                        <p style={styles.info}>
                          Morador:
                          {" "}
                          {v.morador ||
                            "N/A"}
                        </p>

                        <p style={styles.info}>
                          Tipo:
                          {" "}
                          {v.tipo}
                        </p>

                      </div>

                    </div>

                  </td>

                  <td style={styles.td}>

                    <span style={styles.apto}>
                      {v.apartamento}
                    </span>

                  </td>

                  <td style={styles.td}>
                    {v.entrada}
                  </td>

                  <td style={styles.td}>

                    <span
                      style={{

                        ...styles.status,

                        background:
                          corStatus(
                            v.status
                          ).bg,

                        color:
                          corStatus(
                            v.status
                          ).color

                      }}
                    >

                      {v.status}

                    </span>

                  </td>

                  <td style={styles.tdCenter}>

                    <button
                      style={styles.enterBtn}
                      onClick={() =>
                        mudarStatus(
                          v.id,
                          "Em visita"
                        )
                      }
                    >

                      Entrou

                    </button>

                    <button
                      style={styles.exitBtn}
                      onClick={() =>
                        mudarStatus(
                          v.id,
                          "Saiu"
                        )
                      }
                    >

                      Saiu

                    </button>

                    <button
                      style={styles.editBtn}
                      onClick={() =>
                        editarVisitante(v)
                      }
                    >

                      Editar

                    </button>

                    <button
                      style={styles.deleteBtn}
                      onClick={() =>
                        excluirVisitante(
                          v.id
                        )
                      }
                    >

                      Excluir

                    </button>

                  </td>

                </tr>

              )
            )}

          </tbody>

        </table>

      </div>

      {/* MODAL */}

      {mostrarModal && (

        <div style={styles.modalBg}>

          <div style={styles.modal}>

            <div style={styles.modalHeader}>

              <h2 style={styles.modalTitle}>

                {editId
                  ? "Editar visitante"
                  : "Novo visitante"}

              </h2>

              <button
                style={styles.close}
                onClick={() =>
                  setMostrarModal(
                    false
                  )
                }
              >
                ✕
              </button>

            </div>

            <div style={styles.form}>

              <input
                placeholder="Nome"
                value={novoVisitante.nome}
                onChange={(e) =>

                  setNovoVisitante({

                    ...novoVisitante,

                    nome:
                      e.target.value

                  })

                }
                style={styles.input}
              />

              <input
                placeholder="Documento"
                value={novoVisitante.documento}
                onChange={(e) =>

                  setNovoVisitante({

                    ...novoVisitante,

                    documento:
                      e.target.value

                  })

                }
                style={styles.input}
              />

              <input
                placeholder="Apartamento"
                value={novoVisitante.apartamento}
                onChange={(e) =>

                  setNovoVisitante({

                    ...novoVisitante,

                    apartamento:
                      e.target.value

                  })

                }
                style={styles.input}
              />

              <input
                placeholder="Morador responsável"
                value={novoVisitante.morador}
                onChange={(e) =>

                  setNovoVisitante({

                    ...novoVisitante,

                    morador:
                      e.target.value

                  })

                }
                style={styles.input}
              />

              <select
                value={novoVisitante.tipo}
                onChange={(e) =>

                  setNovoVisitante({

                    ...novoVisitante,

                    tipo:
                      e.target.value

                  })

                }
                style={styles.input}
              >

                <option>
                  Visita
                </option>

                <option>
                  Entrega
                </option>

                <option>
                  Prestador
                </option>

                <option>
                  Familiar
                </option>

              </select>

              <input
                placeholder="Hora entrada"
                value={novoVisitante.entrada}
                onChange={(e) =>

                  setNovoVisitante({

                    ...novoVisitante,

                    entrada:
                      e.target.value

                  })

                }
                style={styles.input}
              />

              {/* AUTORIZADO */}

              <label style={styles.checkboxLabel}>

                <input
                  type="checkbox"
                  checked={
                    novoVisitante.autorizado
                  }
                  onChange={(e) =>

                    setNovoVisitante({

                      ...novoVisitante,

                      autorizado:
                        e.target.checked,

                      bloqueado:
                        e.target.checked
                          ? false
                          : novoVisitante.bloqueado

                    })

                  }
                />

                Autorizado

              </label>

              {/* BLOQUEADO */}

              <label style={styles.checkboxLabel}>

                <input
                  type="checkbox"
                  checked={
                    novoVisitante.bloqueado
                  }
                  onChange={(e) =>

                    setNovoVisitante({

                      ...novoVisitante,

                      bloqueado:
                        e.target.checked,

                      autorizado:
                        e.target.checked
                          ? false
                          : novoVisitante.autorizado

                    })

                  }
                />

                Bloqueado

              </label>

              <textarea
                placeholder="Observações"
                value={novoVisitante.observacao}
                onChange={(e) =>

                  setNovoVisitante({

                    ...novoVisitante,

                    observacao:
                      e.target.value

                  })

                }
                style={styles.textarea}
              />

            </div>

            <div style={styles.modalButtons}>

              <button
                style={styles.saveBtn}
                onClick={
                  salvarVisitante
                }
              >

                Salvar Visitante

              </button>

              <button
                style={styles.cancelBtn}
                onClick={() =>
                  setMostrarModal(
                    false
                  )
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
    justifyContent:
      "space-between",
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
    border:
      "1px solid #d1d5db",
    width: "240px",
    outline: "none"
  },

  button: {
    background:
      "linear-gradient(135deg,#14532d,#166534)",
    color: "white",
    border: "none",
    padding: "12px 18px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700"
  },

  resumeGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(240px,1fr))",
    gap: "20px",
    marginBottom: "30px"
  },

  resumeCard: {
    background:
      "linear-gradient(135deg,#14532d,#166534)",
    color: "white",
    borderRadius: "20px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow:
      "0 6px 20px rgba(20,83,45,0.18)"
  },

  resumeIcon: {
    fontSize: "42px"
  },

  resumeLabel: {
    opacity: 0.9
  },

  resumeNumber: {
    margin: "6px 0 0",
    fontSize: "34px"
  },

  card: {
    background: "white",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow:
      "0 4px 20px rgba(0,0,0,0.05)"
  },

  table: {
    width: "100%",
    borderCollapse:
      "collapse"
  },

  th: {
    padding: "18px",
    textAlign: "left",
    background: "#f0fdf4",
    color: "#14532d",
    borderBottom:
      "1px solid #dcfce7"
  },

  thCenter: {
    padding: "18px",
    textAlign: "center",
    background: "#f0fdf4",
    color: "#14532d",
    borderBottom:
      "1px solid #dcfce7"
  },

  td: {
    padding: "18px",
    borderBottom:
      "1px solid #f3f4f6"
  },

  tdCenter: {
    padding: "18px",
    textAlign: "center",
    borderBottom:
      "1px solid #f3f4f6"
  },

  userArea: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },

  avatar: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background:
      "linear-gradient(135deg,#166534,#22c55e)",
    color: "white",
    display: "flex",
    justifyContent:
      "center",
    alignItems: "center",
    fontWeight: "700"
  },

  info: {
    marginTop: "4px",
    color: "#6b7280",
    fontSize: "13px"
  },

  apto: {
    background: "#dcfce7",
    color: "#166534",
    padding: "8px 14px",
    borderRadius: "999px",
    fontWeight: "700",
    fontSize: "13px"
  },

  status: {
    padding: "8px 14px",
    borderRadius: "999px",
    fontWeight: "700",
    fontSize: "13px"
  },

  enterBtn: {
    background: "#dcfce7",
    color: "#166534",
    border: "none",
    padding: "9px 12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
    marginRight: "6px"
  },

  exitBtn: {
    background: "#e5e7eb",
    color: "#374151",
    border: "none",
    padding: "9px 12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
    marginRight: "6px"
  },

  editBtn: {
    background: "#dbeafe",
    color: "#1d4ed8",
    border: "none",
    padding: "9px 12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
    marginRight: "6px"
  },

  deleteBtn: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    padding: "9px 12px",
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
    background:
      "rgba(0,0,0,0.45)",
    display: "flex",
    justifyContent:
      "center",
    alignItems: "center",
    zIndex: 999
  },

  modal: {
    width: "480px",
    background: "white",
    borderRadius: "24px",
    padding: "28px",
    boxShadow:
      "0 10px 40px rgba(0,0,0,0.15)"
  },

  modalHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: "25px"
  },

  modalTitle: {
    margin: 0,
    color: "#14532d"
  },

  close: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    border: "none",
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
    border:
      "1px solid #d1d5db",
    outline: "none"
  },

  textarea: {
    padding: "14px",
    borderRadius: "12px",
    border:
      "1px solid #d1d5db",
    resize: "none",
    minHeight: "90px",
    outline: "none"
  },

  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontWeight: "600",
    color: "#374151"
  },

  modalButtons: {
    display: "flex",
    gap: "12px",
    marginTop: "24px"
  },

  saveBtn: {
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

  cancelBtn: {
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

export default Visitantes;