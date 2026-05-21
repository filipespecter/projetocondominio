import { useEffect, useState } from "react";

import {
  salvarMovimentacao
} from "../../Services/movimentacaoService";

function PackageModal({
  apartamento,
  onClose
}) {

  const [descricao, setDescricao] =
    useState("");

  const [tipo, setTipo] =
    useState("");

  const [encomendas, setEncomendas] =
    useState([]);

  useEffect(() => {

    carregarEncomendas();

  }, []);

  function carregarEncomendas() {

    const data =
      JSON.parse(
        localStorage.getItem("encomendas")
      ) || [];

    const filtradas = data.filter(
      (e) => e.apartamento === apartamento
    );

    filtradas.sort(
      (a, b) => b.id - a.id
    );

    setEncomendas(filtradas);

  }

  function registrarEncomenda() {

    if (!descricao || !tipo) return;

    const todas =
      JSON.parse(
        localStorage.getItem("encomendas")
      ) || [];

    const codigo =
      `${apartamento}-${Date.now()
        .toString()
        .slice(-4)}`;

    const nova = {

      id: Date.now(),

      codigo,

      apartamento,

      tipo,

      descricao,

      status: "pendente",

      data:
        new Date().toLocaleString()

    };

    const atualizadas = [
      ...todas,
      nova
    ];

    localStorage.setItem(
      "encomendas",
      JSON.stringify(atualizadas)
    );

    /* MOVIMENTAÇÃO */

    salvarMovimentacao({

      id: Date.now(),

      tipo: "encomenda_recebida",

      apartamento,

      mensagem:
        `Nova encomenda registrada no AP ${apartamento}`,

      data:
        new Date().toLocaleString()

    });

    setDescricao("");

    setTipo("");

    carregarEncomendas();

  }

  function retirarEncomenda(id) {

    const todas =
      JSON.parse(
        localStorage.getItem("encomendas")
      ) || [];

    const atualizadas = todas.map((e) =>

      e.id === id

        ? {

            ...e,

            status: "retirada",

            retiradaEm:
              new Date().toLocaleString()

          }

        : e

    );

    localStorage.setItem(
      "encomendas",
      JSON.stringify(atualizadas)
    );

    /* MOVIMENTAÇÃO */

    salvarMovimentacao({

      id: Date.now(),

      tipo: "encomenda_retirada",

      apartamento,

      mensagem:
        `Encomenda retirada no AP ${apartamento}`,

      data:
        new Date().toLocaleString()

    });

    carregarEncomendas();

  }

  function excluirEncomenda(id) {

    const todas =
      JSON.parse(
        localStorage.getItem("encomendas")
      ) || [];

    const atualizadas =
      todas.filter(
        (e) => e.id !== id
      );

    localStorage.setItem(
      "encomendas",
      JSON.stringify(atualizadas)
    );

    carregarEncomendas();

  }

  return (

    <div style={styles.overlay}>

      <div style={styles.modal}>

        {/* HEADER */}

        <div style={styles.header}>

          <div>

            <h2 style={styles.title}>
              Apartamento {apartamento}
            </h2>

            <p style={styles.subtitle}>
              Controle de encomendas
            </p>

          </div>

          <div style={styles.badge}>

            📦 {

              encomendas.filter(
                (e) =>
                  e.status === "pendente"
              ).length

            }

          </div>

        </div>

        {/* FORM */}

        <div style={styles.form}>

          <select
            value={tipo}
            onChange={(e) =>
              setTipo(e.target.value)
            }
            style={styles.input}
          >

            <option value="">
              Tipo da encomenda
            </option>

            <option value="Pacote pequeno">
              Pacote pequeno
            </option>

            <option value="Pacote médio">
              Pacote médio
            </option>

            <option value="Pacote grande">
              Pacote grande
            </option>

            <option value="Documento">
              Documento
            </option>

            <option value="Caixa">
              Caixa
            </option>

          </select>

          <input
            placeholder="Descrição / transportadora / observação"
            value={descricao}
            onChange={(e) =>
              setDescricao(e.target.value)
            }
            style={styles.input}
          />

          <button
            style={styles.primary}
            onClick={registrarEncomenda}
          >

            + Registrar Encomenda

          </button>

        </div>

        {/* LISTA */}

        <div style={styles.list}>

          {encomendas.length === 0 && (

            <div style={styles.empty}>

              <h3>
                Nenhuma encomenda
              </h3>

              <p>
                Este apartamento não possui encomendas registradas.
              </p>

            </div>

          )}

          {encomendas.map((item) => (

            <div
              key={item.id}
              style={{
                ...styles.package,

                borderLeft:

                  item.status === "pendente"

                    ? "6px solid #f59e0b"

                    : "6px solid #16a34a"

              }}
            >

              <div style={styles.packageContent}>

                <div style={styles.packageTop}>

                  <h3 style={styles.packageTitle}>

                    📦 {item.tipo}

                  </h3>

                  <span
                    style={{
                      ...styles.status,

                      background:

                        item.status === "pendente"

                          ? "#fef3c7"

                          : "#dcfce7",

                      color:

                        item.status === "pendente"

                          ? "#92400e"

                          : "#166534"

                    }}
                  >

                    {item.status}

                  </span>

                </div>

                <p style={styles.description}>
                  {item.descricao}
                </p>

                <div style={styles.infoArea}>

                  <span style={styles.info}>
                    Código:
                    {" "}
                    {item.codigo}
                  </span>

                  <span style={styles.info}>
                    {item.data}
                  </span>

                </div>

                {item.retiradaEm && (

                  <div style={styles.retirada}>

                    ✅ Retirada em:
                    {" "}
                    {item.retiradaEm}

                  </div>

                )}

              </div>

              <div style={styles.actions}>

                {item.status === "pendente" && (

                  <button
                    style={styles.success}
                    onClick={() =>
                      retirarEncomenda(item.id)
                    }
                  >

                    Retirar

                  </button>

                )}

                <button
                  style={styles.delete}
                  onClick={() =>
                    excluirEncomenda(item.id)
                  }
                >

                  Excluir

                </button>

              </div>

            </div>

          ))}

        </div>

        {/* FOOTER */}

        <button
          style={styles.close}
          onClick={onClose}
        >

          Fechar

        </button>

      </div>

    </div>

  );

}

