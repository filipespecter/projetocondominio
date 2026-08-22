import AuditLogService from "../services/AuditLogService.js";

/**
 * =====================================================
 * CONTROLLER DE AUDITORIA
 * =====================================================
 *
 * Esta camada apenas recebe requisições HTTP,
 * delega as regras ao AuditLogService e retorna
 * respostas padronizadas.
 */
class AuditLogController {
  /**
   * =====================================================
   * LISTAGEM DO CONDOMÍNIO
   * =====================================================
   *
   * Permite filtros por:
   *
   * - usuário;
   * - módulo;
   * - ação;
   * - referência;
   * - período;
   * - usuário + período.
   */
  async index(req, res, next) {
    try {
      const condominiumId =
        req.user.condominiumId;

      const {
        userId,
        module,
        action,
        referenceId,
        startDate,
        endDate,
      } = req.query;

      let data;

      /**
       * Filtro combinado por usuário e período.
       */
      if (
        userId &&
        startDate &&
        endDate
      ) {
        data =
          await AuditLogService
            .findByUserAndPeriod(
              userId,
              condominiumId,
              startDate,
              endDate
            );
      }

      /**
       * Filtro por período.
       */
      else if (
        startDate &&
        endDate
      ) {
        data =
          await AuditLogService
            .findByPeriod(
              condominiumId,
              startDate,
              endDate
            );
      }

      /**
       * Filtro por usuário.
       */
      else if (userId) {
        data =
          await AuditLogService
            .findByUser(
              userId,
              condominiumId
            );
      }

      /**
       * Filtro por módulo.
       */
      else if (module) {
        data =
          await AuditLogService
            .findByModule(
              condominiumId,
              module
            );
      }

      /**
       * Filtro por ação.
       */
      else if (action) {
        data =
          await AuditLogService
            .findByAction(
              condominiumId,
              action
            );
      }

      /**
       * Filtro por registro de referência.
       */
      else if (referenceId) {
        data =
          await AuditLogService
            .findByReference(
              condominiumId,
              referenceId
            );
      }

      /**
       * Sem filtros retorna todo o histórico
       * do condomínio.
       */
      else {
        data =
          await AuditLogService
            .findByCondominium(
              condominiumId
            );
      }

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * =====================================================
   * BUSCA POR ID
   * =====================================================
   */
  async show(req, res, next) {
    try {
      const data =
        await AuditLogService.findById(
          req.params.id,
          req.user.condominiumId
        );

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * =====================================================
   * LOGS GLOBAIS DA PLATAFORMA
   * =====================================================
   *
   * Essa rota será exclusiva do PLATFORM_ADMIN.
   */
  async platformLogs(
    req,
    res,
    next
  ) {
    try {
      const data =
        await AuditLogService
          .findPlatformLogs();

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * =====================================================
   * ESTATÍSTICAS
   * =====================================================
   *
   * Retorna alguns indicadores básicos
   * para o painel administrativo.
   */
  async statistics(
    req,
    res,
    next
  ) {
    try {
      const condominiumId =
        req.user.condominiumId;

      const [
        total,
        create,
        update,
        deleteActions,
        login,
        logout,
        statusChange,
      ] = await Promise.all([
        AuditLogService
          .countByCondominium(
            condominiumId
          ),

        AuditLogService
          .countByAction(
            condominiumId,
            "CREATE"
          ),

        AuditLogService
          .countByAction(
            condominiumId,
            "UPDATE"
          ),

        AuditLogService
          .countByAction(
            condominiumId,
            "DELETE"
          ),

        AuditLogService
          .countByAction(
            condominiumId,
            "LOGIN"
          ),

        AuditLogService
          .countByAction(
            condominiumId,
            "LOGOUT"
          ),

        AuditLogService
          .countByAction(
            condominiumId,
            "STATUS_CHANGE"
          ),
      ]);

      return res.json({
        success: true,
        data: {
          total,
          create,
          update,
          delete: deleteActions,
          login,
          logout,
          statusChange,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default new AuditLogController();
