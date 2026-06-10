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

function obterDataRegistro(item) {
  const possiveisDatas = [
    item.data,
    item.dataEntrada,
    item.dataSaida,
    item.criadoEm,
    item.createdAt,
    item.dataCadastro,
    item.recebidoEm,
    item.retiradoEm,
    item.registradoEm,
    item.dataReserva,
    item.canceladaEm
  ];

  const encontrada = possiveisDatas.find(Boolean);

  if (!encontrada) return null;

  if (String(encontrada).includes("/")) {
    const partes = String(encontrada).split(/[\/,\s:]+/);

    if (partes.length >= 3) {
      const dia = partes[0];
      const mes = partes[1];
      const ano = partes[2];

      return new Date(`${ano}-${mes}-${dia}`);
    }
  }

  const data = new Date(encontrada);

  if (isNaN(data.getTime())) return null;

  return data;
}

function obterIntervalo(periodo = "geral", anterior = false) {
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);

  const inicio = new Date();

  if (periodo === "hoje") {
    inicio.setHours(0, 0, 0, 0);

    if (anterior) {
      inicio.setDate(inicio.getDate() - 1);

      const fimAnterior = new Date(inicio);
      fimAnterior.setHours(23, 59, 59, 999);

      return { inicio, fim: fimAnterior };
    }
  }

  if (periodo === "7dias") {
    inicio.setDate(inicio.getDate() - 7);
    inicio.setHours(0, 0, 0, 0);

    if (anterior) {
      const fimAnterior = new Date(inicio);
      fimAnterior.setDate(fimAnterior.getDate() - 1);
      fimAnterior.setHours(23, 59, 59, 999);

      const inicioAnterior = new Date(fimAnterior);
      inicioAnterior.setDate(inicioAnterior.getDate() - 7);
      inicioAnterior.setHours(0, 0, 0, 0);

      return { inicio: inicioAnterior, fim: fimAnterior };
    }
  }

  if (periodo === "30dias") {
    inicio.setDate(inicio.getDate() - 30);
    inicio.setHours(0, 0, 0, 0);

    if (anterior) {
      const fimAnterior = new Date(inicio);
      fimAnterior.setDate(fimAnterior.getDate() - 1);
      fimAnterior.setHours(23, 59, 59, 999);

      const inicioAnterior = new Date(fimAnterior);
      inicioAnterior.setDate(inicioAnterior.getDate() - 30);
      inicioAnterior.setHours(0, 0, 0, 0);

      return { inicio: inicioAnterior, fim: fimAnterior };
    }
  }

  if (periodo === "mes") {
    inicio.setDate(1);
    inicio.setHours(0, 0, 0, 0);

    if (anterior) {
      const inicioAnterior = new Date(inicio);
      inicioAnterior.setMonth(inicioAnterior.getMonth() - 1);

      const fimAnterior = new Date(inicio);
      fimAnterior.setDate(0);
      fimAnterior.setHours(23, 59, 59, 999);

      return { inicio: inicioAnterior, fim: fimAnterior };
    }
  }

  if (periodo === "ano") {
    inicio.setMonth(0);
    inicio.setDate(1);
    inicio.setHours(0, 0, 0, 0);

    if (anterior) {
      const inicioAnterior = new Date(inicio);
      inicioAnterior.setFullYear(inicioAnterior.getFullYear() - 1);

      const fimAnterior = new Date(inicio);
      fimAnterior.setDate(0);
      fimAnterior.setHours(23, 59, 59, 999);

      return { inicio: inicioAnterior, fim: fimAnterior };
    }
  }

  return { inicio, fim };
}

function filtrarPorIntervalo(lista, inicio, fim) {
  return lista.filter((item) => {
    const data = obterDataRegistro(item);
    if (!data) return false;
    return data >= inicio && data <= fim;
  });
}

