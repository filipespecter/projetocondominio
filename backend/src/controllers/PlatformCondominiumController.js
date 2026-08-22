import PlatformCondominiumService from "../services/PlatformCondominiumService.js";
import PlatformCondominiumApprovalService from "../services/PlatformCondominiumApprovalService.js";

/**
 * =====================================================
 * PLATFORM CONDOMINIUM CONTROLLER
 * =====================================================
 *
 * Controller exclusivo da Central Star Infinity Code.
 *
 * Não contém regra de negócio.
 * Apenas:
 *
 * - recebe requisições;
 * - chama os Services;
 * - devolve respostas HTTP;
 * - encaminha erros ao errorHandler.
 */
class PlatformCondominiumController {
  /**
   * GET /api/v1/platform/condominiums
   *
   * Lista condomínios com filtros e paginação.
   */
  async index(req, res, next) {
    try {
      const result =
        await PlatformCondominiumService.list(
          req.query
        );

      return res.status(200).json({
        success: true,

        message:
          "Condomínios carregados com sucesso.",

        data:
          result,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * GET /api/v1/platform/condominiums/pending
   *
   * Lista exclusivamente solicitações aguardando
   * análise da Star Infinity Code.
   */
  async pending(req, res, next) {
    try {
      const result =
        await PlatformCondominiumService.listPending(
          req.query
        );

      return res.status(200).json({
        success: true,

        message:
          "Solicitações pendentes carregadas com sucesso.",

        data:
          result,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * GET /api/v1/platform/condominiums/statistics
   *
   * Indicadores rápidos da Central.
   */
  async statistics(req, res, next) {
    try {
      const result =
        await PlatformCondominiumService.statistics();

      return res.status(200).json({
        success: true,

        message:
          "Estatísticas carregadas com sucesso.",

        data:
          result,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * GET /api/v1/platform/condominiums/:id
   *
   * Abre a ficha administrativa completa
   * de um condomínio.
   */
  async show(req, res, next) {
    try {
      const result =
        await PlatformCondominiumService.findById(
          req.params.id
        );

      return res.status(200).json({
        success: true,

        message:
          "Condomínio carregado com sucesso.",

        data:
          result,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * POST /api/v1/platform/condominiums/:id/approve
   *
   * Aprovação comercial executada exclusivamente
   * pelo PLATFORM_ADMIN.
   *
   * O Service executa a operação crítica:
   *
   * - valida solicitação PENDING;
   * - valida plano;
   * - cria CONDOMINIUM_ADMIN;
   * - cria assinatura;
   * - configura cobrança;
   * - altera status do condomínio;
   * - registra auditoria;
   * - executa tudo dentro de transação.
   */
  async approve(req, res, next) {
    try {
      const requestContext = {
        requestId:
          req.requestId ?? null,

        ipAddress:
          req.ip ?? null,

        userAgent:
          req.headers[
            "user-agent"
          ] ?? null,
      };

      const result =
        await PlatformCondominiumApprovalService.approve(
          req.params.id,
          req.body,
          req.user,
          requestContext
        );

      return res.status(200).json({
        success: true,

        message:
          "Condomínio aprovado e acesso liberado com sucesso.",

        data:
          result,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * POST /api/v1/platform/condominiums/:id/reject
   *
   * Rejeita uma solicitação ainda PENDING.
   *
   * O motivo da rejeição fica registrado
   * no condomínio e na auditoria.
   */
  async reject(req, res, next) {
    try {
      const requestContext = {
        requestId:
          req.requestId ?? null,

        ipAddress:
          req.ip ?? null,

        userAgent:
          req.headers[
            "user-agent"
          ] ?? null,
      };

      const result =
        await PlatformCondominiumApprovalService.reject(
          req.params.id,
          req.body,
          req.user,
          requestContext
        );

      return res.status(200).json({
        success: true,

        message:
          "Solicitação rejeitada com sucesso.",

        data:
          result,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default new PlatformCondominiumController();
