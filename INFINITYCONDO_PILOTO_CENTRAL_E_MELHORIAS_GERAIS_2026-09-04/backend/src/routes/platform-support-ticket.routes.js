import { Router } from "express";
import SupportTicketController from "../controllers/SupportTicketController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import platformAdminMiddleware from "../middlewares/platformAdminMiddleware.js";

const routes = Router();
routes.use(authMiddleware, platformAdminMiddleware);
routes.get("/", (req,res,next)=>SupportTicketController.platformIndex(req,res,next));
routes.patch("/:id", (req,res,next)=>SupportTicketController.platformUpdate(req,res,next));
export default routes;
