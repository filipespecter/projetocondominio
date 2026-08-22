import CommonAreaService from "../services/CommonAreaService.js";

function requestContext(req) {
  return {
    ipAddress:
      req.ip ?? null,
    userAgent:
      req.get("user-agent") ??
      null,
  };
}

class CommonAreaController {
  async index(req, res, next) {
    try {
      const condominiumId =
        req.user.condominiumId;

      const {
        active,
        reservationRequired,
      } = req.query;

      let data;

      if (
        reservationRequired === true
      ) {
        data =
          await CommonAreaService
            .findReservationRequired(
              condominiumId
            );
      } else if (active === true) {
        data =
          await CommonAreaService
            .findActive(
              condominiumId
            );
      } else {
        data =
          await CommonAreaService
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
        await CommonAreaService
          .findById(
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
        await CommonAreaService.create(
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
            "Área comum cadastrada com sucesso.",
          data,
        });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data =
        await CommonAreaService.update(
          req.params.id,
          req.user.condominiumId,
          req.body,
          req.user,
          requestContext(req)
        );

      return res.json({
        success: true,
        message:
          "Área comum atualizada com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async activate(req, res, next) {
    try {
      const data =
        await CommonAreaService
          .activate(
            req.params.id,
            req.user.condominiumId,
            req.user,
            requestContext(req)
          );

      return res.json({
        success: true,
        message:
          "Área comum ativada com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async deactivate(
    req,
    res,
    next
  ) {
    try {
      const data =
        await CommonAreaService
          .deactivate(
            req.params.id,
            req.user.condominiumId,
            req.user,
            requestContext(req)
          );

      return res.json({
        success: true,
        message:
          "Área comum desativada com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async setReservationRequired(
    req,
    res,
    next
  ) {
    try {
      const data =
        await CommonAreaService
          .setReservationRequired(
            req.params.id,
            req.user.condominiumId,
            req.body
              .reservationRequired,
            req.user,
            requestContext(req)
          );

      return res.json({
        success: true,
        message:
          "Regra de reserva atualizada com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const data =
        await CommonAreaService.remove(
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

  async statistics(
    req,
    res,
    next
  ) {
    try {
      const data =
        await CommonAreaService
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

export default new CommonAreaController();
