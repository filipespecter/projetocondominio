import PlanService from "../services/PlanService.js";

class PlatformPlanController {
  async index(req, res, next) {
    try {
      const plans = await PlanService.findAll();
      return res.status(200).json({ success: true, message: "Planos carregados com sucesso.", data: plans });
    } catch (error) { return next(error); }
  }

  async active(req, res, next) {
    try {
      const plans = await PlanService.findActive();
      return res.status(200).json({ success: true, message: "Planos ativos carregados com sucesso.", data: plans });
    } catch (error) { return next(error); }
  }

  async inactive(req, res, next) {
    try {
      const plans = await PlanService.findInactive();
      return res.status(200).json({ success: true, message: "Planos inativos carregados com sucesso.", data: plans });
    } catch (error) { return next(error); }
  }

  async statistics(req, res, next) {
    try {
      const result = await PlanService.statistics();
      return res.status(200).json({ success: true, message: "Estatísticas de planos carregadas com sucesso.", data: result });
    } catch (error) { return next(error); }
  }

  async show(req, res, next) {
    try {
      const plan = await PlanService.findById(req.params.id);
      return res.status(200).json({ success: true, message: "Plano carregado com sucesso.", data: plan });
    } catch (error) { return next(error); }
  }

  async create(req, res, next) {
    try {
      const requestContext = {
        requestId: req.requestId ?? null,
        ipAddress: req.ip ?? null,
        userAgent: req.headers["user-agent"] ?? null,
      };
      const plan = await PlanService.create(req.body, req.user, requestContext);
      return res.status(201).json({ success: true, message: "Plano comercial criado com sucesso.", data: plan });
    } catch (error) { return next(error); }
  }

  async update(req, res, next) {
    try {
      const requestContext = {
        requestId: req.requestId ?? null,
        ipAddress: req.ip ?? null,
        userAgent: req.headers["user-agent"] ?? null,
      };
      const plan = await PlanService.update(req.params.id, req.body, req.user, requestContext);
      return res.status(200).json({ success: true, message: "Plano comercial atualizado com sucesso.", data: plan });
    } catch (error) { return next(error); }
  }

  async activate(req, res, next) {
    try {
      const requestContext = {
        requestId: req.requestId ?? null,
        ipAddress: req.ip ?? null,
        userAgent: req.headers["user-agent"] ?? null,
      };
      const plan = await PlanService.activate(req.params.id, req.user, requestContext);
      return res.status(200).json({ success: true, message: "Plano ativado com sucesso.", data: plan });
    } catch (error) { return next(error); }
  }

  async deactivate(req, res, next) {
    try {
      const requestContext = {
        requestId: req.requestId ?? null,
        ipAddress: req.ip ?? null,
        userAgent: req.headers["user-agent"] ?? null,
      };
      const plan = await PlanService.deactivate(req.params.id, req.user, requestContext);
      return res.status(200).json({ success: true, message: "Plano desativado com sucesso.", data: plan });
    } catch (error) { return next(error); }
  }

  async updateDisplayOrder(req, res, next) {
    try {
      const requestContext = {
        requestId: req.requestId ?? null,
        ipAddress: req.ip ?? null,
        userAgent: req.headers["user-agent"] ?? null,
      };
      const plan = await PlanService.updateDisplayOrder(
        req.params.id,
        req.body.displayOrder,
        req.user,
        requestContext
      );
      return res.status(200).json({ success: true, message: "Ordem de exibição atualizada com sucesso.", data: plan });
    } catch (error) { return next(error); }
  }

  async remove(req, res, next) {
    try {
      const requestContext = {
        requestId: req.requestId ?? null,
        ipAddress: req.ip ?? null,
        userAgent: req.headers["user-agent"] ?? null,
      };
      const result = await PlanService.remove(req.params.id, req.user, requestContext);
      return res.status(200).json({ success: true, ...result });
    } catch (error) { return next(error); }
  }
}

export default new PlatformPlanController();
