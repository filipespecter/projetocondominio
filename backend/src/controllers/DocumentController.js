import DocumentService from "../services/DocumentService.js";

function context(req) {
  return { ipAddress: req.ip ?? null, userAgent: req.get("user-agent") ?? null, requestId: req.requestId ?? null };
}

class DocumentController {
  async index(req, res, next) {
    try {
      const data = await DocumentService.findAll(req.user.condominiumId, req.user.role, req.query);
      return res.json({ success: true, data });
    } catch (error) { return next(error); }
  }
  async show(req, res, next) {
    try {
      const data = await DocumentService.findById(req.params.id, req.user.condominiumId, req.user.role);
      return res.json({ success: true, data });
    } catch (error) { return next(error); }
  }
  async create(req, res, next) {
    try {
      const data = await DocumentService.create(req.user.condominiumId, req.body, req.user, context(req));
      return res.status(201).json({ success: true, message: "Documento cadastrado com sucesso.", data });
    } catch (error) { return next(error); }
  }
  async update(req, res, next) {
    try {
      const data = await DocumentService.update(req.params.id, req.user.condominiumId, req.body, req.user, context(req));
      return res.json({ success: true, message: "Documento atualizado com sucesso.", data });
    } catch (error) { return next(error); }
  }
  async remove(req, res, next) {
    try {
      const data = await DocumentService.remove(req.params.id, req.user.condominiumId, req.user, context(req));
      return res.json({ success: true, ...data });
    } catch (error) { return next(error); }
  }
  async download(req, res, next) {
    try {
      const data = await DocumentService.download(req.params.id, req.user.condominiumId, req.user.role);
      return res.json({ success: true, data });
    } catch (error) { return next(error); }
  }
}

export default new DocumentController();
