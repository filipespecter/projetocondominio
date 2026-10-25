import {operationalMonitor} from "../services/OperationalMonitorService.js";
import {apartmentReport} from "../services/ApartmentReportService.js";
import { Router } from "express";

import { intelligence } from "../services/IntelligenceService.js";
import { rateLimit } from "express-rate-limit";
import AnalyticsController from "../controllers/AnalyticsController.js";
import { authorizeRoles } from "../middlewares/authMiddleware.js";

const analyticsRoutes = Router();

const administrativeRoles = authorizeRoles(
  "CONDOMINIUM_ADMIN",
  "MANAGER"
);

analyticsRoutes.use(administrativeRoles);
analyticsRoutes.get("/monitor",rateLimit({windowMs:60000,limit:6,standardHeaders:true,legacyHeaders:false}),async(req,res,next)=>{try{res.set("Cache-Control","no-store").json({success:true,data:await operationalMonitor(req.user)});}catch(e){next(e);}});
analyticsRoutes.get("/apartment-report",rateLimit({windowMs:60000,limit:12,standardHeaders:true,legacyHeaders:false}),async(req,res,next)=>{try{res.set("Cache-Control","no-store").json({success:true,data:await apartmentReport(req.user,req.query)});}catch(e){next(e);}});
analyticsRoutes.get("/intelligence",rateLimit({windowMs:60000,limit:12,standardHeaders:true,legacyHeaders:false}),async(req,res,next)=>{try{res.set("Cache-Control","no-store").json({success:true,data:await intelligence(req.user,req.query)});}catch(e){next(e);}});


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