function filtrarPorPeriodo(lista, periodo = "geral", anterior = false) {
  if (periodo === "geral") return lista;

  const { inicio, fim } = obterIntervalo(periodo, anterior);

  return filtrarPorIntervalo(lista, inicio, fim);
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
    .map(([nome, total]) => ({
      nome,
      total
    }));
}

function calcularVariacao(atual, anterior) {
  if (anterior === 0 && atual === 0) {
    return {
      percentual: 0,
      texto: "Estável",
      direcao: "estavel"
    };
  }

  if (anterior === 0 && atual > 0) {
    return {
      percentual: 100,
      texto: "+100%",
      direcao: "subiu"
    };
  }

  const percentual = Number(
    (((atual - anterior) / anterior) * 100).toFixed(1)
  );

  return {
    percentual,
    texto: `${percentual > 0 ? "+" : ""}${percentual}%`,
    direcao:
      percentual > 0
        ? "subiu"
        : percentual < 0
        ? "caiu"
        : "estavel"
  };
}

export function buscarDadosBI(periodo = "geral", anterior = false) {
  const dados = {
    moradores: lerStorage("moradores"),
    apartamentos: lerStorage("apartamentos"),
    porteiros: lerStorage("porteiros"),

    visitantes: [
      ...lerStorage("visitantes"),
      ...lerStorage("visitantes_historico")
    ],

    encomendas: [
      ...lerStorage("encomendas"),
      ...lerStorage("encomendas_historico"),
      ...lerStorage("encomendas_esperadas")
    ],

    reservas: lerStorage("reservas"),

    prestadores: [
      ...lerStorage("condominio_prestadores"),
      ...lerStorage("prestadores_particulares_v2")
    ],

    areasComuns: lerStorage("areasComuns"),

    avisos: [
      ...lerStorage("avisos"),
      ...lerStorage("avisos_sindico")
    ],

    notificacoesMorador: lerStorage("notificacoesMorador"),

    notificacoes: lerStorage("notificacoes"),

    auditoria: [
      ...lerStorage("auditoria_logs"),
      ...lerStorage("auditoriaSistema")
    ],

    ocorrencias: [
      ...lerStorage("ocorrencias"),
      ...lerStorage("historico_ocorrencias"),
      ...lerStorage("livro_ocorrencias")
    ],

    sugestoes: [
      ...lerStorage("sugestoesMorador"),
      ...lerStorage("sugestoes_reclamacoes")
    ],

    operacional: [
      ...lerStorage("operacional_condominio_v2"),
      ...lerStorage("relatorios_operacionais"),
      ...lerStorage("movimentacoes")
    ]
  };

  return {
    moradores: dados.moradores,
    apartamentos: dados.apartamentos,
    areasComuns: dados.areasComuns,
    porteiros: dados.porteiros,

    visitantes: filtrarPorPeriodo(dados.visitantes, periodo, anterior),
    encomendas: filtrarPorPeriodo(dados.encomendas, periodo, anterior),
    reservas: filtrarPorPeriodo(dados.reservas, periodo, anterior),
    prestadores: filtrarPorPeriodo(dados.prestadores, periodo, anterior),
    avisos: filtrarPorPeriodo(dados.avisos, periodo, anterior),
    notificacoesMorador: filtrarPorPeriodo(
      dados.notificacoesMorador,
      periodo,
      anterior
    ),

    notificacoes: filtrarPorPeriodo(
      dados.notificacoes,
      periodo,
      anterior
    ),

    auditoria: filtrarPorPeriodo(
      dados.auditoria,
      periodo,
      anterior
    ),
    ocorrencias: filtrarPorPeriodo(dados.ocorrencias, periodo, anterior),
    sugestoes: filtrarPorPeriodo(dados.sugestoes, periodo, anterior),
    operacional: filtrarPorPeriodo(dados.operacional, periodo, anterior)
  };
}

