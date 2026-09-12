import { Router } from "express";
import PrivateServiceRequestController from "../controllers/PrivateServiceRequestController.js";
import { authMiddleware, authorizeRoles } from "../middlewares/authMiddleware.js";
import {
  validateCreatePrivateServiceRequest,
  validateReviewPrivateServiceRequest,
  validateRejectPrivateServiceRequest,
  validatePrivateServiceRequestId,
  validatePrivateServiceRequestList,
} from "../validators/privateServiceRequestValidator.js";

const routes = Router();
routes.use(authMiddleware);

routes.get(
  "/",
  authorizeRoles("RESIDENT", "CONDOMINIUM_ADMIN", "MANAGER"),
  validatePrivateServiceRequestList,
  (req, res, next) => PrivateServiceRequestController.index(req, res, next)
);

routes.post(
  "/",
  authorizeRoles("RESIDENT"),
  validateCreatePrivateServiceRequest,
  (req, res, next) => PrivateServiceRequestController.create(req, res, next)
);

routes.patch(
  "/:id/cancel",
  authorizeRoles("RESIDENT"),
  validatePrivateServiceRequestId,
  (req, res, next) => PrivateServiceRequestController.cancel(req, res, next)
);

routes.patch(
  "/:id/approve",
  authorizeRoles("CONDOMINIUM_ADMIN", "MANAGER"),
  validatePrivateServiceRequestId,
  validateReviewPrivateServiceRequest,
  (req, res, next) => PrivateServiceRequestController.approve(req, res, next)
);

routes.patch(
  "/:id/reject",
  authorizeRoles("CONDOMINIUM_ADMIN", "MANAGER"),
  validatePrivateServiceRequestId,
  validateRejectPrivateServiceRequest,
  (req, res, next) => PrivateServiceRequestController.reject(req, res, next)
);

export default routes;
