import { Router } from "express";

import PlatformCommunicationController from "../controllers/PlatformCommunicationController.js";

import {
  authMiddleware,
} from "../middlewares/authMiddleware.js";

import platformAdminMiddleware from "../middlewares/platformAdminMiddleware.js";

const platformCommunicationRoutes =
  Router();

platformCommunicationRoutes.use(
  authMiddleware,
  platformAdminMiddleware
);

platformCommunicationRoutes.get(
  "/statistics",
  (req, res, next) =>
    PlatformCommunicationController
      .statistics(
        req,
        res,
        next
      )
);

platformCommunicationRoutes.get(
  "/failed",
  (req, res, next) =>
    PlatformCommunicationController
      .failed(
        req,
        res,
        next
      )
);

platformCommunicationRoutes.get(
  "/condominiums/:condominiumId",
  (req, res, next) =>
    PlatformCommunicationController
      .condominium(
        req,
        res,
        next
      )
);

platformCommunicationRoutes.get(
  "/:id",
  (req, res, next) =>
    PlatformCommunicationController
      .show(
        req,
        res,
        next
      )
);

platformCommunicationRoutes.post(
  "/:id/retry",
  (req, res, next) =>
    PlatformCommunicationController
      .retry(
        req,
        res,
        next
      )
);

export default platformCommunicationRoutes;
