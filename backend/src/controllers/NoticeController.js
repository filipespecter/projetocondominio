import NoticeService from "../services/NoticeService.js";

function requestContext(req) {
  return {
    ipAddress:
      req.ip ?? null,
    userAgent:
      req.get("user-agent") ??
      null,
  };
}

class NoticeController {
  async index(req, res, next) {
    try {
      const condominiumId =
        req.user.condominiumId;

      const isAdministrative =
        [
          "CONDOMINIUM_ADMIN",
          "MANAGER",
        ].includes(
          req.user.role
        );

      let data;

      if (!isAdministrative) {
        data =
          await NoticeService
            .findVisibleForUser(
              condominiumId,
              req.user,
              { type: req.query.type }
            );
      } else {
        const {
          status,
          audience,
          category,
          apartmentId,
          publishedOnly,
          type,
        } = req.query;

        if (publishedOnly === true) {
          data =
            await NoticeService
              .findPublished(
                condominiumId,
                { type }
              );
        } else if (apartmentId) {
          data =
            await NoticeService
              .findByApartment(
                apartmentId,
                condominiumId
              );
        } else if (status) {
          data =
            await NoticeService
              .findByStatus(
                condominiumId,
                status
              );
        } else if (audience) {
          data =
            await NoticeService
              .findByAudience(
                condominiumId,
                audience
              );
        } else if (category) {
          data =
            await NoticeService
              .findByCategory(
                condominiumId,
                category
              );
        } else {
          data =
            await NoticeService
              .findAll(
                condominiumId,
                { type }
              );
        }
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
        await NoticeService
          .findVisibleById(
            req.params.id,
            req.user.condominiumId,
            req.user
          );

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async downloadAttachment(req, res, next) {
    try {
      const data = await NoticeService.downloadAttachment(
        req.params.id,
        req.params.index,
        req.user.condominiumId,
        req.user
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
        await NoticeService.create(
          req.user.condominiumId,
          req.user,
          req.body,
          requestContext(req)
        );

      return res
        .status(201)
        .json({
          success: true,
          message:
            data.status === "PUBLISHED"
              ? "Aviso criado e publicado com sucesso."
              : "Rascunho de aviso criado com sucesso.",
          data,
        });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data =
        await NoticeService.update(
          req.params.id,
          req.user.condominiumId,
          req.body,
          req.user,
          requestContext(req)
        );

      return res.json({
        success: true,
        message:
          "Aviso atualizado com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async publish(req, res, next) {
    try {
      const data =
        await NoticeService.publish(
          req.params.id,
          req.user.condominiumId,
          req.user,
          requestContext(req)
        );

      return res.json({
        success: true,
        message:
          "Aviso publicado com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async moveToDraft(
    req,
    res,
    next
  ) {
    try {
      const data =
        await NoticeService
          .moveToDraft(
            req.params.id,
            req.user.condominiumId,
            req.user,
            requestContext(req)
          );

      return res.json({
        success: true,
        message:
          "Aviso movido para rascunho com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async archive(req, res, next) {
    try {
      const data =
        await NoticeService.archive(
          req.params.id,
          req.user.condominiumId,
          req.user,
          requestContext(req)
        );

      return res.json({
        success: true,
        message:
          "Aviso arquivado com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const data =
        await NoticeService.remove(
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
        await NoticeService.statistics(
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

export default new NoticeController();
