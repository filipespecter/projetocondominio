import { useEffect, useState } from "react";

import ApartmentGrid from "../../components/Porteiro/ApartmentGrid";

import {
  salvarMovimentacao
} from "../../Services/movimentacaoService";

function EncomendasPorteiro() {

  const [esperadas, setEsperadas] =
    useState([]);

  const [encomendas, setEncomendas] =
    useState([]);

  const [porteiro, setPorteiro] =
    useState(null);

  /* =========================
     CARREGAR DADOS
  ========================= */

  useEffect(() => {

    carregarSessao();

    carregarEsperadas();

    carregarEncomendas();

  }, []);

  function carregarSessao() {

    const sessao =
      localStorage.getItem("sessaoPorteiro") ||
      sessionStorage.getItem("sessaoPorteiro");

    try {

      const usuario =
        sessao
          ? JSON.parse(sessao)
          : null;

      setPorteiro(usuario);

    } catch {

      setPorteiro(null);

    }

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

  function carregarEncomendas() {

    const data =
      JSON.parse(
        localStorage.getItem(
          "encomendas"
        )
      ) || [];

    setEncomendas(data);

  }

  function atualizarTela() {

    carregarEncomendas();

    carregarEsperadas();

  }

  const pendentes = encomendas.filter(
    (e) => e.status === "pendente"
  );

  const retiradas = encomendas.filter(
    (e) => e.status === "retirada"
  );

  const recebidasHoje = encomendas.filter((e) => {

    if (!e.dataRecebimento && !e.data) return false;

    const hoje =
      new Date().toLocaleDateString();

    return (
      e.dataRecebimento === hoje ||
      e.data?.includes(hoje)
    );

  });

  const retiradasHoje = encomendas.filter((e) => {

    if (!e.retiradaEm) return false;

    const hoje =
      new Date().toLocaleDateString();

    return e.retiradaEm.includes(hoje);

  });

  /* =========================
     CONFIRMAR RECEBIMENTO
  ========================= */

  function confirmarRecebimento(item) {

    const todasEncomendas =
      JSON.parse(
        localStorage.getItem(
          "encomendas"
        )
      ) || [];

    const agora = new Date();

    const codigo =
      `${item.apartamento || "AP"}-${Date.now()
        .toString()
        .slice(-4)}`;

    const novaEncomenda = {

      id: Date.now(),

      codigo,

      apartamento:
        item.apartamento || "N/A",

      nome:
        item.nome || item.morador || "Morador",

      morador:
        item.morador || item.nome || "Morador",

      descricao:
        item.descricao || item.tipo,

      tipo:
        item.tipo || "Encomenda",

      status: "pendente",

      data:
        agora.toLocaleString(),

      dataRecebimento:
        agora.toLocaleDateString(),

      horaRecebimento:
        agora.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        }),

      porteiroRecebimento:
        porteiro?.nome || "Porteiro",

      porteiroUsuario:
        porteiro?.usuario || ""

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

    salvarMovimentacao({

      id: Date.now(),

      tipo: "encomenda_recebida",

      apartamento:
        novaEncomenda.apartamento,

      mensagem:
        `Encomenda esperada confirmada para o AP ${novaEncomenda.apartamento}`,

      porteiro:
        porteiro?.nome || "Porteiro",

      data:
        agora.toLocaleString()

    });

    atualizarTela();

  }

  return (

    <div style={styles.container}>

      {/* HERO */}

      <div style={styles.hero}>

        <div>

          <span style={styles.heroBadge}>
            📦 Central logística
          </span>

          <h1 style={styles.title}>
            Encomendas da Portaria
          </h1>

          <p style={styles.subtitle}>
            Controle premium de recebimentos, retiradas,
            entregas esperadas e movimentações dos apartamentos.
          </p>

          {porteiro && (

            <div style={styles.userLine}>

              <span style={styles.statusDot}></span>

              <span>
                Operador responsável:{" "}
                <strong>
                  {porteiro.nome}
                </strong>
              </span>

            </div>

          )}

        </div>

        <div style={styles.heroPanel}>

          <p style={styles.heroLabel}>
            Hoje
          </p>

          <h3 style={styles.heroNumber}>
            {recebidasHoje.length}
          </h3>

          <span style={styles.heroStatus}>
            Recebidas no plantão
          </span>

        </div>

      </div>

      {/* CARDS */}

      <div style={styles.cardsGrid}>

        <div style={styles.cardPrimary}>

          <div>

            <p style={styles.cardLabelLight}>
              Pendentes
            </p>

            <h2 style={styles.cardNumberLight}>
              {pendentes.length}
            </h2>

            <span style={styles.cardHintLight}>
              aguardando retirada
            </span>

          </div>

          <div style={styles.cardIconLight}>
            📦
          </div>

        </div>

        <div style={styles.card}>

          <div style={styles.cardIconBlue}>
            📬
          </div>

          <div>

            <p style={styles.cardLabel}>
              Entregas esperadas
            </p>

            <h2 style={styles.cardNumberBlue}>
              {esperadas.length}
            </h2>

          </div>

        </div>

        <div style={styles.card}>

          <div style={styles.cardIconGreen}>
            ✅
          </div>

          <div>

            <p style={styles.cardLabel}>
              Retiradas
            </p>

            <h2 style={styles.cardNumberGreen}>
              {retiradas.length}
            </h2>

          </div>

        </div>

        <div style={styles.card}>

          <div style={styles.cardIconYellow}>
            🕒
          </div>

          <div>

            <p style={styles.cardLabel}>
              Retiradas hoje
            </p>

            <h2 style={styles.cardNumberYellow}>
              {retiradasHoje.length}
            </h2>

          </div>

        </div>

      </div>

      {/* ENCOMENDAS ESPERADAS */}

      {esperadas.length > 0 && (

        <div style={styles.expectedSection}>

          <div style={styles.sectionHeader}>

            <div>

              <h2 style={styles.sectionTitle}>
                Encomendas esperadas
              </h2>

              <p style={styles.sectionSubtitle}>
                Entregas informadas previamente pelos moradores.
              </p>

            </div>

            <span style={styles.sectionBadge}>
              📬 {esperadas.length} aguardando
            </span>

          </div>

          <div style={styles.expectedGrid}>

            {esperadas.map((item) => (

              <div
                key={item.id}
                style={styles.expectedCard}
              >

                <div style={styles.expectedTop}>

                  <div>

                    <span style={styles.expectedBadge}>
                      Aguardada
                    </span>

                    <h3 style={styles.expectedType}>
                      📦 {item.tipo || "Encomenda"}
                    </h3>

                  </div>

                  <div style={styles.expectedIcon}>
                    📬
                  </div>

                </div>

                <p style={styles.expectedDescription}>
                  {item.descricao ||
                    "Sem descrição informada"}
                </p>

                <div style={styles.expectedMeta}>

                  <span>
                    🏠 Apto {item.apartamento || "N/A"}
                  </span>

                  {item.nome && (
                    <span>
                      👤 {item.nome}
                    </span>
                  )}

                  {item.data && (
                    <span>
                      🕒 {item.data}
                    </span>
                  )}

                </div>

                <button
                  style={styles.confirmButton}
                  onClick={() =>
                    confirmarRecebimento(item)
                  }
                >

                  Confirmar recebimento

                </button>

              </div>

            ))}

          </div>

        </div>

      )}

      {/* MAPA DE APARTAMENTOS */}

      <div style={styles.apartmentSection}>

        <div style={styles.sectionHeader}>

          <div>

            <h2 style={styles.sectionTitle}>
              Mapa de apartamentos
            </h2>

            <p style={styles.sectionSubtitle}>
              Clique em um apartamento para registrar, retirar ou
              consultar encomendas.
            </p>

          </div>

          <span style={styles.sectionBadgeGreen}>
            🏢 Torre operacional
          </span>

        </div>

        <ApartmentGrid
          onRefresh={atualizarTela}
        />

      </div>

    </div>

  );

}

