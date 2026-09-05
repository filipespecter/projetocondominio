import { Router } from "express";
import SupportTicketController from "../controllers/SupportTicketController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const routes = Router();
routes.use(authMiddleware);
routes.get("/", (req,res,next)=>SupportTicketController.index(req,res,next));
routes.post("/", (req,res,next)=>SupportTicketController.store(req,res,next));
export default routes;
