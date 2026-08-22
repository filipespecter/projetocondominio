import SupportSessionService from "../services/SupportSessionService.js";

class PlatformSupportController {
  getRequestContext(req) {
    return {
      requestId:
        req.requestId ?? null,

      ipAddress:
        req.ip ?? null,

      userAgent:
        req.headers[
          "user-agent"
        ] ?? null,
    };
  }

  async start(
    req,
    res,
    next
  ) {
    try {
      const session =
        await SupportSessionService
          .start(
            req.body.condominiumId,
            req.body.reason,
            req.user,
            this.getRequestContext(
              req
            )
          );

      return res.status(201).json({
        success: true,

        message:
          "Sessão de suporte iniciada com sucesso.",

        data:
          session,
      });
    } catch (error) {
      return next(error);
    }
  }

  async current(
    req,
    res,
    next
  ) {
    try {
      const session =
        await SupportSessionService
          .getCurrent(
            req.user
          );

      return res.status(200).json({
        success: true,

        message:
          session
            ? "Sessão de suporte ativa carregada com sucesso."
            : "Nenhuma sessão de suporte ativa.",

        data:
          session,
      });
    } catch (error) {
      return next(error);
    }
  }

  async history(
    req,
    res,
    next
  ) {
    try {
      const sessions =
        await SupportSessionService
          .listMine(
            req.user
          );

      return res.status(200).json({
        success: true,

        message:
          "Histórico de sessões de suporte carregado com sucesso.",

        data:
          sessions,
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
      const session =
        await SupportSessionService
          .findById(
            req.params.id,
            req.user
          );

      return res.status(200).json({
        success: true,

        message:
          "Sessão de suporte carregada com sucesso.",

        data:
          session,
      });
    } catch (error) {
      return next(error);
    }
  }

  async close(
    req,
    res,
    next
  ) {
    try {
      const session =
        await SupportSessionService
          .close(
            req.params.id,
            req.user,
            this.getRequestContext(
              req
            )
          );

      return res.status(200).json({
        success: true,

        message:
          "Sessão de suporte encerrada com sucesso.",

        data:
          session,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default new PlatformSupportController();
