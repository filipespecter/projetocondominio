/**
 * =====================================================
 * INFINITYCONDO - SERVIÇO DE AUTENTICAÇÃO
 * =====================================================
 *
 * Este arquivo concentra as chamadas relacionadas
 * à autenticação do frontend.
 *
 * Ele não contém elementos visuais e não altera
 * design ou responsividade.
 */

import {
  api,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "./api.js";

/**
 * =====================================================
 * MAPEAMENTO DE PERFIS
 * =====================================================
 *
 * O backend trabalha com roles em inglês.
 *
 * O frontend atual trabalha com:
 * sindico
 * porteiro
 * morador
 *
 * Durante a migração mantemos os dois formatos
 * compatíveis.
 */
export function roleParaTipoFrontend(
  role
) {
  const normalizedRole =
    String(role ?? "")
      .trim()
      .toUpperCase();

  if (
    [
      "CONDOMINIUM_ADMIN",
      "MANAGER",
    ].includes(
      normalizedRole
    )
  ) {
    return "sindico";
  }

  if (
    normalizedRole ===
    "DOORMAN"
  ) {
    return "porteiro";
  }

  if (
    normalizedRole ===
    "RESIDENT"
  ) {
    return "morador";
  }

  if (
    [
      "PLATFORM_OWNER",
      "PLATFORM_ADMIN",
      "PLATFORM_SUPPORT",
    ].includes(
      normalizedRole
    )
  ) {
    return "platform";
  }

  return "";
}

/**
 * Retorna a role que normalmente corresponde
 * ao perfil visual selecionado na tela de login.
 *
 * Essa função será usada apenas para conferir
 * se o usuário entrou pelo portal correto.
 */
export function tipoFrontendAceitaRole(
  tipo,
  role
) {
  const normalizedTipo =
    String(tipo ?? "")
      .trim()
      .toLowerCase();

  const normalizedRole =
    String(role ?? "")
      .trim()
      .toUpperCase();

  if (
    normalizedTipo ===
    "platform"
  ) {
    return [
      "PLATFORM_OWNER",
      "PLATFORM_ADMIN",
      "PLATFORM_SUPPORT",
    ].includes(
      normalizedRole
    );
  }

  if (
    normalizedTipo ===
    "sindico"
  ) {
    return [
      "CONDOMINIUM_ADMIN",
      "MANAGER",
    ].includes(
      normalizedRole
    );
  }

  if (
    normalizedTipo ===
    "porteiro"
  ) {
    return (
      normalizedRole ===
      "DOORMAN"
    );
  }

  if (
    normalizedTipo ===
    "morador"
  ) {
    return (
      normalizedRole ===
      "RESIDENT"
    );
  }

  return false;
}

/**
 * =====================================================
 * LOGIN
 * =====================================================
 *
 * POST /api/v1/auth/login
 *
 * Payload esperado pelo backend:
 *
 * {
 *   condominiumCode,
 *   username,
 *   password
 * }
 */
export async function login({
  condominiumCode,
  username,
  password,
}) {
  const response =
    await api.post(
      "/v1/auth/login",
      {
        condominiumCode:
          condominiumCode
            ? String(
                condominiumCode
              )
                .trim()
                .toUpperCase()
            : undefined,

        username:
          String(
            username ?? ""
          )
            .trim()
            .toLowerCase(),

        password:
          String(
            password ?? ""
          ),
      },
      {
        authenticated: false,
      }
    );

  const data =
    response?.data;

  if (
    !data?.accessToken ||
    !data?.refreshToken ||
    !data?.user
  ) {
    throw new Error(
      "O servidor não retornou uma sessão válida."
    );
  }

  /**
   * Salva os tokens somente depois que o backend
   * confirma o login.
   */
  saveTokens({
    accessToken:
      data.accessToken,

    refreshToken:
      data.refreshToken,
  });

  return data;
}

/**
 * =====================================================
 * USUÁRIO AUTENTICADO
 * =====================================================
 *
 * GET /api/v1/auth/me
 */
export async function me() {
  const response =
    await api.get(
      "/v1/auth/me"
    );

  return (
    response?.data?.user ??
    null
  );
}

/**
 * =====================================================
 * RENOVAÇÃO MANUAL
 * =====================================================
 *
 * Normalmente api.js faz a renovação automática.
 * Este método fica disponível caso alguma tela
 * precise disparar a renovação explicitamente.
 */
export async function refresh() {
  const refreshToken =
    getRefreshToken();

  if (!refreshToken) {
    throw new Error(
      "Não existe refresh token disponível."
    );
  }

  const response =
    await api.post(
      "/v1/auth/refresh",
      {
        refreshToken,
      },
      {
        authenticated: false,
      }
    );

  const data =
    response?.data;

  if (
    !data?.accessToken
  ) {
    throw new Error(
      "Não foi possível renovar a sessão."
    );
  }

  saveTokens({
    accessToken:
      data.accessToken,

    refreshToken:
      data.refreshToken ||
      refreshToken,
  });

  return data;
}

/**
 * =====================================================
 * LOGOUT
 * =====================================================
 *
 * Primeiro tentamos registrar o logout no backend.
 *
 * Independentemente do resultado da requisição,
 * os tokens locais são removidos para não deixar
 * uma sessão inválida presa no navegador.
 */
export async function logout() {
  try {
    if (getAccessToken()) {
      await api.post(
        "/v1/auth/logout",
        undefined
      );
    }
  } finally {
    clearTokens();
  }

  return true;
}

/**
 * =====================================================
 * ALTERAÇÃO DE SENHA
 * =====================================================
 *
 * PATCH /api/v1/auth/change-password
 */
export async function changePassword({
  currentPassword,
  newPassword,
  newPasswordConfirmation,
}) {
  const response =
    await api.patch(
      "/v1/auth/change-password",
      {
        currentPassword,
        newPassword,
        newPasswordConfirmation,
      }
    );

  return response?.data ?? null;
}

/**
 * =====================================================
 * STATUS LOCAL DA AUTENTICAÇÃO
 * =====================================================
 */

/**
 * Informa se existe um accessToken salvo.
 *
 * Atenção:
 * isso não prova sozinho que o token ainda é válido.
 * A confirmação real é feita pela rota /auth/me.
 */
export function hasAccessToken() {
  return Boolean(
    getAccessToken()
  );
}

/**
 * Remove os tokens sem chamar o backend.
 *
 * Útil em casos de sessão corrompida ou quando
 * ProtectedRoute detectar um estado inválido.
 */
export function clearAuthTokens() {
  clearTokens();
}

/**
 * Exportação agrupada para permitir os dois estilos:
 *
 * import { login } from ...
 *
 * ou
 *
 * import authApi from ...
 */
export function isPlatformRole(
  role
) {
  return [
    "PLATFORM_OWNER",
    "PLATFORM_ADMIN",
    "PLATFORM_SUPPORT",
  ].includes(
    String(role ?? "")
      .trim()
      .toUpperCase()
  );
}

export function isPlatformOwner(
  role
) {
  return (
    String(role ?? "")
      .trim()
      .toUpperCase() ===
    "PLATFORM_OWNER"
  );
}

const authApi = {
  login,
  me,
  refresh,
  logout,
  changePassword,
  hasAccessToken,
  clearAuthTokens,
  roleParaTipoFrontend,
  tipoFrontendAceitaRole,
  isPlatformRole,
  isPlatformOwner,
};

export default authApi;
