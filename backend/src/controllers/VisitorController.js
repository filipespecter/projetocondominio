import VisitorService from "../services/VisitorService.js";

function requestContext(req) {
  return {
    ipAddress:
      req.ip ?? null,
    userAgent:
      req.get("user-agent") ??
      null,
  };
}

class VisitorController {
  async index(req, res, next) {
    try {
      const condominiumId =
        req.user.condominiumId;

      const {
        status,
        apartmentId,
      } = req.query;

      let data;

      if (apartmentId) {
        data =
          await VisitorService
            .findByApartment(
              apartmentId,
              condominiumId
            );
      } else if (status) {
        data =
          await VisitorService
            .findByStatus(
              condominiumId,
              status
            );
      } else {
        data =
          await VisitorService
            .findAll(
              condominiumId
            );
      }

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async show(req, res, next) {
    try {
      const data =
        await VisitorService.findById(
          req.params.id,
          req.user.condominiumId
        );

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async create(req, res, next) {
    try {
      const data =
        await VisitorService.create(
          req.user.condominiumId,
          req.body,
          req.user,
          requestContext(req)
        );

      return res
        .status(201)
        .json({
          success: true,
          message:
            "Visitante cadastrado com sucesso.",
          data,
        });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data =
        await VisitorService.update(
          req.params.id,
          req.user.condominiumId,
          req.body,
          req.user,
          requestContext(req)
        );

      return res.json({
        success: true,
        message:
          "Visitante atualizado com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async authorize(req, res, next) {
    try {
      const data =
        await VisitorService.authorize(
          req.params.id,
          req.user.condominiumId,
          req.user,
          requestContext(req)
        );

      return res.json({
        success: true,
        message:
          "Visitante autorizado com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async deny(req, res, next) {
    try {
      const data =
        await VisitorService.deny(
          req.params.id,
          req.user.condominiumId,
          req.user,
          requestContext(req)
        );

      return res.json({
        success: true,
        message:
          "Entrada do visitante negada.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async registerEntry(
    req,
    res,
    next
  ) {
    try {
      const data =
        await VisitorService
          .registerEntry(
            req.params.id,
            req.user.condominiumId,
            req.user,
            requestContext(req)
          );

      return res.json({
        success: true,
        message:
          "Entrada registrada com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async registerExit(
    req,
    res,
    next
  ) {
    try {
      const data =
        await VisitorService
          .registerExit(
            req.params.id,
            req.user.condominiumId,
            req.user,
            requestContext(req)
          );

      return res.json({
        success: true,
        message:
          "Saída registrada com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const data =
        await VisitorService.remove(
          req.params.id,
          req.user.condominiumId,
          req.user,
          requestContext(req)
        );

      return res.json({
        success: true,
        ...data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async myInvitations(req, res, next) {
    try {
      const data = await VisitorService.listMyInvitations(
        req.user.condominiumId,
        req.user
      );

      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async createInvitation(req, res, next) {
    try {
      const data = await VisitorService.createInvitation(
        req.user.condominiumId,
        req.body,
        req.user,
        requestContext(req)
      );

      return res.status(201).json({
        success: true,
        message: "Convite de visitante criado com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async cancelInvitation(req, res, next) {
    try {
      const data = await VisitorService.cancelMyInvitation(
        req.params.id,
        req.user.condominiumId,
        req.user,
        requestContext(req)
      );

      return res.json({
        success: true,
        message: "Convite cancelado com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async validateInvitation(req, res, next) {
    try {
      const data = await VisitorService.validateInvitation(
        req.user.condominiumId,
        req.body.token,
        req.user,
        requestContext(req)
      );

      return res.json({
        success: true,
        message: "QR validado. Entrada do visitante registrada.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async statistics(
    req,
    res,
    next
  ) {
    try {
      const data =
        await VisitorService
          .statistics(
            req.user.condominiumId
          );

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default new VisitorController();