export function gerarIndicadoresBI(periodo = "geral", anterior = false) {
  const dados = buscarDadosBI(periodo, anterior);

  const moradoresPrincipais = dados.moradores.filter((m) => m.moradorPrincipal).length;
  const dependentes = dados.moradores.filter((m) => !m.moradorPrincipal).length;

  const apartamentosOcupados = dados.apartamentos.filter((a) => {
    const status = normalizarTexto(a.status);

    return (
      status === "ocupado" ||
      a.morador ||
      a.moradoresNomes?.length > 0 ||
      a.moradoresIds?.length > 0
    );
  }).length;

  const areasDisponiveis = dados.areasComuns.filter((area) => {
    const status = normalizarTexto(area.status);
    return status === "disponível" || status === "disponivel" || !status;
  }).length;

  const areasManutencao = dados.areasComuns.filter((area) => {
    const status = normalizarTexto(area.status);
    return status === "manutenção" || status === "manutencao";
  }).length;

  const prestadoresCondominio = dados.prestadores.filter(
    (p) => normalizarTexto(p.tipoServico || p.tipo) === "condomínio" ||
      normalizarTexto(p.tipoServico || p.tipo) === "condominio"
  ).length;

  const prestadoresParticulares = dados.prestadores.filter(
    (p) => normalizarTexto(p.tipoServico || p.tipo) === "particular"
  ).length;

  const prestadoresExecucao = dados.prestadores.filter((p) => {
    const status = normalizarTexto(p.status);
    return status === "em execução" || status === "em execucao";
  }).length;

  const prestadoresFinalizados = dados.prestadores.filter((p) => {
    const status = normalizarTexto(p.status);
    return status === "finalizado" || status === "finalizada";
  }).length;

  const visitantesAtivos = dados.visitantes.filter((v) => {
    const status = normalizarTexto(v.status || v.statusSindico);

    return (
      status === "dentro" ||
      status === "ativo" ||
      status === "entrada" ||
      status === "em visita" ||
      status === "autorizado"
    );
  }).length;

  const encomendasPendentes = dados.encomendas.filter((e) => {
    const status = normalizarTexto(e.status || e.statusSindico);

    return (
      status === "pendente" ||
      status === "recebido" ||
      status === "aguardando" ||
      status === "aguardando retirada" ||
      status === "esperada" ||
      status === "atrasado"
    );
  }).length;

  const reservasAtivas = dados.reservas.filter((r) => {
    const status = normalizarTexto(r.status);

    return (
      status === "aprovada" ||
      status === "ativa" ||
      status === "confirmada"
    );
  }).length;

  const reservasPendentes = dados.reservas.filter((r) => {
    const status = normalizarTexto(r.status);

    return status === "pendente" || status === "em análise" || status === "em analise";
  }).length;

  const ocorrenciasAbertas = dados.ocorrencias.filter((o) => {
    const status = normalizarTexto(o.status);

    return (
      status === "aberta" ||
      status === "pendente" ||
      status === "encaminhada" ||
      status === "em tratamento" ||
      status === "em análise" ||
      status === "em analise" ||
      status === "novo" ||
      status === "ciente"
    );
  }).length;

  const reclamacoes = dados.sugestoes.filter((s) => {
    const tipo = normalizarTexto(s.tipoRegistro || s.tipo || s.categoria);
    return tipo.includes("reclama");
  });

  const sugestoes = dados.sugestoes.filter((s) => {
    const tipo = normalizarTexto(s.tipoRegistro || s.tipo || s.categoria);
    return tipo.includes("sugest");
  });

  const reclamacoesAbertas = reclamacoes.filter((r) => {
    const status = normalizarTexto(r.status);
    return status !== "resolvido" && status !== "resolvida";
  }).length;

  const sugestoesAbertas = sugestoes.filter((s) => {
    const status = normalizarTexto(s.status);
    return status !== "resolvido" && status !== "resolvida";
  }).length;

  const sugestoesResolvidas = sugestoes.filter((s) => {
    const status = normalizarTexto(s.status);
    return status === "resolvido" || status === "resolvida";
  }).length;

  const pendenciasSindico = dados.avisos.filter((a) => {
    const status = normalizarTexto(a.status);

    return (
      status === "novo" ||
      status === "pendente" ||
      status === "encaminhada" ||
      status === "aguardando" ||
      status === "ciente" ||
      status === "em tratamento"
    );
  }).length;

  return {
    totalMoradores: dados.moradores.length,
    totalMoradoresPrincipais: moradoresPrincipais,
    totalDependentes: dependentes,

    totalApartamentos: dados.apartamentos.length,
    totalApartamentosOcupados: apartamentosOcupados,
    totalPorteiros: dados.porteiros.length,

    totalVisitantes: dados.visitantes.length,
    totalVisitantesAtivos: visitantesAtivos,

    totalEncomendas: dados.encomendas.length,
    totalPendentes: encomendasPendentes,

    totalReservas: dados.reservas.length,
    totalReservasAtivas: reservasAtivas,
    totalReservasPendentes: reservasPendentes,

    totalPrestadores: dados.prestadores.length,
    totalPrestadoresCondominio: prestadoresCondominio,
    totalPrestadoresParticulares: prestadoresParticulares,
    totalPrestadoresExecucao: prestadoresExecucao,
    totalPrestadoresFinalizados: prestadoresFinalizados,

    totalAreas: dados.areasComuns.length,
    totalAreasDisponiveis: areasDisponiveis,
    totalAreasManutencao: areasManutencao,

    totalAvisos: dados.avisos.length,
    totalAvisosSindico: dados.avisos.length,
    totalPendenciasSindico: pendenciasSindico,

    totalNotificacoesMorador: dados.notificacoesMorador.length,
    totalNotificacoesSistema: dados.notificacoes.length,
    totalAuditorias: dados.auditoria.length,

    totalOcorrencias: dados.ocorrencias.length,
    totalOcorrenciasAbertas: ocorrenciasAbertas,

    totalSugestoes: sugestoes.length,
    totalSugestoesAbertas: sugestoesAbertas,
    totalSugestoesResolvidas: sugestoesResolvidas,

    totalReclamacoes: reclamacoes.length,
    totalReclamacoesAbertas: reclamacoesAbertas,

    totalOperacional: dados.operacional.length
  };
}

