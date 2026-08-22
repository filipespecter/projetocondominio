import ProviderAccessService from "../services/ProviderAccessService.js";

function requestContext(req) {
  return {
    ipAddress:
      req.ip ?? null,
    userAgent:
      req.get("user-agent") ??
      null,
  };
}

class ProviderAccessController {
  async index(req, res, next) {
    try {
      const condominiumId =
        req.user.condominiumId;

      const {
        status,
        serviceProviderId,
        apartmentId,
        scheduledDate,
      } = req.query;

      let data;

      if (serviceProviderId) {
        data =
          await ProviderAccessService
            .findByServiceProvider(
              serviceProviderId,
              condominiumId
            );
      } else if (apartmentId) {
        data =
          await ProviderAccessService
            .findByApartment(
              apartmentId,
              condominiumId
            );
      } else if (scheduledDate) {
        data =
          await ProviderAccessService
            .findByDate(
              condominiumId,
              scheduledDate
            );
      } else if (status) {
        data =
          await ProviderAccessService
            .findByStatus(
              condominiumId,
              status
            );
      } else {
        data =
          await ProviderAccessService
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
        await ProviderAccessService
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
        await ProviderAccessService
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
            "Acesso de prestador agendado com sucesso.",
          data,
        });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data =
        await ProviderAccessService
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
          "Agendamento do prestador atualizado com sucesso.",
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
        await ProviderAccessService
          .registerEntry(
            req.params.id,
            req.user.condominiumId,
            req.user,
            requestContext(req)
          );

      return res.json({
        success: true,
        message:
          "Entrada do prestador registrada com sucesso.",
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
        await ProviderAccessService
          .registerExit(
            req.params.id,
            req.user.condominiumId,
            req.user,
            requestContext(req)
          );

      return res.json({
        success: true,
        message:
          "Saída do prestador registrada com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async cancel(req, res, next) {
    try {
      const data =
        await ProviderAccessService
          .cancel(
            req.params.id,
            req.user.condominiumId,
            req.user,
            requestContext(req)
          );

      return res.json({
        success: true,
        message:
          "Acesso do prestador cancelado com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const data =
        await ProviderAccessService
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
        await ProviderAccessService
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

export default new ProviderAccessController();
