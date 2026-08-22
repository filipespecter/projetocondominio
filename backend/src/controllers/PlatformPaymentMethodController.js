import PaymentMethodService from "../services/PaymentMethodService.js";

class PlatformPaymentMethodController {
  getRequestContext(req) {
    return {
      requestId: req.requestId ?? null,
      ipAddress: req.ip ?? null,
      userAgent:
        req.get?.("user-agent") ?? null,
    };
  }

  async index(req, res, next) {
    try {
      const result =
        await PaymentMethodService.findByCondominium(
          req.params.condominiumId
        );

      return res.status(200).json({
        success: true,
        message:
          "Métodos de pagamento carregados com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async show(req, res, next) {
    try {
      const result =
        await PaymentMethodService.findById(
          req.params.id
        );

      return res.status(200).json({
        success: true,
        message:
          "Método de pagamento carregado com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async store(req, res, next) {
    try {
      const result =
        await PaymentMethodService.create(
          {
            ...req.body,
            condominiumId:
              req.params.condominiumId,
          },
          req.user,
          this.getRequestContext(req)
        );

      return res.status(201).json({
        success: true,
        message:
          "Método de pagamento configurado com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const current =
        await PaymentMethodService.findById(
          req.params.id
        );

      if (
        current.condominiumId !==
        req.params.condominiumId
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Método de pagamento não encontrado para este condomínio.",
        });
      }

      const result =
        await PaymentMethodService.update(
          req.params.id,
          req.body,
          req.user,
          this.getRequestContext(req)
        );

      return res.status(200).json({
        success: true,
        message:
          "Método de pagamento atualizado com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async changeStatus(req, res, next) {
    try {
      const current =
        await PaymentMethodService.findById(
          req.params.id
        );

      if (
        current.condominiumId !==
        req.params.condominiumId
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Método de pagamento não encontrado para este condomínio.",
        });
      }

      const result =
        await PaymentMethodService.changeStatus(
          req.params.id,
          req.body.status,
          req.user,
          this.getRequestContext(req)
        );

      return res.status(200).json({
        success: true,
        message:
          "Status do método de pagamento atualizado com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default new PlatformPaymentMethodController();
