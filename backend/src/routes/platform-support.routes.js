import { Router } from "express";

import PlatformSupportController from "../controllers/PlatformSupportController.js";

import {
  authMiddleware,
} from "../middlewares/authMiddleware.js";

import platformAdminMiddleware from "../middlewares/platformAdminMiddleware.js";

import {
  validateSupportSessionStart,
} from "../validators/platformSupportValidator.js";

const platformSupportRoutes =
  Router();

platformSupportRoutes.use(
  authMiddleware,
  platformAdminMiddleware
);

platformSupportRoutes.get(
  "/current",
  (req, res, next) =>
    PlatformSupportController
      .current(
        req,
        res,
        next
      )
);

platformSupportRoutes.get(
  "/history",
  (req, res, next) =>
    PlatformSupportController
      .history(
        req,
        res,
        next
      )
);

platformSupportRoutes.post(
  "/start",
  validateSupportSessionStart,
  (req, res, next) =>
    PlatformSupportController
      .start(
        req,
        res,
        next
      )
);

platformSupportRoutes.get(
  "/:id",
  (req, res, next) =>
    PlatformSupportController
      .show(
        req,
        res,
        next
      )
);

platformSupportRoutes.post(
  "/:id/close",
  (req, res, next) =>
    PlatformSupportController
      .close(
        req,
        res,
        next
      )
);

export default platformSupportRoutes;