const styles = {

  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background:
      "rgba(0,0,0,0.45)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999
  },

  modal: {
    background: "#f9fafb",
    width: "700px",
    borderRadius: "22px",
    padding: "28px",
    maxHeight: "85vh",
    overflowY: "auto",
    boxShadow:
      "0 20px 40px rgba(0,0,0,0.15)"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px"
  },

  title: {
    margin: 0,
    color: "#111827"
  },

  subtitle: {
    marginTop: "6px",
    color: "#6b7280"
  },

  badge: {
    background: "#14532d",
    color: "white",
    width: "55px",
    height: "55px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700"
  },

  form: {
    background: "white",
    padding: "20px",
    borderRadius: "16px",
    marginBottom: "25px",
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },

  input: {
    width: "100%",
    padding: "14px",
    borderRadius: "10px",
    border:
      "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box"
  },

  primary: {
    background: "#14532d",
    color: "white",
    border: "none",
    padding: "14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "15px"
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },

  empty: {
    background: "white",
    borderRadius: "16px",
    padding: "30px",
    textAlign: "center",
    color: "#6b7280"
  },

  package: {
    background: "white",
    borderRadius: "16px",
    padding: "18px",
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)"
  },

  packageContent: {
    flex: 1
  },

  packageTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px"
  },

  packageTitle: {
    margin: 0,
    color: "#111827"
  },

  status: {
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700"
  },

  description: {
    color: "#374151",
    marginBottom: "14px",
    lineHeight: "22px"
  },

  infoArea: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },

  info: {
    fontSize: "13px",
    color: "#6b7280"
  },

  retirada: {
    marginTop: "12px",
    color: "#16a34a",
    fontSize: "13px",
    fontWeight: "600"
  },

  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },

  success: {
    background: "#16a34a",
    color: "white",
    border: "none",
    padding: "10px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600"
  },

  delete: {
    background: "#dc2626",
    color: "white",
    border: "none",
    padding: "10px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600"
  },

  close: {
    width: "100%",
    marginTop: "25px",
    padding: "14px",
    background: "#6b7280",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "15px"
  }

};

export default PackageModal;