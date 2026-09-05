import { Router } from "express";
import SearchController from "../controllers/SearchController.js";
const routes = Router();
routes.get("/", (req,res,next)=>SearchController.index(req,res,next));
export default routes;
