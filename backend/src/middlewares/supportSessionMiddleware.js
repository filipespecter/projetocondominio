import SupportSessionService from "../services/SupportSessionService.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * =====================================================
 * SUPPORT SESSION MIDDLEWARE
 * =====================================================
 *
 * Aplica o contexto temporário de suporte.
 *
 * Deve ser executado depois do authMiddleware e do
 * platformAdminMiddleware.
 *
 * A sessão é recebida preferencialmente pelo header:
 *
 * x-support-session-id
 *
 * O PLATFORM_ADMIN mantém sua identidade original.
 * O condomínio é disponibilizado separadamente em:
 *
 * req.supportSessionId
 * req.supportCondominiumId
 * req.supportSession
 * req.condominiumId
 *
 * Não alteramos permanentemente o condominiumId do
 * usuário autenticado.
 */
export async function supportSessionMiddleware(
  req,
  res,
  next
) {
  try {
    if (!req.user) {
      throw new ApiError(
        "Usuário não autenticado.",
        401
      );
    }

    if (
      ![
        "PLATFORM_OWNER",
        "PLATFORM_ADMIN",
        "PLATFORM_SUPPORT",
      ].includes(
        req.user.role
      )
    ) {
      throw new ApiError(
        "Acesso de suporte restrito à equipe interna da plataforma.",
        403
      );
    }

    const sessionId =
      req.headers[
        "x-support-session-id"
      ] ??
      req.headers[
        "x-support-session"
      ] ??
      null;

    const session =
      await SupportSessionService
        .validateActiveSession(
          sessionId,
          req.user
        );

    req.supportSession =
      session;

    req.supportSessionId =
      session.id;

    req.supportCondominiumId =
      session.condominiumId;

    /**
     * Compatibilidade com serviços/controllers que
     * utilizam req.condominiumId como contexto.
     */
    req.condominiumId =
      session.condominiumId;

    req.auth = {
      ...(req.auth ?? {}),

      supportSessionId:
        session.id,

      supportCondominiumId:
        session.condominiumId,
    };

    return next();
  } catch (error) {
    return next(error);
  }
}

export default supportSessionMiddleware;