const styles = {

  container: {
    width: "100%",
    fontFamily: "Arial",
    color: "#111827"
  },

  hero: {
    background:
      "linear-gradient(135deg,#052e16,#14532d,#166534)",
    borderRadius: "30px",
    padding: "32px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "28px",
    marginBottom: "26px",
    boxShadow:
      "0 20px 45px rgba(20,83,45,0.25)"
  },

  heroBadge: {
    background: "rgba(255,255,255,0.14)",
    padding: "10px 14px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "800",
    display: "inline-block",
    marginBottom: "15px"
  },

  title: {
    margin: 0,
    fontSize: "36px",
    letterSpacing: "-0.5px"
  },

  subtitle: {
    margin: "10px 0 0",
    color: "rgba(255,255,255,0.78)",
    maxWidth: "680px",
    lineHeight: "1.5"
  },

  userLine: {
    marginTop: "18px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#dcfce7",
    fontSize: "14px",
    fontWeight: "600"
  },

  statusDot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    background: "#22c55e",
    boxShadow:
      "0 0 0 5px rgba(34,197,94,0.16)"
  },

  heroPanel: {
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: "24px",
    padding: "22px",
    minWidth: "230px",
    textAlign: "center",
    backdropFilter: "blur(12px)"
  },

  heroLabel: {
    margin: 0,
    color: "rgba(255,255,255,0.68)",
    fontSize: "13px"
  },

  heroNumber: {
    margin: "8px 0 12px",
    color: "white",
    fontSize: "38px"
  },

  heroStatus: {
    background: "#dcfce7",
    color: "#166534",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800"
  },

  cardsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "18px",
    marginBottom: "26px"
  },

  cardPrimary: {
    background:
      "linear-gradient(135deg,#14532d,#16a34a)",
    borderRadius: "24px",
    padding: "24px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow:
      "0 14px 35px rgba(22,163,74,0.2)"
  },

  card: {
    background: "white",
    borderRadius: "24px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow:
      "0 12px 35px rgba(15,23,42,0.07)",
    border: "1px solid #eef2f7"
  },

  cardLabelLight: {
    margin: 0,
    color: "rgba(255,255,255,0.75)",
    fontSize: "14px"
  },

  cardNumberLight: {
    margin: "10px 0 2px",
    color: "white",
    fontSize: "38px"
  },

  cardHintLight: {
    color: "rgba(255,255,255,0.72)",
    fontSize: "13px"
  },

  cardIconLight: {
    width: "58px",
    height: "58px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.16)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "29px"
  },

  cardIconBlue: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#dbeafe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px"
  },

  cardIconGreen: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#dcfce7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px"
  },

  cardIconYellow: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#fef3c7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px"
  },

  cardLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px"
  },

  cardNumberBlue: {
    margin: "8px 0 0",
    color: "#2563eb",
    fontSize: "34px"
  },

  cardNumberGreen: {
    margin: "8px 0 0",
    color: "#166534",
    fontSize: "34px"
  },

  cardNumberYellow: {
    margin: "8px 0 0",
    color: "#92400e",
    fontSize: "34px"
  },

  expectedSection: {
    background: "white",
    borderRadius: "28px",
    padding: "26px",
    marginBottom: "26px",
    boxShadow:
      "0 14px 40px rgba(15,23,42,0.08)",
    border: "1px solid #eef2f7"
  },

  apartmentSection: {
    background: "white",
    borderRadius: "28px",
    padding: "26px",
    boxShadow:
      "0 14px 40px rgba(15,23,42,0.08)",
    border: "1px solid #eef2f7"
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "22px"
  },

  sectionTitle: {
    margin: 0,
    color: "#14532d",
    fontSize: "24px"
  },

  sectionSubtitle: {
    margin: "7px 0 0",
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "1.5"
  },

  sectionBadge: {
    background: "#eff6ff",
    color: "#1d4ed8",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    whiteSpace: "nowrap"
  },

  sectionBadgeGreen: {
    background: "#f0fdf4",
    color: "#166534",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    whiteSpace: "nowrap"
  },

  expectedGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px"
  },

  expectedCard: {
    background: "#f9fafb",
    borderRadius: "22px",
    padding: "22px",
    border: "1px solid #e5e7eb"
  },

  expectedTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "14px"
  },

  expectedBadge: {
    display: "inline-block",
    background: "#fef3c7",
    color: "#92400e",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    marginBottom: "9px"
  },

  expectedType: {
    margin: 0,
    color: "#111827",
    fontSize: "18px"
  },

  expectedIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "16px",
    background: "#dbeafe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "23px"
  },

  expectedDescription: {
    color: "#374151",
    lineHeight: "1.5",
    margin: "0 0 16px"
  },

  expectedMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    color: "#6b7280",
    fontSize: "13px",
    marginBottom: "18px"
  },

  confirmButton: {
    width: "100%",
    background:
      "linear-gradient(135deg,#14532d,#16a34a)",
    color: "white",
    border: "none",
    padding: "14px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "800",
    boxShadow:
      "0 12px 25px rgba(22,163,74,0.20)"
  }

};

export default EncomendasPorteiro;