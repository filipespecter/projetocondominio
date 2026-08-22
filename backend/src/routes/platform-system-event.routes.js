import { Router } from "express";
import PlatformSystemEventController from "../controllers/PlatformSystemEventController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import platformAdminMiddleware from "../middlewares/platformAdminMiddleware.js";

const routes = Router();
routes.use(authMiddleware, platformAdminMiddleware);
routes.get("/statistics", (req,res,next) => PlatformSystemEventController.statistics(req,res,next));
routes.get("/", (req,res,next) => PlatformSystemEventController.index(req,res,next));
routes.get("/:id", (req,res,next) => PlatformSystemEventController.show(req,res,next));
routes.patch("/:id/resolve", (req,res,next) => PlatformSystemEventController.resolve(req,res,next));
routes.patch("/:id/reopen", (req,res,next) => PlatformSystemEventController.reopen(req,res,next));

export default routes;