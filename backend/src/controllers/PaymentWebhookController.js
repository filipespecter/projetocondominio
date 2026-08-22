import PaymentWebhookService from "../services/PaymentWebhookService.js";

class PaymentWebhookController {
  async mercadoPago(
    req,
    res,
    next
  ) {
    try {
      const result =
        await PaymentWebhookService
          .handleMercadoPago({
            payload:
              req.body,

            headers:
              req.headers,

            query:
              req.query,

            requestContext: {
              requestId:
                req.requestId ??
                req.headers[
                  "x-request-id"
                ] ??
                null,

              ipAddress:
                req.ip ??
                null,

              userAgent:
                req.headers[
                  "user-agent"
                ] ??
                null,
            },
          });

      return res.status(200).json({
        success: true,

        message:
          "Webhook recebido com sucesso.",

        data:
          result,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default new PaymentWebhookController();
