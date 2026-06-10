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

  const novoLog = {
    id: Date.now(),

    usuarioId: usuarioForcado?.id || usuarioAtual.id,
    usuario: usuarioForcado?.nome || usuarioAtual.nome,
    perfil:
      perfilForcado ||
      usuarioForcado?.perfil ||
      usuarioAtual.perfil,

    acao,
    modulo,
    detalhes,

    antes,
    depois,
    referenciaId,

    data: new Date().toLocaleDateString("pt-BR"),
    hora: new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    }),
    criadoEm: new Date().toISOString(),

    origem: "localStorage",
    sistema: "GreenCondo"
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