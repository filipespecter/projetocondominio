import WhatsAppWebhookService from "../services/WhatsAppWebhookService.js";

class WhatsAppWebhookController {
  async verify(
    req,
    res,
    next
  ) {
    try {
      const challenge =
        WhatsAppWebhookService
          .verifyChallenge(
            req.query
          );

      return res
        .status(200)
        .send(
          String(
            challenge
          )
        );
    } catch (error) {
      return next(error);
    }
  }

  async receive(
    req,
    res,
    next
  ) {
    try {
      const rawBody =
        req.rawBody ??
        null;

      const signature =
        req.headers[
          "x-hub-signature-256"
        ] ??
        null;

      await WhatsAppWebhookService
        .processStatusWebhook({
          payload:
            req.body,
          rawBody,
          signature,
        });

      return res
        .status(200)
        .json({
          success: true,
        });
    } catch (error) {
      return next(error);
    }
  }
}

export default new WhatsAppWebhookController();
