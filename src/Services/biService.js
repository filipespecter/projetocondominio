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
    item.retiradaEm,
    item.dataRecebimento,
    item.dataRegistro,
    item.registradoEm,
    item.timestamp
  ];

  const encontrada = possiveisDatas.find(Boolean);

  if (!encontrada) return null;

  if (typeof encontrada === "number") {
    const dataTimestamp = new Date(encontrada);
    return isNaN(dataTimestamp.getTime()) ? null : dataTimestamp;
  }

  if (String(encontrada).includes("/")) {
    const partes = String(encontrada).split(/[\/,\s:]+/);

    if (partes.length >= 3) {
      const dia = partes[0];
      const mes = partes[1];
      const ano = partes[2];

      const dataBR = new Date(`${ano}-${mes}-${dia}`);

      if (!isNaN(dataBR.getTime())) {
        return dataBR;
      }
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

      return {
        inicio,
        fim: fimAnterior
      };
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

      return {
        inicio: inicioAnterior,
        fim: fimAnterior
      };
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

      return {
        inicio: inicioAnterior,
        fim: fimAnterior
      };
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

      return {
        inicio: inicioAnterior,
        fim: fimAnterior
      };
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

      return {
        inicio: inicioAnterior,
        fim: fimAnterior
      };
    }
  }

  return {
    inicio,
    fim
  };
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

function filtrarCentralPorCategoria(lista, categoria) {
  return lista.filter(
    (item) => normalizarTexto(item.categoria) === normalizarTexto(categoria)
  );
}

export function buscarDadosBI(periodo = "geral", anterior = false) {
  const avisosSindico = lerStorage("avisos_sindico");
  const sugestoesReclamacoes = lerStorage("sugestoes_reclamacoes");

  const dados = {
    moradores: lerStorage("moradores"),
    apartamentos: lerStorage("apartamentos"),
    visitantes: lerStorage("visitantes"),
    visitantesHistorico: lerStorage("visitantes_historico"),
    encomendas: lerStorage("encomendas"),
    encomendasHistorico: lerStorage("encomendas_historico"),
    reservas: lerStorage("reservas"),
    prestadores: [
      ...lerStorage("condominio_prestadores"),
      ...lerStorage("prestadores_particulares_v2")
    ],
    areasComuns: lerStorage("areasComuns"),
    avisos: lerStorage("avisos"),
    avisosSindico,
    notificacoesMorador: lerStorage("notificacoesMorador"),
    relatoriosOperacionais: lerStorage("relatorios_operacionais"),
    ocorrencias: lerStorage("ocorrencias"),
    sugestoesReclamacoes,
    sugestoes: [
      ...sugestoesReclamacoes.filter(
        (item) =>
          normalizarTexto(item.tipoRegistro) === "sugestão" ||
          normalizarTexto(item.tipoRegistro) === "sugestao" ||
          normalizarTexto(item.tipo) === "sugestão" ||
          normalizarTexto(item.tipo) === "sugestao"
      ),
      ...filtrarCentralPorCategoria(avisosSindico, "Sugestão")
    ],
    reclamacoes: [
      ...sugestoesReclamacoes.filter(
        (item) =>
          normalizarTexto(item.tipoRegistro) === "reclamação" ||
          normalizarTexto(item.tipoRegistro) === "reclamacao" ||
          normalizarTexto(item.tipo) === "reclamação" ||
          normalizarTexto(item.tipo) === "reclamacao"
      ),
      ...filtrarCentralPorCategoria(avisosSindico, "Reclamação")
    ],
    operacional: lerStorage("operacional_condominio_v2"),
    porteiros: lerStorage("porteiros")
  };

  return {
    moradores: dados.moradores,
    apartamentos: dados.apartamentos,
    areasComuns: dados.areasComuns,
    porteiros: dados.porteiros,

    visitantes: filtrarPorPeriodo(dados.visitantes, periodo, anterior),
    visitantesHistorico: filtrarPorPeriodo(
      dados.visitantesHistorico,
      periodo,
      anterior
    ),
    encomendas: filtrarPorPeriodo(dados.encomendas, periodo, anterior),
    encomendasHistorico: filtrarPorPeriodo(
      dados.encomendasHistorico,
      periodo,
      anterior
    ),
    reservas: filtrarPorPeriodo(dados.reservas, periodo, anterior),
    prestadores: filtrarPorPeriodo(dados.prestadores, periodo, anterior),
    avisos: filtrarPorPeriodo(dados.avisos, periodo, anterior),
    avisosSindico: filtrarPorPeriodo(dados.avisosSindico, periodo, anterior),
    notificacoesMorador: filtrarPorPeriodo(
      dados.notificacoesMorador,
      periodo,
      anterior
    ),
    relatoriosOperacionais: filtrarPorPeriodo(
      dados.relatoriosOperacionais,
      periodo,
      anterior
    ),
    ocorrencias: filtrarPorPeriodo(dados.ocorrencias, periodo, anterior),
    sugestoes: filtrarPorPeriodo(dados.sugestoes, periodo, anterior),
    reclamacoes: filtrarPorPeriodo(dados.reclamacoes, periodo, anterior),
    operacional: filtrarPorPeriodo(dados.operacional, periodo, anterior)
  };
}

