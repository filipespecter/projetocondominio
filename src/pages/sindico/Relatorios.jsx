import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function Relatorios() {
  const STORAGE_KEYS = {
    moradores: "moradores",
    apartamentos: "apartamentos",
    porteiros: "porteiros",
    visitantes: "visitantes",
    visitantesHistorico: "visitantes_historico",
    encomendas: "encomendas",
    encomendasHistorico: "encomendas_historico",
    reservas: "reservas",
    areasComuns: "areasComuns",
    avisos: "avisos",
    avisosSindico: "avisos_sindico",
    notificacoesMorador: "notificacoesMorador",
    relatoriosOperacionais: "relatorios_operacionais",
    prestadores: "condominio_prestadores",
    prestadoresParticulares: "prestadores_particulares_v2",
    ocorrencias: "ocorrencias",
    sugestoesReclamacoes: "sugestoes_reclamacoes",
    historico: "historico_relatorios_greencondo"
  };

  const [dados, setDados] = useState({});
  const [tipoRelatorio, setTipoRelatorio] = useState("executivo");
  const [periodo, setPeriodo] = useState("30dias");
  const [assinatura, setAssinatura] = useState("Síndico / Administração");
  const [observacoes, setObservacoes] = useState("");
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState("");

  const [historico, setHistorico] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.historico)) || [];
    } catch {
      return [];
    }
  });

  const [relatorioPersonalizado, setRelatorioPersonalizado] = useState({
    titulo: "Relatório Personalizado",
    incluirMoradores: true,
    incluirVisitantes: true,
    incluirEncomendas: false,
    incluirReservas: false,
    incluirOcorrencias: false,
    incluirSugestoes: false,
    incluirReclamacoes: false,
    incluirOperacional: false,
    incluirPrestadores: false,
    incluirAvisos: false,
    incluirAreas: false
  });

  useEffect(() => {
    carregarDados();
  }, []);

  function lerStorage(chave) {
    try {
      return JSON.parse(localStorage.getItem(chave)) || [];
    } catch {
      return [];
    }
  }

  function normalizarTexto(valor) {
    return String(valor || "")
      .trim()
      .toLowerCase();
  }

  function ehResolvido(status) {
    const texto = normalizarTexto(status);

    return (
      texto === "resolvido" ||
      texto === "resolvida" ||
      texto === "saiu" ||
      texto === "encerrado" ||
      texto === "entregue" ||
      texto === "retirada"
    );
  }

  function ehAberto(status) {
    const texto = normalizarTexto(status);

    return (
      texto === "novo" ||
      texto === "aberto" ||
      texto === "aberta" ||
      texto === "pendente" ||
      texto === "aguardando" ||
      texto === "ciente" ||
      texto === "em tratamento" ||
      texto === "em análise" ||
      texto === "em analise"
    );
  }

  function carregarDados() {
    const avisosSindico = lerStorage(STORAGE_KEYS.avisosSindico);
    const sugestoesReclamacoes = lerStorage(STORAGE_KEYS.sugestoesReclamacoes);

    const sugestoes = [
      ...sugestoesReclamacoes.filter((item) => {
        const tipo = normalizarTexto(item.tipoRegistro || item.tipo);
        return tipo === "sugestão" || tipo === "sugestao";
      }),
      ...avisosSindico.filter(
        (item) => normalizarTexto(item.categoria) === "sugestão"
      )
    ];

    const reclamacoes = [
      ...sugestoesReclamacoes.filter((item) => {
        const tipo = normalizarTexto(item.tipoRegistro || item.tipo);
        return tipo === "reclamação" || tipo === "reclamacao";
      }),
      ...avisosSindico.filter(
        (item) => normalizarTexto(item.categoria) === "reclamação"
      )
    ];

    setDados({
      moradores: lerStorage(STORAGE_KEYS.moradores),
      apartamentos: lerStorage(STORAGE_KEYS.apartamentos),
      porteiros: lerStorage(STORAGE_KEYS.porteiros),
      visitantes: lerStorage(STORAGE_KEYS.visitantes),
      visitantesHistorico: lerStorage(STORAGE_KEYS.visitantesHistorico),
      encomendas: lerStorage(STORAGE_KEYS.encomendas),
      encomendasHistorico: lerStorage(STORAGE_KEYS.encomendasHistorico),
      reservas: lerStorage(STORAGE_KEYS.reservas),
      areasComuns: lerStorage(STORAGE_KEYS.areasComuns),
      avisos: lerStorage(STORAGE_KEYS.avisos),
      avisosSindico,
      notificacoesMorador: lerStorage(STORAGE_KEYS.notificacoesMorador),
      relatoriosOperacionais: lerStorage(STORAGE_KEYS.relatoriosOperacionais),
      prestadores: [
        ...lerStorage(STORAGE_KEYS.prestadores),
        ...lerStorage(STORAGE_KEYS.prestadoresParticulares)
      ],
      ocorrencias: lerStorage(STORAGE_KEYS.ocorrencias),
      sugestoes,
      reclamacoes
    });

    setUltimaAtualizacao(new Date().toLocaleString("pt-BR"));
  }

  function obterDataItem(item) {
    const valor = [
      item.data,
      item.dataEntrada,
      item.dataSaida,
      item.criadoEm,
      item.createdAt,
      item.dataCadastro,
      item.recebidoEm,
      item.retiradoEm,
      item.retiradaEm,
      item.dataRecebimento,
      item.dataRegistro,
      item.registradoEm,
      item.dataReserva,
      item.dataVisita,
      item.timestamp
    ].find(Boolean);

    if (!valor) return null;

    if (typeof valor === "number") {
      const dataTimestamp = new Date(valor);
      return isNaN(dataTimestamp.getTime()) ? null : dataTimestamp;
    }

    if (String(valor).includes("/")) {
      const partes = String(valor).split(/[\/,\s:]+/);

      if (partes.length >= 3) {
        const dataBR = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);

        if (!isNaN(dataBR.getTime())) return dataBR;
      }
    }

    const data = new Date(valor);

    return isNaN(data.getTime()) ? null : data;
  }

  function filtrarPeriodo(lista) {
    if (periodo === "geral") return lista;

    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);

    const inicio = new Date();

    if (periodo === "hoje") inicio.setHours(0, 0, 0, 0);
    if (periodo === "7dias") inicio.setDate(inicio.getDate() - 7);
    if (periodo === "15dias") inicio.setDate(inicio.getDate() - 15);
    if (periodo === "30dias") inicio.setDate(inicio.getDate() - 30);
    if (periodo === "90dias") inicio.setDate(inicio.getDate() - 90);

    inicio.setHours(0, 0, 0, 0);

    return lista.filter((item) => {
      const data = obterDataItem(item);

      if (!data) return true;

      return data >= inicio && data <= hoje;
    });
  }

  const relatorios = [
    {
      id: "executivo",
      nome: "Relatório Executivo",
      icon: "📊",
      descricao: "Resumo geral e indicadores principais."
    },
    {
      id: "moradores",
      nome: "Moradores",
      icon: "👥",
      descricao: "Moradores, apartamentos e contatos."
    },
    {
      id: "visitantes",
      nome: "Visitantes",
      icon: "🚶",
      descricao: "Controle de acesso e histórico de visitantes."
    },
    {
      id: "encomendas",
      nome: "Encomendas",
      icon: "📦",
      descricao: "Pacotes pendentes, recebidos e retirados."
    },
    {
      id: "reservas",
      nome: "Reservas",
      icon: "📅",
      descricao: "Reservas das áreas comuns."
    },
    {
      id: "ocorrencias",
      nome: "Ocorrências",
      icon: "🚨",
      descricao: "Livro de ocorrências e tratativas."
    },
    {
      id: "sugestoes",
      nome: "Sugestões",
      icon: "💡",
      descricao: "Sugestões enviadas pelos moradores."
    },
    {
      id: "reclamacoes",
      nome: "Reclamações",
      icon: "⚠️",
      descricao: "Reclamações, status e respostas."
    },
    {
      id: "operacional",
      nome: "Operacional",
      icon: "🧠",
      descricao: "Consolidado de movimentações e eventos."
    },
    {
      id: "prestadores",
      nome: "Prestadores",
      icon: "🧰",
      descricao: "Serviços e fornecedores."
    },
    {
      id: "comunicacao",
      nome: "Comunicação",
      icon: "📢",
      descricao: "Avisos, Central do Síndico e notificações."
    },
    {
      id: "areas",
      nome: "Áreas Comuns",
      icon: "🏊",
      descricao: "Estruturas e utilização."
    },
    {
      id: "personalizado",
      nome: "Personalizado",
      icon: "📝",
      descricao: "Monte seu próprio relatório."
    }
  ];

  const periodos = [
    { id: "hoje", nome: "Hoje" },
    { id: "7dias", nome: "Últimos 7 dias" },
    { id: "15dias", nome: "Últimos 15 dias" },
    { id: "30dias", nome: "Últimos 30 dias" },
    { id: "90dias", nome: "Últimos 90 dias" },
    { id: "geral", nome: "Geral" }
  ];

  const relatorioSelecionado =
    relatorios.find((item) => item.id === tipoRelatorio) || relatorios[0];

  const preview = useMemo(() => {
    return gerarPreview();
  }, [dados, tipoRelatorio, periodo, relatorioPersonalizado]);

  function normalizarLinha(valor) {
    if (valor === undefined || valor === null || valor === "") return "-";
    if (typeof valor === "object") return JSON.stringify(valor);
    return String(valor);
  }

  function montarTabelaModulo(modulo) {
    const lista = filtrarPeriodo(dados[modulo] || []);
        if (modulo === "moradores") {
      return {
        titulo: "Moradores",
        colunas: ["Nome", "Apartamento", "Telefone", "E-mail", "Status"],
        linhas: lista.map((item) => [
          normalizarLinha(item.nome),
          normalizarLinha(item.apartamento || item.apto),
          normalizarLinha(item.telefone),
          normalizarLinha(item.email),
          normalizarLinha(item.status || "Ativo")
        ])
      };
    }

    if (modulo === "visitantes") {
      const listaFinal = filtrarPeriodo([
        ...(dados.visitantes || []),
        ...(dados.visitantesHistorico || [])
      ]);

      return {
        titulo: "Visitantes",
        colunas: ["Nome", "Apartamento", "Status", "Entrada", "Saída"],
        linhas: listaFinal.map((item) => [
          normalizarLinha(item.nome),
          normalizarLinha(item.apartamento || item.apto),
          normalizarLinha(item.status || item.acao),
          normalizarLinha(item.entrada || item.horarioEntrada || item.data),
          normalizarLinha(item.saida || item.horarioSaida || item.dataSaida)
        ])
      };
    }

    if (modulo === "encomendas") {
      const listaFinal = filtrarPeriodo([
        ...(dados.encomendas || []),
        ...(dados.encomendasHistorico || [])
      ]);

      return {
        titulo: "Encomendas",
        colunas: ["Morador", "Apartamento", "Status", "Data", "Descrição"],
        linhas: listaFinal.map((item) => [
          normalizarLinha(item.nome || item.destinatario || item.morador),
          normalizarLinha(item.apartamento || item.apto),
          normalizarLinha(item.status || item.acao),
          normalizarLinha(item.data || item.dataRecebimento || item.retiradaEm),
          normalizarLinha(item.descricao || item.tipo || item.observacao)
        ])
      };
    }

    if (modulo === "reservas") {
      return {
        titulo: "Reservas",
        colunas: ["Morador", "Apartamento", "Área", "Status", "Data"],
        linhas: lista.map((item) => [
          normalizarLinha(item.morador || item.nome),
          normalizarLinha(item.apartamento || item.apto),
          normalizarLinha(item.area || item.areaComum),
          normalizarLinha(item.status),
          normalizarLinha(item.data || item.dataReserva)
        ])
      };
    }

    if (modulo === "ocorrencias") {
      return {
        titulo: "Ocorrências",
        colunas: ["Título", "Responsável", "Status", "Data", "Descrição"],
        linhas: lista.map((item) => [
          normalizarLinha(item.titulo || item.tipo || item.tipoRegistro),
          normalizarLinha(item.responsavel || item.porteiroNome || item.criadoPor),
          normalizarLinha(item.status),
          normalizarLinha(item.data || item.criadoEm),
          normalizarLinha(item.descricao || item.observacao)
        ])
      };
    }

    if (modulo === "sugestoes") {
      return {
        titulo: "Sugestões",
        colunas: ["Título", "Morador", "Apartamento", "Status", "Data"],
        linhas: lista.map((item) => [
          normalizarLinha(item.titulo || item.tipoRegistro || item.tipo),
          normalizarLinha(item.morador || item.moradorNome),
          normalizarLinha(item.apartamento),
          normalizarLinha(item.status),
          normalizarLinha(item.data || item.dataCriacao)
        ])
      };
    }

    if (modulo === "reclamacoes") {
      return {
        titulo: "Reclamações",
        colunas: ["Título", "Morador", "Apartamento", "Status", "Data"],
        linhas: lista.map((item) => [
          normalizarLinha(item.titulo || item.tipoRegistro || item.tipo),
          normalizarLinha(item.morador || item.moradorNome),
          normalizarLinha(item.apartamento),
          normalizarLinha(item.status),
          normalizarLinha(item.data || item.dataCriacao)
        ])
      };
    }

    if (modulo === "operacional") {
      const listaFinal = filtrarPeriodo(dados.relatoriosOperacionais || []);

      return {
        titulo: "Relatório Operacional",
        colunas: ["Tipo", "Origem", "Título", "Status", "Data"],
        linhas: listaFinal.map((item) => [
          normalizarLinha(item.tipo),
          normalizarLinha(item.origem),
          normalizarLinha(item.titulo || item.acao),
          normalizarLinha(item.status),
          normalizarLinha(item.data)
        ])
      };
    }

    if (modulo === "prestadores") {
      return {
        titulo: "Prestadores",
        colunas: ["Nome", "Serviço", "Contato", "Status", "Data"],
        linhas: lista.map((item) => [
          normalizarLinha(item.nome),
          normalizarLinha(item.servico || item.tipo),
          normalizarLinha(item.telefone || item.contato),
          normalizarLinha(item.status),
          normalizarLinha(item.data || item.criadoEm)
        ])
      };
    }

    if (modulo === "comunicacao") {
      const listaFinal = filtrarPeriodo([
        ...(dados.avisos || []),
        ...(dados.avisosSindico || []),
        ...(dados.notificacoesMorador || [])
      ]);

      return {
        titulo: "Comunicação",
        colunas: ["Categoria", "Origem", "Título", "Status", "Data"],
        linhas: listaFinal.map((item) => [
          normalizarLinha(item.categoria || item.tipo || "Aviso"),
          normalizarLinha(item.origem || "Sistema"),
          normalizarLinha(item.titulo),
          normalizarLinha(item.status || (item.lida ? "Lida" : "Não lida")),
          normalizarLinha(item.data || item.criadoEm)
        ])
      };
    }

    if (modulo === "areas") {
      return {
        titulo: "Áreas Comuns",
        colunas: ["Área", "Status", "Capacidade", "Regras", "Reservas"],
        linhas: (dados.areasComuns || []).map((item) => {
          const totalReservas = (dados.reservas || []).filter((reserva) => {
            return (
              reserva.area === item.nome ||
              reserva.areaComum === item.nome ||
              reserva.areaId === item.id
            );
          }).length;

          return [
            normalizarLinha(item.nome),
            normalizarLinha(item.status),
            normalizarLinha(item.capacidade),
            normalizarLinha(item.regras || item.descricao),
            totalReservas
          ];
        })
      };
    }

    return {
      titulo: "Dados",
      colunas: ["Nome", "Status", "Data"],
      linhas: lista.map((item) => [
        normalizarLinha(item.nome || item.titulo || item.descricao),
        normalizarLinha(item.status),
        normalizarLinha(item.data || item.criadoEm)
      ])
    };
  }

  function gerarPreview() {
    const moradores = dados.moradores || [];
    const visitantes = filtrarPeriodo([
      ...(dados.visitantes || []),
      ...(dados.visitantesHistorico || [])
    ]);
    const encomendas = filtrarPeriodo([
      ...(dados.encomendas || []),
      ...(dados.encomendasHistorico || [])
    ]);
    const reservas = filtrarPeriodo(dados.reservas || []);
    const ocorrencias = filtrarPeriodo(dados.ocorrencias || []);
    const sugestoes = filtrarPeriodo(dados.sugestoes || []);
    const reclamacoes = filtrarPeriodo(dados.reclamacoes || []);
    const prestadores = filtrarPeriodo(dados.prestadores || []);
    const comunicacao = filtrarPeriodo([
      ...(dados.avisos || []),
      ...(dados.avisosSindico || []),
      ...(dados.notificacoesMorador || [])
    ]);
    const operacional = filtrarPeriodo(dados.relatoriosOperacionais || []);
    const areas = dados.areasComuns || [];

    if (tipoRelatorio === "executivo") {
      const ocorrenciasAbertas = ocorrencias.filter((item) =>
        ehAberto(item.status)
      ).length;

      const reclamacoesAbertas = reclamacoes.filter((item) =>
        ehAberto(item.status)
      ).length;

      const sugestoesResolvidas = sugestoes.filter((item) =>
        ehResolvido(item.status)
      ).length;

      return {
        titulo: "Relatório Executivo Condominial",
        descricao:
          "Documento administrativo com visão geral dos principais módulos do condomínio.",
        resumo: [
          `Total de moradores cadastrados: ${moradores.length}`,
          `Visitantes no período: ${visitantes.length}`,
          `Encomendas no período: ${encomendas.length}`,
          `Reservas no período: ${reservas.length}`,
          `Ocorrências no período: ${ocorrencias.length}`,
          `Ocorrências abertas: ${ocorrenciasAbertas}`,
          `Sugestões no período: ${sugestoes.length}`,
          `Sugestões resolvidas: ${sugestoesResolvidas}`,
          `Reclamações no período: ${reclamacoes.length}`,
          `Reclamações abertas: ${reclamacoesAbertas}`,
          `Prestadores no período: ${prestadores.length}`,
          `Comunicações no período: ${comunicacao.length}`,
          `Registros operacionais: ${operacional.length}`,
          `Áreas comuns cadastradas: ${areas.length}`
        ],
        tabelas: [
          {
            titulo: "Resumo Geral",
            colunas: ["Módulo", "Quantidade"],
            linhas: [
              ["Moradores", moradores.length],
              ["Visitantes", visitantes.length],
              ["Encomendas", encomendas.length],
              ["Reservas", reservas.length],
              ["Ocorrências", ocorrencias.length],
              ["Sugestões", sugestoes.length],
              ["Reclamações", reclamacoes.length],
              ["Prestadores", prestadores.length],
              ["Comunicação", comunicacao.length],
              ["Operacional", operacional.length],
              ["Áreas Comuns", areas.length]
            ]
          }
        ]
      };
    }

    if (tipoRelatorio === "personalizado") {
      const tabelas = [];

      if (relatorioPersonalizado.incluirMoradores) tabelas.push(montarTabelaModulo("moradores"));
      if (relatorioPersonalizado.incluirVisitantes) tabelas.push(montarTabelaModulo("visitantes"));
      if (relatorioPersonalizado.incluirEncomendas) tabelas.push(montarTabelaModulo("encomendas"));
      if (relatorioPersonalizado.incluirReservas) tabelas.push(montarTabelaModulo("reservas"));
      if (relatorioPersonalizado.incluirOcorrencias) tabelas.push(montarTabelaModulo("ocorrencias"));
      if (relatorioPersonalizado.incluirSugestoes) tabelas.push(montarTabelaModulo("sugestoes"));
      if (relatorioPersonalizado.incluirReclamacoes) tabelas.push(montarTabelaModulo("reclamacoes"));
      if (relatorioPersonalizado.incluirOperacional) tabelas.push(montarTabelaModulo("operacional"));
      if (relatorioPersonalizado.incluirPrestadores) tabelas.push(montarTabelaModulo("prestadores"));
      if (relatorioPersonalizado.incluirAvisos) tabelas.push(montarTabelaModulo("comunicacao"));
      if (relatorioPersonalizado.incluirAreas) tabelas.push(montarTabelaModulo("areas"));

      return {
        titulo: relatorioPersonalizado.titulo || "Relatório Personalizado",
        descricao:
          "Documento personalizado gerado com base nos módulos selecionados.",
        resumo: [
          `Módulos selecionados: ${tabelas.length}`,
          `Total estimado de registros: ${tabelas.reduce(
            (total, tabela) => total + tabela.linhas.length,
            0
          )}`,
          `Período aplicado: ${nomePeriodo()}`
        ],
        tabelas
      };
    }

    const tabela = montarTabelaModulo(tipoRelatorio);

    return {
      titulo: `Relatório de ${relatorioSelecionado.nome}`,
      descricao: relatorioSelecionado.descricao,
      resumo: [
        `Tipo selecionado: ${relatorioSelecionado.nome}`,
        `Período aplicado: ${nomePeriodo()}`,
        `Registros encontrados: ${tabela.linhas.length}`,
        `Última atualização: ${ultimaAtualizacao || "Agora"}`
      ],
      tabelas: [tabela]
    };
  }

  function nomePeriodo() {
    return periodos.find((item) => item.id === periodo)?.nome || "Geral";
  }

  function salvarHistorico(tipo) {
    const novo = {
      id: Date.now(),
      tipo,
      relatorio: preview.titulo,
      periodo: nomePeriodo(),
      data: new Date().toLocaleString("pt-BR")
    };

    const atualizado = [novo, ...historico].slice(0, 10);

    setHistorico(atualizado);

    localStorage.setItem(STORAGE_KEYS.historico, JSON.stringify(atualizado));
  }

  function gerarPDF() {
    const doc = new jsPDF();
    const dataGeracao = new Date().toLocaleString("pt-BR");

    doc.setFillColor(22, 163, 74);
    doc.rect(0, 0, 210, 38, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("GreenCondo", 14, 17);

    doc.setFontSize(10);
    doc.text("Central de Relatórios Condominiais", 14, 27);

    doc.setTextColor(20, 83, 45);
    doc.setFontSize(15);
    doc.text(preview.titulo, 14, 50);

    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    doc.text(`Período: ${nomePeriodo()}`, 14, 58);
    doc.text(`Gerado em: ${dataGeracao}`, 14, 65);

    autoTable(doc, {
      startY: 76,
      head: [["Resumo"]],
      body: preview.resumo.map((item) => [item]),
      headStyles: { fillColor: [22, 163, 74] },
      styles: { fontSize: 9, cellPadding: 3 }
    });

    let posicao = doc.lastAutoTable.finalY + 10;

    preview.tabelas.forEach((tabela) => {
      if (posicao > 245) {
        doc.addPage();
        posicao = 18;
      }

      doc.setTextColor(20, 83, 45);
      doc.setFontSize(12);
      doc.text(tabela.titulo, 14, posicao);

      autoTable(doc, {
        startY: posicao + 6,
        head: [tabela.colunas],
        body:
          tabela.linhas.length > 0
            ? tabela.linhas.slice(0, 120)
            : [["Sem registros"]],
        headStyles: { fillColor: [20, 83, 45] },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: "linebreak"
        }
      });

      posicao = doc.lastAutoTable.finalY + 12;
    });

    if (observacoes.trim()) {
      if (posicao > 240) {
        doc.addPage();
        posicao = 18;
      }

      doc.setTextColor(20, 83, 45);
      doc.setFontSize(12);
      doc.text("Observações", 14, posicao);

      doc.setTextColor(80, 80, 80);
      doc.setFontSize(10);
      doc.text(doc.splitTextToSize(observacoes, 180), 14, posicao + 8);

      posicao += 30;
    }

    if (posicao > 245) {
      doc.addPage();
      posicao = 18;
    }

    doc.setDrawColor(20, 83, 45);
    doc.line(14, posicao + 14, 90, posicao + 14);

    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    doc.text(assinatura || "Responsável", 14, posicao + 20);
    doc.text("Assinatura digital / Responsável pelo relatório", 14, posicao + 26);

    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text("Relatório gerado automaticamente pelo GreenCondo.", 14, 287);

    salvarHistorico("PDF");

    doc.save(
      `${preview.titulo
        .toLowerCase()
        .replaceAll(" ", "-")
        .replace(/[^\w-]/g, "")}.pdf`
    );
  }

  function exportarCSV() {
    const linhas = [];

    linhas.push(["Relatório", preview.titulo]);
    linhas.push(["Período", nomePeriodo()]);
    linhas.push(["Gerado em", new Date().toLocaleString("pt-BR")]);
    linhas.push([]);

    preview.resumo.forEach((item) => {
      linhas.push(["Resumo", item]);
    });

    preview.tabelas.forEach((tabela) => {
      linhas.push([]);
      linhas.push([tabela.titulo]);
      linhas.push(tabela.colunas);

      tabela.linhas.forEach((linha) => {
        linhas.push(linha);
      });
    });

    const csv = linhas
      .map((linha) =>
        linha
          .map((celula) => `"${String(celula || "").replaceAll('"', '""')}"`)
          .join(";")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${preview.titulo
      .toLowerCase()
      .replaceAll(" ", "-")
      .replace(/[^\w-]/g, "")}.csv`;
    link.click();

    URL.revokeObjectURL(url);

    salvarHistorico("CSV");
  }

  function atualizarPersonalizado(campo, valor) {
    setRelatorioPersonalizado((anterior) => ({
      ...anterior,
      [campo]: valor
    }));
  }

  return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <div>
          <span style={styles.heroBadge}>📄 Central de Documentos</span>

          <h1 style={styles.title}>Relatórios GreenCondo</h1>

          <p style={styles.subtitle}>
            Gere documentos operacionais, executivos e personalizados com
            pré-visualização, período definido, assinatura digital e exportação.
          </p>
        </div>

        <div style={styles.heroStats}>
          <div style={styles.heroStat}>
            <span>Relatório</span>
            <strong>{relatorioSelecionado.nome}</strong>
          </div>

          <div style={styles.heroStat}>
            <span>Período</span>
            <strong>{nomePeriodo()}</strong>
          </div>

          <div style={styles.heroStatGreen}>
            <span>Atualizado</span>
            <strong>{ultimaAtualizacao || "Agora"}</strong>
          </div>
        </div>
      </section>

      <section style={styles.layoutGrid}>
        <aside style={styles.configPanel}>
          <div style={styles.panelHeader}>
            <span style={styles.panelBadge}>Configuração</span>

            <h2 style={styles.panelTitle}>Montar relatório</h2>
          </div>

          <label style={styles.label}>Tipo de relatório</label>

          <div style={styles.reportGrid}>
            {relatorios.map((relatorio) => (
              <button
                key={relatorio.id}
                onClick={() => setTipoRelatorio(relatorio.id)}
                style={{
                  ...styles.reportButton,
                  ...(tipoRelatorio === relatorio.id
                    ? styles.reportButtonActive
                    : {})
                }}
              >
                <span style={styles.reportIcon}>{relatorio.icon}</span>

                <div>
                  <strong>{relatorio.nome}</strong>
                  <small>{relatorio.descricao}</small>
                </div>
              </button>
            ))}
          </div>

          <label style={styles.label}>Período</label>

          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            style={styles.select}
          >
            {periodos.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </select>
                    {tipoRelatorio === "personalizado" && (
            <div style={styles.customBox}>
              <label style={styles.label}>Nome do relatório</label>

              <input
                value={relatorioPersonalizado.titulo}
                onChange={(e) =>
                  atualizarPersonalizado("titulo", e.target.value)
                }
                style={styles.input}
              />

              <label style={styles.label}>Módulos incluídos</label>

              <CheckOption
                label="Moradores"
                checked={relatorioPersonalizado.incluirMoradores}
                onChange={(valor) =>
                  atualizarPersonalizado("incluirMoradores", valor)
                }
              />

              <CheckOption
                label="Visitantes"
                checked={relatorioPersonalizado.incluirVisitantes}
                onChange={(valor) =>
                  atualizarPersonalizado("incluirVisitantes", valor)
                }
              />

              <CheckOption
                label="Encomendas"
                checked={relatorioPersonalizado.incluirEncomendas}
                onChange={(valor) =>
                  atualizarPersonalizado("incluirEncomendas", valor)
                }
              />

              <CheckOption
                label="Reservas"
                checked={relatorioPersonalizado.incluirReservas}
                onChange={(valor) =>
                  atualizarPersonalizado("incluirReservas", valor)
                }
              />

              <CheckOption
                label="Ocorrências"
                checked={relatorioPersonalizado.incluirOcorrencias}
                onChange={(valor) =>
                  atualizarPersonalizado("incluirOcorrencias", valor)
                }
              />

              <CheckOption
                label="Sugestões"
                checked={relatorioPersonalizado.incluirSugestoes}
                onChange={(valor) =>
                  atualizarPersonalizado("incluirSugestoes", valor)
                }
              />

              <CheckOption
                label="Reclamações"
                checked={relatorioPersonalizado.incluirReclamacoes}
                onChange={(valor) =>
                  atualizarPersonalizado("incluirReclamacoes", valor)
                }
              />

              <CheckOption
                label="Operacional"
                checked={relatorioPersonalizado.incluirOperacional}
                onChange={(valor) =>
                  atualizarPersonalizado("incluirOperacional", valor)
                }
              />

              <CheckOption
                label="Prestadores"
                checked={relatorioPersonalizado.incluirPrestadores}
                onChange={(valor) =>
                  atualizarPersonalizado("incluirPrestadores", valor)
                }
              />

              <CheckOption
                label="Comunicação"
                checked={relatorioPersonalizado.incluirAvisos}
                onChange={(valor) =>
                  atualizarPersonalizado("incluirAvisos", valor)
                }
              />

              <CheckOption
                label="Áreas comuns"
                checked={relatorioPersonalizado.incluirAreas}
                onChange={(valor) =>
                  atualizarPersonalizado("incluirAreas", valor)
                }
              />
            </div>
          )}

          <label style={styles.label}>Assinatura digital</label>

          <input
            value={assinatura}
            onChange={(e) => setAssinatura(e.target.value)}
            style={styles.input}
            placeholder="Ex: Síndico / Administração"
          />

          <label style={styles.label}>Observações finais</label>

          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            style={styles.textarea}
            placeholder="Digite observações que serão incluídas no PDF..."
          />

          <div style={styles.actions}>
            <button style={styles.primaryButton} onClick={gerarPDF}>
              📄 Gerar PDF
            </button>

            <button style={styles.secondaryButton} onClick={exportarCSV}>
              CSV
            </button>

            <button style={styles.secondaryButton} onClick={carregarDados}>
              🔄 Atualizar
            </button>
          </div>
        </aside>

        <main style={styles.previewPanel}>
          <div style={styles.previewHeader}>
            <div>
              <span style={styles.previewBadge}>Pré-visualização</span>

              <h2 style={styles.previewTitle}>{preview.titulo}</h2>

              <p style={styles.previewSubtitle}>{preview.descricao}</p>
            </div>

            <div style={styles.previewSeal}>GreenCondo</div>
          </div>

          <div style={styles.metaGrid}>
            <div>
              <span>Período</span>
              <strong>{nomePeriodo()}</strong>
            </div>

            <div>
              <span>Registros</span>
              <strong>
                {preview.tabelas.reduce(
                  (total, tabela) => total + tabela.linhas.length,
                  0
                )}
              </strong>
            </div>

            <div>
              <span>Emitido por</span>
              <strong>{assinatura || "-"}</strong>
            </div>
          </div>

          <section style={styles.summaryBox}>
            <h3>Resumo</h3>

            {preview.resumo.map((item, index) => (
              <p key={index}>• {item}</p>
            ))}
          </section>

          {preview.tabelas.map((tabela, tabelaIndex) => (
            <section key={tabelaIndex} style={styles.tableBox}>
              <h3>{tabela.titulo}</h3>

              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {tabela.colunas.map((coluna) => (
                        <th key={coluna} style={styles.th}>
                          {coluna}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {tabela.linhas.length === 0 ? (
                      <tr>
                        <td colSpan={tabela.colunas.length} style={styles.td}>
                          Sem registros para o período selecionado.
                        </td>
                      </tr>
                    ) : (
                      tabela.linhas.slice(0, 8).map((linha, index) => (
                        <tr key={index}>
                          {linha.map((celula, cellIndex) => (
                            <td key={cellIndex} style={styles.td}>
                              {normalizarLinha(celula)}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {tabela.linhas.length > 8 && (
                <small style={styles.moreInfo}>
                  Mostrando 8 de {tabela.linhas.length} registros na prévia.
                  O PDF/CSV inclui mais registros.
                </small>
              )}
            </section>
          ))}

          <section style={styles.signatureBox}>
            <div>
              <strong>{assinatura || "Responsável"}</strong>
              <span>Assinatura digital / Responsável pelo relatório</span>
            </div>

            <small>
              Gerado automaticamente em {new Date().toLocaleString("pt-BR")}
            </small>
          </section>
        </main>
      </section>

      <section style={styles.historyPanel}>
        <div style={styles.panelHeader}>
          <span style={styles.panelBadge}>Histórico</span>

          <h2 style={styles.panelTitle}>Relatórios gerados</h2>
        </div>

        {historico.length === 0 ? (
          <div style={styles.empty}>Nenhum relatório gerado ainda.</div>
        ) : (
          <div style={styles.historyList}>
            {historico.map((item) => (
              <div key={item.id} style={styles.historyItem}>
                <span>{item.tipo}</span>
                <strong>{item.relatorio}</strong>
                <small>{item.periodo}</small>
                <small>{item.data}</small>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CheckOption({ label, checked, onChange }) {
  return (
    <label style={styles.checkOption}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />

      <span>{label}</span>
    </label>
  );
}

const styles = {
  container: {
    width: "100%",
    minHeight: "100vh",
    color: "#111827",
    fontFamily: "Arial"
  },

  hero: {
    background: "linear-gradient(135deg,#ffffff,#f0fdf4)",
    borderRadius: "28px",
    padding: "34px",
    display: "flex",
    justifyContent: "space-between",
    gap: "28px",
    alignItems: "center",
    boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
    marginBottom: "24px",
    border: "1px solid #dcfce7"
  },

  heroBadge: {
    display: "inline-block",
    background: "#dcfce7",
    border: "1px solid #bbf7d0",
    color: "#166534",
    padding: "9px 13px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "12px",
    marginBottom: "16px"
  },

  title: {
    margin: 0,
    fontSize: "42px",
    letterSpacing: "-1px",
    color: "#111827"
  },

  subtitle: {
    color: "#6b7280",
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
    minWidth: "140px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    padding: "16px",
    borderRadius: "18px"
  },

  heroStatGreen: {
    minWidth: "160px",
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    color: "#166534",
    padding: "16px",
    borderRadius: "18px"
  },

  layoutGrid: {
    display: "grid",
    gridTemplateColumns: "380px minmax(0,1fr)",
    gap: "22px",
    alignItems: "flex-start",
    marginBottom: "24px"
  },

  configPanel: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 16px 40px rgba(15,23,42,0.07)"
  },

  previewPanel: {
    background: "#ffffff",
    color: "#111827",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 16px 40px rgba(15,23,42,0.07)",
    border: "1px solid #e5e7eb"
  },

  panelHeader: {
    marginBottom: "20px"
  },

  panelBadge: {
    display: "inline-block",
    background: "#ecfdf5",
    color: "#166534",
    border: "1px solid #bbf7d0",
    padding: "7px 11px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "11px"
  },

  panelTitle: {
    margin: "12px 0 0",
    color: "#111827",
    fontSize: "24px"
  },

  label: {
    display: "block",
    marginTop: "16px",
    marginBottom: "8px",
    color: "#374151",
    fontSize: "13px",
    fontWeight: "900"
  },

  reportGrid: {
    display: "grid",
    gap: "10px"
  },

  reportButton: {
    background: "#ffffff",
    color: "#111827",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "13px",
    display: "flex",
    gap: "12px",
    textAlign: "left",
    cursor: "pointer"
  },

  reportButtonActive: {
    background: "#ecfdf5",
    color: "#166534",
    border: "1px solid #22c55e",
    boxShadow: "0 0 0 3px rgba(34,197,94,0.12)"
  },

  reportIcon: {
    fontSize: "22px"
  },

  select: {
    width: "100%",
    background: "#ffffff",
    color: "#111827",
    border: "1px solid #d1d5db",
    borderRadius: "14px",
    padding: "13px",
    outline: "none"
  },

  input: {
    width: "100%",
    background: "#ffffff",
    color: "#111827",
    border: "1px solid #d1d5db",
    borderRadius: "14px",
    padding: "13px",
    outline: "none",
    boxSizing: "border-box"
  },

  textarea: {
    width: "100%",
    minHeight: "92px",
    background: "#ffffff",
    color: "#111827",
    border: "1px solid #d1d5db",
    borderRadius: "14px",
    padding: "13px",
    outline: "none",
    boxSizing: "border-box",
    resize: "vertical"
  },

  customBox: {
    marginTop: "16px",
    padding: "14px",
    borderRadius: "18px",
    background: "#f9fafb",
    border: "1px solid #e5e7eb"
  },

  checkOption: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#374151",
    marginBottom: "8px",
    fontSize: "13px"
  },

  actions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "20px"
  },

  primaryButton: {
    background: "#16a34a",
    color: "white",
    border: "none",
    padding: "13px 16px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "900"
  },

  secondaryButton: {
    background: "#f3f4f6",
    color: "#111827",
    border: "1px solid #d1d5db",
    padding: "13px 16px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "900"
  },

  previewHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "flex-start",
    marginBottom: "20px"
  },

  previewBadge: {
    display: "inline-block",
    background: "#fef3c7",
    color: "#92400e",
    border: "1px solid #fde68a",
    padding: "7px 11px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "11px"
  },

  previewTitle: {
    margin: "12px 0 0",
    color: "#111827",
    fontSize: "30px"
  },

  previewSubtitle: {
    color: "#64748b",
    lineHeight: "1.6"
  },

  previewSeal: {
    background: "#16a34a",
    color: "white",
    padding: "14px 18px",
    borderRadius: "16px",
    fontWeight: "900"
  },

  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
    gap: "12px",
    marginBottom: "18px"
  },

  summaryBox: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#064e3b",
    borderRadius: "18px",
    padding: "18px",
    marginBottom: "18px"
  },

  tableBox: {
    marginBottom: "22px"
  },

  tableWrapper: {
    overflowX: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: "16px"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px"
  },

  th: {
    background: "#f3f4f6",
    color: "#374151",
    padding: "12px",
    textAlign: "left",
    borderBottom: "1px solid #e5e7eb"
  },

  td: {
    padding: "11px",
    borderBottom: "1px solid #f1f5f9",
    color: "#374151"
  },

  moreInfo: {
    display: "block",
    marginTop: "8px",
    color: "#64748b"
  },

  signatureBox: {
    marginTop: "24px",
    borderTop: "1px solid #cbd5e1",
    paddingTop: "18px",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
    color: "#475569"
  },

  historyPanel: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    padding: "24px",
    marginBottom: "20px",
    boxShadow: "0 16px 40px rgba(15,23,42,0.07)"
  },

  empty: {
    color: "#64748b",
    background: "#f9fafb",
    padding: "20px",
    borderRadius: "16px"
  },

  historyList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
    gap: "12px"
  },

  historyItem: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "14px",
    display: "grid",
    gap: "4px"
  }
};

export default Relatorios;