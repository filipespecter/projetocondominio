import { useEffect, useState } from "react";

function Prestadores() {

  /* =========================
     CHAVE FIXA STORAGE
  ========================= */

  const STORAGE_KEYS = {
    prestadores: "prestadores_condominio_v2",
    particulares: "prestadores_particulares_v2",
    operacional: "operacional_condominio_v2"
  };

  /* =========================
     ABAS
  ========================= */

  const [abaAtiva, setAbaAtiva] =
    useState("condominio");

  /* =========================
     STATES
  ========================= */

  const [prestadores, setPrestadores] =
    useState([]);

  const [particulares, setParticulares] =
    useState([]);

  const [operacional, setOperacional] =
    useState([]);

  const [mostrarModal, setMostrarModal] =
    useState(false);

  const [busca, setBusca] =
    useState("");

  const [editId, setEditId] =
    useState(null);

  /* =========================
     FORM PRESTADOR
  ========================= */

  const estadoInicialPrestador = {
    nome: "",
    empresa: "",
    telefone: "",
    cpf: "",
    servico: "",
    apartamento: "",
    responsavel: "",
    dataEntrada: "",
    horaEntrada: "",
    dataSaida: "",
    horaSaida: "",
    observacao: "",
    status: "Autorizado"
  };

  const [novoPrestador, setNovoPrestador] =
    useState(estadoInicialPrestador);

  /* =========================
     FORM OPERACIONAL
  ========================= */

  const estadoInicialOperacional = {
    data: "",
    horario: "",
    porteiro: "",
    leituraAnterior: "",
    leituraAtual: "",
    consumo: "",
    poco: "Desligado",
    observacao: ""
  };

  const [novoOperacional, setNovoOperacional] =
    useState(estadoInicialOperacional);

  /* =========================
     LOCAL STORAGE
  ========================= */

  useEffect(() => {

    try {

      const dadosPrestadores =
        localStorage.getItem(
          STORAGE_KEYS.prestadores
        );

      const dadosParticulares =
        localStorage.getItem(
          STORAGE_KEYS.particulares
        );

      const dadosOperacional =
        localStorage.getItem(
          STORAGE_KEYS.operacional
        );

      if (dadosPrestadores) {

        setPrestadores(
          JSON.parse(dadosPrestadores)
        );

      }

      if (dadosParticulares) {

        setParticulares(
          JSON.parse(dadosParticulares)
        );

      }

      if (dadosOperacional) {

        setOperacional(
          JSON.parse(dadosOperacional)
        );

      }

    } catch (erro) {

      console.log(
        "Erro ao carregar localStorage",
        erro
      );

    }

  }, []);

  /* =========================
     SALVAR STORAGE
  ========================= */

  useEffect(() => {

    try {

      localStorage.setItem(
        STORAGE_KEYS.prestadores,
        JSON.stringify(prestadores)
      );

    } catch (erro) {

      console.log(erro);

    }

  }, [prestadores]);

  useEffect(() => {

    try {

      localStorage.setItem(
        STORAGE_KEYS.particulares,
        JSON.stringify(particulares)
      );

    } catch (erro) {

      console.log(erro);

    }

  }, [particulares]);

  useEffect(() => {

    try {

      localStorage.setItem(
        STORAGE_KEYS.operacional,
        JSON.stringify(operacional)
      );

    } catch (erro) {

      console.log(erro);

    }

  }, [operacional]);

  /* =========================
     FORMATAR TELEFONE
  ========================= */

  function formatarTelefone(valor) {

    valor = valor
      .replace(/\D/g, "")
      .slice(0, 11);

    if (valor.length <= 10) {

      return valor.replace(
        /(\d{2})(\d{4})(\d{0,4})/,
        "($1) $2-$3"
      );

    }

    return valor.replace(
      /(\d{2})(\d{5})(\d{0,4})/,
      "($1) $2-$3"
    );

  }

  /* =========================
     FORMATAR CPF
  ========================= */

  function formatarCPF(valor) {

    valor = valor
      .replace(/\D/g, "")
      .slice(0, 11);

    return valor.replace(
      /(\d{3})(\d{3})(\d{3})(\d{0,2})/,
      "$1.$2.$3-$4"
    );

  }

  /* =========================
     LISTA FILTRADA
  ========================= */

  const listaAtual =
    abaAtiva === "condominio"
      ? prestadores
      : particulares;

  const listaFiltrada =
    listaAtual.filter((item) => {

      const texto =
        busca.toLowerCase();

      return (

        item.nome
          ?.toLowerCase()
          .includes(texto) ||

        item.servico
          ?.toLowerCase()
          .includes(texto) ||

        item.empresa
          ?.toLowerCase()
          .includes(texto)

      );

    });

  /* =========================
     NOVO CADASTRO
  ========================= */

  function abrirNovoCadastro() {

    setEditId(null);

    setNovoPrestador(
      estadoInicialPrestador
    );

    setMostrarModal(true);

  }

  /* =========================
     EDITAR
  ========================= */

  function editarPrestador(item) {

    setEditId(item.id);

    setNovoPrestador(item);

    setMostrarModal(true);

  }

  /* =========================
     EXCLUIR
  ========================= */

  function excluirPrestador(id) {

    const confirmar =
      window.confirm(
        "Deseja excluir este cadastro?"
      );

    if (!confirmar) return;

    if (abaAtiva === "condominio") {

      setPrestadores((prev) =>
        prev.filter(
          (item) => item.id !== id
        )
      );

    } else {

      setParticulares((prev) =>
        prev.filter(
          (item) => item.id !== id
        )
      );

    }

  }

  /* =========================
     SALVAR PRESTADOR
  ========================= */

  function salvarPrestador() {

    if (
      !novoPrestador.nome ||
      !novoPrestador.telefone ||
      !novoPrestador.servico
    ) {

      alert(
        "Preencha os campos obrigatórios."
      );

      return;

    }

    const dados = {
      ...novoPrestador
    };

    /* EDITAR */

    if (editId !== null) {

      dados.id = editId;

      if (abaAtiva === "condominio") {

        setPrestadores((prev) =>

          prev.map((item) =>

            item.id === editId
              ? dados
              : item

          )

        );

      } else {

        setParticulares((prev) =>

          prev.map((item) =>

            item.id === editId
              ? dados
              : item

          )

        );

      }

    }

    /* NOVO */

    else {

      dados.id = Date.now();

      if (abaAtiva === "condominio") {

        setPrestadores((prev) => [
          ...prev,
          dados
        ]);

      } else {

        setParticulares((prev) => [
          ...prev,
          dados
        ]);

      }

    }

    setNovoPrestador(
      estadoInicialPrestador
    );

    setEditId(null);

    setMostrarModal(false);

  }

  /* =========================
     SALVAR OPERACIONAL
  ========================= */

  function salvarOperacional() {

    const novo = {
      id: Date.now(),
      ...novoOperacional
    };

    setOperacional((prev) => [
      ...prev,
      novo
    ]);

    setNovoOperacional(
      estadoInicialOperacional
    );

  }

  /* =========================
     STATUS
  ========================= */

  function corStatus(status) {

    switch (status) {

      case "Autorizado":

        return {
          background: "#dcfce7",
          color: "#166534"
        };

      case "Em serviço":

        return {
          background: "#fef3c7",
          color: "#92400e"
        };

      case "Finalizado":

        return {
          background: "#dbeafe",
          color: "#1d4ed8"
        };

      default:

        return {
          background: "#fee2e2",
          color: "#dc2626"
        };

    }

  }

  return (

    <div style={styles.container}>

      {/* HEADER */}

      <div style={styles.header}>

        <div>

          <h1 style={styles.title}>
            Central Operacional
          </h1>

          <p style={styles.subtitle}>
            Gestão de prestadores, controle técnico e operações do condomínio
          </p>

        </div>

      </div>

      {/* ABAS */}

      <div style={styles.tabs}>

        <button
          style={{
            ...styles.tab,
            ...(abaAtiva === "condominio"
              ? styles.activeTab
              : {})
          }}
          onClick={() =>
            setAbaAtiva("condominio")
          }
        >

          Serviços Condomínio

        </button>

        <button
          style={{
            ...styles.tab,
            ...(abaAtiva === "particular"
              ? styles.activeTab
              : {})
          }}
          onClick={() =>
            setAbaAtiva("particular")
          }
        >

          Serviços Particulares

        </button>

        <button
          style={{
            ...styles.tab,
            ...(abaAtiva === "operacional"
              ? styles.activeTab
              : {})
          }}
          onClick={() =>
            setAbaAtiva("operacional")
          }
        >

          Operacional / COMPESA

        </button>

      </div>

      {/* CARDS */}

      <div style={styles.resumeGrid}>

        <div style={styles.resumeCard}>

          <span style={styles.cardTitle}>
            Prestadores Condomínio
          </span>

          <h1 style={styles.cardNumber}>
            {prestadores.length}
          </h1>

        </div>

        <div style={styles.resumeCard}>

          <span style={styles.cardTitle}>
            Serviços Particulares
          </span>

          <h1 style={styles.cardNumber}>
            {particulares.length}
          </h1>

        </div>

        <div style={styles.resumeCard}>

          <span style={styles.cardTitle}>
            Controle Operacional
          </span>

          <h1 style={styles.cardNumber}>
            {operacional.length}
          </h1>

        </div>

      </div>

      {/* OPERACIONAL */}

      {abaAtiva === "operacional" ? (

        <>

          <div style={styles.operacionalCard}>

            <h2 style={styles.sectionTitle}>
              Controle COMPESA / Poço
            </h2>

            <div style={styles.grid}>

              <input
                type="date"
                value={novoOperacional.data}
                onChange={(e) =>

                  setNovoOperacional({
                    ...novoOperacional,
                    data: e.target.value
                  })

                }
                style={styles.input}
              />

              <input
                type="time"
                value={novoOperacional.horario}
                onChange={(e) =>

                  setNovoOperacional({
                    ...novoOperacional,
                    horario:
                      e.target.value
                  })

                }
                style={styles.input}
              />

              <input
                placeholder="Porteiro responsável"
                value={
                  novoOperacional.porteiro
                }
                onChange={(e) =>

                  setNovoOperacional({
                    ...novoOperacional,
                    porteiro:
                      e.target.value
                  })

                }
                style={styles.input}
              />

              <input
                type="number"
                placeholder="Leitura anterior"
                value={
                  novoOperacional.leituraAnterior
                }
                onChange={(e) =>

                  setNovoOperacional({
                    ...novoOperacional,
                    leituraAnterior:
                      e.target.value
                  })

                }
                style={styles.input}
              />

              <input
                type="number"
                placeholder="Leitura atual"
                value={
                  novoOperacional.leituraAtual
                }
                onChange={(e) =>

                  setNovoOperacional({
                    ...novoOperacional,
                    leituraAtual:
                      e.target.value
                  })

                }
                style={styles.input}
              />

              <input
                type="number"
                placeholder="Consumo m³"
                value={
                  novoOperacional.consumo
                }
                onChange={(e) =>

                  setNovoOperacional({
                    ...novoOperacional,
                    consumo:
                      e.target.value
                  })

                }
                style={styles.input}
              />

              <select
                value={
                  novoOperacional.poco
                }
                onChange={(e) =>

                  setNovoOperacional({
                    ...novoOperacional,
                    poco:
                      e.target.value
                  })

                }
                style={styles.input}
              >

                <option>
                  Ligado
                </option>

                <option>
                  Desligado
                </option>

              </select>

            </div>

            <textarea
              placeholder="Observações"
              value={
                novoOperacional.observacao
              }
              onChange={(e) =>

                setNovoOperacional({
                  ...novoOperacional,
                  observacao:
                    e.target.value
                })

              }
              style={styles.textarea}
            />

            <button
              style={styles.button}
              onClick={salvarOperacional}
            >

              Salvar Controle

            </button>

          </div>

          {/* TABELA OPERACIONAL */}

          <div style={styles.card}>

            <table style={styles.table}>

              <thead>

                <tr>

                  <th style={styles.th}>
                    Data
                  </th>

                  <th style={styles.th}>
                    Porteiro
                  </th>

                  <th style={styles.th}>
                    Consumo
                  </th>

                  <th style={styles.th}>
                    Poço
                  </th>

                </tr>

              </thead>

              <tbody>

                {operacional.map((o) => (

                  <tr key={o.id}>

                    <td style={styles.td}>
                      {o.data}
                    </td>

                    <td style={styles.td}>
                      {o.porteiro}
                    </td>

                    <td style={styles.td}>
                      {o.consumo} m³
                    </td>

                    <td style={styles.td}>
                      {o.poco}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </>

      ) : (

        <>

          {/* AÇÕES */}

          <div style={styles.actions}>

            <input
              placeholder="Buscar..."
              value={busca}
              onChange={(e) =>
                setBusca(e.target.value)
              }
              style={styles.search}
            />

            <button
              style={styles.button}
              onClick={abrirNovoCadastro}
            >

              + Novo Cadastro

            </button>

          </div>

          {/* TABELA */}

          <div style={styles.card}>

            <table style={styles.table}>

              <thead>

                <tr>

                  <th style={styles.th}>
                    Prestador
                  </th>

                  <th style={styles.th}>
                    Serviço
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

                {listaFiltrada.map((p) => (

                  <tr key={p.id}>

                    <td style={styles.td}>

                      <div>

                        <strong>
                          {p.nome}
                        </strong>

                        <p style={styles.info}>
                          {p.empresa}
                        </p>

                        <p style={styles.info}>
                          {p.telefone}
                        </p>

                      </div>

                    </td>

                    <td style={styles.td}>
                      {p.servico}
                    </td>

                    <td style={styles.td}>

                      {p.dataEntrada}
                      {" "}
                      {p.horaEntrada}

                    </td>

                    <td style={styles.td}>

                      <span
                        style={{
                          ...styles.status,
                          ...corStatus(
                            p.status
                          )
                        }}
                      >

                        {p.status}

                      </span>

                    </td>

                    <td style={styles.tdCenter}>

                      <div style={styles.actionsButtons}>

                        <button
                          style={styles.editBtn}
                          onClick={() =>
                            editarPrestador(p)
                          }
                        >

                          Editar

                        </button>

                        <button
                          style={styles.deleteBtn}
                          onClick={() =>
                            excluirPrestador(p.id)
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

        </>

      )}

      {/* MODAL */}

      {mostrarModal && (

        <div style={styles.modalBg}>

          <div style={styles.modal}>

            <h2 style={styles.modalTitle}>

              {editId !== null
                ? "Editar Cadastro"
                : "Novo Cadastro"}

            </h2>

            <div style={styles.formSection}>

              <h3 style={styles.formTitle}>
                Dados do Prestador
              </h3>

              <div style={styles.formGrid}>

                <input
                  placeholder="Nome completo"
                  value={novoPrestador.nome}
                  onChange={(e) =>

                    setNovoPrestador({
                      ...novoPrestador,
                      nome: e.target.value
                    })

                  }
                  style={styles.input}
                />

                <input
                  placeholder="Empresa"
                  value={novoPrestador.empresa}
                  onChange={(e) =>

                    setNovoPrestador({
                      ...novoPrestador,
                      empresa:
                        e.target.value
                    })

                  }
                  style={styles.input}
                />

                <input
                  placeholder="Telefone"
                  value={novoPrestador.telefone}
                  onChange={(e) =>

                    setNovoPrestador({
                      ...novoPrestador,
                      telefone:
                        formatarTelefone(
                          e.target.value
                        )
                    })

                  }
                  style={styles.input}
                />

                <input
                  placeholder="CPF"
                  value={novoPrestador.cpf}
                  onChange={(e) =>

                    setNovoPrestador({
                      ...novoPrestador,
                      cpf:
                        formatarCPF(
                          e.target.value
                        )
                    })

                  }
                  style={styles.input}
                />

                <input
                  placeholder="Tipo de serviço"
                  value={novoPrestador.servico}
                  onChange={(e) =>

                    setNovoPrestador({
                      ...novoPrestador,
                      servico:
                        e.target.value
                    })

                  }
                  style={styles.input}
                />

                <select
                  value={
                    novoPrestador.status
                  }
                  onChange={(e) =>

                    setNovoPrestador({
                      ...novoPrestador,
                      status:
                        e.target.value
                    })

                  }
                  style={styles.input}
                >

                  <option>
                    Autorizado
                  </option>

                  <option>
                    Em serviço
                  </option>

                  <option>
                    Finalizado
                  </option>

                </select>

              </div>

            </div>

            {abaAtiva === "particular" && (

              <div style={styles.formSection}>

                <h3 style={styles.formTitle}>
                  Responsável pela Solicitação
                </h3>

                <div style={styles.formGrid}>

                  <input
                    placeholder="Apartamento"
                    value={
                      novoPrestador.apartamento
                    }
                    onChange={(e) =>

                      setNovoPrestador({
                        ...novoPrestador,
                        apartamento:
                          e.target.value
                      })

                    }
                    style={styles.input}
                  />

                  <input
                    placeholder="Morador responsável"
                    value={
                      novoPrestador.responsavel
                    }
                    onChange={(e) =>

                      setNovoPrestador({
                        ...novoPrestador,
                        responsavel:
                          e.target.value
                      })

                    }
                    style={styles.input}
                  />

                </div>

              </div>

            )}

            <div style={styles.formSection}>

              <h3 style={styles.formTitle}>
                Controle de Entrada e Saída
              </h3>

              <div style={styles.formGrid}>

                <input
                  type="date"
                  value={
                    novoPrestador.dataEntrada
                  }
                  onChange={(e) =>

                    setNovoPrestador({
                      ...novoPrestador,
                      dataEntrada:
                        e.target.value
                    })

                  }
                  style={styles.input}
                />

                <input
                  type="time"
                  value={
                    novoPrestador.horaEntrada
                  }
                  onChange={(e) =>

                    setNovoPrestador({
                      ...novoPrestador,
                      horaEntrada:
                        e.target.value
                    })

                  }
                  style={styles.input}
                />

                <input
                  type="date"
                  value={
                    novoPrestador.dataSaida
                  }
                  onChange={(e) =>

                    setNovoPrestador({
                      ...novoPrestador,
                      dataSaida:
                        e.target.value
                    })

                  }
                  style={styles.input}
                />

                <input
                  type="time"
                  value={
                    novoPrestador.horaSaida
                  }
                  onChange={(e) =>

                    setNovoPrestador({
                      ...novoPrestador,
                      horaSaida:
                        e.target.value
                    })

                  }
                  style={styles.input}
                />

              </div>

            </div>

            <div style={styles.formSection}>

              <h3 style={styles.formTitle}>
                Observações
              </h3>

              <textarea
                placeholder="Digite observações adicionais"
                value={
                  novoPrestador.observacao
                }
                onChange={(e) =>

                  setNovoPrestador({
                    ...novoPrestador,
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
                onClick={salvarPrestador}
              >

                Salvar

              </button>

              <button
                style={styles.cancelBtn}
                onClick={() => {

                  setMostrarModal(false);

                  setEditId(null);

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
    width: "100%",
    minHeight: "100vh",
    background: "#fffdf5"
  },

  header: {
    marginBottom: "28px"
  },

  title: {
    margin: 0,
    fontSize: "36px",
    color: "#166534",
    fontWeight: "800"
  },

  subtitle: {
    color: "#78716c",
    marginTop: "8px"
  },

  tabs: {
    display: "flex",
    gap: "12px",
    marginBottom: "30px",
    flexWrap: "wrap"
  },

  tab: {
    padding: "14px 20px",
    borderRadius: "14px",
    border: "none",
    background: "#fef3c7",
    color: "#166534",
    cursor: "pointer",
    fontWeight: "700"
  },

  activeTab: {
    background: "#166534",
    color: "white"
  },

  actions: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
    marginBottom: "25px",
    flexWrap: "wrap"
  },

  search: {
    width: "280px",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #fde68a",
    outline: "none"
  },

  button: {
    background: "#166534",
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
    gap: "18px",
    marginBottom: "30px"
  },

  resumeCard: {
    background: "white",
    border: "2px solid #fde68a",
    borderRadius: "24px",
    padding: "24px"
  },

  cardTitle: {
    color: "#78716c",
    fontSize: "14px"
  },

  cardNumber: {
    margin: "10px 0 0",
    color: "#166534",
    fontSize: "38px"
  },

  card: {
    background: "white",
    borderRadius: "24px",
    overflow: "hidden",
    border: "2px solid #fde68a"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse"
  },

  th: {
    background: "#fef9c3",
    color: "#166534",
    padding: "18px",
    textAlign: "left"
  },

  thCenter: {
    background: "#fef9c3",
    color: "#166534",
    padding: "18px",
    textAlign: "center"
  },

  td: {
    padding: "18px",
    borderBottom: "1px solid #fef3c7"
  },

  tdCenter: {
    padding: "18px",
    borderBottom: "1px solid #fef3c7",
    textAlign: "center"
  },

  info: {
    color: "#78716c",
    fontSize: "13px",
    marginTop: "4px"
  },

  status: {
    padding: "8px 14px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "700"
  },

  actionsButtons: {
    display: "flex",
    gap: "8px",
    justifyContent: "center",
    flexWrap: "wrap"
  },

  editBtn: {
    background: "#fef3c7",
    color: "#92400e",
    border: "none",
    padding: "10px 14px",
    borderRadius: "10px",
    cursor: "pointer"
  },

  deleteBtn: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    padding: "10px 14px",
    borderRadius: "10px",
    cursor: "pointer"
  },

  operacionalCard: {
    background: "white",
    border: "2px solid #fde68a",
    borderRadius: "24px",
    padding: "24px",
    marginBottom: "28px"
  },

  sectionTitle: {
    marginTop: 0,
    marginBottom: "22px",
    color: "#166534"
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "14px",
    marginBottom: "18px"
  },

  formSection: {
    marginBottom: "24px",
    paddingBottom: "20px",
    borderBottom: "1px solid #fef3c7"
  },

  formTitle: {
    marginBottom: "14px",
    color: "#166534",
    fontSize: "16px"
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: "14px"
  },

  input: {
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #fde68a",
    outline: "none"
  },

  textarea: {
    width: "100%",
    marginTop: "10px",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #fde68a",
    minHeight: "100px",
    resize: "none",
    outline: "none",
    boxSizing: "border-box"
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
    zIndex: 999
  },

  modal: {
    width: "760px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "white",
    borderRadius: "24px",
    padding: "28px",
    border: "2px solid #fde68a"
  },

  modalTitle: {
    marginTop: 0,
    marginBottom: "24px",
    color: "#166534"
  },

  modalButtons: {
    display: "flex",
    gap: "12px",
    marginTop: "24px"
  },

  saveBtn: {
    flex: 1,
    background: "#166534",
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

export default Prestadores;