export function calcularSaudeCondominio(periodo = "geral") {
  const indicadores = gerarIndicadoresBI(periodo);

  let pontuacao = 100;

  pontuacao -= indicadores.totalPendentes * 2;
  pontuacao -= indicadores.totalReservasPendentes * 2;
  pontuacao -= indicadores.totalOcorrenciasAbertas * 5;
  pontuacao -= indicadores.totalReclamacoesAbertas * 4;
  pontuacao -= indicadores.totalSugestoesAbertas * 1;
  pontuacao -= indicadores.totalPendenciasSindico * 1;
  pontuacao -= indicadores.totalVisitantesAtivos * 1;

  if (pontuacao < 0) pontuacao = 0;

  if (pontuacao >= 80) {
    return {
      status: "Excelente",
      descricao: "Operação estável e sem sinais críticos.",
      pontuacao,
      cor: "#7cff4a"
    };
  }

  if (pontuacao >= 50) {
    return {
      status: "Atenção",
      descricao: "Existem pendências que merecem acompanhamento.",
      pontuacao,
      cor: "#facc15"
    };
  }

  return {
    status: "Crítico",
    descricao: "Muitas pendências ou ocorrências abertas.",
    pontuacao,
    cor: "#ef4444"
  };
}

export function gerarDistribuicaoGeral(periodo = "geral") {
  const indicadores = gerarIndicadoresBI(periodo);

  return [
    { nome: "Moradores", total: indicadores.totalMoradores },
    { nome: "Principais", total: indicadores.totalMoradoresPrincipais },
    { nome: "Dependentes", total: indicadores.totalDependentes },
    { nome: "Apartamentos", total: indicadores.totalApartamentos },
    { nome: "Aptos ocupados", total: indicadores.totalApartamentosOcupados },
    { nome: "Porteiros", total: indicadores.totalPorteiros },
    { nome: "Visitantes", total: indicadores.totalVisitantes },
    { nome: "Encomendas", total: indicadores.totalEncomendas },
    { nome: "Reservas", total: indicadores.totalReservas },
    { nome: "Prestadores", total: indicadores.totalPrestadores },
    { nome: "Áreas comuns", total: indicadores.totalAreas },
    { nome: "Auditoria", total: indicadores.totalAuditorias },
    { nome: "Ocorrências", total: indicadores.totalOcorrencias },
    { nome: "Sugestões", total: indicadores.totalSugestoes },
    { nome: "Reclamações", total: indicadores.totalReclamacoes },
    { nome: "Avisos", total: indicadores.totalAvisosSindico },
    { nome: "Operacional", total: indicadores.totalOperacional }
  ];
}

