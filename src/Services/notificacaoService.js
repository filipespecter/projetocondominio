const STORAGE_NOTIFICACOES = "notificacoes";

function lerStorage(chave) {
  try {
    return JSON.parse(localStorage.getItem(chave)) || [];
  } catch {
    return [];
  }
}

function salvarStorage(chave, dados) {
  localStorage.setItem(chave, JSON.stringify(dados));
}

export function buscarNotificacoes() {
  return lerStorage(STORAGE_NOTIFICACOES);
}

export function criarNotificacao({
  titulo,
  mensagem,
  tipo = "Sistema",
  origem = "Sistema",
  perfilDestino = "sindico",
  usuarioDestinoId = null,
  moduloOrigem = "",
  referenciaId = null,
  prioridade = "normal"
}) {
  const notificacoes = buscarNotificacoes();

  const nova = {
    id: Date.now(),
    titulo,
    mensagem,
    tipo,
    origem,
    perfilDestino,
    usuarioDestinoId,
    moduloOrigem,
    referenciaId,
    prioridade,
    lida: false,
    data: new Date().toLocaleDateString("pt-BR"),
    hora: new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    }),
    criadoEm: new Date().toISOString()
  };

  salvarStorage(STORAGE_NOTIFICACOES, [
    nova,
    ...notificacoes
  ]);

  return nova;
}

export function marcarNotificacaoComoLida(id) {
  const notificacoes = buscarNotificacoes();

  const atualizadas = notificacoes.map((item) =>
    item.id === id
      ? {
          ...item,
          lida: true,
          lidaEm: new Date().toISOString()
        }
      : item
  );

  salvarStorage(STORAGE_NOTIFICACOES, atualizadas);

  return atualizadas;
}

export function marcarTodasComoLidas(perfilDestino = null) {
  const notificacoes = buscarNotificacoes();

  const atualizadas = notificacoes.map((item) => {
    if (perfilDestino && item.perfilDestino !== perfilDestino) {
      return item;
    }

    return {
      ...item,
      lida: true,
      lidaEm: new Date().toISOString()
    };
  });

  salvarStorage(STORAGE_NOTIFICACOES, atualizadas);

  return atualizadas;
}

export function removerNotificacao(id) {
  const notificacoes = buscarNotificacoes();

  const atualizadas = notificacoes.filter((item) => item.id !== id);

  salvarStorage(STORAGE_NOTIFICACOES, atualizadas);

  return atualizadas;
}

export function contarNaoLidas(perfilDestino = null) {
  const notificacoes = buscarNotificacoes();

  return notificacoes.filter((item) => {
    if (perfilDestino && item.perfilDestino !== perfilDestino) {
      return false;
    }

    return !item.lida;
  }).length;
}

export function buscarNotificacoesPorPerfil(perfilDestino) {
  return buscarNotificacoes().filter(
    (item) => item.perfilDestino === perfilDestino
  );
}