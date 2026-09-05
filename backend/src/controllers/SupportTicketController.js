import SupportTicketService from "../services/SupportTicketService.js";

class SupportTicketController {
  async create(req, res, next) { try { const data = await SupportTicketService.create(req.body, req.user); return res.status(201).json({ success: true, message: "Solicitação de atendimento aberta com sucesso.", data }); } catch (e) { return next(e); } }
  async mine(req, res, next) { try { const data = await SupportTicketService.listMine(req.user); return res.json({ success: true, data }); } catch (e) { return next(e); } }
  async platform(req, res, next) { try { const data = await SupportTicketService.listPlatform(req.query); return res.json({ success: true, data }); } catch (e) { return next(e); } }
  async stats(req, res, next) { try { const data = await SupportTicketService.statistics(); return res.json({ success: true, data }); } catch (e) { return next(e); } }
  async update(req, res, next) { try { const data = await SupportTicketService.update(req.params.id, req.body, req.user); return res.json({ success: true, message: "Solicitação atualizada.", data }); } catch (e) { return next(e); } }
}
export default new SupportTicketController();