export function gerarIndicadoresCriticos(periodo = "geral") {
  const indicadores = gerarIndicadoresBI(periodo);

  return [
    { nome: "Visitantes ativos", total: indicadores.totalVisitantesAtivos },
    { nome: "Encomendas pendentes", total: indicadores.totalPendentes },
    { nome: "Reservas pendentes", total: indicadores.totalReservasPendentes },
    { nome: "Ocorrências abertas", total: indicadores.totalOcorrenciasAbertas },
    { nome: "Reclamações abertas", total: indicadores.totalReclamacoesAbertas },
    { nome: "Sugestões abertas", total: indicadores.totalSugestoesAbertas },
    { nome: "Pendências do síndico", total: indicadores.totalPendenciasSindico },
    { nome: "Áreas em manutenção", total: indicadores.totalAreasManutencao },
    { nome: "Prestadores em execução", total: indicadores.totalPrestadoresExecucao }
  ];
}

export function gerarRankingsPremiumBI(periodo = "geral") {
  const dados = buscarDadosBI(periodo);

  return {
    areasMaisReservadas: contarPorCampo(dados.reservas, "area"),
    moradoresComMaisReservas: contarPorCampo(dados.reservas, "moradorNome"),
    apartamentosComMaisVisitantes: contarPorCampo(dados.visitantes, "apartamento"),
    prestadoresMaisUtilizados: contarPorCampo(dados.prestadores, "servico"),
    ocorrenciasPorCategoria: contarPorCampo(dados.ocorrencias, "categoria"),
    auditoriaPorModulo: contarPorCampo(dados.auditoria, "modulo")
  };
}

export function gerarRankingModulos(periodo = "geral") {
  return gerarDistribuicaoGeral(periodo)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
}

export function gerarComparativosBI(periodo = "geral") {
  if (periodo === "geral") {
    return {
      visitantes: { atual: 0, anterior: 0, variacao: calcularVariacao(0, 0) },
      encomendas: { atual: 0, anterior: 0, variacao: calcularVariacao(0, 0) },
      reservas: { atual: 0, anterior: 0, variacao: calcularVariacao(0, 0) },
      ocorrencias: { atual: 0, anterior: 0, variacao: calcularVariacao(0, 0) },
      sugestoes: { atual: 0, anterior: 0, variacao: calcularVariacao(0, 0) },
      reclamacoes: { atual: 0, anterior: 0, variacao: calcularVariacao(0, 0) }
    };
  }

  const atual = gerarIndicadoresBI(periodo, false);
  const anterior = gerarIndicadoresBI(periodo, true);

  return {
    visitantes: {
      atual: atual.totalVisitantes,
      anterior: anterior.totalVisitantes,
      variacao: calcularVariacao(atual.totalVisitantes, anterior.totalVisitantes)
    },

    encomendas: {
      atual: atual.totalEncomendas,
      anterior: anterior.totalEncomendas,
      variacao: calcularVariacao(atual.totalEncomendas, anterior.totalEncomendas)
    },

    reservas: {
      atual: atual.totalReservas,
      anterior: anterior.totalReservas,
      variacao: calcularVariacao(atual.totalReservas, anterior.totalReservas)
    },

    ocorrencias: {
      atual: atual.totalOcorrencias,
      anterior: anterior.totalOcorrencias,
      variacao: calcularVariacao(atual.totalOcorrencias, anterior.totalOcorrencias)
    },

    sugestoes: {
      atual: atual.totalSugestoes,
      anterior: anterior.totalSugestoes,
      variacao: calcularVariacao(atual.totalSugestoes, anterior.totalSugestoes)
    },

    reclamacoes: {
      atual: atual.totalReclamacoes,
      anterior: anterior.totalReclamacoes,
      variacao: calcularVariacao(
        atual.totalReclamacoes,
        anterior.totalReclamacoes
      )
    }
  };
}

