import ServiceProviderService from "../services/ServiceProviderService.js";

function requestContext(req) {
  return {
    ipAddress:
      req.ip ?? null,
    userAgent:
      req.get("user-agent") ??
      null,
  };
}

class ServiceProviderController {
  async index(req, res, next) {
    try {
      const condominiumId =
        req.user.condominiumId;

      const {
        status,
        activeOnly,
      } = req.query;

      let data;

      if (activeOnly === true) {
        data =
          await ServiceProviderService
            .findActive(
              condominiumId
            );
      } else if (status) {
        data =
          await ServiceProviderService
            .findByStatus(
              condominiumId,
              status
            );
      } else {
        data =
          await ServiceProviderService
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
        await ServiceProviderService
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
        await ServiceProviderService
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
            "Prestador cadastrado com sucesso.",
          data,
        });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data =
        await ServiceProviderService
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
          "Prestador atualizado com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async activate(req, res, next) {
    try {
      const data =
        await ServiceProviderService
          .activate(
            req.params.id,
            req.user.condominiumId,
            req.user,
            requestContext(req)
          );

      return res.json({
        success: true,
        message:
          "Prestador ativado com sucesso.",
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
        await ServiceProviderService
          .deactivate(
            req.params.id,
            req.user.condominiumId,
            req.user,
            requestContext(req)
          );

      return res.json({
        success: true,
        message:
          "Prestador desativado com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async block(req, res, next) {
    try {
      const data =
        await ServiceProviderService
          .block(
            req.params.id,
            req.user.condominiumId,
            req.user,
            requestContext(req)
          );

      return res.json({
        success: true,
        message:
          "Prestador bloqueado com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async changeStatus(
    req,
    res,
    next
  ) {
    try {
      const data =
        await ServiceProviderService
          .changeStatus(
            req.params.id,
            req.user.condominiumId,
            req.body.status,
            req.user,
            requestContext(req)
          );

      return res.json({
        success: true,
        message:
          "Status do prestador atualizado com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const data =
        await ServiceProviderService
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
        await ServiceProviderService
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

export default new ServiceProviderController();
