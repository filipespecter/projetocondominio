import PlatformDashboardService from "../services/PlatformDashboardService.js";

/**
 * =====================================================
 * PLATFORM DASHBOARD CONTROLLER
 * =====================================================
 *
 * Controller exclusivo da Central Star Infinity Code.
 */
class PlatformDashboardController {
  /**
   * GET /api/v1/platform/dashboard
   */
  async index(req, res, next) {
    try {
      const dashboard =
        await PlatformDashboardService
          .getDashboard();

      /**
       * Regra de negócio:
       * caixa/financeiro da Star é exclusivo do OWNER.
       *
       * O dado é removido no backend e não apenas
       * escondido no frontend.
       */
      if (
        req.user.role !==
        "PLATFORM_OWNER"
      ) {
        delete dashboard.billing;
      }

      return res.status(200).json({
        success: true,

        message:
          "Dashboard da Central Star carregado com sucesso.",

        data: {
          platform:
            "InfinityCondo",

          company:
            "Star Infinity Code",

          authenticatedUser: {
            id:
              req.user.id,

            role:
              req.user.role,

            condominiumId:
              req.user.condominiumId,
          },

          dashboard,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default new PlatformDashboardController();
