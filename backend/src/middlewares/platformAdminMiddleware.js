import {
  platformAccessMiddleware,
} from "./platformAccessMiddleware.js";

/**
 * =====================================================
 * COMPATIBILIDADE - PLATFORM ADMIN MIDDLEWARE
 * =====================================================
 *
 * O projeto antigo utilizava este arquivo em todas as
 * rotas da Central.
 *
 * A partir do Bloco 10.1-B existem três níveis:
 *
 * PLATFORM_OWNER
 * PLATFORM_ADMIN
 * PLATFORM_SUPPORT
 *
 * Para não quebrar módulos existentes, este middleware
 * passa a representar "usuário interno da plataforma".
 *
 * Restrições mais fortes são aplicadas por:
 *
 * platformManagementMiddleware
 * platformOwnerMiddleware
 */
export const platformAdminMiddleware =
  platformAccessMiddleware;

export default platformAdminMiddleware;