export function gerarIndicadoresBI(periodo = "geral", anterior = false) {
  const dados = buscarDadosBI(periodo, anterior);

  const visitantesAtivos = dados.visitantes.filter((v) => {
    const status = normalizarTexto(v.status || v.statusSindico);

    return (
      status === "dentro" ||
      status === "ativo" ||
      status === "entrada" ||
      status === "entrou" ||
      status === "em visita"
    );
  }).length;

  const encomendasPendentes = dados.encomendas.filter((e) => {
    const status = normalizarTexto(e.status || e.statusSindico);

    return (
      status === "pendente" ||
      status === "recebido" ||
      status === "aguardando" ||
      status === "aguardando retirada"
    );
  }).length;

  const reservasAtivas = dados.reservas.filter((r) => {
    const status = normalizarTexto(r.status);

    return (
      status === "aprovada" ||
      status === "ativa" ||
      status === "confirmada" ||
      status === "pendente"
    );
  }).length;

  const ocorrenciasAbertas = dados.ocorrencias.filter((o) =>
    ehAberto(o.status)
  ).length;

  const ocorrenciasResolvidas = dados.ocorrencias.filter((o) =>
    ehResolvido(o.status)
  ).length;

  const sugestoesAbertas = dados.sugestoes.filter((s) =>
    ehAberto(s.status)
  ).length;

  const sugestoesResolvidas = dados.sugestoes.filter((s) =>
    ehResolvido(s.status)
  ).length;

  const reclamacoesAbertas = dados.reclamacoes.filter((r) =>
    ehAberto(r.status)
  ).length;

  const reclamacoesResolvidas = dados.reclamacoes.filter((r) =>
    ehResolvido(r.status)
  ).length;

  const pendenciasSindico = dados.avisosSindico.filter(
    (item) =>
      item.cienciaSindico === false ||
      ehAberto(item.status)
  ).length;

  return {
    totalMoradores: dados.moradores.length,
    totalApartamentos: dados.apartamentos.length,
    totalPorteiros: dados.porteiros.length,

    totalVisitantes: dados.visitantes.length,
    totalVisitantesAtivos: visitantesAtivos,
    totalVisitantesHistorico: dados.visitantesHistorico.length,

    totalEncomendas: dados.encomendas.length,
    totalPendentes: encomendasPendentes,
    totalEncomendasHistorico: dados.encomendasHistorico.length,

    totalReservas: dados.reservas.length,
    totalReservasAtivas: reservasAtivas,

    totalPrestadores: dados.prestadores.length,
    totalAreas: dados.areasComuns.length,

    totalAvisos: dados.avisos.length,
    totalAvisosSindico: dados.avisosSindico.length,
    totalPendenciasSindico: pendenciasSindico,
    totalNotificacoesMorador: dados.notificacoesMorador.length,

    totalOcorrencias: dados.ocorrencias.length,
    totalOcorrenciasAbertas: ocorrenciasAbertas,
    totalOcorrenciasResolvidas: ocorrenciasResolvidas,

    totalSugestoes: dados.sugestoes.length,
    totalSugestoesAbertas: sugestoesAbertas,
    totalSugestoesResolvidas: sugestoesResolvidas,

    totalReclamacoes: dados.reclamacoes.length,
    totalReclamacoesAbertas: reclamacoesAbertas,
    totalReclamacoesResolvidas: reclamacoesResolvidas,

    totalRelatoriosOperacionais: dados.relatoriosOperacionais.length,
    totalOperacional: dados.operacional.length
  };
}

