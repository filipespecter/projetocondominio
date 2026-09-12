import PrivateServiceRequestService from "../services/PrivateServiceRequestService.js";

class PrivateServiceRequestController {
  context(req) {
    return {
      requestId: req.requestId ?? null,
      ipAddress: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
    };
  }

  async index(req, res, next) {
    try {
      const data = await PrivateServiceRequestService.list(req.user, req.query);
      return res.json({ success: true, data });
    } catch (error) { return next(error); }
  }

  async create(req, res, next) {
    try {
      const data = await PrivateServiceRequestService.create(req.user, req.body, this.context(req));
      return res.status(201).json({ success: true, message: "Solicitação enviada para análise do síndico.", data });
    } catch (error) { return next(error); }
  }

  async cancel(req, res, next) {
    try {
      const data = await PrivateServiceRequestService.cancel(req.user, req.params.id, this.context(req));
      return res.json({ success: true, message: "Solicitação cancelada.", data });
    } catch (error) { return next(error); }
  }

  async approve(req, res, next) {
    try {
      const data = await PrivateServiceRequestService.approve(req.user, req.params.id, req.body, this.context(req));
      return res.json({ success: true, message: "Solicitação aprovada e acesso do prestador agendado.", data });
    } catch (error) { return next(error); }
  }

  async reject(req, res, next) {
    try {
      const data = await PrivateServiceRequestService.reject(req.user, req.params.id, req.body, this.context(req));
      return res.json({ success: true, message: "Solicitação rejeitada.", data });
    } catch (error) { return next(error); }
  }
}

export default new PrivateServiceRequestController();
