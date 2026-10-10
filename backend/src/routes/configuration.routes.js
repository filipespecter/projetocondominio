import prisma from "../config/prisma.js";
import CommunicationService from "../services/CommunicationService.js";
import { ApiError } from "../utils/ApiError.js";
import TenantMessagingService from "../services/TenantMessagingService.js";
import { Router } from "express";
import ConfigurationController from "../controllers/ConfigurationController.js";
import { authorizeRoles } from "../middlewares/authMiddleware.js";

const routes = Router();
const adminOrManager = authorizeRoles("CONDOMINIUM_ADMIN", "MANAGER");
const master = authorizeRoles("CONDOMINIUM_ADMIN");

routes.post("/whatsapp/test", master, async (req,res,next)=>{try {res.json({success:true,data:await TenantMessagingService.test(req.user)});} catch(e){next(e);}});
routes.get("/messaging/history", adminOrManager, async(req,res,next)=>{try {const data=await prisma.communicationLog.findMany({where:{condominiumId:req.user.condominiumId,module:"PACKAGE"},orderBy:{createdAt:"desc"},take:50,select:{id:true,createdAt:true,channel:true,recipient:true,status:true,attemptCount:true}});res.json({success:true,data});}catch(e){next(e);}});
routes.post("/messaging/:id/retry", master, async(req,res,next)=>{try {if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id))throw new ApiError("Identificador de aviso inválido.",422);const item=await prisma.communicationLog.findFirst({where:{id:req.params.id,condominiumId:req.user.condominiumId,module:"PACKAGE"}});if(!item)throw new ApiError("Aviso não encontrado.",404); await CommunicationService.send(item.id,req.user);res.json({success:true,data:{message:"Tentativa registrada."}});}catch(e){next(e);}});
routes.get("/", adminOrManager, (req, res, next) => ConfigurationController.show(req, res, next));
routes.patch("/condominium", master, (req, res, next) => ConfigurationController.updateCondominium(req, res, next));
routes.patch("/settings/:group", adminOrManager, (req, res, next) => ConfigurationController.updateGroup(req, res, next));
routes.post("/users", master, (req, res, next) => ConfigurationController.createUser(req, res, next));
routes.patch("/users/:id", master, (req, res, next) => ConfigurationController.updateUser(req, res, next));
routes.patch("/users/:id/status", master, (req, res, next) => ConfigurationController.toggleUser(req, res, next));
routes.delete("/users/:id", master, (req, res, next) => ConfigurationController.removeUser(req, res, next));
routes.patch("/master-credentials", master, (req, res, next) => ConfigurationController.masterCredentials(req, res, next));

export default routes;