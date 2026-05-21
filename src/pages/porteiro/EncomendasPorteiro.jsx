import { useEffect, useState } from "react";

import ApartmentGrid from "../../components/Porteiro/ApartmentGrid";
import PackageModal from "../../components/Porteiro/PackageModal";

function EncomendasPorteiro() {

  const [apSelecionado, setApSelecionado] =
    useState(null);

  const [esperadas, setEsperadas] =
    useState([]);

  const [encomendas, setEncomendas] =
    useState([]);

  useEffect(() => {

    carregarEsperadas();

    carregarEncomendas();

  }, []);

  function carregarEsperadas() {

    const data =
      JSON.parse(
        localStorage.getItem(
          "encomendas_esperadas"
        )
      ) || [];

    setEsperadas(data);

  }

  function carregarEncomendas() {

    const data =
      JSON.parse(
        localStorage.getItem(
          "encomendas"
        )
      ) || [];

    setEncomendas(data);

  }

  function abrirModal(ap) {
    setApSelecionado(ap);
  }

  function fecharModal() {
    setApSelecionado(null);

    carregarEncomendas();

    carregarEsperadas();

  }

  const pendentes = encomendas.filter(
    (e) => e.status === "pendente"
  );

  const retiradas = encomendas.filter(
    (e) => e.status === "retirada"
  );

  function confirmarRecebimento(item) {

    const todasEncomendas =
      JSON.parse(
        localStorage.getItem(
          "encomendas"
        )
      ) || [];

    const novaEncomenda = {

      id: Date.now(),

      apartamento:
        item.apartamento || "N/A",

      nome:
        item.nome || "Morador",

      descricao:
        item.descricao || item.tipo,

      tipo:
        item.tipo,

      status: "pendente",

      data: new Date().toLocaleString()

    };

    const atualizadas = [
      ...todasEncomendas,
      novaEncomenda
    ];

    localStorage.setItem(
      "encomendas",
      JSON.stringify(atualizadas)
    );

    const novasEsperadas =
      esperadas.filter(
        (e) => e.id !== item.id
      );

    localStorage.setItem(
      "encomendas_esperadas",
      JSON.stringify(novasEsperadas)
    );

    carregarEncomendas();

    carregarEsperadas();

  }

  return (

    <div style={styles.container}>

      {/* HEADER */}

      <div style={styles.header}>

        <h1 style={styles.title}>
          Encomendas
        </h1>

        <p style={styles.subtitle}>
          Controle operacional de encomendas da portaria
        </p>

      </div>

      {/* CARDS */}

      <div style={styles.cardsGrid}>

        <div style={styles.card}>

          <div style={styles.cardIcon}>
            📦
          </div>

          <div>

            <p style={styles.cardLabel}>
              Pendentes
            </p>

            <h2 style={styles.cardNumber}>
              {pendentes.length}
            </h2>

          </div>

        </div>

        <div style={styles.card}>

          <div style={styles.cardIcon}>
            📬
          </div>

          <div>

            <p style={styles.cardLabel}>
              Esperadas
            </p>

            <h2 style={styles.cardNumber}>
              {esperadas.length}
            </h2>

          </div>

        </div>

        <div style={styles.card}>

          <div style={styles.cardIcon}>
            ✅
          </div>

          <div>

            <p style={styles.cardLabel}>
              Retiradas
            </p>

            <h2 style={styles.cardNumber}>
              {retiradas.length}
            </h2>

          </div>

        </div>

      </div>

      {/* ENCOMENDAS ESPERADAS */}

      {esperadas.length > 0 && (

        <div style={styles.expectedSection}>

          <div style={styles.expectedHeader}>

            <h2 style={styles.expectedTitle}>
              📬 Encomendas Esperadas
            </h2>

            <p style={styles.expectedSubtitle}>
              Moradores aguardando entregas
            </p>

          </div>

          <div style={styles.expectedGrid}>

            {esperadas.map((item) => (

              <div
                key={item.id}
                style={styles.expectedCard}
              >

                <div style={styles.expectedTop}>

                  <h3 style={styles.expectedType}>
                    📦 {item.tipo}
                  </h3>

                  <div style={styles.status}>
                    aguardando
                  </div>

                </div>

                <p style={styles.expectedDescription}>
                  {item.descricao ||
                    "Sem descrição"}
                </p>

                <div style={styles.expectedInfo}>

                  <p>
                    🕒 {item.data}
                  </p>

                </div>

                <button
                  style={styles.confirmButton}
                  onClick={() =>
                    confirmarRecebimento(item)
                  }
                >

                  Confirmar Recebimento

                </button>

              </div>

            ))}

          </div>

        </div>

      )}

      {/* GRID APARTAMENTOS */}

      <ApartmentGrid onSelect={abrirModal} />

      {/* MODAL */}

      {apSelecionado && (

        <PackageModal
          apartamento={apSelecionado}
          onClose={fecharModal}
        />

      )}

    </div>

  );

}

const styles = {

  container: {
    width: "100%"
  },

  header: {
    marginBottom: "30px"
  },

  title: {
    fontSize: "30px",
    marginBottom: "6px",
    color: "#111827"
  },

  subtitle: {
    color: "#6b7280"
  },

  cardsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginBottom: "35px"
  },

  card: {
    background: "white",
    borderRadius: "18px",
    padding: "22px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)"
  },

  cardIcon: {
    fontSize: "40px"
  },

  cardLabel: {
    color: "#6b7280",
    marginBottom: "5px"
  },

  cardNumber: {
    margin: 0,
    fontSize: "32px",
    color: "#111827"
  },

  expectedSection: {
    marginBottom: "35px"
  },

  expectedHeader: {
    marginBottom: "20px"
  },

  expectedTitle: {
    margin: 0,
    fontSize: "24px",
    color: "#111827"
  },

  expectedSubtitle: {
    marginTop: "6px",
    color: "#6b7280"
  },

  expectedGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px"
  },

  expectedCard: {
    background: "white",
    borderRadius: "18px",
    padding: "22px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)"
  },

  expectedTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px"
  },

  expectedType: {
    margin: 0,
    color: "#111827"
  },

  status: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700"
  },

  expectedDescription: {
    color: "#4b5563",
    marginBottom: "18px"
  },

  expectedInfo: {
    color: "#6b7280",
    fontSize: "14px",
    marginBottom: "18px"
  },

  confirmButton: {
    width: "100%",
    background: "#16a34a",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700"
  }

};

export default EncomendasPorteiro;