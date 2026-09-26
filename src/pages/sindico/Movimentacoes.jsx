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
  CartesianGrid,
  Legend
} from "recharts";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { useEffect, useState } from "react";
import { carregarDadosBI } from "../../Services/biService.js";

function Movimentacoes() {

  const [dadosLine, setDadosLine] =
    useState([]);

  const [dadosBar, setDadosBar] =
    useState([]);

  const [dadosPie, setDadosPie] =
    useState([]);

  const [tipoGrafico, setTipoGrafico] =
    useState("linha");

  const [mesSelecionado, setMesSelecionado] =
    useState("Maio");

  const [totais, setTotais] =
    useState({
      visitantes: 0,
      encomendas: 0,
      reservas: 0,
      avisos: 0
    });

  useEffect(() => {

    carregarDados();

  }, [mesSelecionado]);

  async function carregarDados() {
    try {
      const base = await carregarDadosBI();
      const visitantes = Array.isArray(base.visitantes) ? base.visitantes : [];
      const encomendas = Array.isArray(base.encomendas) ? base.encomendas : [];
      const reservas = Array.isArray(base.reservas) ? base.reservas : [];
      const avisos = Array.isArray(base.avisos) ? base.avisos : [];

      setTotais({ visitantes: visitantes.length, encomendas: encomendas.length, reservas: reservas.length, avisos: avisos.length });
      const tipos = [
        { name: "Visitantes", value: visitantes.length },
        { name: "Encomendas", value: encomendas.length },
        { name: "Reservas", value: reservas.length },
        { name: "Avisos", value: avisos.length }
      ];
      setDadosBar(tipos);
      setDadosPie(tipos);

      const movimentos = [
        ...visitantes.map((x) => ({ ...x, __tipo: "Visitante" })),
        ...encomendas.map((x) => ({ ...x, __tipo: "Encomenda" })),
        ...reservas.map((x) => ({ ...x, __tipo: "Reserva" })),
        ...avisos.map((x) => ({ ...x, __tipo: "Aviso" }))
      ];
      const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
      const contagem = Object.fromEntries(dias.map((d) => [d, 0]));
      movimentos.forEach((item) => {
        const raw = item.createdAt || item.criadoEm || item.data || item.dataReserva || item.recebidoEm;
        const d = raw ? new Date(raw) : null;
        if (d && !Number.isNaN(d.getTime())) contagem[dias[d.getDay()]] += 1;
      });
      setDadosLine(["Seg","Ter","Qua","Qui","Sex","Sab","Dom"].map((dia) => ({ dia, valor: contagem[dia] || 0 })));
    } catch (error) {
      console.error("Erro ao carregar movimentações:", error);
      setTotais({ visitantes: 0, encomendas: 0, reservas: 0, avisos: 0 });
      setDadosLine([]); setDadosBar([]); setDadosPie([]);
    }
  }

  function exportarPDF() {

    const doc = new jsPDF();

    doc.setFontSize(22);

    doc.text(
      "Relatório de Movimentações",
      14,
      20
    );

    doc.setFontSize(12);

    doc.text(
      `Mês selecionado: ${mesSelecionado}`,
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
      `movimentacoes-${mesSelecionado}.pdf`
    );

  }

  const COLORS = [
    "#6d28d9",
    "#7c3aed",
    "#a855f7",
    "#ddd6fe"
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
          height={350}
        >

          <LineChart data={dadosLine}>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="dia" />

            <YAxis />

            <Tooltip />

            <Legend />

            <Line
              type="monotone"
              dataKey="valor"
              stroke="#6d28d9"
              strokeWidth={4}
            />

          </LineChart>

        </ResponsiveContainer>

      );

    }

    if (tipoGrafico === "barra") {

      return (

        <ResponsiveContainer
          width="100%"
          height={350}
        >

          <BarChart data={dadosBar}>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="name" />

            <YAxis />

            <Tooltip />

            <Legend />

            <Bar
              dataKey="value"
              fill="#7c3aed"
              radius={[8, 8, 0, 0]}
            />

          </BarChart>

        </ResponsiveContainer>

      );

    }

    if (tipoGrafico === "pizza") {

      return (

        <ResponsiveContainer
          width="100%"
          height={350}
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

            <Legend />

          </PieChart>

        </ResponsiveContainer>

      );

    }

    if (tipoGrafico === "area") {

      return (

        <ResponsiveContainer
          width="100%"
          height={350}
        >

          <AreaChart data={dadosLine}>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="dia" />

            <YAxis />

            <Tooltip />

            <Legend />

            <Area
              type="monotone"
              dataKey="valor"
              stroke="#7c3aed"
              fill="#ddd6fe"
              strokeWidth={3}
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

      {/* RESUMO */}

      <div style={styles.cards}>

        <div style={styles.card}>

          <div style={styles.cardIcon}>
            📊
          </div>

          <div>

            <p style={styles.cardLabel}>
              Total geral
            </p>

            <h1 style={styles.cardNumber}>
              {totalGeral}
            </h1>

          </div>

        </div>

        <div style={styles.card}>

          <div style={styles.cardIcon}>
            📦
          </div>

          <div>

            <p style={styles.cardLabel}>
              Tipos ativos
            </p>

            <h1 style={styles.cardNumber}>
              4
            </h1>

          </div>

        </div>

        <div style={styles.card}>

          <div style={styles.cardIcon}>
            📈
          </div>

          <div>

            <p style={styles.cardLabel}>
              Média semanal
            </p>

            <h1 style={styles.cardNumber}>
              {Math.round(totalGeral / 7)}
            </h1>

          </div>

        </div>

      </div>

      {/* GRÁFICO */}

      <div style={styles.chartCard}>

        <div style={styles.chartHeader}>

          <div>

            <h2 style={styles.chartTitle}>
              Visualização Analytics
            </h2>

            <p style={styles.chartSubtitle}>
              Dados completos do condomínio
            </p>

          </div>

        </div>

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
    marginBottom: "30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px"
  },

  title: {
    fontSize: "34px",
    color: "#6d28d9",
    margin: 0
  },

  subtitle: {
    color: "#6b7280",
    marginTop: "8px"
  },

  actions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap"
  },

  select: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #c4b5fd",
    outline: "none",
    background: "white"
  },

  pdfButton: {
    background:
      "linear-gradient(135deg,#6d28d9,#7c3aed)",
    color: "white",
    border: "none",
    padding: "12px 18px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700",
    boxShadow:
      "0 4px 12px rgba(20,83,45,0.2)"
  },

  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(240px,1fr))",
    gap: "20px",
    marginBottom: "30px"
  },

  card: {
    background:
      "linear-gradient(135deg,#6d28d9,#7c3aed)",
    color: "white",
    padding: "24px",
    borderRadius: "22px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow:
      "0 8px 24px rgba(20,83,45,0.18)"
  },

  cardIcon: {
    fontSize: "42px"
  },

  cardLabel: {
    marginBottom: "6px",
    opacity: 0.9
  },

  cardNumber: {
    margin: 0,
    fontSize: "36px"
  },

  chartCard: {
    background: "white",
    padding: "28px",
    borderRadius: "24px",
    boxShadow:
      "0 4px 20px rgba(0,0,0,0.06)"
  },

  chartHeader: {
    marginBottom: "24px"
  },

  chartTitle: {
    margin: 0,
    color: "#6d28d9"
  },

  chartSubtitle: {
    marginTop: "8px",
    color: "#6b7280"
  }

};

export default Movimentacoes;