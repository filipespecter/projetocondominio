import Jwt from "../utils/Jwt.js";
import { ApiError } from "../utils/ApiError.js";
import UserSessionService from "../services/UserSessionService.js";

/**
 * Extrai o token Bearer do cabeçalho Authorization.
 */
function extractBearerToken(authorizationHeader) {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] =
    String(authorizationHeader)
      .trim()
      .split(/\s+/);

  if (
    scheme?.toLowerCase() !== "bearer" ||
    !token
  ) {
    return null;
  }

  return token;
}

/**
 * Protege rotas que exigem autenticação.
 *
 * Após validar o access token, disponibiliza:
 *
 * req.user.id
 * req.user.condominiumId
 * req.user.role
 * req.auth.token
 * req.auth.payload
 */
export function authMiddleware(
  req,
  res,
  next
) {
  try {
    const token =
      extractBearerToken(
        req.headers.authorization
      );

    if (!token) {
      throw new ApiError(
        "Token de acesso não informado.",
        401
      );
    }

    const payload =
      Jwt.verifyAccessToken(token);

    if (!payload?.sub) {
      throw new ApiError(
        "Token de acesso inválido.",
        401
      );
    }

    req.user = {
      id: payload.sub,

      condominiumId:
        payload.condominiumId ?? null,

      role:
        payload.role ?? null,
    };

    req.auth = {
      token,
      payload,
    };

    // Mantém a última atividade operacional do porteiro atualizada sem
    // atrasar a requisição principal. Falhas de telemetria não bloqueiam o uso.
    if (req.user.role === "DOORMAN") {
      void UserSessionService.touch(req.user.id).catch(() => null);
    }

    return next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }

    if (error?.name === "TokenExpiredError") {
      return next(
        new ApiError(
          "Token de acesso expirado.",
          401
        )
      );
    }

    if (
      error?.name ===
      "JsonWebTokenError"
    ) {
      return next(
        new ApiError(
          "Token de acesso inválido.",
          401
        )
      );
    }

    if (
      error?.name ===
      "NotBeforeError"
    ) {
      return next(
        new ApiError(
          "Token de acesso ainda não está válido.",
          401
        )
      );
    }

    return next(error);
  }
}

/**
 * Restringe uma rota aos perfis informados.
 *
 * Exemplo:
 *
 * router.get(
 *   "/administrativo",
 *   authMiddleware,
 *   authorizeRoles(
 *     "CONDOMINIUM_ADMIN",
 *     "MANAGER"
 *   ),
 *   controller
 * );
 */
export function authorizeRoles(
  ...allowedRoles
) {
  const normalizedRoles =
    allowedRoles
      .flat()
      .filter(Boolean);

  return (req, res, next) => {
    if (!req.user) {
      return next(
        new ApiError(
          "Usuário não autenticado.",
          401
        )
      );
    }

    if (
      !normalizedRoles.includes(
        req.user.role
      )
    ) {
      return next(
        new ApiError(
          "Você não possui permissão para acessar este recurso.",
          403
        )
      );
    }

    return next();
  };
}

/**
 * Garante que o token pertence ao condomínio
 * informado no contexto da requisição.
 *
 * O middleware lê, nesta ordem:
 *
 * req.condominiumId
 * req.params.condominiumId
 * req.body.condominiumId
 *
 * PLATFORM_ADMIN não fica limitado por condomínio.
 */
export function requireSameCondominium(
  req,
  res,
  next
) {
  if (!req.user) {
    return next(
      new ApiError(
        "Usuário não autenticado.",
        401
      )
    );
  }

  if (
    [
      "PLATFORM_OWNER",
      "PLATFORM_ADMIN",
      "PLATFORM_SUPPORT",
    ].includes(req.user.role)
  ) {
    return next();
  }

  const requestedCondominiumId =
    req.condominiumId ??
    req.params?.condominiumId ??
    req.body?.condominiumId ??
    null;

  if (!requestedCondominiumId) {
    return next();
  }

  if (
    !req.user.condominiumId ||
    req.user.condominiumId !==
      requestedCondominiumId
  ) {
    return next(
      new ApiError(
        "Você não possui acesso aos dados deste condomínio.",
        403
      )
    );
  }

  return next();
}

export default authMiddleware;
