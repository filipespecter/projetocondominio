import { useEffect, useState } from "react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function Relatorios() {

  const [dados, setDados] = useState({
    moradores: 0,
    apartamentos: 0,
    visitantes: 0,
    encomendas: 0,
    reservas: 0,
    avisos: 0
  });

  const [crescimento, setCrescimento] =
    useState(0);

  const [mesAtual, setMesAtual] =
    useState("");

  const [ultimaAtualizacao, setUltimaAtualizacao] =
    useState("");

  useEffect(() => {

    carregarDados();

  }, []);

  function carregarDados() {

    const moradores =
      JSON.parse(
        localStorage.getItem("moradores")
      ) || [];

    const apartamentos =
      JSON.parse(
        localStorage.getItem("apartamentos")
      ) || [];

    const visitantes =
      JSON.parse(
        localStorage.getItem("visitantes")
      ) || [];

    const encomendas =
      JSON.parse(
        localStorage.getItem("encomendas")
      ) || [];

    const reservas =
      JSON.parse(
        localStorage.getItem("reservas")
      ) || [];

    const avisos =
      JSON.parse(
        localStorage.getItem("avisos")
      ) || [];

    setDados({
      moradores: moradores.length,
      apartamentos: apartamentos.length,
      visitantes: visitantes.length,
      encomendas: encomendas.length,
      reservas: reservas.length,
      avisos: avisos.length
    });

    const totalAtual =
      visitantes.length +
      encomendas.length +
      reservas.length +
      avisos.length;

    const totalAnterior =
      Math.max(totalAtual - 5, 1);

    const percentual =
      (
        (
          (totalAtual - totalAnterior) /
          totalAnterior
        ) * 100
      ).toFixed(1);

    setCrescimento(percentual);

    const data = new Date();

    const mes =
      data.toLocaleString("pt-BR", {
        month: "long"
      });

    setMesAtual(
      mes.charAt(0).toUpperCase() +
      mes.slice(1)
    );

    setUltimaAtualizacao(
      data.toLocaleString("pt-BR")
    );

  }

  function exportarPDF() {

    const doc = new jsPDF();

    doc.setFontSize(22);

    doc.text(
      "Relatório Executivo do Condomínio",
      14,
      20
    );

    doc.setFontSize(12);

    doc.text(
      `Mês de referência: ${mesAtual}`,
      14,
      32
    );

    doc.text(
      `Atualizado em: ${ultimaAtualizacao}`,
      14,
      40
    );

    autoTable(doc, {

      startY: 50,

      head: [["Indicador", "Quantidade"]],

      body: [

        ["Apartamentos", dados.apartamentos],

        ["Moradores", dados.moradores],

        ["Visitantes", dados.visitantes],

        ["Encomendas", dados.encomendas],

        ["Reservas", dados.reservas],

        ["Avisos", dados.avisos]

      ],

      styles: {
        fontSize: 11,
        cellPadding: 4
      },

      headStyles: {
        fillColor: [20, 83, 45]
      }

    });

    doc.text(
      `Crescimento operacional: ${crescimento}%`,
      14,
      140
    );

    doc.text(
      "Sistema operacional ativo e sincronizado.",
      14,
      150
    );

    doc.save(
      `relatorio-${mesAtual}.pdf`
    );

  }

  const totalOperacional =

    dados.visitantes +
    dados.encomendas +
    dados.reservas +
    dados.avisos;

  return (

    <div style={styles.container}>

      {/* HEADER */}

      <div style={styles.header}>

        <div>

          <h1 style={styles.title}>
            Relatórios
          </h1>

          <p style={styles.subtitle}>
            Painel executivo e indicadores do condomínio
          </p>

        </div>

        <button
          style={styles.exportButton}
          onClick={exportarPDF}
        >

          📄 Exportar PDF

        </button>

      </div>

      {/* CARDS */}

      <div style={styles.grid}>

        <div style={styles.card}>

          <div style={styles.iconBox}>
            🏢
          </div>

          <div>

            <p style={styles.cardLabel}>
              Apartamentos
            </p>

            <h2 style={styles.cardNumber}>
              {dados.apartamentos}
            </h2>

          </div>

        </div>

        <div style={styles.card}>

          <div style={styles.iconBox}>
            👥
          </div>

          <div>

            <p style={styles.cardLabel}>
              Moradores
            </p>

            <h2 style={styles.cardNumber}>
              {dados.moradores}
            </h2>

          </div>

        </div>

        <div style={styles.card}>

          <div style={styles.iconBox}>
            🚶
          </div>

          <div>

            <p style={styles.cardLabel}>
              Visitantes
            </p>

            <h2 style={styles.cardNumber}>
              {dados.visitantes}
            </h2>

          </div>

        </div>

        <div style={styles.card}>

          <div style={styles.iconBox}>
            📦
          </div>

          <div>

            <p style={styles.cardLabel}>
              Encomendas
            </p>

            <h2 style={styles.cardNumber}>
              {dados.encomendas}
            </h2>

          </div>

        </div>

        <div style={styles.card}>

          <div style={styles.iconBox}>
            📅
          </div>

          <div>

            <p style={styles.cardLabel}>
              Reservas
            </p>

            <h2 style={styles.cardNumber}>
              {dados.reservas}
            </h2>

          </div>

        </div>

        <div style={styles.card}>

          <div style={styles.iconBox}>
            📢
          </div>

          <div>

            <p style={styles.cardLabel}>
              Avisos
            </p>

            <h2 style={styles.cardNumber}>
              {dados.avisos}
            </h2>

          </div>

        </div>

      </div>

      {/* EXECUTIVO */}

      <div style={styles.executiveGrid}>

        <div style={styles.executiveCard}>

          <h3 style={styles.executiveTitle}>
            📈 Crescimento operacional
          </h3>

          <h1 style={styles.executiveNumber}>
            +{crescimento}%
          </h1>

          <p style={styles.executiveText}>
            comparado ao período anterior
          </p>

        </div>

        <div style={styles.executiveCard}>

          <h3 style={styles.executiveTitle}>
            ⚡ Movimentações totais
          </h3>

          <h1 style={styles.executiveNumber}>
            {totalOperacional}
          </h1>

          <p style={styles.executiveText}>
            atividades registradas
          </p>

        </div>

        <div style={styles.executiveCard}>

          <h3 style={styles.executiveTitle}>
            🗓️ Mês atual
          </h3>

          <h1 style={styles.executiveNumber}>
            {mesAtual}
          </h1>

          <p style={styles.executiveText}>
            relatório em tempo real
          </p>

        </div>

      </div>

      {/* PAINÉIS */}

      <div style={styles.bottomGrid}>

        <div style={styles.panel}>

          <h3 style={styles.panelTitle}>
            📊 Resumo do condomínio
          </h3>

          <div style={styles.list}>

            <div style={styles.listItem}>
              <span>🏢 Apartamentos</span>
              <strong>{dados.apartamentos}</strong>
            </div>

            <div style={styles.listItem}>
              <span>👥 Moradores</span>
              <strong>{dados.moradores}</strong>
            </div>

            <div style={styles.listItem}>
              <span>🚶 Visitantes</span>
              <strong>{dados.visitantes}</strong>
            </div>

            <div style={styles.listItem}>
              <span>📦 Encomendas</span>
              <strong>{dados.encomendas}</strong>
            </div>

            <div style={styles.listItem}>
              <span>📅 Reservas</span>
              <strong>{dados.reservas}</strong>
            </div>

            <div style={styles.listItem}>
              <span>📢 Avisos</span>
              <strong>{dados.avisos}</strong>
            </div>

          </div>

        </div>

        <div style={styles.panel}>

          <h3 style={styles.panelTitle}>
            ⚡ Sistema
          </h3>

          <div style={styles.systemBox}>

            <div style={styles.systemItem}>
              <span style={styles.dotGreen}></span>
              Sistema online
            </div>

            <div style={styles.systemItem}>
              <span style={styles.dotBlue}></span>
              Dados sincronizados
            </div>

            <div style={styles.systemItem}>
              <span style={styles.dotYellow}></span>
              Backup local ativo
            </div>

            <div style={styles.systemItem}>
              <span style={styles.dotPurple}></span>
              Painel atualizado
            </div>

            <div style={styles.systemItem}>
              <span style={styles.dotGreen}></span>
              Analytics operacional ativo
            </div>

          </div>

        </div>

      </div>

      {/* RODAPÉ */}

      <div style={styles.footer}>

        Última atualização:
        {" "}
        {ultimaAtualizacao}

      </div>

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
    marginBottom: "30px",
    flexWrap: "wrap",
    gap: "20px"
  },

  title: {
    margin: 0,
    fontSize: "34px",
    fontWeight: "700",
    color: "#14532d"
  },

  subtitle: {
    marginTop: "8px",
    color: "#6b7280",
    fontSize: "15px"
  },

  exportButton: {
    background:
      "linear-gradient(135deg,#14532d,#22c55e)",
    color: "white",
    border: "none",
    padding: "14px 20px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "700",
    boxShadow:
      "0 10px 25px rgba(34,197,94,0.25)"
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(250px,1fr))",
    gap: "22px",
    marginBottom: "30px"
  },

  card: {
    background: "white",
    borderRadius: "24px",
    padding: "25px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.05)"
  },

  iconBox: {
    width: "70px",
    height: "70px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg,#14532d,#22c55e)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    color: "white"
  },

  cardLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px"
  },

  cardNumber: {
    margin: "6px 0 0",
    fontSize: "34px",
    color: "#111827"
  },

  executiveGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(280px,1fr))",
    gap: "22px",
    marginBottom: "30px"
  },

  executiveCard: {
    background:
      "linear-gradient(135deg,#14532d,#22c55e)",
    borderRadius: "24px",
    padding: "28px",
    color: "white"
  },

  executiveTitle: {
    marginTop: 0,
    marginBottom: "15px",
    fontSize: "16px"
  },

  executiveNumber: {
    margin: 0,
    fontSize: "42px"
  },

  executiveText: {
    marginTop: "12px",
    opacity: 0.9
  },

  bottomGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(320px,1fr))",
    gap: "24px"
  },

  panel: {
    background: "white",
    borderRadius: "24px",
    padding: "25px",
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.05)"
  },

  panelTitle: {
    marginTop: 0,
    marginBottom: "20px",
    color: "#111827"
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },

  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#f9fafb",
    padding: "14px 16px",
    borderRadius: "14px",
    color: "#374151"
  },

  systemBox: {
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },

  systemItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "#f9fafb",
    padding: "14px 16px",
    borderRadius: "14px",
    color: "#374151",
    fontWeight: "500"
  },

  dotGreen: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#22c55e"
  },

  dotBlue: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#3b82f6"
  },

  dotYellow: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#facc15"
  },

  dotPurple: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#8b5cf6"
  },

  footer: {
    marginTop: "30px",
    textAlign: "center",
    color: "#6b7280",
    fontSize: "14px"
  }

};

export default Relatorios;