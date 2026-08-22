import DelinquencyService from "../services/DelinquencyService.js";

class PlatformDelinquencyController {
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

  async run(
    req,
    res,
    next
  ) {
    try {
      const referenceDate =
        req.body
          ?.referenceDate
          ? new Date(
              req.body
                .referenceDate
            )
          : new Date();

      const result =
        await DelinquencyService
          .runDaily(
            referenceDate,
            this.getRequestContext(
              req
            )
          );

      return res.status(200).json({
        success: true,
        message:
          "Rotina de inadimplência executada com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default new PlatformDelinquencyController();
