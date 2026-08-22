import PaymentTransactionService from "../services/PaymentTransactionService.js";

class PlatformPaymentTransactionController {
  getRequestContext(req) {
    return {
      requestId: req.requestId ?? null,
      ipAddress: req.ip ?? null,
      userAgent:
        req.get?.("user-agent") ?? null,
    };
  }

  async indexByCharge(
    req,
    res,
    next
  ) {
    try {
      const result =
        await PaymentTransactionService.findByCharge(
          req.params.chargeId
        );

      return res.status(200).json({
        success: true,
        message:
          "Transações carregadas com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async show(req, res, next) {
    try {
      const result =
        await PaymentTransactionService.findById(
          req.params.id
        );

      return res.status(200).json({
        success: true,
        message:
          "Transação carregada com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async store(req, res, next) {
    try {
      const result =
        await PaymentTransactionService.create(
          req.body,
          req.user,
          this.getRequestContext(req)
        );

      return res.status(201).json({
        success: true,
        message:
          "Transação registrada com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async changeStatus(req, res, next) {
    try {
      const result =
        await PaymentTransactionService.updateStatus(
          req.params.id,
          req.body.status,
          req.body,
          req.user,
          this.getRequestContext(req)
        );

      return res.status(200).json({
        success: true,
        message:
          "Status da transação atualizado com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default new PlatformPaymentTransactionController();
