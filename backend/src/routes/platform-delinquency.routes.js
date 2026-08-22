import { Router } from "express";

import PlatformDelinquencyController from "../controllers/PlatformDelinquencyController.js";

import {
  authMiddleware,
} from "../middlewares/authMiddleware.js";

import { platformOwnerMiddleware } from "../middlewares/platformAccessMiddleware.js";

const platformDelinquencyRoutes =
  Router();

platformDelinquencyRoutes.post(
  "/run",
  authMiddleware,
  platformOwnerMiddleware,
  (req, res, next) =>
    PlatformDelinquencyController
      .run(
        req,
        res,
        next
      )
);

export default platformDelinquencyRoutes;
