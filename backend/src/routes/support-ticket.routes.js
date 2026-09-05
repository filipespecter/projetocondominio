import { Router } from "express";
import SupportTicketController from "../controllers/SupportTicketController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
const router = Router();
router.use(authMiddleware);
router.get("/mine", (req,res,next)=>SupportTicketController.mine(req,res,next));
router.post("/", (req,res,next)=>SupportTicketController.create(req,res,next));
export default router;
