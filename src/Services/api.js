/**
 * =====================================================
 * INFINITYCONDO - CLIENTE HTTP CENTRAL
 * =====================================================
 *
 * Este arquivo centraliza a comunicação entre o
 * frontend React e o backend Node/Express.
 *
 * OBJETIVOS:
 * - manter a URL da API em um único lugar;
 * - enviar o accessToken automaticamente;
 * - renovar o token quando possível;
 * - padronizar tratamento de erros;
 * - evitar espalhar fetch() por várias páginas.
 *
 * IMPORTANTE:
 * - este arquivo NÃO altera layout;
 * - este arquivo NÃO altera responsividade;
 * - este arquivo NÃO depende de componentes visuais.
 */

/**
 * URL base do backend.
 *
 * Em desenvolvimento:
 * http://localhost:3333/api
 *
 * Em produção, poderá ser definida no arquivo .env:
 *
 * VITE_API_URL=https://api.seudominio.com/api
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3333/api";

/**
 * =====================================================
 * CHAVES DE AUTENTICAÇÃO
 * =====================================================
 *
 * Os tokens são a única informação persistida no
 * navegador e ficam SOMENTE em sessionStorage.
 *
 * Nenhum dado de negócio do InfinityCondo deve usar
 * localStorage/sessionStorage como banco.
 *
 * O PostgreSQL, acessado pelo backend, é a fonte
 * oficial de verdade.
 */
const ACCESS_TOKEN_KEY =
  "infinityCondoAccessToken";

const REFRESH_TOKEN_KEY =
  "infinityCondoRefreshToken";

/**
 * =====================================================
 * LEITURA DOS TOKENS
 * =====================================================
 */

/**
 * Retorna o accessToken atual.
 */
export function getAccessToken() {
  return (
    sessionStorage.getItem(
      ACCESS_TOKEN_KEY
    ) ||
    null
  );
}

/**
 * Retorna o refreshToken atual.
 */
export function getRefreshToken() {
  return (
    sessionStorage.getItem(
      REFRESH_TOKEN_KEY
    ) ||
    null
  );
}

/**
 * =====================================================
 * PERSISTÊNCIA DOS TOKENS
 * =====================================================
 */

/**
 * Salva o par de tokens.
 *
 * A sessão utiliza somente sessionStorage.
 * Nenhum dado operacional é persistido no navegador.
 */
export function saveTokens({
  accessToken,
  refreshToken,
}) {
  if (accessToken) {
    sessionStorage.setItem(
      ACCESS_TOKEN_KEY,
      accessToken
    );
  }

  if (refreshToken) {
    sessionStorage.setItem(
      REFRESH_TOKEN_KEY,
      refreshToken
    );
  }
}

/**
 * Remove somente os tokens da API.
 *
 * As sessões antigas dos perfis são removidas
 * pela lógica de logout/login do frontend.
 */
export function clearTokens() {
  sessionStorage.removeItem(
    ACCESS_TOKEN_KEY
  );

  sessionStorage.removeItem(
    REFRESH_TOKEN_KEY
  );
}

/**
 * =====================================================
 * ERRO PADRONIZADO DA API
 * =====================================================
 *
 * Criamos um Error normal do JavaScript e anexamos
 * informações extras devolvidas pelo backend.
 */
function createApiError(
  response,
  payload
) {
  const error = new Error(
    payload?.message ||
    "Não foi possível concluir a operação."
  );

  error.status =
    response?.status ?? 0;

  error.details =
    payload?.details ??
    payload?.errors ??
    null;

  error.payload =
    payload ?? null;

  return error;
}

/**
 * =====================================================
 * LEITURA SEGURA DA RESPOSTA
 * =====================================================
 */
async function parseResponse(
  response
) {
  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  if (
    contentType.includes(
      "application/json"
    )
  ) {
    return response.json();
  }

  const text =
    await response.text();

  return text
    ? {
        success:
          response.ok,
        message: text,
      }
    : null;
}

/**
 * =====================================================
 * RENOVAÇÃO DO ACCESS TOKEN
 * =====================================================
 *
 * Este método é interno.
 *
 * Quando uma rota protegida responder 401 e houver
 * refreshToken salvo, tentamos renovar o par de tokens.
 */
async function tryRefreshToken() {
  const refreshToken =
    getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  try {
    const response =
      await fetch(
        `${API_BASE_URL}/v1/auth/refresh`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            refreshToken,
          }),
        }
      );

    const payload =
      await parseResponse(
        response
      );

    if (
      !response.ok ||
      !payload?.success ||
      !payload?.data?.accessToken
    ) {
      clearTokens();

      return null;
    }

    saveTokens({
      accessToken:
        payload.data.accessToken,

      refreshToken:
        payload.data.refreshToken ||
        refreshToken,
    });

    return payload.data.accessToken;
  } catch {
    clearTokens();

    return null;
  }
}

