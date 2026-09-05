import SupportTicketService from "../services/SupportTicketService.js";

function requestContext(req) {
  return { requestId: req.requestId ?? null, ipAddress: req.ip ?? null, userAgent: req.headers["user-agent"] ?? null };
}

class SupportTicketController {
  async index(req, res, next) {
    try {
      const data = await SupportTicketService.listForUser(req.user, req.query);
      return res.status(200).json({ success: true, message: "Solicitações carregadas com sucesso.", data });
    } catch (error) { return next(error); }
  }
  async store(req, res, next) {
    try {
      const data = await SupportTicketService.createForUser(req.body, req.user, requestContext(req));
      return res.status(201).json({ success: true, message: "Solicitação aberta com sucesso.", data });
    } catch (error) { return next(error); }
  }
  async platformIndex(req, res, next) {
    try {
      const data = await SupportTicketService.platformList(req.query);
      return res.status(200).json({ success: true, message: "Central de solicitações carregada com sucesso.", data });
    } catch (error) { return next(error); }
  }
  async platformUpdate(req, res, next) {
    try {
      const data = await SupportTicketService.updatePlatform(req.params.id, req.body, req.user, requestContext(req));
      return res.status(200).json({ success: true, message: "Solicitação atualizada com sucesso.", data });
    } catch (error) { return next(error); }
  }
}

export default new SupportTicketController();
