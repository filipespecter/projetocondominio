import { Router } from "express";

import DashboardController from "../controllers/DashboardController.js";
import { authorizeRoles } from "../middlewares/authMiddleware.js";

const dashboardRoutes = Router();

const managerRoles = authorizeRoles(
  "CONDOMINIUM_ADMIN",
  "MANAGER"
);

const doormanOnly = authorizeRoles("DOORMAN");
const residentOnly = authorizeRoles("RESIDENT");

// GET /api/v1/dashboard/manager
dashboardRoutes.get("/manager", managerRoles, (req, res, next) =>
  DashboardController.manager(req, res, next)
);

// GET /api/v1/dashboard/doorman
dashboardRoutes.get("/doorman", doormanOnly, (req, res, next) =>
  DashboardController.doorman(req, res, next)
);

// GET /api/v1/dashboard/resident
dashboardRoutes.get("/resident", residentOnly, (req, res, next) =>
  DashboardController.resident(req, res, next)
);

// GET /api/v1/dashboard/summary
dashboardRoutes.get("/summary", managerRoles, (req, res, next) =>
  DashboardController.summary(req, res, next)
);

export default dashboardRoutes;
