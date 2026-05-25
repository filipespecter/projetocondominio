import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { useEffect, useState } from "react";

function Movimentacoes() {

  const [dadosLine, setDadosLine] = useState([]);
  const [dadosBar, setDadosBar] = useState([]);
  const [dadosPie, setDadosPie] = useState([]);

  const [tipoGrafico, setTipoGrafico] =
    useState("linha");

  const [mesSelecionado, setMesSelecionado] =
    useState("Maio");

  const [totais, setTotais] = useState({
    visitantes: 0,
    encomendas: 0,
    reservas: 0,
    avisos: 0
  });

  useEffect(() => {

    carregarDados();

  }, [mesSelecionado]);

  function carregarDados() {

    const visitantes =
      JSON.parse(localStorage.getItem("visitantes")) || [];

    const encomendas =
      JSON.parse(localStorage.getItem("encomendas")) || [];

    const reservas =
      JSON.parse(localStorage.getItem("reservas")) || [];

    const avisos =
      JSON.parse(localStorage.getItem("avisos")) || [];

    setTotais({
      visitantes: visitantes.length,
      encomendas: encomendas.length,
      reservas: reservas.length,
      avisos: avisos.length
    });

    const total =
      visitantes.length +
      encomendas.length +
      reservas.length +
      avisos.length;

    setDadosLine([
      { dia: "Seg", valor: total * 0.1 },
      { dia: "Ter", valor: total * 0.15 },
      { dia: "Qua", valor: total * 0.08 },
      { dia: "Qui", valor: total * 0.2 },
      { dia: "Sex", valor: total * 0.25 },
      { dia: "Sab", valor: total * 0.12 },
      { dia: "Dom", valor: total * 0.1 }
    ]);

    const tipos = [
      {
        name: "Visitantes",
        value: visitantes.length
      },
      {
        name: "Encomendas",
        value: encomendas.length
      },
      {
        name: "Reservas",
        value: reservas.length
      },
      {
        name: "Avisos",
        value: avisos.length
      }
    ];

    setDadosBar(tipos);

    setDadosPie(tipos);

  }

  function exportarPDF() {

    const doc = new jsPDF();

    doc.setFontSize(20);

    doc.text(
      "Relatório Mensal Condomínio",
      14,
      20
    );

    doc.setFontSize(12);

    doc.text(
      `Mês: ${mesSelecionado}`,
      14,
      32
    );

    autoTable(doc, {
      startY: 45,
      head: [["Categoria", "Quantidade"]],
      body: [
        ["Visitantes", totais.visitantes],
        ["Encomendas", totais.encomendas],
        ["Reservas", totais.reservas],
        ["Avisos", totais.avisos]
      ]
    });

    doc.save(
      `relatorio-${mesSelecionado}.pdf`
    );

  }

  const COLORS = [
    "#14532d",
    "#166534",
    "#22c55e",
    "#86efac"
  ];

  const totalGeral =
    dadosBar.reduce(
      (acc, item) => acc + item.value,
      0
    );

  function renderizarGrafico() {

    if (tipoGrafico === "linha") {

      return (

        <ResponsiveContainer
          width="100%"
          height={320}
        >

          <LineChart data={dadosLine}>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="dia" />

            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="valor"
              stroke="#14532d"
              strokeWidth={3}
            />

          </LineChart>

        </ResponsiveContainer>

      );

    }

    if (tipoGrafico === "barra") {

      return (

        <ResponsiveContainer
          width="100%"
          height={320}
        >

          <BarChart data={dadosBar}>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="name" />

            <YAxis />

            <Tooltip />

            <Bar
              dataKey="value"
              fill="#166534"
            />

          </BarChart>

        </ResponsiveContainer>

      );

    }

    if (tipoGrafico === "pizza") {

      return (

        <ResponsiveContainer
          width="100%"
          height={320}
        >

          <PieChart>

            <Pie
              data={dadosPie}
              dataKey="value"
              nameKey="name"
              outerRadius={120}
              label
            >

              {dadosPie.map((_, index) => (

                <Cell
                  key={index}
                  fill={
                    COLORS[index % COLORS.length]
                  }
                />

              ))}

            </Pie>

            <Tooltip />

          </PieChart>

        </ResponsiveContainer>

      );

    }

    if (tipoGrafico === "area") {

      return (

        <ResponsiveContainer
          width="100%"
          height={320}
        >

          <AreaChart data={dadosLine}>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="dia" />

            <YAxis />

            <Tooltip />

            <Area
              type="monotone"
              dataKey="valor"
              stroke="#166534"
              fill="#bbf7d0"
            />

          </AreaChart>

        </ResponsiveContainer>

      );

    }

  }

  return (

    <div style={styles.container}>

      {/* HEADER */}

      <div style={styles.header}>

        <div>

          <h1 style={styles.title}>
            Movimentações
          </h1>

          <p style={styles.subtitle}>
            Analytics completo do condomínio
          </p>

        </div>

        <div style={styles.actions}>

          <select
            value={mesSelecionado}
            onChange={(e) =>
              setMesSelecionado(
                e.target.value
              )
            }
            style={styles.select}
          >

            <option>Janeiro</option>
            <option>Fevereiro</option>
            <option>Março</option>
            <option>Abril</option>
            <option>Maio</option>
            <option>Junho</option>

          </select>

          <select
            value={tipoGrafico}
            onChange={(e) =>
              setTipoGrafico(
                e.target.value
              )
            }
            style={styles.select}
          >

            <option value="linha">
              Linha
            </option>

            <option value="barra">
              Barras
            </option>

            <option value="pizza">
              Pizza
            </option>

            <option value="area">
              Área
            </option>

          </select>

          <button
            style={styles.pdfButton}
            onClick={exportarPDF}
          >

            Exportar PDF

          </button>

        </div>

      </div>

      {/* CARDS */}

      <div style={styles.cards}>

        <div style={styles.card}>
          <h3>Total geral</h3>
          <h1>{totalGeral}</h1>
        </div>

        <div style={styles.card}>
          <h3>Tipos ativos</h3>
          <h1>4</h1>
        </div>

        <div style={styles.card}>
          <h3>Média semanal</h3>
          <h1>
            {Math.round(totalGeral / 7)}
          </h1>
        </div>

      </div>

      {/* GRÁFICO */}

      <div style={styles.chartCard}>

        <h2 style={styles.chartTitle}>
          Visualização Analytics
        </h2>

        {renderizarGrafico()}

      </div>

    </div>

  );

}

const styles = {

  container: {
    width: "100%"
  },

  header: {
    marginBottom: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px"
  },

  title: {
    fontSize: "34px",
    color: "#14532d",
    margin: 0
  },

  subtitle: {
    color: "#6b7280"
  },

  actions: {
    display: "flex",
    gap: "12px",
    alignItems: "center"
  },

  select: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    outline: "none"
  },

  pdfButton: {
    background: "#14532d",
    color: "white",
    border: "none",
    padding: "10px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600"
  },

  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "15px",
    marginBottom: "20px"
  },

  card: {
    background: "white",
    padding: "24px",
    borderRadius: "14px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)"
  },

  chartCard: {
    background: "white",
    padding: "24px",
    borderRadius: "14px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)"
  },

  chartTitle: {
    marginBottom: "20px",
    color: "#14532d"
  }

};

export default Movimentacoes;