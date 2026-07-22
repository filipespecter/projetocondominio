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

function gerarIdUnico() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
  usuarioDestinoNome = "",
  usuarioDestinoUsuario = "",
  apartamentoDestino = "",
  condominioId = null,
  moduloOrigem = "",
  referenciaId = null,
  prioridade = "normal"
}) {
  const notificacoes = buscarNotificacoes();
  const agora = new Date();

  const nova = {
    id: gerarIdUnico(),
    titulo,
    mensagem,
    tipo,
    origem,
    perfilDestino,
    usuarioDestinoId,
    usuarioDestinoNome,
    usuarioDestinoUsuario,
    apartamentoDestino,
    condominioId,
    moduloOrigem,
    referenciaId,
    prioridade,
    lida: false,
    data: agora.toLocaleDateString("pt-BR"),
    hora: agora.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    }),
    criadoEm: agora.toISOString()
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
    String(item.id) === String(id)
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

  const atualizadas = notificacoes.filter(
    (item) => String(item.id) !== String(id)
  );

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

export function buscarNotificacoesPorPerfil(
  perfilDestino,
  usuario = null
) {
  return buscarNotificacoes().filter((item) => {
    if (item.perfilDestino !== perfilDestino) {
      return false;
    }

    if (!usuario || perfilDestino !== "morador") {
      return true;
    }

    if (item.usuarioDestinoId && usuario.id) {
      return String(item.usuarioDestinoId) === String(usuario.id);
    }

    if (item.usuarioDestinoUsuario && usuario.usuario) {
      return (
        String(item.usuarioDestinoUsuario) ===
        String(usuario.usuario)
      );
    }

    if (
      item.usuarioDestinoNome &&
      usuario.nome &&
      item.apartamentoDestino &&
      (usuario.apartamento || usuario.apto)
    ) {
      return (
        String(item.usuarioDestinoNome).trim().toLowerCase() ===
          String(usuario.nome).trim().toLowerCase() &&
        String(item.apartamentoDestino) ===
          String(usuario.apartamento || usuario.apto)
      );
    }

    return !item.usuarioDestinoId &&
      !item.usuarioDestinoUsuario &&
      !item.usuarioDestinoNome;
  });
}