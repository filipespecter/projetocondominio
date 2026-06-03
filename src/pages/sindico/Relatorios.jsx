import { useEffect, useMemo, useState } from "react";

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

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

function Relatorios() {
  const STORAGE_KEYS = {
    moradores: "moradores",
    apartamentos: "apartamentos",
    porteiros: "porteiros",
    visitantes: "visitantes",
    encomendas: "encomendas",
    reservas: "reservas",
    areasComuns: "areasComuns",
    avisos: "avisos",
    prestadores: "condominio_prestadores",
    prestadoresParticulares: "prestadores_particulares_v2",
    operacional: "operacional_condominio_v2",
    ocorrencias: "ocorrencias",
    sugestoes: "sugestoesMorador",
    historicoBI: "historico_bi_infinity"
  };

  const [dados, setDados] = useState({});
  const [moduloAtivo, setModuloAtivo] = useState("visitantes");
  const [tipoGrafico, setTipoGrafico] = useState("barra");
  const [periodo, setPeriodo] = useState("mes");
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState("");
  const [historicoBI, setHistoricoBI] = useState(() => {
    const dadosSalvos = localStorage.getItem(STORAGE_KEYS.historicoBI);
    return dadosSalvos ? JSON.parse(dadosSalvos) : [];
  });

  useEffect(() => {
    carregarDados();
  }, []);

  function lerStorage(chave) {
    return JSON.parse(localStorage.getItem(chave)) || [];
  }

  function carregarDados() {
    const base = {
      moradores: lerStorage(STORAGE_KEYS.moradores),
      apartamentos: lerStorage(STORAGE_KEYS.apartamentos),
      porteiros: lerStorage(STORAGE_KEYS.porteiros),
      visitantes: lerStorage(STORAGE_KEYS.visitantes),
      encomendas: lerStorage(STORAGE_KEYS.encomendas),
      reservas: lerStorage(STORAGE_KEYS.reservas),
      areasComuns: lerStorage(STORAGE_KEYS.areasComuns),
      avisos: lerStorage(STORAGE_KEYS.avisos),
      prestadores: lerStorage(STORAGE_KEYS.prestadores),
      prestadoresParticulares: lerStorage(STORAGE_KEYS.prestadoresParticulares),
      operacional: lerStorage(STORAGE_KEYS.operacional),
      ocorrencias: lerStorage(STORAGE_KEYS.ocorrencias),
      sugestoes: lerStorage(STORAGE_KEYS.sugestoes)
    };

    setDados(base);
    setUltimaAtualizacao(new Date().toLocaleString("pt-BR"));
  }

  const modulos = [
    {
      id: "moradores",
      nome: "Moradores",
      icon: "👥",
      descricao: "Cadastros residenciais",
      dados: dados.moradores || []
    },
    {
      id: "apartamentos",
      nome: "Apartamentos",
      icon: "🏢",
      descricao: "Unidades cadastradas",
      dados: dados.apartamentos || []
    },
    {
      id: "porteiros",
      nome: "Porteiros",
      icon: "🛡️",
      descricao: "Equipe operacional",
      dados: dados.porteiros || []
    },
    {
      id: "visitantes",
      nome: "Visitantes",
      icon: "🚶",
      descricao: "Controle de acesso",
      dados: dados.visitantes || []
    },
    {
      id: "encomendas",
      nome: "Encomendas",
      icon: "📦",
      descricao: "Fluxo logístico",
      dados: dados.encomendas || []
    },
    {
      id: "reservas",
      nome: "Reservas",
      icon: "📅",
      descricao: "Áreas comuns",
      dados: dados.reservas || []
    },
    {
      id: "areasComuns",
      nome: "Áreas Comuns",
      icon: "🏊",
      descricao: "Estruturas do condomínio",
      dados: dados.areasComuns || []
    },
    {
      id: "avisos",
      nome: "Avisos",
      icon: "📢",
      descricao: "Comunicação",
      dados: dados.avisos || []
    },
    {
      id: "prestadores",
      nome: "Prestadores",
      icon: "🧰",
      descricao: "Serviços e fornecedores",
      dados: [
        ...(dados.prestadores || []),
        ...(dados.prestadoresParticulares || [])
      ]
    },
    {
      id: "operacional",
      nome: "COMPESA / Poço",
      icon: "💧",
      descricao: "Controle operacional",
      dados: dados.operacional || []
    },
    {
      id: "ocorrencias",
      nome: "Ocorrências",
      icon: "🚨",
      descricao: "Registros internos",
      dados: dados.ocorrencias || []
    },
    {
      id: "sugestoes",
      nome: "Sugestões",
      icon: "💡",
      descricao: "Feedback dos moradores",
      dados: dados.sugestoes || []
    }
  ];

  const moduloSelecionado = useMemo(() => {
    return modulos.find((m) => m.id === moduloAtivo) || modulos[0];
  }, [modulos, moduloAtivo]);

  const totalRegistros = modulos.reduce(
    (total, modulo) => total + modulo.dados.length,
    0
  );

  const dadosGrafico = modulos.map((modulo) => ({
    name: modulo.nome,
    value: modulo.dados.length
  }));

  const dadosModuloAtivo = gerarDadosModulo(moduloSelecionado);

  const COLORS = [
    "#22c55e",
    "#16a34a",
    "#15803d",
    "#facc15",
    "#84cc16",
    "#4ade80",
    "#bbf7d0",
    "#eab308"
  ];

  function gerarDadosModulo(modulo) {
    const lista = modulo.dados || [];

    if (lista.length === 0) {
      return [
        { name: "Sem dados", value: 0 }
      ];
    }

    const agrupado = {};

    lista.forEach((item, index) => {
      let chave = "Registros";

      if (modulo.id === "visitantes") {
        chave = item.status || "Sem status";
      } else if (modulo.id === "encomendas") {
        chave = item.status || "Sem status";
      } else if (modulo.id === "reservas") {
        chave = item.status || "Sem status";
      } else if (modulo.id === "avisos") {
        chave = item.prioridade || "Sem prioridade";
      } else if (modulo.id === "prestadores") {
        chave = item.status || "Sem status";
      } else if (modulo.id === "areasComuns") {
        chave = item.status || "Sem status";
      } else if (modulo.id === "porteiros") {
        chave = item.turno || "Sem turno";
      } else if (modulo.id === "operacional") {
        chave = item.poco || "Sem status";
      } else {
        chave = `Grupo ${index + 1}`;
      }

      agrupado[chave] = (agrupado[chave] || 0) + 1;
    });

    return Object.keys(agrupado).map((key) => ({
      name: key,
      value: agrupado[key]
    }));
  }

  function renderizarGrafico() {
    const data =
      moduloAtivo === "geral"
        ? dadosGrafico
        : dadosModuloAtivo;

    if (tipoGrafico === "linha") {
      return (
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="name" stroke="#d1d5db" />
            <YAxis stroke="#d1d5db" />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#facc15"
              strokeWidth={4}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (tipoGrafico === "pizza") {
      return (
        <ResponsiveContainer width="100%" height={360}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={125}
              label
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
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
        <ResponsiveContainer width="100%" height={360}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="name" stroke="#d1d5db" />
            <YAxis stroke="#d1d5db" />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#22c55e"
              fill="#14532d"
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="name" stroke="#d1d5db" />
          <YAxis stroke="#d1d5db" />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="value"
            fill="#22c55e"
            radius={[12, 12, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  function gerarPDF() {
    const doc = new jsPDF();

    doc.setFillColor(5, 46, 22);
    doc.rect(0, 0, 210, 38, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Infinity BI Center", 14, 18);

    doc.setFontSize(11);
    doc.text("Relatório Executivo Condominial", 14, 28);

    doc.setTextColor(20, 83, 45);
    doc.setFontSize(14);
    doc.text(`Módulo analisado: ${moduloSelecionado.nome}`, 14, 50);

    doc.setFontSize(10);
    doc.text(`Período: ${periodo}`, 14, 58);
    doc.text(`Atualizado em: ${ultimaAtualizacao}`, 14, 66);

    autoTable(doc, {
      startY: 78,
      head: [["Indicador", "Quantidade"]],
      body: modulos.map((modulo) => [
        modulo.nome,
        modulo.dados.length
      ]),
      headStyles: {
        fillColor: [20, 83, 45]
      },
      styles: {
        fontSize: 10
      }
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 12,
      head: [["Análise", "Valor"]],
      body: dadosModuloAtivo.map((item) => [
        item.name,
        item.value
      ]),
      headStyles: {
        fillColor: [234, 179, 8]
      },
      styles: {
        fontSize: 10
      }
    });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      "Relatório gerado automaticamente pelo Infinity Condo.",
      14,
      285
    );

    salvarHistoricoBI("PDF Executivo", moduloSelecionado.nome);

    doc.save(`infinity-bi-${moduloSelecionado.id}.pdf`);
  }

  function exportarExcel() {
    const workbook = XLSX.utils.book_new();

    const resumo = modulos.map((modulo) => ({
      Modulo: modulo.nome,
      Quantidade: modulo.dados.length
    }));

    const wsResumo = XLSX.utils.json_to_sheet(resumo);
    XLSX.utils.book_append_sheet(workbook, wsResumo, "Resumo");

    const dadosModulo = moduloSelecionado.dados.map((item, index) => ({
      ID: item.id || index + 1,
      Nome: item.nome || item.titulo || item.area || item.descricao || "-",
      Status: item.status || item.prioridade || "-",
      Data: item.data || item.criadoEm || item.dataEntrada || "-",
      Informacao: JSON.stringify(item)
    }));

    const wsModulo = XLSX.utils.json_to_sheet(dadosModulo);
    XLSX.utils.book_append_sheet(workbook, wsModulo, moduloSelecionado.nome);

    salvarHistoricoBI("Excel", moduloSelecionado.nome);

    XLSX.writeFile(
      workbook,
      `infinity-bi-${moduloSelecionado.id}.xlsx`
    );
  }

  function exportarCSV() {
    const linhas = [
      ["Modulo", "Quantidade"],
      ...modulos.map((modulo) => [
        modulo.nome,
        modulo.dados.length
      ])
    ];

    const csv = linhas
      .map((linha) => linha.join(";"))
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "infinity-bi-resumo.csv";
    link.click();

    URL.revokeObjectURL(url);

    salvarHistoricoBI("CSV", "Resumo geral");
  }

  function gerarBackup() {
    const backup = {};

    Object.keys(STORAGE_KEYS).forEach((key) => {
      if (key !== "historicoBI") {
        backup[STORAGE_KEYS[key]] =
          JSON.parse(localStorage.getItem(STORAGE_KEYS[key])) || [];
      }
    });

    const arquivo = {
      sistema: "Infinity Condo",
      tipo: "backup-local",
      geradoEm: new Date().toISOString(),
      dados: backup
    };

    const blob = new Blob([JSON.stringify(arquivo, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `backup-infinity-condo-${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);

    salvarHistoricoBI("Backup", "Backup geral");
  }

  function restaurarBackup(event) {
    const arquivo = event.target.files[0];

    if (!arquivo) return;

    const leitor = new FileReader();

    leitor.onload = function (e) {
      try {
        const conteudo = JSON.parse(e.target.result);

        if (!conteudo.dados) {
          alert("Arquivo de backup inválido.");
          return;
        }

        Object.keys(conteudo.dados).forEach((chave) => {
          localStorage.setItem(
            chave,
            JSON.stringify(conteudo.dados[chave])
          );
        });

        alert("Backup restaurado com sucesso.");
        carregarDados();
        salvarHistoricoBI("Restauração", "Backup restaurado");
      } catch (error) {
        alert("Erro ao restaurar backup.");
      }
    };

    leitor.readAsText(arquivo);
  }

  function salvarHistoricoBI(tipo, modulo) {
    const novo = {
      id: Date.now(),
      tipo,
      modulo,
      data: new Date().toLocaleString("pt-BR")
    };

    const atualizado = [
      novo,
      ...historicoBI
    ].slice(0, 8);

    setHistoricoBI(atualizado);

    localStorage.setItem(
      STORAGE_KEYS.historicoBI,
      JSON.stringify(atualizado)
    );
  }

  function abrirModoMonitor() {
    const elemento = document.documentElement;

    if (elemento.requestFullscreen) {
      elemento.requestFullscreen();
    }
  }

  return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <div>
          <span style={styles.heroBadge}>
            🧠 Central BI em tempo real
          </span>

          <h1 style={styles.title}>
            Infinity BI Center
          </h1>

          <p style={styles.subtitle}>
            Relatórios, movimentações, análise operacional, exportações,
            backup e inteligência condominial em uma única central.
          </p>
        </div>

        <div style={styles.heroStats}>
          <div style={styles.heroStat}>
            <span>Sistema</span>
            <strong>Online</strong>
          </div>

          <div style={styles.heroStat}>
            <span>Registros</span>
            <strong>{totalRegistros}</strong>
          </div>

          <div style={styles.heroStatGold}>
            <span>Atualizado</span>
            <strong>{ultimaAtualizacao || "Agora"}</strong>
          </div>
        </div>
      </section>

      <section style={styles.commandBar}>
        <select
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          style={styles.select}
        >
          <option value="hoje">Hoje</option>
          <option value="semana">Esta semana</option>
          <option value="mes">Este mês</option>
          <option value="ano">Este ano</option>
          <option value="geral">Geral</option>
        </select>

        <select
          value={tipoGrafico}
          onChange={(e) => setTipoGrafico(e.target.value)}
          style={styles.select}
        >
          <option value="barra">Barras</option>
          <option value="linha">Linha</option>
          <option value="pizza">Pizza</option>
          <option value="area">Área</option>
        </select>

        <button style={styles.actionButton} onClick={carregarDados}>
          🔄 Atualizar
        </button>

        <button style={styles.goldButton} onClick={abrirModoMonitor}>
          🖥️ Modo Monitor
        </button>

        <button style={styles.actionButton} onClick={gerarPDF}>
          📄 PDF
        </button>

        <button style={styles.actionButton} onClick={exportarExcel}>
          📊 Excel
        </button>

        <button style={styles.actionButton} onClick={exportarCSV}>
          CSV
        </button>

        <button style={styles.goldButton} onClick={gerarBackup}>
          💾 Backup
        </button>

        <label style={styles.restoreButton}>
          Restaurar
          <input
            type="file"
            accept=".json"
            onChange={restaurarBackup}
            style={{ display: "none" }}
          />
        </label>
      </section>

      <section style={styles.cardsGrid}>
        {modulos.map((modulo) => (
          <button
            key={modulo.id}
            style={{
              ...styles.biCard,
              ...(moduloAtivo === modulo.id ? styles.biCardActive : {})
            }}
            onClick={() => setModuloAtivo(modulo.id)}
          >
            <div style={styles.cardIcon}>
              {modulo.icon}
            </div>

            <div>
              <p style={styles.cardLabel}>
                {modulo.nome}
              </p>

              <h2 style={styles.cardNumber}>
                {modulo.dados.length}
              </h2>

              <span style={styles.cardMini}>
                {modulo.descricao}
              </span>
            </div>
          </button>
        ))}
      </section>

      <section style={styles.analysisGrid}>
        <div style={styles.chartPanel}>
          <div style={styles.panelHeader}>
            <div>
              <span style={styles.panelBadge}>
                Visualização BI
              </span>

              <h2 style={styles.panelTitle}>
                {moduloSelecionado.icon} {moduloSelecionado.nome}
              </h2>
            </div>

            <span style={styles.liveBadge}>
              ● Live
            </span>
          </div>

          {renderizarGrafico()}
        </div>

        <div style={styles.sidePanel}>
          <div style={styles.panelHeader}>
            <div>
              <span style={styles.panelBadgeGold}>
                Análise
              </span>

              <h2 style={styles.panelTitle}>
                Resumo do setor
              </h2>
            </div>
          </div>

          <div style={styles.sectorList}>
            {dadosModuloAtivo.map((item, index) => (
              <div key={index} style={styles.sectorItem}>
                <span>{item.name}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={styles.bottomGrid}>
        <div style={styles.historyPanel}>
          <div style={styles.panelHeader}>
            <div>
              <span style={styles.panelBadge}>
                Histórico BI
              </span>

              <h2 style={styles.panelTitle}>
                Relatórios recentes
              </h2>
            </div>
          </div>

          {historicoBI.length === 0 ? (
            <div style={styles.empty}>
              Nenhum relatório gerado ainda.
            </div>
          ) : (
            <div style={styles.historyList}>
              {historicoBI.map((item) => (
                <div key={item.id} style={styles.historyItem}>
                  <span>{item.tipo}</span>
                  <strong>{item.modulo}</strong>
                  <small>{item.data}</small>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.systemPanel}>
          <div style={styles.panelHeader}>
            <div>
              <span style={styles.panelBadgeGold}>
                Sistema
              </span>

              <h2 style={styles.panelTitle}>
                Status operacional
              </h2>
            </div>
          </div>

          <div style={styles.systemList}>
            <div style={styles.systemItem}>🟢 Sistema online</div>
            <div style={styles.systemItem}>🟢 Dados locais sincronizados</div>
            <div style={styles.systemItem}>🟡 Backup local disponível</div>
            <div style={styles.systemItem}>🟢 BI operacional ativo</div>
            <div style={styles.systemItem}>🟡 Segurança final entra com backend</div>
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    minHeight: "100vh",
    color: "white",
    fontFamily: "Arial"
  },

  hero: {
    background:
      "radial-gradient(circle at top right,rgba(250,204,21,0.22),transparent 32%), linear-gradient(135deg,#020617,#052e16 55%,#064e3b)",
    borderRadius: "38px",
    padding: "36px",
    display: "flex",
    justifyContent: "space-between",
    gap: "28px",
    alignItems: "center",
    boxShadow: "0 30px 85px rgba(5,46,22,0.35)",
    marginBottom: "24px",
    border: "1px solid rgba(255,255,255,0.12)"
  },

  heroBadge: {
    display: "inline-block",
    background: "rgba(34,197,94,0.15)",
    border: "1px solid rgba(34,197,94,0.30)",
    color: "#bbf7d0",
    padding: "9px 13px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "12px",
    marginBottom: "16px"
  },

  title: {
    margin: 0,
    fontSize: "46px",
    letterSpacing: "-1px"
  },

  subtitle: {
    color: "rgba(255,255,255,0.70)",
    maxWidth: "760px",
    lineHeight: "1.6"
  },

  heroStats: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    justifyContent: "flex-end"
  },

  heroStat: {
    minWidth: "130px",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    padding: "16px",
    borderRadius: "20px"
  },

  heroStatGold: {
    minWidth: "160px",
    background: "rgba(250,204,21,0.14)",
    border: "1px solid rgba(250,204,21,0.30)",
    color: "#fef3c7",
    padding: "16px",
    borderRadius: "20px"
  },

  commandBar: {
    background: "#07130d",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "28px",
    padding: "16px",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "24px",
    boxShadow: "0 18px 55px rgba(15,23,42,0.18)"
  },

  select: {
    background: "#0f1f16",
    color: "white",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: "16px",
    padding: "13px",
    outline: "none"
  },

  actionButton: {
    background: "#10251a",
    color: "white",
    border: "1px solid rgba(255,255,255,0.14)",
    padding: "13px 15px",
    borderRadius: "16px",
    cursor: "pointer",
    fontWeight: "900"
  },

  goldButton: {
    background: "linear-gradient(135deg,#92400e,#facc15)",
    color: "white",
    border: "none",
    padding: "13px 15px",
    borderRadius: "16px",
    cursor: "pointer",
    fontWeight: "900"
  },

  restoreButton: {
    background: "#facc15",
    color: "#713f12",
    border: "none",
    padding: "13px 15px",
    borderRadius: "16px",
    cursor: "pointer",
    fontWeight: "900"
  },

  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
    gap: "16px",
    marginBottom: "24px"
  },

  biCard: {
    background: "linear-gradient(180deg,#ffffff,#f8fafc)",
    color: "#111827",
    border: "1px solid #e5e7eb",
    borderRadius: "28px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    cursor: "pointer",
    textAlign: "left",
    boxShadow: "0 14px 35px rgba(15,23,42,0.08)"
  },

  biCardActive: {
    border: "2px solid #facc15",
    boxShadow:
      "0 18px 45px rgba(250,204,21,0.20), 0 0 0 4px rgba(250,204,21,0.10)"
  },

  cardIcon: {
    width: "58px",
    height: "58px",
    borderRadius: "20px",
    background: "linear-gradient(135deg,#052e16,#16a34a)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    color: "white"
  },

  cardLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "13px",
    fontWeight: "900"
  },

  cardNumber: {
    margin: "4px 0",
    color: "#052e16",
    fontSize: "32px"
  },

  cardMini: {
    color: "#6b7280",
    fontSize: "12px"
  },

  analysisGrid: {
    display: "grid",
    gridTemplateColumns: "1.6fr 0.8fr",
    gap: "22px",
    marginBottom: "24px"
  },

  chartPanel: {
    background: "#07130d",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "32px",
    padding: "26px",
    boxShadow: "0 22px 60px rgba(15,23,42,0.20)"
  },

  sidePanel: {
    background: "#07130d",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "32px",
    padding: "26px",
    boxShadow: "0 22px 60px rgba(15,23,42,0.20)"
  },

  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "flex-start",
    marginBottom: "20px"
  },

  panelBadge: {
    background: "rgba(34,197,94,0.14)",
    color: "#bbf7d0",
    border: "1px solid rgba(34,197,94,0.28)",
    padding: "7px 11px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "11px"
  },

  panelBadgeGold: {
    background: "rgba(250,204,21,0.14)",
    color: "#facc15",
    border: "1px solid rgba(250,204,21,0.28)",
    padding: "7px 11px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "11px"
  },

  panelTitle: {
    margin: "12px 0 0",
    color: "white",
    fontSize: "26px"
  },

  liveBadge: {
    color: "#22c55e",
    fontWeight: "900"
  },

  sectorList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },

  sectorItem: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "16px",
    padding: "14px",
    display: "flex",
    justifyContent: "space-between"
  },

  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "22px"
  },

  historyPanel: {
    background: "#07130d",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "32px",
    padding: "26px"
  },

  systemPanel: {
    background: "#07130d",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "32px",
    padding: "26px"
  },

  empty: {
    color: "rgba(255,255,255,0.58)",
    background: "rgba(255,255,255,0.06)",
    padding: "20px",
    borderRadius: "18px"
  },

  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },

  historyItem: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "16px",
    padding: "14px",
    display: "grid",
    gap: "4px"
  },

  systemList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },

  systemItem: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "16px",
    padding: "14px"
  }
};

export default Relatorios;