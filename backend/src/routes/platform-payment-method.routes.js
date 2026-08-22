import { Router } from "express";

import PlatformPaymentMethodController from "../controllers/PlatformPaymentMethodController.js";

import {
  authMiddleware,
} from "../middlewares/authMiddleware.js";

import { platformOwnerMiddleware } from "../middlewares/platformAccessMiddleware.js";

const platformPaymentMethodRoutes =
  Router();

platformPaymentMethodRoutes.use(
  authMiddleware,
  platformOwnerMiddleware
);

platformPaymentMethodRoutes.get(
  "/condominiums/:condominiumId",
  (req, res, next) =>
    PlatformPaymentMethodController.index(
      req,
      res,
      next
    )
);

platformPaymentMethodRoutes.post(
  "/condominiums/:condominiumId",
  (req, res, next) =>
    PlatformPaymentMethodController.store(
      req,
      res,
      next
    )
);

platformPaymentMethodRoutes.get(
  "/condominiums/:condominiumId/:id",
  (req, res, next) =>
    PlatformPaymentMethodController.show(
      req,
      res,
      next
    )
);

platformPaymentMethodRoutes.put(
  "/condominiums/:condominiumId/:id",
  (req, res, next) =>
    PlatformPaymentMethodController.update(
      req,
      res,
      next
    )
);

platformPaymentMethodRoutes.patch(
  "/condominiums/:condominiumId/:id/status",
  (req, res, next) =>
    PlatformPaymentMethodController.changeStatus(
      req,
      res,
      next
    )
);

export default platformPaymentMethodRoutes;
