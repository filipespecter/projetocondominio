import CommunicationService from "../services/CommunicationService.js";

class PlatformCommunicationController {
  getRequestContext(req) {
    return {
      requestId:
        req.requestId ??
        null,

      ipAddress:
        req.ip ??
        null,

      userAgent:
        req.headers[
          "user-agent"
        ] ??
        null,
    };
  }

  async statistics(
    req,
    res,
    next
  ) {
    try {
      const result =
        await CommunicationService
          .statistics();

      return res.status(200).json({
        success: true,
        message:
          "Estatísticas de comunicação carregadas com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async failed(
    req,
    res,
    next
  ) {
    try {
      const limit =
        Number(
          req.query.limit ??
          100
        );

      const result =
        await CommunicationService
          .findFailed(limit);

      return res.status(200).json({
        success: true,
        message:
          "Comunicações com falha carregadas com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async condominium(
    req,
    res,
    next
  ) {
    try {
      const result =
        await CommunicationService
          .findByCondominium(
            req.params
              .condominiumId
          );

      return res.status(200).json({
        success: true,
        message:
          "Comunicações do condomínio carregadas com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async show(
    req,
    res,
    next
  ) {
    try {
      const result =
        await CommunicationService
          .findById(
            req.params.id
          );

      return res.status(200).json({
        success: true,
        message:
          "Comunicação carregada com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async retry(
    req,
    res,
    next
  ) {
    try {
      const result =
        await CommunicationService
          .retry(
            req.params.id,
            req.user,
            this.getRequestContext(
              req
            )
          );

      return res.status(200).json({
        success: true,
        message:
          "Reenvio processado com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default new PlatformCommunicationController();
