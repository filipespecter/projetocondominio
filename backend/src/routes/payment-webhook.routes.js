import { Router } from "express";

import PaymentWebhookController from "../controllers/PaymentWebhookController.js";

const paymentWebhookRoutes =
  Router();

/**
 * =====================================================
 * WEBHOOKS DE PAGAMENTO
 * =====================================================
 *
 * Rotas públicas por necessidade técnica.
 *
 * Não utilizam authMiddleware porque são chamadas
 * diretamente pelos provedores externos.
 *
 * A autenticidade é validada pela assinatura secreta
 * do próprio provedor.
 */
paymentWebhookRoutes.post(
  "/mercado-pago",
  (req, res, next) =>
    PaymentWebhookController
      .mercadoPago(
        req,
        res,
        next
      )
);

export default paymentWebhookRoutes;