export function calcularSaudeCondominio(periodo = "geral") {
  const indicadores = gerarIndicadoresBI(periodo);

  let pontuacao = 100;

  pontuacao -= indicadores.totalPendentes * 2;
  pontuacao -= indicadores.totalOcorrenciasAbertas * 5;
  pontuacao -= indicadores.totalReclamacoesAbertas * 4;
  pontuacao -= indicadores.totalSugestoesAbertas * 1;
  pontuacao -= indicadores.totalVisitantesAtivos * 1;
  pontuacao -= indicadores.totalPendenciasSindico * 1;

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
      descricao:
        "Existem pendências operacionais que merecem acompanhamento do síndico.",
      pontuacao,
      cor: "#facc15"
    };
  }

  return {
    status: "Crítico",
    descricao:
      "Muitas pendências, reclamações ou ocorrências abertas exigem ação imediata.",
    pontuacao,
    cor: "#ef4444"
  };
}

export function gerarDistribuicaoGeral(periodo = "geral") {
  const indicadores = gerarIndicadoresBI(periodo);

  return [
    { nome: "Moradores", total: indicadores.totalMoradores },
    { nome: "Apartamentos", total: indicadores.totalApartamentos },
    { nome: "Porteiros", total: indicadores.totalPorteiros },
    { nome: "Visitantes", total: indicadores.totalVisitantes },
    { nome: "Encomendas", total: indicadores.totalEncomendas },
    { nome: "Reservas", total: indicadores.totalReservas },
    { nome: "Prestadores", total: indicadores.totalPrestadores },
    { nome: "Ocorrências", total: indicadores.totalOcorrencias },
    { nome: "Sugestões", total: indicadores.totalSugestoes },
    { nome: "Reclamações", total: indicadores.totalReclamacoes },
    { nome: "Central", total: indicadores.totalAvisosSindico },
    { nome: "Notificações", total: indicadores.totalNotificacoesMorador }
  ];
}

