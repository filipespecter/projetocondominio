import { Router } from "express";

import PlatformChargeController from "../controllers/PlatformChargeController.js";

import {
  authMiddleware,
} from "../middlewares/authMiddleware.js";

import { platformOwnerMiddleware } from "../middlewares/platformAccessMiddleware.js";

const platformChargeRoutes =
  Router();

platformChargeRoutes.use(
  authMiddleware,
  platformOwnerMiddleware
);


platformChargeRoutes.get(
  "/",
  (req, res, next) => PlatformChargeController.index(req, res, next)
);

platformChargeRoutes.get(
  "/statistics",
  (req, res, next) =>
    PlatformChargeController.statistics(
      req,
      res,
      next
    )
);

platformChargeRoutes.get(
  "/condominiums/:condominiumId",
  (req, res, next) =>
    PlatformChargeController.indexByCondominium(
      req,
      res,
      next
    )
);

platformChargeRoutes.post(
  "/",
  (req, res, next) =>
    PlatformChargeController.store(
      req,
      res,
      next
    )
);

platformChargeRoutes.get(
  "/:id",
  (req, res, next) =>
    PlatformChargeController.show(
      req,
      res,
      next
    )
);


platformChargeRoutes.post(
  "/:id/process",
  (req, res, next) =>
    PlatformChargeController.processGateway(
      req,
      res,
      next
    )
);

platformChargeRoutes.post(
  "/:id/refund-provider",
  (req, res, next) =>
    PlatformChargeController.refundGateway(
      req,
      res,
      next
    )
);

platformChargeRoutes.patch(
  "/:id/paid",
  (req, res, next) =>
    PlatformChargeController.markPaid(
      req,
      res,
      next
    )
);

platformChargeRoutes.patch(
  "/:id/overdue",
  (req, res, next) =>
    PlatformChargeController.markOverdue(
      req,
      res,
      next
    )
);

platformChargeRoutes.patch(
  "/:id/cancel",
  (req, res, next) =>
    PlatformChargeController.cancel(
      req,
      res,
      next
    )
);

platformChargeRoutes.patch(
  "/:id/refund",
  (req, res, next) =>
    PlatformChargeController.refund(
      req,
      res,
      next
    )
);

export default platformChargeRoutes;
