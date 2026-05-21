import { useEffect, useState } from "react";

function EncomendasMorador() {

  const [encomendas, setEncomendas] =
    useState([]);

  const [esperadas, setEsperadas] =
    useState([]);

  const [tipoEntrega, setTipoEntrega] =
    useState("");

  const [descricaoEntrega, setDescricaoEntrega] =
    useState("");

  useEffect(() => {

    carregarEncomendas();

    carregarEsperadas();

  }, []);

  function carregarEncomendas() {

    const data =
      JSON.parse(
        localStorage.getItem("encomendas")
      ) || [];

    setEncomendas(data);

  }

  function carregarEsperadas() {

    const data =
      JSON.parse(
        localStorage.getItem(
          "encomendas_esperadas"
        )
      ) || [];

    setEsperadas(data);

  }

  function registrarEsperada() {

    if (!tipoEntrega) return;

    const todas =
      JSON.parse(
        localStorage.getItem(
          "encomendas_esperadas"
        )
      ) || [];

    const nova = {

      id: Date.now(),

      morador: "Carlos Henrique",

      apartamento: "304",

      tipo: tipoEntrega,

      descricao: descricaoEntrega,

      status: "aguardando",

      data: new Date().toLocaleString()

    };

    const atualizadas = [...todas, nova];

    localStorage.setItem(
      "encomendas_esperadas",
      JSON.stringify(atualizadas)
    );

    setTipoEntrega("");

    setDescricaoEntrega("");

    carregarEsperadas();

  }

  const pendentes = encomendas.filter(
    (e) => e.status === "pendente"
  );

  const retiradas = encomendas.filter(
    (e) => e.status === "retirada"
  );

  return (

    <div style={styles.container}>

      {/* HEADER */}

      <div style={styles.header}>

        <div>

          <h1 style={styles.title}>
            Minhas Encomendas
          </h1>

          <p style={styles.subtitle}>
            Acompanhe suas encomendas e retiradas
          </p>

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
              Pendentes
            </p>

            <h2 style={styles.resumeNumber}>
              {pendentes.length}
            </h2>

          </div>

        </div>

        <div style={styles.resumeCard}>

          <div style={styles.resumeIcon}>
            ✅
          </div>

          <div>

            <p style={styles.resumeLabel}>
              Retiradas
            </p>

            <h2 style={styles.resumeNumber}>
              {retiradas.length}
            </h2>

          </div>

        </div>

      </div>

      {/* ENCOMENDAS ESPERADAS */}

      <div style={styles.expectedBox}>

        <h2 style={styles.expectedTitle}>
          📬 Avisar Encomenda Esperada
        </h2>

        <p style={styles.expectedText}>
          Informe para a portaria que você está aguardando uma entrega.
        </p>

        <div style={styles.expectedForm}>

          <select
            value={tipoEntrega}
            onChange={(e) =>
              setTipoEntrega(e.target.value)
            }
            style={styles.select}
          >

            <option value="">
              Selecione
            </option>

            <option value="Amazon">
              Amazon
            </option>

            <option value="Mercado Livre">
              Mercado Livre
            </option>

            <option value="Shopee">
              Shopee
            </option>

            <option value="iFood">
              iFood
            </option>

            <option value="Outro">
              Outro
            </option>

          </select>

          <input
            placeholder="Descrição opcional"
            value={descricaoEntrega}
            onChange={(e) =>
              setDescricaoEntrega(e.target.value)
            }
            style={styles.input}
          />

          <button
            style={styles.expectedButton}
            onClick={registrarEsperada}
          >

            Avisar Portaria

          </button>

        </div>

      </div>

      {/* AGUARDANDO RECEBIMENTO */}

      {esperadas.length > 0 && (

        <div style={styles.waitingBox}>

          <div style={styles.waitingHeader}>

            <h2 style={styles.waitingTitle}>
              📬 Entregas Aguardadas
            </h2>

            <p style={styles.waitingSubtitle}>
              Encomendas avisadas para a portaria
            </p>

          </div>

          <div style={styles.waitingList}>

            {esperadas.map((item) => (

              <div
                key={item.id}
                style={styles.waitingCard}
              >

                <div style={styles.waitingTop}>

                  <h3 style={styles.waitingType}>
                    📦 {item.tipo}
                  </h3>

                  <div style={styles.waitingStatus}>
                    aguardando
                  </div>

                </div>

                <p style={styles.waitingDescription}>
                  {item.descricao ||
                    "Sem descrição"}
                </p>

                <div style={styles.waitingInfo}>

                  <p>
                    🕒 {item.data}
                  </p>

                </div>

              </div>

            ))}

          </div>

        </div>

      )}

      {/* LISTA */}

      <div style={styles.list}>

        {encomendas.length === 0 && (

          <div style={styles.empty}>

            <h3>
              Nenhuma encomenda encontrada
            </h3>

            <p>
              Você ainda não possui encomendas registradas.
            </p>

          </div>

        )}

        {encomendas.map((item) => (

          <div
            key={item.id}
            style={styles.card}
          >

            <div style={styles.cardTop}>

              <div>

                <h2 style={styles.packageTitle}>

                  📦 {item.tipo || "Encomenda"}

                </h2>

                <p style={styles.description}>
                  {item.descricao}
                </p>

              </div>

              <div
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

              </div>

            </div>

            <div style={styles.infoArea}>

              <div style={styles.infoItem}>
                🏢 Apartamento:
                {" "}
                {item.apartamento}
              </div>

              <div style={styles.infoItem}>
                🔖 Código:
                {" "}
                {item.codigo || "N/A"}
              </div>

              <div style={styles.infoItem}>
                🕒 Recebido:
                {" "}
                {item.data}
              </div>

              {item.retiradaEm && (

                <div style={styles.infoItem}>

                  ✅ Retirada:
                  {" "}
                  {item.retiradaEm}

                </div>

              )}

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
    margin: 0,
    fontSize: "34px",
    color: "#111827"
  },

  subtitle: {
    marginTop: "8px",
    color: "#6b7280"
  },

  resumeGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginBottom: "30px"
  },

  resumeCard: {
    background: "white",
    borderRadius: "16px",
    padding: "25px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
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
    fontSize: "32px"
  },

  expectedBox: {
    background: "white",
    borderRadius: "18px",
    padding: "25px",
    marginBottom: "30px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
  },

  expectedTitle: {
    marginBottom: "10px",
    color: "#111827"
  },

  expectedText: {
    color: "#6b7280",
    marginBottom: "20px"
  },

  expectedForm: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr auto",
    gap: "14px"
  },

  select: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    outline: "none"
  },

  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    outline: "none"
  },

  expectedButton: {
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "12px 20px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600"
  },

  waitingBox: {
    marginBottom: "30px"
  },

  waitingHeader: {
    marginBottom: "18px"
  },

  waitingTitle: {
    margin: 0,
    color: "#111827"
  },

  waitingSubtitle: {
    marginTop: "6px",
    color: "#6b7280"
  },

  waitingList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },

  waitingCard: {
    background: "white",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
  },

  waitingTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px"
  },

  waitingType: {
    margin: 0
  },

  waitingStatus: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700"
  },

  waitingDescription: {
    color: "#4b5563",
    marginBottom: "12px"
  },

  waitingInfo: {
    color: "#6b7280",
    fontSize: "14px"
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "18px"
  },

  empty: {
    background: "white",
    borderRadius: "16px",
    padding: "40px",
    textAlign: "center",
    color: "#6b7280",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
  },

  card: {
    background: "white",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "18px"
  },

  packageTitle: {
    margin: 0,
    color: "#111827"
  },

  description: {
    marginTop: "8px",
    color: "#4b5563"
  },

  status: {
    padding: "8px 14px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "700"
  },

  infoArea: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },

  infoItem: {
    color: "#374151",
    fontSize: "14px"
  }

};

export default EncomendasMorador;