export function gerarDadosComparativoGrafico(periodo = "geral") {
  const comparativos = gerarComparativosBI(periodo);

  return [
    {
      nome: "Visitantes",
      atual: comparativos.visitantes.atual,
      anterior: comparativos.visitantes.anterior
    },
    {
      nome: "Encomendas",
      atual: comparativos.encomendas.atual,
      anterior: comparativos.encomendas.anterior
    },
    {
      nome: "Reservas",
      atual: comparativos.reservas.atual,
      anterior: comparativos.reservas.anterior
    },
    {
      nome: "Ocorrências",
      atual: comparativos.ocorrencias.atual,
      anterior: comparativos.ocorrencias.anterior
    },
    {
      nome: "Sugestões",
      atual: comparativos.sugestoes.atual,
      anterior: comparativos.sugestoes.anterior
    },
    {
      nome: "Reclamações",
      atual: comparativos.reclamacoes.atual,
      anterior: comparativos.reclamacoes.anterior
    }
  ];
}

export function gerarResumoExecutivoBI(periodo = "geral") {
  const indicadores = gerarIndicadoresBI(periodo);
  const comparativos = gerarComparativosBI(periodo);
  const saude = calcularSaudeCondominio(periodo);

  const mensagens = [];

  if (periodo === "geral") {
    mensagens.push("A visão geral mostra o acumulado completo do condomínio.");
  } else {
    const variacoes = [
      comparativos.visitantes.variacao,
      comparativos.encomendas.variacao,
      comparativos.reservas.variacao,
      comparativos.ocorrencias.variacao,
      comparativos.sugestoes.variacao,
      comparativos.reclamacoes.variacao
    ];

    const subidas = variacoes.filter((v) => v.direcao === "subiu").length;
    const quedas = variacoes.filter((v) => v.direcao === "caiu").length;

    if (subidas > quedas) {
      mensagens.push(
        "O período atual apresenta aumento operacional em relação ao período anterior."
      );
    } else if (quedas > subidas) {
      mensagens.push(
        "O período atual apresenta redução de movimentações em relação ao período anterior."
      );
    } else {
      mensagens.push(
        "O período atual está estável em comparação ao período anterior."
      );
    }
  }

  if (indicadores.totalPendentes > 0) {
    mensagens.push(
      `${indicadores.totalPendentes} encomenda(s) ainda aguardam retirada.`
    );
  }

  if (indicadores.totalReservasPendentes > 0) {
    mensagens.push(
      `${indicadores.totalReservasPendentes} reserva(s) aguardam análise.`
    );
  }

  if (indicadores.totalOcorrenciasAbertas > 0) {
    mensagens.push(
      `${indicadores.totalOcorrenciasAbertas} ocorrência(s) estão abertas e precisam de acompanhamento.`
    );
  }

  if (indicadores.totalReclamacoesAbertas > 0) {
    mensagens.push(
      `${indicadores.totalReclamacoesAbertas} reclamação(ões) precisam de atenção.`
    );
  }

  mensagens.push(
    `Saúde operacional atual: ${saude.status} (${saude.pontuacao}%).`
  );

  return mensagens;
}