export function gerarIndicadoresCriticos(periodo = "geral") {
  const indicadores = gerarIndicadoresBI(periodo);

  return [
    { nome: "Visitantes ativos", total: indicadores.totalVisitantesAtivos },
    { nome: "Encomendas pendentes", total: indicadores.totalPendentes },
    { nome: "Reservas ativas", total: indicadores.totalReservasAtivas },
    { nome: "Ocorrências abertas", total: indicadores.totalOcorrenciasAbertas },
    { nome: "Reclamações abertas", total: indicadores.totalReclamacoesAbertas },
    { nome: "Sugestões abertas", total: indicadores.totalSugestoesAbertas },
    { nome: "Pendências do síndico", total: indicadores.totalPendenciasSindico }
  ];
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
      reclamacoes: { atual: 0, anterior: 0, variacao: calcularVariacao(0, 0) },
      central: { atual: 0, anterior: 0, variacao: calcularVariacao(0, 0) }
    };
  }

  const atual = gerarIndicadoresBI(periodo, false);
  const anterior = gerarIndicadoresBI(periodo, true);

  return {
    visitantes: {
      atual: atual.totalVisitantes,
      anterior: anterior.totalVisitantes,
      variacao: calcularVariacao(
        atual.totalVisitantes,
        anterior.totalVisitantes
      )
    },

    encomendas: {
      atual: atual.totalEncomendas,
      anterior: anterior.totalEncomendas,
      variacao: calcularVariacao(
        atual.totalEncomendas,
        anterior.totalEncomendas
      )
    },

    reservas: {
      atual: atual.totalReservas,
      anterior: anterior.totalReservas,
      variacao: calcularVariacao(
        atual.totalReservas,
        anterior.totalReservas
      )
    },

    ocorrencias: {
      atual: atual.totalOcorrencias,
      anterior: anterior.totalOcorrencias,
      variacao: calcularVariacao(
        atual.totalOcorrencias,
        anterior.totalOcorrencias
      )
    },

    sugestoes: {
      atual: atual.totalSugestoes,
      anterior: anterior.totalSugestoes,
      variacao: calcularVariacao(
        atual.totalSugestoes,
        anterior.totalSugestoes
      )
    },

    reclamacoes: {
      atual: atual.totalReclamacoes,
      anterior: anterior.totalReclamacoes,
      variacao: calcularVariacao(
        atual.totalReclamacoes,
        anterior.totalReclamacoes
      )
    },

    central: {
      atual: atual.totalAvisosSindico,
      anterior: anterior.totalAvisosSindico,
      variacao: calcularVariacao(
        atual.totalAvisosSindico,
        anterior.totalAvisosSindico
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
    },
    {
      nome: "Central",
      atual: comparativos.central.atual,
      anterior: comparativos.central.anterior
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
      comparativos.reclamacoes.variacao,
      comparativos.central.variacao
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

  if (indicadores.totalOcorrenciasAbertas > 0) {
    mensagens.push(
      `${indicadores.totalOcorrenciasAbertas} ocorrência(s) estão abertas e precisam de acompanhamento.`
    );
  }

  if (indicadores.totalReclamacoesAbertas > 0) {
    mensagens.push(
      `${indicadores.totalReclamacoesAbertas} reclamação(ões) estão abertas ou em tratamento.`
    );
  }

  if (indicadores.totalSugestoesAbertas > 0) {
    mensagens.push(
      `${indicadores.totalSugestoesAbertas} sugestão(ões) aguardam análise ou conclusão.`
    );
  }

  if (indicadores.totalPendenciasSindico > 0) {
    mensagens.push(
      `${indicadores.totalPendenciasSindico} registro(s) na Central do Síndico exigem atenção.`
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
      titulo: "Comparativo de reclamações",
      texto: `Reclamações: ${comparativos.reclamacoes.variacao.texto} em relação ao período anterior.`
    });

    insights.push({
      tipo: "tendência",
      titulo: "Comparativo da Central",
      texto: `Central do Síndico: ${comparativos.central.variacao.texto} em relação ao período anterior.`
    });
  }

  if (indicadores.totalPendentes > 0) {
    insights.push({
      tipo: "atenção",
      titulo: "Encomendas pendentes",
      texto: `${indicadores.totalPendentes} encomenda(s) aguardando retirada.`
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
      tipo: "atenção",
      titulo: "Reclamações em aberto",
      texto: `${indicadores.totalReclamacoesAbertas} reclamação(ões) aguardam tratamento ou resolução.`
    });
  }

  if (indicadores.totalSugestoesAbertas > 0) {
    insights.push({
      tipo: "operação",
      titulo: "Sugestões em análise",
      texto: `${indicadores.totalSugestoesAbertas} sugestão(ões) ainda não foram concluídas.`
    });
  }

  if (indicadores.totalSugestoesResolvidas > 0) {
    insights.push({
      tipo: "positivo",
      titulo: "Sugestões resolvidas",
      texto: `${indicadores.totalSugestoesResolvidas} sugestão(ões) já foram concluídas.`
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

  if (indicadores.totalPendenciasSindico > 0) {
    insights.push({
      tipo: "central",
      titulo: "Central do Síndico",
      texto: `${indicadores.totalPendenciasSindico} registro(s) precisam de ciência, resposta ou acompanhamento.`
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
    visitantes: [
      ...dados.visitantes,
      ...dados.visitantesHistorico
    ]
      .slice(-4)
      .reverse(),

    encomendas: [
      ...dados.encomendas,
      ...dados.encomendasHistorico
    ]
      .slice(-4)
      .reverse(),

    reservas: dados.reservas.slice(-4).reverse(),

    ocorrencias: dados.ocorrencias.slice(-4).reverse(),

    central: dados.avisosSindico.slice(-4).reverse(),

    relatorios: dados.relatoriosOperacionais.slice(-4).reverse()
  };
}