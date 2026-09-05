import PackageService from "../services/PackageService.js";

function requestContext(req) {
  return {
    ipAddress:
      req.ip ?? null,
    userAgent:
      req.get("user-agent") ??
      null,
  };
}

class PackageController {
  async index(req, res, next) {
    try {
      const condominiumId =
        req.user.condominiumId;

      const {
        status,
        apartmentId,
        pending,
      } = req.query;

      let data;

      if (pending === true) {
        data =
          await PackageService
            .findPending(
              condominiumId
            );
      } else if (apartmentId) {
        data =
          await PackageService
            .findByApartment(
              apartmentId,
              condominiumId
            );
      } else if (status) {
        data =
          await PackageService
            .findByStatus(
              condominiumId,
              status
            );
      } else {
        data =
          await PackageService
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

  async myPackages(
    req,
    res,
    next
  ) {
    try {
      const data =
        await PackageService.findMine(
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

  async pickupCredential(
    req,
    res,
    next
  ) {
    try {
      const data =
        await PackageService
          .generatePickupCredential(
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

  async validatePickup(
    req,
    res,
    next
  ) {
    try {
      const data =
        await PackageService
          .validatePickupCredential(
            req.user.condominiumId,
            req.body.method,
            req.body.value
          );

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async confirmPickup(
    req,
    res,
    next
  ) {
    try {
      const data =
        await PackageService
          .confirmPickup(
            req.params.id,
            req.user.condominiumId,
            req.body,
            req.user,
            requestContext(req)
          );

      return res.json({
        success: true,
        message:
          "Retirada confirmada com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async deliveryProof(req, res, next) {
    try {
      const data = await PackageService.getDeliveryProof(req.params.id, req.user.condominiumId);
      return res.json({ success: true, data });
    } catch (error) { return next(error); }
  }

  async show(req, res, next) {
    try {
      const data =
        await PackageService.findById(
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

  async expectedByResident(
    req,
    res,
    next
  ) {
    try {
      const data =
        await PackageService
          .findExpectedByResident(
            req.params.residentId,
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

  async createExpected(
    req,
    res,
    next
  ) {
    try {
      const data =
        await PackageService
          .createExpected(
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
            "Encomenda esperada cadastrada com sucesso.",
          data,
        });
    } catch (error) {
      return next(error);
    }
  }

  async createReceived(
    req,
    res,
    next
  ) {
    try {
      const data =
        await PackageService
          .createReceived(
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
            "Encomenda recebida cadastrada com sucesso.",
          data,
        });
    } catch (error) {
      return next(error);
    }
  }

  async registerReceived(
    req,
    res,
    next
  ) {
    try {
      const data =
        await PackageService
          .registerReceived(
            req.params.id,
            req.user.condominiumId,
            req.user,
            requestContext(req)
          );

      return res.json({
        success: true,
        message:
          "Encomenda marcada como recebida.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async deliver(req, res, next) {
    try {
      const data =
        await PackageService.deliver(
          req.params.id,
          req.user.condominiumId,
          req.body.withdrawnBy,
          req.user,
          requestContext(req)
        );

      return res.json({
        success: true,
        message:
          "Encomenda entregue com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async cancel(req, res, next) {
    try {
      const data =
        await PackageService.cancel(
          req.params.id,
          req.user.condominiumId,
          req.body.reason,
          req.user,
          requestContext(req)
        );

      return res.json({
        success: true,
        message:
          "Encomenda cancelada com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data =
        await PackageService.update(
          req.params.id,
          req.user.condominiumId,
          req.body,
          req.user,
          requestContext(req)
        );

      return res.json({
        success: true,
        message:
          "Encomenda atualizada com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const data =
        await PackageService.remove(
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
        await PackageService
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

export default new PackageController();
