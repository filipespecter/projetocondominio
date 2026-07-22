const STORAGE_AUDITORIA = "auditoria_logs";

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

function obterUsuarioAtual() {
  const possiveisSessoes = [
    "sessaoSindico",
    "usuarioSindico",
    "sessaoPorteiro",
    "usuarioPorteiro",
    "sessaoMorador",
    "usuarioMorador"
  ];

  for (const chave of possiveisSessoes) {
    try {
      const valor =
        localStorage.getItem(chave) ||
        sessionStorage.getItem(chave);

      if (valor) {
        const usuario = JSON.parse(valor);

        return {
          id: usuario.id || null,
          nome: usuario.nome || usuario.usuario || "Usuário",
          perfil:
            usuario.tipo ||
            usuario.perfil ||
            usuario.perfilAdmin ||
            "sistema",
          condominioId: usuario.condominioId || null,
          chaveSessao: chave
        };
      }
    } catch {
      continue;
    }
  }

  return {
    id: null,
    nome: "Sistema",
    perfil: "sistema",
    condominioId: null,
    chaveSessao: null
  };
}

export function buscarAuditoria() {
  return lerStorage(STORAGE_AUDITORIA);
}

export function registrarAuditoria({
  acao,
  modulo,
  detalhes = "",
  antes = null,
  depois = null,
  referenciaId = null,
  perfilForcado = null,
  usuarioForcado = null
}) {
  const logs = buscarAuditoria();
  const usuarioAtual = obterUsuarioAtual();
  const agora = new Date();

  const novoLog = {
    id: gerarIdUnico(),

    usuarioId: usuarioForcado?.id || usuarioAtual.id,
    usuario: usuarioForcado?.nome || usuarioAtual.nome,
    perfil:
      perfilForcado ||
      usuarioForcado?.perfil ||
      usuarioAtual.perfil,
    condominioId:
      usuarioForcado?.condominioId ||
      usuarioAtual.condominioId ||
      null,

    acao,
    modulo,
    detalhes,

    antes,
    depois,
    referenciaId,

    data: agora.toLocaleDateString("pt-BR"),
    hora: agora.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    }),
    criadoEm: agora.toISOString(),

    origem: "localStorage",
    sistema: "InfinityCondo"
  };

  salvarStorage(STORAGE_AUDITORIA, [
    novoLog,
    ...logs
  ]);

  return novoLog;
}

export function buscarAuditoriaPorModulo(modulo) {
  return buscarAuditoria().filter(
    (item) => item.modulo === modulo
  );
}

export function buscarAuditoriaPorPerfil(perfil) {
  return buscarAuditoria().filter(
    (item) => item.perfil === perfil
  );
}

export function limparAuditoria() {
  salvarStorage(STORAGE_AUDITORIA, []);
  return [];
}