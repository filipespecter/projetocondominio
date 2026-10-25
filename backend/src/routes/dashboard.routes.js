import {operationEvents,operationPage,feedState,clearFeed} from "../services/OperationalReviewService.js";
import {requireTrustedOrigin} from "../middlewares/securityMiddleware.js";
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

const respondReview=fn=>async(req,res,next)=>{try{res.set("Cache-Control","no-store").json({success:true,data:await fn(req)});}catch(e){next(e);}};
dashboardRoutes.get("/operations/:kind/events",managerRoles,respondReview(req=>operationEvents(req.user,req.params.kind,req.query)));
dashboardRoutes.get("/operations/:kind",managerRoles,respondReview(req=>operationPage(req.user,req.params.kind,req.query)));
dashboardRoutes.get("/feed-state",managerRoles,respondReview(req=>feedState(req.user)));
dashboardRoutes.post("/feed-clear",managerRoles,requireTrustedOrigin,respondReview(req=>clearFeed(req.user,req.body?.through)));
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
