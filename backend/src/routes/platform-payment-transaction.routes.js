import { Router } from "express";

import PlatformPaymentTransactionController from "../controllers/PlatformPaymentTransactionController.js";

import {
  authMiddleware,
} from "../middlewares/authMiddleware.js";

import { platformOwnerMiddleware } from "../middlewares/platformAccessMiddleware.js";

const platformPaymentTransactionRoutes =
  Router();

platformPaymentTransactionRoutes.use(
  authMiddleware,
  platformOwnerMiddleware
);

platformPaymentTransactionRoutes.get(
  "/charges/:chargeId",
  (req, res, next) =>
    PlatformPaymentTransactionController.indexByCharge(
      req,
      res,
      next
    )
);

platformPaymentTransactionRoutes.post(
  "/",
  (req, res, next) =>
    PlatformPaymentTransactionController.store(
      req,
      res,
      next
    )
);

platformPaymentTransactionRoutes.get(
  "/:id",
  (req, res, next) =>
    PlatformPaymentTransactionController.show(
      req,
      res,
      next
    )
);

platformPaymentTransactionRoutes.patch(
  "/:id/status",
  (req, res, next) =>
    PlatformPaymentTransactionController.changeStatus(
      req,
      res,
      next
    )
);

export default platformPaymentTransactionRoutes;
