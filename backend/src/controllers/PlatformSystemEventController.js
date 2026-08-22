import SystemEventService from "../services/SystemEventService.js";

class PlatformSystemEventController {
  async index(req, res, next) { try { return res.status(200).json({ success: true, message: "Eventos do sistema carregados com sucesso.", data: await SystemEventService.list(req.query) }); } catch (e) { return next(e); } }
  async show(req, res, next) { try { return res.status(200).json({ success: true, message: "Evento do sistema carregado com sucesso.", data: await SystemEventService.findById(req.params.id) }); } catch (e) { return next(e); } }
  async statistics(req, res, next) { try { return res.status(200).json({ success: true, message: "Estatísticas de eventos carregadas com sucesso.", data: await SystemEventService.statistics() }); } catch (e) { return next(e); } }
  async resolve(req, res, next) { try { return res.status(200).json({ success: true, message: "Evento marcado como resolvido.", data: await SystemEventService.resolve(req.params.id, req.user, req.body?.resolutionNotes) }); } catch (e) { return next(e); } }
  async reopen(req, res, next) { try { return res.status(200).json({ success: true, message: "Evento reaberto com sucesso.", data: await SystemEventService.reopen(req.params.id) }); } catch (e) { return next(e); } }
}
export default new PlatformSystemEventController();