export function gerarInsightsBI(periodo = "geral") {
  const indicadores = gerarIndicadoresBI(periodo);
  const saude = calcularSaudeCondominio(periodo);
  const comparativos = gerarComparativosBI(periodo);

  const insights = [];

  if (periodo !== "geral") {
    insights.push({
      tipo: "tendência",
      titulo: "Comparativo de visitantes",
      texto: `Visitantes: ${comparativos.visitantes.variacao.texto} em relação ao período anterior.`
    });

    insights.push({
      tipo: "tendência",
      titulo: "Comparativo de reservas",
      texto: `Reservas: ${comparativos.reservas.variacao.texto} em relação ao período anterior.`
    });

    insights.push({
      tipo: "tendência",
      titulo: "Sugestões e reclamações",
      texto: `Sugestões: ${comparativos.sugestoes.variacao.texto} | Reclamações: ${comparativos.reclamacoes.variacao.texto}.`
    });
  }

  if (indicadores.totalPendentes > 0) {
    insights.push({
      tipo: "atenção",
      titulo: "Encomendas pendentes",
      texto: `${indicadores.totalPendentes} encomenda(s) aguardando retirada.`
    });
  }

  if (indicadores.totalReservasPendentes > 0) {
    insights.push({
      tipo: "atenção",
      titulo: "Reservas pendentes",
      texto: `${indicadores.totalReservasPendentes} reserva(s) aguardam análise.`
    });
  }

  if (indicadores.totalOcorrenciasAbertas > 0) {
    insights.push({
      tipo: "crítico",
      titulo: "Ocorrências abertas",
      texto: `${indicadores.totalOcorrenciasAbertas} ocorrência(s) precisam de acompanhamento.`
    });
  }

  if (indicadores.totalReclamacoesAbertas > 0) {
    insights.push({
      tipo: "crítico",
      titulo: "Reclamações abertas",
      texto: `${indicadores.totalReclamacoesAbertas} reclamação(ões) precisam de atenção.`
    });
  }

  if (indicadores.totalSugestoesAbertas > 0) {
    insights.push({
      tipo: "gestão",
      titulo: "Sugestões dos moradores",
      texto: `${indicadores.totalSugestoesAbertas} sugestão(ões) estão abertas para análise.`
    });
  }

  if (indicadores.totalReservasAtivas > 0) {
    insights.push({
      tipo: "positivo",
      titulo: "Reservas ativas",
      texto: `${indicadores.totalReservasAtivas} reserva(s) confirmadas no período.`
    });
  }

  if (indicadores.totalVisitantesAtivos > 0) {
    insights.push({
      tipo: "operação",
      titulo: "Visitantes ativos",
      texto: `${indicadores.totalVisitantesAtivos} visitante(s) constam como ativos.`
    });
  }

  if (insights.length === 0) {
    insights.push({
      tipo: "positivo",
      titulo: "Operação tranquila",
      texto: `Nenhuma pendência crítica encontrada. Saúde atual: ${saude.status}.`
    });
  }

  return insights;
}

export function buscarAtividadesRecentes(periodo = "geral") {
  const dados = buscarDadosBI(periodo);

  return {
    visitantes: dados.visitantes.slice(-4).reverse(),
    encomendas: dados.encomendas.slice(-4).reverse(),
    reservas: dados.reservas.slice(-4).reverse(),
    ocorrencias: dados.ocorrencias.slice(-4).reverse(),
    sugestoes: dados.sugestoes.slice(-4).reverse(),
    avisos: dados.avisos.slice(-4).reverse(),
    operacional: dados.operacional.slice(-4).reverse()
  };
}