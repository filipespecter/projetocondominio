import ApartmentService from "../services/ApartmentService.js";

class ApartmentController {
  async index(req, res, next) {
    try {
      const condominiumId = req.user.condominiumId;
      const { status } = req.query;

      const data = status
        ? await ApartmentService.findByStatus(condominiumId, status)
        : await ApartmentService.findAll(condominiumId);

      return res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async directory(
    req,
    res,
    next
  ) {
    try {
      const data =
        await ApartmentService
          .operationalDirectory(
            req.user
              .condominiumId
          );

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async show(req, res, next) {
    try {
      const data = await ApartmentService.findById(
        req.params.id,
        req.user.condominiumId
      );

      return res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const data = await ApartmentService.create(
        req.user.condominiumId,
        req.body,
        req.user
      );

      return res.status(201).json({
        success: true,
        message: "Apartamento cadastrado com sucesso.",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data = await ApartmentService.update(
        req.params.id,
        req.user.condominiumId,
        req.body,
        req.user
      );

      return res.json({
        success: true,
        message: "Apartamento atualizado com sucesso.",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async changeStatus(req, res, next) {
    try {
      const data = await ApartmentService.changeStatus(
        req.params.id,
        req.user.condominiumId,
        req.body.status,
        req.user
      );

      return res.json({
        success: true,
        message: "Status atualizado com sucesso.",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const data = await ApartmentService.remove(
        req.params.id,
        req.user.condominiumId,
        req.user
      );

      return res.json({
        success: true,
        ...data,
      });
    } catch (error) {
      next(error);
    }
  }

  async statistics(req, res, next) {
    try {
      const data = await ApartmentService.statistics(
        req.user.condominiumId
      );

      return res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export default new ApartmentController();
