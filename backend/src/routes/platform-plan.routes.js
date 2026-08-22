import { Router } from "express";
import PlatformPlanController from "../controllers/PlatformPlanController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import platformAdminMiddleware from "../middlewares/platformAdminMiddleware.js";
import { platformManagementMiddleware } from "../middlewares/platformAccessMiddleware.js";

const platformPlanRoutes = Router();

platformPlanRoutes.use(
  authMiddleware,
  platformAdminMiddleware
);

platformPlanRoutes.get("/active", (req, res, next) =>
  PlatformPlanController.active(req, res, next)
);

platformPlanRoutes.get("/inactive", (req, res, next) =>
  PlatformPlanController.inactive(req, res, next)
);

platformPlanRoutes.get("/statistics", (req, res, next) =>
  PlatformPlanController.statistics(req, res, next)
);

platformPlanRoutes.get("/", (req, res, next) =>
  PlatformPlanController.index(req, res, next)
);

platformPlanRoutes.post("/", platformManagementMiddleware, (req, res, next) =>
  PlatformPlanController.create(req, res, next)
);

platformPlanRoutes.get("/:id", (req, res, next) =>
  PlatformPlanController.show(req, res, next)
);

platformPlanRoutes.put("/:id", platformManagementMiddleware, (req, res, next) =>
  PlatformPlanController.update(req, res, next)
);

platformPlanRoutes.patch("/:id/activate", platformManagementMiddleware, (req, res, next) =>
  PlatformPlanController.activate(req, res, next)
);

platformPlanRoutes.patch("/:id/deactivate", platformManagementMiddleware, (req, res, next) =>
  PlatformPlanController.deactivate(req, res, next)
);

platformPlanRoutes.patch("/:id/display-order", platformManagementMiddleware, (req, res, next) =>
  PlatformPlanController.updateDisplayOrder(req, res, next)
);

platformPlanRoutes.delete("/:id", platformManagementMiddleware, (req, res, next) =>
  PlatformPlanController.remove(req, res, next)
);

export default platformPlanRoutes;
