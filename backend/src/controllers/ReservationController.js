import ReservationService from "../services/ReservationService.js";

function requestContext(req) {
  return {
    ipAddress:
      req.ip ?? null,
    userAgent:
      req.get("user-agent") ??
      null,
  };
}

class ReservationController {
  async index(req, res, next) {
    try {
      const condominiumId =
        req.user.condominiumId;

      const {
        status,
        apartmentId,
        userId,
      } = req.query;

      let data;

      if (apartmentId) {
        data =
          await ReservationService
            .findByApartment(
              apartmentId,
              condominiumId
            );
      } else if (userId) {
        data =
          await ReservationService
            .findByUser(
              userId,
              condominiumId
            );
      } else if (status) {
        data =
          await ReservationService
            .findByStatus(
              condominiumId,
              status
            );
      } else {
        data =
          await ReservationService
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

  async myReservations(req, res, next) {
    try {
      const data = await ReservationService.findByUser(
        req.user.id,
        req.user.condominiumId
      );

      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async show(req, res, next) {
    try {
      const data =
        await ReservationService
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
        await ReservationService.create(
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
            "Solicitação de reserva criada com sucesso.",
          data,
        });
    } catch (error) {
      return next(error);
    }
  }

  async createAdministrative(
    req,
    res,
    next
  ) {
    try {
      const data =
        await ReservationService
          .createAdministrative(
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
            "Reserva administrativa criada com sucesso.",
          data,
        });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data =
        await ReservationService.update(
          req.params.id,
          req.user.condominiumId,
          req.body,
          req.user,
          requestContext(req)
        );

      return res.json({
        success: true,
        message:
          "Reserva atualizada com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async approve(req, res, next) {
    try {
      const data =
        await ReservationService
          .approve(
            req.params.id,
            req.user.condominiumId,
            req.user,
            req.body.reviewReason,
            requestContext(req)
          );

      return res.json({
        success: true,
        message:
          "Reserva aprovada com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async reject(req, res, next) {
    try {
      const data =
        await ReservationService
          .reject(
            req.params.id,
            req.user.condominiumId,
            req.body.reviewReason,
            req.user,
            requestContext(req)
          );

      return res.json({
        success: true,
        message:
          "Reserva rejeitada com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async reopen(req, res, next) {
    try {
      const data =
        await ReservationService
          .reopen(
            req.params.id,
            req.user.condominiumId,
            req.user,
            requestContext(req)
          );

      return res.json({
        success: true,
        message:
          "Reserva reaberta com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async cancel(req, res, next) {
    try {
      const data =
        await ReservationService
          .cancel(
            req.params.id,
            req.user.condominiumId,
            req.user,
            requestContext(req)
          );

      return res.json({
        success: true,
        message:
          "Reserva cancelada com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async complete(req, res, next) {
    try {
      const data =
        await ReservationService
          .complete(
            req.params.id,
            req.user.condominiumId,
            req.user,
            requestContext(req)
          );

      return res.json({
        success: true,
        message:
          "Reserva concluída com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const data =
        await ReservationService
          .remove(
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
        await ReservationService
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

export default new ReservationController();
