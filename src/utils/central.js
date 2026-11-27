// Rótulos em português para códigos internos exibidos na Central Star.
// Código desconhecido vira texto legível (ex.: "NOVO_CODIGO" -> "Novo codigo").

function legivel(codigo) {
  if (!codigo) return "-";
  const texto = String(codigo).replace(/_/g, " ").toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function rotulo(mapa, codigo) {
  if (codigo === null || codigo === undefined || codigo === "") return "-";
  return mapa[String(codigo).toUpperCase()] ?? legivel(codigo);
}

const ACOES_AUDITORIA = {
  APPROVE: "Aprovação",
  CREATE: "Cadastro",
  DELETE: "Exclusão",
  EXPORT: "Exportação",
  LOGIN: "Login",
  LOGOUT: "Saída",
  PASSWORD_CHANGE: "Troca de senha",
  PASSWORD_RESET_REQUEST: "Pedido de nova senha",
  PASSWORD_RESET_SEND_FAILED: "Falha no envio de nova senha",
  RESET_PASSWORD: "Redefinição de senha",
  SEND_FAILED: "Falha no envio",
  SEND_REQUEST: "Envio solicitado",
  STATUS_CHANGE: "Mudança de status",
  UPDATE: "Alteração",
  REJECT: "Recusa",
  ARCHIVE: "Arquivamento",
};

const MODULOS = {
  ASSEMBLY: "Assembleias",
  ASSET: "Patrimônio",
  AUTH: "Acesso",
  COMMON_AREA: "Áreas comuns",
  COMMUNICATION: "Comunicações",
  CONDOMINIUM: "Condomínio",
  CONDOMINIUM_APPROVAL: "Aprovação de condomínio",
  CONDOMINIUM_ONBOARDING: "Cadastro de condomínio",
  CONDOMINIUM_STRUCTURE: "Estrutura do condomínio",
  CONFIGURATION_USER: "Usuários do condomínio",
  CONTRACT: "Contratos",
  DOCUMENT: "Documentos",
  DOORMAN: "Porteiros",
  EXPENSE: "Despesas",
  EXPENSE_CATEGORY: "Categorias de despesa",
  MONTHLY_DOCUMENT: "Documentos mensais",
  NOTICE: "Avisos",
  OCCURRENCE: "Ocorrências",
  PACKAGE: "Encomendas",
  PLATFORM_OWNER: "Central",
  PRIVATE_SERVICE: "Serviços do apartamento",
  PROVIDER_ACCESS: "Acesso de prestadores",
  REPORT_DOCUMENT: "Relatórios",
  RESERVATION: "Reservas",
  RESIDENT: "Moradores",
  SERVICE_PROVIDER: "Prestadores",
  SHIFT_HANDOVER: "Passagem de serviço",
  SUPPLIER: "Fornecedores",
  VISITOR: "Visitantes",
  VISITOR_INVITATION: "Convites de visitante",
};

const CATEGORIAS_SUPORTE = {
  ACESSO: "Acesso",
  ENCOMENDAS: "Encomendas",
  RESERVAS: "Reservas",
  FINANCEIRO: "Financeiro",
  RELATORIOS: "Relatórios",
  DADOS_CADASTRAIS: "Dados cadastrais",
  GERAL: "Geral",
};

const SEVERIDADES = {
  INFO: "Informativo",
  WARNING: "Atenção",
  ERROR: "Erro",
  CRITICAL: "Crítico",
};

const TIPOS_EVENTO = {
  APIERROR: "Erro de API",
  HTTP_ERROR: "Erro de requisição",
  ERROR: "Erro interno",
  TYPEERROR: "Erro interno",
  PRISMACLIENTKNOWNREQUESTERROR: "Erro de banco de dados",
};

export const rotuloAcaoAuditoria = (c) => rotulo(ACOES_AUDITORIA, c);
export const rotuloModulo = (c) => rotulo(MODULOS, c);
export const rotuloCategoriaSuporte = (c) => rotulo(CATEGORIAS_SUPORTE, c);
export const rotuloSeveridade = (c) => rotulo(SEVERIDADES, c);
export const rotuloTipoEvento = (c) => (c ? TIPOS_EVENTO[String(c).toUpperCase()] ?? c : "Evento");

const PERFIS = {
  PLATFORM_OWNER: "Proprietário da plataforma",
  PLATFORM_ADMIN: "Administrador da Central",
  PLATFORM_SUPPORT: "Suporte da Central",
  MANAGER: "Síndico",
  CONDOMINIUM_ADMIN: "Administrador do condomínio",
  DOORMAN: "Porteiro",
  RESIDENT: "Morador",
};

export const rotuloPerfil = (c) => rotulo(PERFIS, c);
