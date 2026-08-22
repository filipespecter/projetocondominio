import { Router } from "express";

import PlatformUserController from "../controllers/PlatformUserController.js";

import {
  authMiddleware,
} from "../middlewares/authMiddleware.js";

import platformAdminMiddleware from "../middlewares/platformAdminMiddleware.js";

import {
  platformManagementMiddleware,
} from "../middlewares/platformAccessMiddleware.js";

import {
  validateCreatePlatformUser,
  validatePlatformUserUpdate,
  validatePlatformUserStatus,
  validatePlatformUserPasswordReset,
} from "../validators/platformUserValidator.js";

const platformUserRoutes =
  Router();

platformUserRoutes.use(
  authMiddleware,
  platformAdminMiddleware
);

platformUserRoutes.post(
  "/",
  platformManagementMiddleware,
  validateCreatePlatformUser,
  (req, res, next) =>
    PlatformUserController
      .store(
        req,
        res,
        next
      )
);

platformUserRoutes.get(
  "/statistics",
  platformManagementMiddleware,
  (req, res, next) =>
    PlatformUserController
      .statistics(
        req,
        res,
        next
      )
);

platformUserRoutes.get(
  "/",
  platformManagementMiddleware,
  (req, res, next) =>
    PlatformUserController
      .index(
        req,
        res,
        next
      )
);

platformUserRoutes.get(
  "/:id/profile",
  platformManagementMiddleware,
  (req, res, next) =>
    PlatformUserController.profile(
      req,
      res,
      next
    )
);

platformUserRoutes.get(
  "/:id",
  platformManagementMiddleware,
  (req, res, next) =>
    PlatformUserController
      .show(
        req,
        res,
        next
      )
);

platformUserRoutes.put(
  "/:id",
  platformManagementMiddleware,
  validatePlatformUserUpdate,
  (req, res, next) =>
    PlatformUserController
      .update(
        req,
        res,
        next
      )
);

platformUserRoutes.patch(
  "/:id/status",
  platformManagementMiddleware,
  validatePlatformUserStatus,
  (req, res, next) =>
    PlatformUserController
      .changeStatus(
        req,
        res,
        next
      )
);

platformUserRoutes.patch(
  "/:id/reset-password",
  platformManagementMiddleware,
  validatePlatformUserPasswordReset,
  (req, res, next) =>
    PlatformUserController
      .resetPassword(
        req,
        res,
        next
      )
);

export default platformUserRoutes;
