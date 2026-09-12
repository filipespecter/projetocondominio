import ContractService from "../services/ContractService.js";

const context = (req) => ({
  ipAddress: req.ip ?? null,
  userAgent: req.get("user-agent") ?? null,
  requestId: req.requestId ?? null,
});

class ContractController {
  async index(req, res, next) {
    try {
      return res.json({ success: true, data: await ContractService.findAll(req.user.condominiumId, req.query) });
    } catch (error) { return next(error); }
  }

  async show(req, res, next) {
    try {
      return res.json({ success: true, data: await ContractService.findById(req.params.id, req.user.condominiumId) });
    } catch (error) { return next(error); }
  }

  async create(req, res, next) {
    try {
      const data = await ContractService.create(req.user.condominiumId, req.body, req.user, context(req));
      return res.status(201).json({ success: true, message: "Contrato cadastrado com sucesso.", data });
    } catch (error) { return next(error); }
  }

  async update(req, res, next) {
    try {
      const data = await ContractService.update(req.params.id, req.user.condominiumId, req.body, req.user, context(req));
      return res.json({ success: true, message: "Contrato atualizado com sucesso.", data });
    } catch (error) { return next(error); }
  }

  async remove(req, res, next) {
    try {
      return res.json({ success: true, ...await ContractService.remove(req.params.id, req.user.condominiumId, req.user, context(req)) });
    } catch (error) { return next(error); }
  }

  async download(req, res, next) {
    try {
      return res.json({ success: true, data: await ContractService.download(req.params.id, req.user.condominiumId) });
    } catch (error) { return next(error); }
  }
}

export default new ContractController();
