import OccurrenceService from "../services/OccurrenceService.js";

function requestContext(req) {
  return {
    ipAddress:
      req.ip ?? null,
    userAgent:
      req.get("user-agent") ??
      null,
  };
}

class OccurrenceController {
  async index(req, res, next) {
    try {
      const condominiumId =
        req.user.condominiumId;

      const {
        status,
        type,
        priority,
        apartmentId,
        createdByUserId,
        activeOnly,
      } = req.query;

      let data;

      if (activeOnly === true) {
        data =
          await OccurrenceService
            .findActive(
              condominiumId
            );
      } else if (apartmentId) {
        data =
          await OccurrenceService
            .findByApartment(
              apartmentId,
              condominiumId
            );
      } else if (createdByUserId) {
        data =
          await OccurrenceService
            .findByUser(
              createdByUserId,
              condominiumId
            );
      } else if (status) {
        data =
          await OccurrenceService
            .findByStatus(
              condominiumId,
              status
            );
      } else if (type) {
        data =
          await OccurrenceService
            .findByType(
              condominiumId,
              type
            );
      } else if (priority) {
        data =
          await OccurrenceService
            .findByPriority(
              condominiumId,
              priority
            );
      } else {
        data =
          await OccurrenceService
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

  /**
   * Lista somente as ocorrências criadas
   * pelo usuário autenticado.
   */
  async myOccurrences(
    req,
    res,
    next
  ) {
    try {
      const data =
        await OccurrenceService
          .findByUser(
            req.user.id,
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

  async show(req, res, next) {
    try {
      const data =
        await OccurrenceService
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
        await OccurrenceService
          .create(
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
            "Ocorrência registrada com sucesso.",
          data,
        });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data =
        await OccurrenceService
          .update(
            req.params.id,
            req.user.condominiumId,
            req.body,
            req.user,
            requestContext(req)
          );

      return res.json({
        success: true,
        message:
          "Ocorrência atualizada com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async assign(req, res, next) {
    try {
      const data =
        await OccurrenceService
          .assign(
            req.params.id,
            req.user.condominiumId,
            req.body.assignedToUserId,
            req.user,
            requestContext(req)
          );

      return res.json({
        success: true,
        message:
          "Ocorrência atribuída com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async markAsInReview(
    req,
    res,
    next
  ) {
    try {
      const data =
        await OccurrenceService
          .markAsInReview(
            req.params.id,
            req.user.condominiumId,
            req.user,
            requestContext(req)
          );

      return res.json({
        success: true,
        message:
          "Ocorrência colocada em análise.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async startProgress(
    req,
    res,
    next
  ) {
    try {
      const data =
        await OccurrenceService
          .startProgress(
            req.params.id,
            req.user.condominiumId,
            req.user,
            requestContext(req)
          );

      return res.json({
        success: true,
        message:
          "Atendimento da ocorrência iniciado.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async resolve(req, res, next) {
    try {
      const data =
        await OccurrenceService
          .resolve(
            req.params.id,
            req.user.condominiumId,
            req.body.resolution,
            req.user,
            requestContext(req)
          );

      return res.json({
        success: true,
        message:
          "Ocorrência resolvida com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async close(req, res, next) {
    try {
      const data =
        await OccurrenceService
          .close(
            req.params.id,
            req.user.condominiumId,
            req.user,
            requestContext(req)
          );

      return res.json({
        success: true,
        message:
          "Ocorrência encerrada com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async cancel(req, res, next) {
    try {
      const data =
        await OccurrenceService
          .cancel(
            req.params.id,
            req.user.condominiumId,
            req.user,
            requestContext(req)
          );

      return res.json({
        success: true,
        message:
          "Ocorrência cancelada com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async markAsReadByManager(
    req,
    res,
    next
  ) {
    try {
      const data =
        await OccurrenceService
          .markAsReadByManager(
            req.params.id,
            req.user.condominiumId
          );

      return res.json({
        success: true,
        message:
          "Ocorrência marcada como lida pelo gestor.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async markAsReadByDoorman(
    req,
    res,
    next
  ) {
    try {
      const data =
        await OccurrenceService
          .markAsReadByDoorman(
            req.params.id,
            req.user.condominiumId
          );

      return res.json({
        success: true,
        message:
          "Ocorrência marcada como lida pelo porteiro.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const data =
        await OccurrenceService
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
        await OccurrenceService
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

export default new OccurrenceController();