/**
 * =====================================================
 * REQUISIÇÃO CENTRAL
 * =====================================================
 *
 * Exemplo:
 *
 * apiRequest("/v1/apartments")
 *
 * apiRequest("/v1/apartments", {
 *   method: "POST",
 *   body: { ... }
 * })
 */
export async function apiRequest(
  endpoint,
  options = {}
) {
  const {
    method = "GET",
    body,
    headers = {},
    authenticated = true,
    retryOnUnauthorized = true,
    ...fetchOptions
  } = options;

  const requestHeaders = {
    Accept:
      "application/json",
    ...headers,
  };

  /**
   * Só adicionamos Content-Type JSON quando existe body.
   */
  if (
    body !== undefined &&
    body !== null &&
    !(
      body instanceof FormData
    )
  ) {
    requestHeaders[
      "Content-Type"
    ] = "application/json";
  }

  /**
   * Adiciona JWT automaticamente em rotas protegidas.
   */
  if (authenticated) {
    const accessToken =
      getAccessToken();

    if (accessToken) {
      requestHeaders.Authorization =
        `Bearer ${accessToken}`;
    }
  }

  const url =
    endpoint.startsWith("http")
      ? endpoint
      : `${API_BASE_URL}${endpoint}`;

  let response;

  try {
    response =
      await fetch(url, {
        method,

        headers:
          requestHeaders,

        body:
          body === undefined ||
          body === null
            ? undefined
            : body instanceof FormData
              ? body
              : JSON.stringify(
                  body
                ),

        ...fetchOptions,
      });
  } catch {
    const connectionError =
      new Error(
        "Não foi possível conectar ao servidor do InfinityCondo."
      );

    connectionError.status = 0;

    throw connectionError;
  }

  let payload =
    await parseResponse(
      response
    );

  /**
   * =====================================================
   * TOKEN EXPIRADO
   * =====================================================
   *
   * Tentamos renovar uma única vez.
   *
   * Não fazemos isso nas próprias rotas de autenticação,
   * porque poderia gerar loop.
   */
  const isAuthEndpoint =
    endpoint.includes(
      "/v1/auth/login"
    ) ||
    endpoint.includes(
      "/v1/auth/refresh"
    );

  if (
    response.status === 401 &&
    authenticated &&
    retryOnUnauthorized &&
    !isAuthEndpoint
  ) {
    const newAccessToken =
      await tryRefreshToken();

    if (newAccessToken) {
      requestHeaders.Authorization =
        `Bearer ${newAccessToken}`;

      try {
        response =
          await fetch(url, {
            method,

            headers:
              requestHeaders,

            body:
              body === undefined ||
              body === null
                ? undefined
                : body instanceof FormData
                  ? body
                  : JSON.stringify(
                      body
                    ),

            ...fetchOptions,
          });

        payload =
          await parseResponse(
            response
          );
      } catch {
        const connectionError =
          new Error(
            "Não foi possível conectar ao servidor do InfinityCondo."
          );

        connectionError.status = 0;

        throw connectionError;
      }
    }
  }

  /**
   * Resposta HTTP fora da faixa 2xx.
   */
  if (!response.ok) {
    throw createApiError(
      response,
      payload
    );
  }

  /**
   * Segurança adicional:
   * mesmo com HTTP 200, respeitamos success:false
   * caso algum endpoint devolva esse formato.
   */
  if (
    payload &&
    payload.success === false
  ) {
    throw createApiError(
      response,
      payload
    );
  }

  return payload;
}

/**
 * =====================================================
 * ATALHOS HTTP
 * =====================================================
 *
 * Facilitam a criação dos Services dos módulos.
 */
export const api = {
  get(
    endpoint,
    options = {}
  ) {
    return apiRequest(
      endpoint,
      {
        ...options,
        method: "GET",
      }
    );
  },

  post(
    endpoint,
    body,
    options = {}
  ) {
    return apiRequest(
      endpoint,
      {
        ...options,
        method: "POST",
        body,
      }
    );
  },

  patch(
    endpoint,
    body,
    options = {}
  ) {
    return apiRequest(
      endpoint,
      {
        ...options,
        method: "PATCH",
        body,
      }
    );
  },

  put(
    endpoint,
    body,
    options = {}
  ) {
    return apiRequest(
      endpoint,
      {
        ...options,
        method: "PUT",
        body,
      }
    );
  },

  delete(
    endpoint,
    options = {}
  ) {
    return apiRequest(
      endpoint,
      {
        ...options,
        method: "DELETE",
      }
    );
  },
};

export default api;
