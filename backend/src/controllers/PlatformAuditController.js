import PlatformAuditService from "../services/PlatformAuditService.js";

class PlatformAuditController {
  async index(req, res, next) {
    try {
      const result =
        await PlatformAuditService
          .list(req.query);

      return res.status(200).json({
        success: true,
        message:
          "Auditoria global carregada com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async statistics(req, res, next) {
    try {
      const result =
        await PlatformAuditService
          .statistics();

      return res.status(200).json({
        success: true,
        message:
          "Indicadores de auditoria carregados com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async show(req, res, next) {
    try {
      const result =
        await PlatformAuditService
          .findById(
            req.params.id
          );

      return res.status(200).json({
        success: true,
        message:
          "Registro de auditoria carregado com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async condominiumTimeline(
    req,
    res,
    next
  ) {
    try {
      const result =
        await PlatformAuditService
          .condominiumTimeline(
            req.params.condominiumId,
            req.query
          );

      return res.status(200).json({
        success: true,
        message:
          "Timeline do condomínio carregada com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async userTimeline(
    req,
    res,
    next
  ) {
    try {
      const result =
        await PlatformAuditService
          .userTimeline(
            req.params.userId,
            req.query
          );

      return res.status(200).json({
        success: true,
        message:
          "Timeline do usuário carregada com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async supportTimeline(
    req,
    res,
    next
  ) {
    try {
      const result =
        await PlatformAuditService
          .supportTimeline(
            req.params.supportSessionId,
            req.query
          );

      return res.status(200).json({
        success: true,
        message:
          "Timeline da sessão de suporte carregada com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async requestTimeline(
    req,
    res,
    next
  ) {
    try {
      const result =
        await PlatformAuditService
          .requestTimeline(
            req.params.requestId
          );

      return res.status(200).json({
        success: true,
        message:
          "Rastreamento da requisição carregado com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default new PlatformAuditController();
