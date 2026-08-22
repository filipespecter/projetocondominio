import { Router } from "express";

import AnalyticsController from "../controllers/AnalyticsController.js";
import { authorizeRoles } from "../middlewares/authMiddleware.js";

const analyticsRoutes = Router();

const administrativeRoles = authorizeRoles(
  "CONDOMINIUM_ADMIN",
  "MANAGER"
);

analyticsRoutes.use(administrativeRoles);

analyticsRoutes.get("/overview", (req, res, next) =>
  AnalyticsController.overview(req, res, next)
);

analyticsRoutes.get("/daily-movement", (req, res, next) =>
  AnalyticsController.dailyMovement(req, res, next)
);

analyticsRoutes.get("/monthly-movement", (req, res, next) =>
  AnalyticsController.monthlyMovement(req, res, next)
);

analyticsRoutes.get("/visitors", (req, res, next) =>
  AnalyticsController.visitors(req, res, next)
);

analyticsRoutes.get("/packages", (req, res, next) =>
  AnalyticsController.packages(req, res, next)
);

analyticsRoutes.get("/reservations", (req, res, next) =>
  AnalyticsController.reservations(req, res, next)
);

analyticsRoutes.get("/occurrences", (req, res, next) =>
  AnalyticsController.occurrences(req, res, next)
);

analyticsRoutes.get("/occupancy", (req, res, next) =>
  AnalyticsController.occupancy(req, res, next)
);

analyticsRoutes.get("/full", (req, res, next) =>
  AnalyticsController.full(req, res, next)
);

export default analyticsRoutes;
