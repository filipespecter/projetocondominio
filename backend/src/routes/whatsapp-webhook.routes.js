import { Router } from "express";

import WhatsAppWebhookController from "../controllers/WhatsAppWebhookController.js";

const whatsappWebhookRoutes =
  Router();

/**
 * GET /api/v1/webhooks/whatsapp
 *
 * Validação inicial realizada pela Meta
 * ao cadastrar a URL do webhook.
 */
whatsappWebhookRoutes.get(
  "/",
  (req, res, next) =>
    WhatsAppWebhookController
      .verify(
        req,
        res,
        next
      )
);

/**
 * POST /api/v1/webhooks/whatsapp
 *
 * Recebe atualizações de status:
 *
 * SENT
 * DELIVERED
 * READ
 * FAILED
 */
whatsappWebhookRoutes.post(
  "/",
  (req, res, next) =>
    WhatsAppWebhookController
      .receive(
        req,
        res,
        next
      )
);

export default whatsappWebhookRoutes;
