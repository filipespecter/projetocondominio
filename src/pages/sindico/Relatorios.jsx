import { useEffect, useMemo, useState } from "react";
import { registrarAuditoria } from "../../Services/auditoriaService";
import { criarNotificacao } from "../../Services/notificacaoService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

function Relatorios() {
  const STORAGE_KEYS = {
    moradores: "moradores",
    apartamentos: "apartamentos",
    porteiros: "porteiros",

    visitantes: "visitantes",
    visitantesHistorico: "visitantes_historico",

    encomendas: "encomendas",
    encomendasHistorico: "encomendas_historico",
    encomendasEsperadas: "encomendas_esperadas",

    reservas: "reservas",
    areasComuns: "areasComuns",

    avisos: "avisos",
    avisosSindico: "avisos_sindico",
    notificacoesMorador: "notificacoesMorador",

    prestadores: "condominio_prestadores",
    prestadoresParticulares: "prestadores_particulares_v2",

    ocorrencias: "ocorrencias",
    historicoOcorrencias: "historico_ocorrencias",

    sugestoes: "sugestoesMorador",
    sugestoesReclamacoes: "sugestoes_reclamacoes",

    movimentacoes: "movimentacoes",
    relatoriosOperacionais: "relatorios_operacionais",
    auditoria: "auditoria_logs",
    auditoriaSistema: "auditoriaSistema",
    configuracoes: "configuracoes",
    perfilCondominio: "perfil_condominio",

    historico: "historico_relatorios_infinitycondo"
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
    incluirPrestadores: false,
    incluirAvisos: false,
    incluirAreas: false,
    incluirOperacional: false,
    incluirAuditoria: false
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

  function lerObjeto(chave) {
    try {
      return JSON.parse(localStorage.getItem(chave)) || null;
    } catch {
      return null;
    }
  }

  function obterUsuarioAtual() {
    try {
      return (
        JSON.parse(localStorage.getItem("usuarioSindico")) ||
        JSON.parse(sessionStorage.getItem("usuarioSindico")) ||
        {}
      );
    } catch {
      return {};
    }
  }

  function obterPerfilCondominio() {
    const perfil =
      lerObjeto(STORAGE_KEYS.perfilCondominio) ||
      lerObjeto(STORAGE_KEYS.configuracoes) ||
      {};

    return {
      condominioId: perfil.id || perfil.condominioId || null,
      nomeCondominio:
        perfil.nomeCondominio ||
        perfil.nome ||
        "Condomínio não configurado",
      cnpj: perfil.cnpj || "",
      endereco: perfil.endereco || "",
      sindico: perfil.sindico || "",
      telefone: perfil.telefone || "",
      email: perfil.email || ""
    };
  }

  function registrarAuditoriaRelatorio(acao, detalhes = "") {
    registrarAuditoria({
      acao,
      modulo: "Relatórios",
      detalhes,
      referenciaId: Date.now()
    });
  }

  function criarNotificacaoRelatorio(tipo) {
    if (tipoRelatorio !== "executivo" && tipoRelatorio !== "personalizado") {
      return;
    }

    criarNotificacao({
      titulo:
        tipoRelatorio === "executivo"
          ? "Relatório executivo gerado"
          : "Relatório personalizado gerado",
      mensagem: `${preview.titulo} foi exportado em ${tipo}.`,
      tipo: "Relatórios",
      origem: "Relatórios",
      perfilDestino: "sindico",
      moduloOrigem: "Relatorios",
      referenciaId: Date.now(),
      prioridade: "normal"
    });
  }

  function carregarDados() {
    const perfilAtual = obterPerfilCondominio();
    const condominioId = perfilAtual.condominioId;

    function filtrarCondominio(lista) {
      return removerDuplicados(lista).filter((item) =>
        itemPertenceAoCondominio(item, condominioId)
      );
    }

    setDados({
      moradores: filtrarCondominio(lerStorage(STORAGE_KEYS.moradores)),
      apartamentos: filtrarCondominio(lerStorage(STORAGE_KEYS.apartamentos)),
      porteiros: filtrarCondominio(lerStorage(STORAGE_KEYS.porteiros)),

      visitantes: filtrarCondominio([
        ...lerStorage(STORAGE_KEYS.visitantes),
        ...lerStorage(STORAGE_KEYS.visitantesHistorico)
      ]),

      encomendas: filtrarCondominio([
        ...lerStorage(STORAGE_KEYS.encomendas),
        ...lerStorage(STORAGE_KEYS.encomendasHistorico),
        ...lerStorage(STORAGE_KEYS.encomendasEsperadas)
      ]),

      reservas: filtrarCondominio(lerStorage(STORAGE_KEYS.reservas)),
      areasComuns: filtrarCondominio(lerStorage(STORAGE_KEYS.areasComuns)),

      avisos: filtrarCondominio([
        ...lerStorage(STORAGE_KEYS.avisos),
        ...lerStorage(STORAGE_KEYS.avisosSindico),
        ...lerStorage(STORAGE_KEYS.notificacoesMorador)
      ]),

      prestadores: filtrarCondominio([
        ...lerStorage(STORAGE_KEYS.prestadores),
        ...lerStorage(STORAGE_KEYS.prestadoresParticulares)
      ]),

      ocorrencias: filtrarCondominio([
        ...lerStorage(STORAGE_KEYS.ocorrencias),
        ...lerStorage(STORAGE_KEYS.historicoOcorrencias)
      ]),

      sugestoes: filtrarCondominio([
        ...lerStorage(STORAGE_KEYS.sugestoes),
        ...lerStorage(STORAGE_KEYS.sugestoesReclamacoes)
      ]),

      movimentacoes: filtrarCondominio([
        ...lerStorage(STORAGE_KEYS.movimentacoes),
        ...lerStorage(STORAGE_KEYS.relatoriosOperacionais)
      ]),

      auditoria: filtrarCondominio([
        ...lerStorage(STORAGE_KEYS.auditoria),
        ...lerStorage(STORAGE_KEYS.auditoriaSistema)
      ]),

      configuracoes:
        lerObjeto(STORAGE_KEYS.perfilCondominio) ||
        lerObjeto(STORAGE_KEYS.configuracoes) ||
        {}
    });

    setUltimaAtualizacao(new Date().toLocaleString("pt-BR"));
  }

  function removerDuplicados(lista) {
    const vistos = new Set();

    return (lista || []).filter((item, index) => {
      const chave = String(
        item?.id ||
          item?.codigoInterno ||
          item?.codigo ||
          item?.documento ||
          item?.cpfCnpj ||
          item?.email ||
          item?.nome ||
          item?.titulo ||
          index
      );

      if (vistos.has(chave)) {
        return false;
      }

      vistos.add(chave);
      return true;
    });
  }

  function itemPertenceAoCondominio(item, condominioId) {
    if (!condominioId) return true;

    return (
      !item?.condominioId ||
      String(item.condominioId) === String(condominioId)
    );
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
      item.dataReserva,
      item.dataVisita,
      item.registradoEm,
      item.canceladaEm
    ].find(Boolean);

    if (!valor) return null;

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
    if (periodo === "14dias") inicio.setDate(inicio.getDate() - 14);
    if (periodo === "30dias") inicio.setDate(inicio.getDate() - 30);
    if (periodo === "3meses") inicio.setMonth(inicio.getMonth() - 3);

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
      descricao: "Controle de acesso e status."
    },
    {
      id: "encomendas",
      nome: "Encomendas",
      icon: "📦",
      descricao: "Pacotes pendentes, esperados e retirados."
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
      descricao: "Registros internos do condomínio."
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
      descricao: "Avisos, notificações e central do síndico."
    },
    {
      id: "areas",
      nome: "Áreas Comuns",
      icon: "🏊",
      descricao: "Estruturas e utilização."
    },
    {
      id: "operacional",
      nome: "Operacional",
      icon: "📈",
      descricao: "Movimentações e registros operacionais."
    },
    {
      id: "auditoria",
      nome: "Auditoria",
      icon: "🧾",
      descricao: "Ações registradas no sistema."
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
    { id: "14dias", nome: "Últimas 2 semanas" },
    { id: "30dias", nome: "Último mês" },
    { id: "3meses", nome: "Últimos 3 meses" },
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

  function formatarDataHoraExportacao(valor) {
    if (valor === undefined || valor === null || valor === "") return "-";

    if (valor instanceof Date && !isNaN(valor.getTime())) {
      return valor.toLocaleString("pt-BR");
    }

    const texto = String(valor).trim();

    if (!texto) return "-";

    const dataBR = texto.match(
      /^(\d{2})\/(\d{2})\/(\d{4})(?:[\s,]+(?:às\s*)?(\d{2}):(\d{2})(?::(\d{2}))?)?/i
    );

    if (dataBR) {
      const [, dia, mes, ano, hora, minuto, segundo] = dataBR;
      const data = new Date(
        Number(ano),
        Number(mes) - 1,
        Number(dia),
        Number(hora || 0),
        Number(minuto || 0),
        Number(segundo || 0)
      );

      if (!isNaN(data.getTime())) {
        return hora
          ? data.toLocaleString("pt-BR")
          : data.toLocaleDateString("pt-BR");
      }
    }

    const data = new Date(texto);

    if (isNaN(data.getTime())) return texto;

    const possuiHorario =
      texto.includes("T") ||
      /\d{1,2}:\d{2}/.test(texto) ||
      data.getHours() !== 0 ||
      data.getMinutes() !== 0 ||
      data.getSeconds() !== 0;

    return possuiHorario
      ? data.toLocaleString("pt-BR")
      : data.toLocaleDateString("pt-BR");
  }

  function criarNomeArquivo(extensao) {
    const nomeBase = preview.titulo
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return `${nomeBase || "relatorio-infinitycondo"}.${extensao}`;
  }

  function montarTabelaModulo(modulo) {
    const lista = filtrarPeriodo(dados[modulo] || []);

    if (modulo === "moradores") {
      return {
        titulo: "Moradores",
        colunas: ["Nome", "Apartamento", "Tipo", "Telefone", "E-mail", "Status"],
        linhas: lista.map((item) => [
          normalizarLinha(item.nome),
          normalizarLinha(item.apartamento || item.apto),
          normalizarLinha(item.tipoMorador || "Morador"),
          normalizarLinha(item.telefone),
          normalizarLinha(item.email),
          normalizarLinha(item.status || "Ativo")
        ])
      };
    }

    if (modulo === "visitantes") {
      return {
        titulo: "Visitantes",
        colunas: ["Nome", "Apartamento", "Morador", "Status", "Data"],
        linhas: lista.map((item) => [
          normalizarLinha(item.nome),
          normalizarLinha(item.apartamento || item.apto),
          normalizarLinha(item.morador || item.responsavel),
          normalizarLinha(item.status || item.statusSindico),
          formatarDataHoraExportacao(item.data || item.dataEntrada || item.criadoEm)
        ])
      };
    }

    if (modulo === "encomendas") {
      return {
        titulo: "Encomendas",
        colunas: ["Código", "Destinatário", "Apartamento", "Status", "Data", "Descrição"],
        linhas: lista.map((item) => [
          normalizarLinha(item.codigoInterno || item.codigo),
          normalizarLinha(item.nome || item.destinatario || item.morador),
          normalizarLinha(item.apartamento || item.apto),
          normalizarLinha(item.status || item.statusSindico),
          formatarDataHoraExportacao(item.data || item.recebidoEm || item.criadoEm),
          normalizarLinha(item.descricao || item.tipo || item.observacao)
        ])
      };
    }

    if (modulo === "reservas") {
      return {
        titulo: "Reservas",
        colunas: ["Morador", "Apartamento", "Área", "Status", "Data"],
        linhas: lista.map((item) => [
          normalizarLinha(item.morador || item.moradorNome || item.nome),
          normalizarLinha(item.apartamento || item.apto),
          normalizarLinha(item.area || item.areaComum),
          normalizarLinha(item.status),
          formatarDataHoraExportacao(item.data || item.dataReserva)
        ])
      };
    }

    if (modulo === "ocorrencias") {
      return {
        titulo: "Ocorrências",
        colunas: ["Título", "Categoria", "Prioridade", "Responsável", "Status", "Data"],
        linhas: lista.map((item) => [
          normalizarLinha(item.titulo || item.tipo || item.categoria),
          normalizarLinha(item.categoria),
          normalizarLinha(item.prioridade),
          normalizarLinha(item.responsavel || item.criadoPor || item.porteiroNome),
          normalizarLinha(item.status),
          formatarDataHoraExportacao(item.data || item.criadoEm || item.registradoEm)
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
          formatarDataHoraExportacao(item.data || item.criadoEm)
        ])
      };
    }

    if (modulo === "comunicacao") {
      const listaAvisos = filtrarPeriodo(dados.avisos || []);

      return {
        titulo: "Comunicação",
        colunas: ["Título", "Categoria", "Origem", "Status", "Data"],
        linhas: listaAvisos.map((item) => [
          normalizarLinha(item.titulo),
          normalizarLinha(item.categoria || item.tipo),
          normalizarLinha(item.origem || item.responsavel),
          normalizarLinha(item.status),
          formatarDataHoraExportacao(item.data || item.criadoEm)
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
            normalizarLinha(item.capacidade || "Opcional"),
            normalizarLinha(item.regras || item.descricao),
            totalReservas
          ];
        })
      };
    }

    if (modulo === "operacional") {
      return {
        titulo: "Operacional",
        colunas: ["Tipo", "Ação", "Origem", "Status", "Data"],
        linhas: lista.map((item) => [
          normalizarLinha(item.tipo),
          normalizarLinha(item.acao || item.titulo || item.descricao),
          normalizarLinha(item.origem || item.origemModulo || item.usuario),
          normalizarLinha(item.status),
          formatarDataHoraExportacao(item.data || item.criadoEm || item.registradoEm)
        ])
      };
    }

    if (modulo === "auditoria") {
      return {
        titulo: "Auditoria",
        colunas: ["Módulo", "Ação", "Usuário", "Data", "Detalhes"],
        linhas: lista.map((item) => [
          normalizarLinha(item.modulo),
          normalizarLinha(item.acao),
          normalizarLinha(item.usuario || item.usuarioNome || item.criadoPor),
          formatarDataHoraExportacao(item.data || item.criadoEm || item.registradoEm),
          normalizarLinha(item.detalhes || item.descricao)
        ])
      };
    }

    return {
      titulo: "Dados",
      colunas: ["Nome", "Status", "Data"],
      linhas: lista.map((item) => [
        normalizarLinha(item.nome || item.titulo || item.descricao),
        normalizarLinha(item.status),
        formatarDataHoraExportacao(item.data || item.criadoEm)
      ])
    };
  }

  function contarPorCampo(lista, campo, limite = 5) {
    const mapa = {};

    lista.forEach((item) => {
      const chave = item[campo] || "Não informado";
      mapa[chave] = (mapa[chave] || 0) + 1;
    });

    return Object.entries(mapa)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limite)
      .map(([nome, total]) => [nome, total]);
  }

  function contarAreasReservadas(reservas, limite = 5) {
    const mapa = {};

    reservas.forEach((item) => {
      const chave = item.area || item.areaComum || "Não informado";
      mapa[chave] = (mapa[chave] || 0) + 1;
    });

    return Object.entries(mapa)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limite)
      .map(([nome, total]) => [nome, total]);
  }

  function gerarPreview() {
    const moradores = dados.moradores || [];
    const visitantes = filtrarPeriodo(dados.visitantes || []);
    const encomendas = filtrarPeriodo(dados.encomendas || []);
    const reservas = filtrarPeriodo(dados.reservas || []);
    const ocorrencias = filtrarPeriodo(dados.ocorrencias || []);
    const prestadores = filtrarPeriodo(dados.prestadores || []);
    const avisos = filtrarPeriodo(dados.avisos || []);
    const sugestoes = filtrarPeriodo(dados.sugestoes || []);
    const movimentacoes = filtrarPeriodo(dados.movimentacoes || []);
    const auditoria = filtrarPeriodo(dados.auditoria || []);
    const areas = dados.areasComuns || [];

    const moradoresAtivos = moradores.filter(
      (m) => m.status !== "Inativo" && m.status !== "Bloqueado"
    );

    const apartamentosOcupados = (dados.apartamentos || []).filter(
      (a) => a.status === "Ocupado" || a.morador || a.moradoresNomes?.length > 0
    );

    const reservasAprovadas = reservas.filter((r) => r.status === "aprovada");
    const reservasPendentes = reservas.filter((r) => r.status === "pendente");

    const ocorrenciasAbertas = ocorrencias.filter(
      (o) => o.status !== "Resolvido" && o.status !== "Resolvida"
    );

    const ocorrenciasResolvidas = ocorrencias.filter(
      (o) => o.status === "Resolvido" || o.status === "Resolvida"
    );

    const visitantesLiberados = visitantes.filter(
      (v) => v.status === "Autorizado" || v.status === "Em Visita"
    );

    const encomendasPendentes = encomendas.filter(
      (e) => e.status === "Recebido" || e.status === "Atrasado"
    );

    if (tipoRelatorio === "executivo") {
      return {
        titulo: "Relatório Executivo Condominial",
        descricao:
          "Documento administrativo com visão geral dos principais módulos do condomínio.",
        resumo: [
          `Total de moradores cadastrados: ${moradores.length}`,
          `Moradores ativos: ${moradoresAtivos.length}`,
          `Apartamentos ocupados: ${apartamentosOcupados.length}`,
          `Visitantes liberados/no condomínio: ${visitantesLiberados.length}`,
          `Encomendas pendentes: ${encomendasPendentes.length}`,
          `Reservas aprovadas: ${reservasAprovadas.length}`,
          `Reservas pendentes: ${reservasPendentes.length}`,
          `Ocorrências abertas: ${ocorrenciasAbertas.length}`,
          `Ocorrências resolvidas: ${ocorrenciasResolvidas.length}`,
          `Sugestões/Reclamações no período: ${sugestoes.length}`,
          `Prestadores no período: ${prestadores.length}`,
          `Comunicações no período: ${avisos.length}`,
          `Auditorias no período: ${auditoria.length}`,
          `Movimentações operacionais no período: ${movimentacoes.length}`,
          `Áreas comuns cadastradas: ${areas.length}`
        ],
        tabelas: [
          {
            titulo: "Resumo Geral",
            colunas: ["Módulo", "Quantidade"],
            linhas: [
              ["Moradores", moradores.length],
              ["Moradores ativos", moradoresAtivos.length],
              ["Apartamentos ocupados", apartamentosOcupados.length],
              ["Visitantes liberados", visitantesLiberados.length],
              ["Encomendas pendentes", encomendasPendentes.length],
              ["Reservas aprovadas", reservasAprovadas.length],
              ["Reservas pendentes", reservasPendentes.length],
              ["Ocorrências abertas", ocorrenciasAbertas.length],
              ["Ocorrências resolvidas", ocorrenciasResolvidas.length],
              ["Sugestões/Reclamações", sugestoes.length],
              ["Prestadores", prestadores.length],
              ["Comunicação", avisos.length],
              ["Auditoria", auditoria.length],
              ["Operacional", movimentacoes.length],
              ["Áreas Comuns", areas.length]
            ]
          },
          {
            titulo: "Top 5 áreas mais reservadas",
            colunas: ["Área", "Reservas"],
            linhas: contarAreasReservadas(reservas)
          },
          {
            titulo: "Top 5 moradores com mais reservas",
            colunas: ["Morador", "Reservas"],
            linhas: contarPorCampo(reservas, "morador")
          },
          {
            titulo: "Ocorrências por categoria",
            colunas: ["Categoria", "Total"],
            linhas: contarPorCampo(ocorrencias, "categoria")
          },
          {
            titulo: "Movimentações por tipo",
            colunas: ["Tipo", "Total"],
            linhas: contarPorCampo(movimentacoes, "tipo")
          }
        ]
      };
    }

    if (tipoRelatorio === "personalizado") {
      const tabelas = [];

      if (relatorioPersonalizado.incluirMoradores) {
        tabelas.push(montarTabelaModulo("moradores"));
      }

      if (relatorioPersonalizado.incluirVisitantes) {
        tabelas.push(montarTabelaModulo("visitantes"));
      }

      if (relatorioPersonalizado.incluirEncomendas) {
        tabelas.push(montarTabelaModulo("encomendas"));
      }

      if (relatorioPersonalizado.incluirReservas) {
        tabelas.push(montarTabelaModulo("reservas"));
      }

      if (relatorioPersonalizado.incluirOcorrencias) {
        tabelas.push(montarTabelaModulo("ocorrencias"));
      }

      if (relatorioPersonalizado.incluirPrestadores) {
        tabelas.push(montarTabelaModulo("prestadores"));
      }

      if (relatorioPersonalizado.incluirAvisos) {
        tabelas.push(montarTabelaModulo("comunicacao"));
      }

      if (relatorioPersonalizado.incluirAreas) {
        tabelas.push(montarTabelaModulo("areas"));
      }

      if (relatorioPersonalizado.incluirOperacional) {
        tabelas.push(montarTabelaModulo("operacional"));
      }

      if (relatorioPersonalizado.incluirAuditoria) {
        tabelas.push(montarTabelaModulo("auditoria"));
      }

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
    const usuarioAtual = obterUsuarioAtual();
    const perfilCondominio = obterPerfilCondominio();

    const novo = {
      id: Date.now(),
      tipo,
      relatorio: preview.titulo,
      periodo: nomePeriodo(),
      data: new Date().toLocaleString("pt-BR"),
      usuario: usuarioAtual.nome || usuarioAtual.usuario || "Síndico",
      perfil: usuarioAtual.perfil || usuarioAtual.perfilAdmin || "sindico",
      usuarioId: usuarioAtual.id || null,
      geradoPor: usuarioAtual.nome || usuarioAtual.usuario || "Síndico",
      condominioId: perfilCondominio.condominioId,
      nomeCondominio: perfilCondominio.nomeCondominio,
      createdAt: new Date().toISOString()
    };

    const atualizado = [novo, ...historico].slice(0, 50);

    setHistorico(atualizado);

    localStorage.setItem(STORAGE_KEYS.historico, JSON.stringify(atualizado));
  }

  function gerarPDF() {
    const doc = new jsPDF();
    const dataGeracao = new Date().toLocaleString("pt-BR");
    const perfilCondominio = obterPerfilCondominio();

    doc.setFillColor(22, 163, 74);
    doc.rect(0, 0, 210, 38, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("InfinityCondo", 14, 17);

    doc.setFontSize(10);
    doc.text(perfilCondominio.nomeCondominio || "Central de Relatórios Condominiais", 14, 27);

    doc.setTextColor(20, 83, 45);
    doc.setFontSize(15);
    doc.text(preview.titulo, 14, 50);

    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    doc.text(`Período: ${nomePeriodo()}`, 14, 58);
    doc.text(`Gerado em: ${dataGeracao}`, 14, 65);
    doc.text(`Condomínio: ${perfilCondominio.nomeCondominio}`, 14, 72);

    autoTable(doc, {
      startY: 82,
      head: [["Resumo"]],
      body: preview.resumo.map((item) => [item]),
      headStyles: {
        fillColor: [22, 163, 74]
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      }
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
            ? tabela.linhas
            : [["Sem registros"]],
        headStyles: {
          fillColor: [20, 83, 45]
        },
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
    doc.text("Relatório gerado automaticamente pelo InfinityCondo.", 14, 287);

    salvarHistorico("PDF");
    registrarAuditoriaRelatorio("Gerou PDF", `${preview.titulo} • ${nomePeriodo()}`);
    criarNotificacaoRelatorio("PDF");

    doc.save(criarNomeArquivo("pdf"));
  }

  function exportarExcel() {
    const workbook = XLSX.utils.book_new();
    const perfilCondominio = obterPerfilCondominio();
    const nomesUsados = new Set();

    function limparNomeAba(nome, indice) {
      const base = String(nome || `Relatorio ${indice + 1}`)
        .replace(/[\\/?*\[\]:]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 31) || `Relatorio ${indice + 1}`;

      let nomeFinal = base;
      let contador = 2;

      while (nomesUsados.has(nomeFinal.toLowerCase())) {
        const sufixo = ` ${contador}`;
        nomeFinal = `${base.slice(0, 31 - sufixo.length)}${sufixo}`;
        contador += 1;
      }

      nomesUsados.add(nomeFinal.toLowerCase());
      return nomeFinal;
    }

    function ajustarLarguras(worksheet, linhas) {
      const maiorQuantidadeColunas = linhas.reduce(
        (maior, linha) => Math.max(maior, linha.length),
        0
      );

      worksheet["!cols"] = Array.from(
        { length: maiorQuantidadeColunas },
        (_, indiceColuna) => {
          const maiorTexto = linhas.reduce((maior, linha) => {
            const tamanho = String(linha[indiceColuna] ?? "").length;
            return Math.max(maior, tamanho);
          }, 10);

          return { wch: Math.min(Math.max(maiorTexto + 2, 12), 45) };
        }
      );
    }

    const linhasResumo = [
      ["Relatório", preview.titulo],
      ["Período", nomePeriodo()],
      ["Gerado em", new Date().toLocaleString("pt-BR")],
      ["Condomínio", perfilCondominio.nomeCondominio],
      ["CNPJ", perfilCondominio.cnpj || "-"],
      ["Endereço", perfilCondominio.endereco || "-"],
      [],
      ["Resumo"],
      ...preview.resumo.map((item) => [item])
    ];

    const resumoSheet = XLSX.utils.aoa_to_sheet(linhasResumo);
    ajustarLarguras(resumoSheet, linhasResumo);
    XLSX.utils.book_append_sheet(workbook, resumoSheet, "Resumo");
    nomesUsados.add("resumo");

    preview.tabelas.forEach((tabela, indice) => {
      const linhasTabela = [
        [tabela.titulo],
        [],
        tabela.colunas,
        ...(tabela.linhas.length > 0
          ? tabela.linhas.map((linha) =>
              tabela.colunas.map((_, coluna) =>
                normalizarLinha(linha[coluna])
              )
            )
          : [tabela.colunas.map((_, coluna) =>
              coluna === 0 ? "Sem registros" : ""
            )])
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(linhasTabela);
      ajustarLarguras(worksheet, linhasTabela);
      worksheet["!autofilter"] = {
        ref: `A3:${XLSX.utils.encode_col(
          Math.max(tabela.colunas.length - 1, 0)
        )}3`
      };

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        limparNomeAba(tabela.titulo, indice)
      );
    });

    XLSX.writeFile(workbook, criarNomeArquivo("xlsx"), {
      compression: true
    });

    salvarHistorico("Excel");
    registrarAuditoriaRelatorio(
      "Gerou Excel",
      `${preview.titulo} • ${nomePeriodo()}`
    );
    criarNotificacaoRelatorio("Excel");
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

          <h1 style={styles.title}>Relatórios InfinityCondo</h1>

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

              <CheckOption
                label="Operacional"
                checked={relatorioPersonalizado.incluirOperacional}
                onChange={(valor) =>
                  atualizarPersonalizado("incluirOperacional", valor)
                }
              />

              <CheckOption
                label="Auditoria"
                checked={relatorioPersonalizado.incluirAuditoria}
                onChange={(valor) =>
                  atualizarPersonalizado("incluirAuditoria", valor)
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

            <button style={styles.secondaryButton} onClick={exportarExcel}>
              Excel
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

            <div style={styles.previewSeal}>InfinityCondo</div>
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
              <p key={`${item}-${index}`}>• {item}</p>
            ))}
          </section>

          {preview.tabelas.map((tabela, tabelaIndex) => (
            <section key={`${tabela.titulo}-${tabelaIndex}`} style={styles.tableBox}>
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
                  O PDF/Excel inclui mais registros.
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
                <small>{item.geradoPor || item.usuario || "Síndico"}</small>
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
    background: "linear-gradient(135deg,#ffffff,#faf5ff)",
    borderRadius: "28px",
    padding: "34px",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: "28px",
    alignItems: "center",
    boxShadow: "0 18px 45px rgba(88,28,135,0.09)",
    marginBottom: "24px",
    border: "1px solid #f3e8ff"
  },

  heroBadge: {
    display: "inline-block",
    background: "#f3e8ff",
    border: "1px solid #ddd6fe",
    color: "#7c3aed",
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
    maxWidth: "100%",
    background: "#ffffff",
    border: "1px solid #ddd6fe",
    padding: "16px",
    borderRadius: "18px"
  },

  heroStatGreen: {
    minWidth: "160px",
    maxWidth: "100%",
    background: "#ecfdf5",
    border: "1px solid #ddd6fe",
    color: "#7c3aed",
    padding: "16px",
    borderRadius: "18px"
  },

  layoutGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(320px,100%),1fr))",
    gap: "22px",
    alignItems: "flex-start",
    marginBottom: "24px"
  },

  configPanel: {
    background: "#ffffff",
    border: "1px solid #ddd6fe",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 16px 40px rgba(88,28,135,0.08)"
  },

  previewPanel: {
    background: "#ffffff",
    color: "#111827",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 16px 40px rgba(88,28,135,0.08)",
    border: "1px solid #ddd6fe"
  },

  panelHeader: {
    marginBottom: "20px"
  },

  panelBadge: {
    display: "inline-block",
    background: "#ecfdf5",
    color: "#7c3aed",
    border: "1px solid #ddd6fe",
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
    border: "1px solid #ddd6fe",
    borderRadius: "16px",
    padding: "13px",
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    textAlign: "left",
    cursor: "pointer"
  },

  reportButtonActive: {
    background: "#ecfdf5",
    color: "#7c3aed",
    border: "1px solid #a855f7",
    boxShadow: "0 0 0 3px rgba(34,197,94,0.12)"
  },

  reportIcon: {
    fontSize: "22px"
  },

  select: {
    width: "100%",
    background: "#ffffff",
    color: "#111827",
    border: "1px solid #c4b5fd",
    borderRadius: "14px",
    padding: "13px",
    outline: "none"
  },

  input: {
    width: "100%",
    background: "#ffffff",
    color: "#111827",
    border: "1px solid #c4b5fd",
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
    border: "1px solid #c4b5fd",
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
    background: "#fbfaff",
    border: "1px solid #ddd6fe"
  },

  checkOption: {
    display: "flex",
    flexWrap: "wrap",
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
    background: "#8b5cf6",
    color: "white",
    border: "none",
    padding: "13px 16px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "900"
  },

  secondaryButton: {
    background: "#f5f3ff",
    color: "#111827",
    border: "1px solid #c4b5fd",
    padding: "13px 16px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "900"
  },

  previewHeader: {
    display: "flex",
    flexWrap: "wrap",
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
    background: "#8b5cf6",
    whiteSpace: "nowrap",
    color: "white",
    padding: "14px 18px",
    borderRadius: "16px",
    fontWeight: "900"
  },

  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(180px,100%),1fr))",
    gap: "12px",
    marginBottom: "18px"
  },

  summaryBox: {
    background: "#faf5ff",
    border: "1px solid #ddd6fe",
    color: "#5b21b6",
    borderRadius: "18px",
    padding: "18px",
    marginBottom: "18px"
  },

  tableBox: {
    marginBottom: "22px"
  },

  tableWrapper: {
    overflowX: "auto",
    border: "1px solid #ddd6fe",
    borderRadius: "16px"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px"
  },

  th: {
    background: "#f5f3ff",
    color: "#374151",
    padding: "12px",
    textAlign: "left",
    borderBottom: "1px solid #ddd6fe"
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
    border: "1px solid #ddd6fe",
    borderRadius: "24px",
    padding: "24px",
    marginBottom: "20px",
    boxShadow: "0 16px 40px rgba(88,28,135,0.08)"
  },

  empty: {
    color: "#64748b",
    background: "#fbfaff",
    padding: "20px",
    borderRadius: "16px"
  },

  historyList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(230px,100%),1fr))",
    gap: "12px"
  },

  historyItem: {
    background: "#fbfaff",
    border: "1px solid #ddd6fe",
    borderRadius: "16px",
    padding: "14px",
    display: "grid",
    gap: "4px"
  }
};

export default Relatorios;