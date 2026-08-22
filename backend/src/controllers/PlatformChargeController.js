import ChargeService from "../services/ChargeService.js";

class PlatformChargeController {
  getRequestContext(req) {
    return {
      requestId: req.requestId ?? null,
      ipAddress: req.ip ?? null,
      userAgent:
        req.get?.("user-agent") ?? null,
    };
  }

  async indexByCondominium(
    req,
    res,
    next
  ) {
    try {
      const result =
        await ChargeService.findByCondominium(
          req.params.condominiumId
        );

      return res.status(200).json({
        success: true,
        message:
          "Cobranças carregadas com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async show(req, res, next) {
    try {
      const result =
        await ChargeService.findById(
          req.params.id
        );

      return res.status(200).json({
        success: true,
        message:
          "Cobrança carregada com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async store(req, res, next) {
    try {
      const result =
        await ChargeService.create(
          req.body,
          req.user,
          this.getRequestContext(req)
        );

      return res.status(201).json({
        success: true,
        message:
          "Cobrança criada com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async markPaid(req, res, next) {
    try {
      const result =
        await ChargeService.changeStatus(
          req.params.id,
          "PAID",
          req.user,
          this.getRequestContext(req),
          {
            paidAt:
              req.body.paidAt,
          }
        );

      return res.status(200).json({
        success: true,
        message:
          "Cobrança marcada como paga.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async markOverdue(req, res, next) {
    try {
      const result =
        await ChargeService.changeStatus(
          req.params.id,
          "OVERDUE",
          req.user,
          this.getRequestContext(req)
        );

      return res.status(200).json({
        success: true,
        message:
          "Cobrança marcada como vencida.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async cancel(req, res, next) {
    try {
      const result =
        await ChargeService.changeStatus(
          req.params.id,
          "CANCELED",
          req.user,
          this.getRequestContext(req)
        );

      return res.status(200).json({
        success: true,
        message:
          "Cobrança cancelada com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async refund(req, res, next) {
    try {
      const result =
        await ChargeService.changeStatus(
          req.params.id,
          "REFUNDED",
          req.user,
          this.getRequestContext(req)
        );

      return res.status(200).json({
        success: true,
        message:
          "Cobrança marcada como reembolsada.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }


  async processGateway(
    req,
    res,
    next
  ) {
    try {
      const {
        default:
          PaymentGatewayOrchestratorService,
      } = await import(
        "../services/PaymentGatewayOrchestratorService.js"
      );

      const result =
        await PaymentGatewayOrchestratorService
          .processCharge(
            req.params.id,
            req.body ?? {},
            req.user,
            this.getRequestContext(req)
          );

      return res.status(200).json({
        success: true,
        message:
          "Cobrança enviada ao gateway com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async refundGateway(
    req,
    res,
    next
  ) {
    try {
      const {
        default:
          PaymentGatewayOrchestratorService,
      } = await import(
        "../services/PaymentGatewayOrchestratorService.js"
      );

      const result =
        await PaymentGatewayOrchestratorService
          .refundCharge(
            req.params.id,
            req.body?.amountInCents ??
              null,
            req.user,
            this.getRequestContext(req)
          );

      return res.status(200).json({
        success: true,
        message:
          "Reembolso enviado ao gateway com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async statistics(req, res, next) {
    try {
      const result =
        await ChargeService.statistics();

      return res.status(200).json({
        success: true,
        message:
          "Estatísticas financeiras carregadas com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default new PlatformChargeController();
