import { ApiError } from "../utils/ApiError.js";

export const PLATFORM_ROLES = [
  "PLATFORM_OWNER",
  "PLATFORM_ADMIN",
  "PLATFORM_SUPPORT",
];

export function isPlatformRole(role) {
  return PLATFORM_ROLES.includes(
    String(role ?? "")
      .trim()
      .toUpperCase()
  );
}

/**
 * Permite entrada na Central Star para qualquer
 * usuário interno válido da plataforma.
 *
 * Todos os usuários internos obrigatoriamente possuem
 * condominiumId = null.
 */
export function platformAccessMiddleware(
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

  if (!isPlatformRole(req.user.role)) {
    return next(
      new ApiError(
        "Acesso restrito à Central Star Infinity Code.",
        403
      )
    );
  }

  if (
    req.user.condominiumId !== null &&
    req.user.condominiumId !== undefined
  ) {
    return next(
      new ApiError(
        "Conta interna da plataforma inválida.",
        403
      )
    );
  }

  return next();
}

/**
 * Somente OWNER e ADMIN.
 *
 * Usado para administração interna e ações que o
 * PLATFORM_SUPPORT não pode executar.
 */
export function platformManagementMiddleware(
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
    ![
      "PLATFORM_OWNER",
      "PLATFORM_ADMIN",
    ].includes(req.user.role)
  ) {
    return next(
      new ApiError(
        "Acesso restrito à administração da plataforma.",
        403
      )
    );
  }

  if (
    req.user.condominiumId !== null &&
    req.user.condominiumId !== undefined
  ) {
    return next(
      new ApiError(
        "Conta administrativa da plataforma inválida.",
        403
      )
    );
  }

  return next();
}

/**
 * Regra crítica:
 * financeiro/caixa da Star Infinity Code é exclusivo
 * do PLATFORM_OWNER.
 */
export function platformOwnerMiddleware(
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
    req.user.role !==
    "PLATFORM_OWNER"
  ) {
    return next(
      new ApiError(
        "Este recurso é exclusivo do proprietário da plataforma.",
        403
      )
    );
  }

  if (
    req.user.condominiumId !== null &&
    req.user.condominiumId !== undefined
  ) {
    return next(
      new ApiError(
        "Conta proprietária da plataforma inválida.",
        403
      )
    );
  }

  return next();
}

export default platformAccessMiddleware;
