import {cardCheckoutEnabled, checkoutUrl} from "../utils/mercadoPagoCardOrder.js";
import { isOrderId } from "../utils/mercadoPagoOrder.js";
import PaymentGatewayOrchestratorService from "../services/PaymentGatewayOrchestratorService.js";
import { configurationRequest } from "../services/CondominiumRequestsService.js";
import WahaConnectionService from "../services/WahaConnectionService.js";
import WhatsAppOnboardingService from "../services/WhatsAppOnboardingService.js";
import { resetLimiter, whatsappConnectionLimiter, requireTrustedOrigin } from "../middlewares/securityMiddleware.js";
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

const portaria = authorizeRoles("CONDOMINIUM_ADMIN", "MANAGER", "DOORMAN");
routes.get("/messaging/status", portaria, async(req,res,next)=>{try {res.json({success:true,data:await TenantMessagingService.operationalStatus(req.user.condominiumId)});}catch(e){next(e);}});
routes.get("/whatsapp/waha/status", master, async(req,res,next)=>{try {res.set("Cache-Control","no-store").json({success:true,data:await WahaConnectionService.status(req.user,req.query.qr === "true")});}catch(e){next(e);}});
routes.post("/whatsapp/waha/start", master, requireTrustedOrigin, whatsappConnectionLimiter, async(req,res,next)=>{try {res.set("Cache-Control","no-store").json({success:true,data:await WahaConnectionService.start(req.user,req.body?.replaceMetaConfirmed)});}catch(e){next(e);}});
routes.post("/whatsapp/waha/disconnect", master, requireTrustedOrigin, resetLimiter, async(req,res,next)=>{try {res.json({success:true,data:await WahaConnectionService.disconnect(req.user,req.body?.confirmed)});}catch(e){next(e);}});
routes.get("/whatsapp/onboarding", master, (_req,res)=>res.json({success:true,data:WhatsAppOnboardingService.publicSettings()}));
routes.post("/whatsapp/connect/start", master, requireTrustedOrigin, resetLimiter, async(req,res,next)=>{try {res.json({success:true,data:await WhatsAppOnboardingService.start(req.user)});}catch(e){next(e);}});
routes.post("/whatsapp/connect/finish", master, requireTrustedOrigin, resetLimiter, async(req,res,next)=>{try {res.json({success:true,data:await WhatsAppOnboardingService.finish(req.user,req.body)});}catch(e){next(e);}});
routes.post("/whatsapp/connect/check", master, requireTrustedOrigin, resetLimiter, async(req,res,next)=>{try {res.json({success:true,data:await WhatsAppOnboardingService.check(req.user)});}catch(e){next(e);}});
routes.post("/whatsapp/test", master, async (req,res,next)=>{try {res.json({success:true,data:await TenantMessagingService.test(req.user)});} catch(e){next(e);}});
routes.post("/messaging/:id/check-delivery", portaria, requireTrustedOrigin, resetLimiter, async(req,res,next)=>{try{res.json({success:true,data:await WahaConnectionService.checkDelivery(req.user,req.params.id)});}catch(e){next(e);}});
routes.get("/messaging/history", portaria, async(req,res,next)=>{try {const data=await prisma.communicationLog.findMany({where:{condominiumId:req.user.condominiumId,module:"PACKAGE"},orderBy:{createdAt:"desc"},take:50,select:{id:true,createdAt:true,channel:true,recipient:true,status:true,attemptCount:true,provider:true,lastError:true}});res.json({success:true,data});}catch(e){next(e);}});
routes.post("/messaging/:id/retry", portaria, requireTrustedOrigin, resetLimiter, async(req,res,next)=>{try {if(req.body?.confirmed!==true)throw new ApiError("Confirme a nova tentativa antes de enviar.",422);if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id))throw new ApiError("Identificador de aviso inválido.",422);const item=await prisma.communicationLog.findFirst({where:{id:req.params.id,condominiumId:req.user.condominiumId,module:"PACKAGE"}});if(!item)throw new ApiError("Aviso não encontrado.",404); if(item.status!=="FAILED")throw new ApiError("Somente avisos com falha podem ser reenviados.",409);const result=await CommunicationService.send(item.id,req.user);res.json({success:true,data:{status:result.status,message:"Tentativa registrada. Confira o estado da entrega."}});}catch(e){next(e);}});
routes.post("/requests",master,requireTrustedOrigin,resetLimiter,async(req,res,next)=>{try{res.json({success:true,data:await configurationRequest(req.user,req.body)});}catch(e){next(e);}});
routes.post("/subscription-charges/:id/issue",master,requireTrustedOrigin,resetLimiter,async(req,res,next)=>{
 try{
  const {condominiumId}=req.user;
  const {id}=req.params;
  const type=req.body?.method;
  if(!condominiumId||!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id))throw new ApiError("Cobrança não encontrada.",404);
  if(type==="CARD"&&req.body?.switchFromPix!==true){
    const data=req.body?.switchFromBoleto===true
      ? await PaymentGatewayOrchestratorService.switchBoletoToCard(id,req.user,{requestId:req.requestId})
      : await PaymentGatewayOrchestratorService.openCardCheckout(id,req.user,{requestId:req.requestId});
    return res.set("Cache-Control","no-store").json({success:true,data});
  }
  if(!["PIX","BOLETO"].includes(type))throw new ApiError("Escolha Pix ou boleto.",422);
  if(req.body?.switchFromPix===true){
    if(type!=="BOLETO")throw new ApiError("Selecione boleto para a troca.",422);
    await PaymentGatewayOrchestratorService.switchPixToBoleto(id,req.user,{requestId:req.requestId});
  }else await PaymentGatewayOrchestratorService.processCharge(id,{},req.user,{requestId:req.requestId},{portalPayment:{condominiumId,type}});
  res.set("Cache-Control","no-store").json({success:true});
 }catch(e){next(e);}
});
routes.get("/subscription-charges",master,async(req,res,next)=>{
 try{
  const condominiumId=req.user.condominiumId;if(!condominiumId)throw new ApiError("Condomínio não identificado.",403);
  const charges=await prisma.charge.findMany({where:{condominiumId},orderBy:{dueDate:"desc"},take:24,select:{id:true,status:true,dueDate:true,amountInCents:true,paidAt:true,provider:true,providerChargeId:true,expiresAt:true,paymentUrl:true,boletoBarcode:true,pixCopyPaste:true,metadata:true}});
  const data=charges.map(({metadata,provider,providerChargeId,...charge})=>{
    const open=["PENDING","OVERDUE","FAILED"].includes(charge.status);
    const checking=Boolean(metadata?.gatewayAttemptPending);
    const hasPayment=Boolean(providerChargeId||charge.paymentUrl||charge.pixCopyPaste||charge.boletoBarcode||metadata?.pixQrCodeBase64);
    const usable=open&&!checking&&charge.status!=="FAILED"&&(!charge.expiresAt||charge.expiresAt>new Date());
    const cardOrder=metadata?.gatewayAttemptKind==="CARD_ORDERS";
    const cardAvailable=cardCheckoutEnabled()&&open&&!checking;
    const cardUrl=cardOrder&&usable&&checkoutUrl(charge.paymentUrl,providerChargeId);
    return {...charge,checking,canStartCard:cardAvailable&&!hasPayment,canSwitchBoletoToCard:cardAvailable&&metadata?.gatewayAttemptKind==="BOLETO_ORDERS"&&provider==="MERCADO_PAGO"&&isOrderId(providerChargeId),hasOpenCardCheckout:cardAvailable&&Boolean(cardUrl),
      canSwitchToBoleto:metadata?.gatewayAttemptKind!=="BOLETO_ORDERS"&&!cardOrder&&open&&!checking&&provider==="MERCADO_PAGO"&&isOrderId(providerChargeId),canChoose:open&&!hasPayment&&!checking,hasPayment,
      paymentUrl:usable&&!cardOrder?charge.paymentUrl:null,boletoBarcode:usable?charge.boletoBarcode:null,pixCopyPaste:usable?charge.pixCopyPaste:null,
      pixQrCodeBase64:usable&&typeof metadata?.pixQrCodeBase64==="string"&&/^[A-Za-z0-9+/=]{1,250000}$/.test(metadata.pixQrCodeBase64)?metadata.pixQrCodeBase64:null,
      officialPriceInCents:metadata?.officialPriceInCents??null,discountInCents:metadata?.discountInCents??0};
  });
  res.set("Cache-Control","no-store").json({success:true,data});
 }catch(e){next(e);}
});
routes.get("/", adminOrManager, (req, res, next) => ConfigurationController.show(req, res, next));
routes.patch("/condominium", master, (req, res, next) => ConfigurationController.updateCondominium(req, res, next));
routes.patch("/settings/:group", adminOrManager, (req, res, next) => ConfigurationController.updateGroup(req, res, next));
routes.post("/users", master, (req, res, next) => ConfigurationController.createUser(req, res, next));
routes.patch("/users/:id", master, (req, res, next) => ConfigurationController.updateUser(req, res, next));
routes.patch("/users/:id/status", master, (req, res, next) => ConfigurationController.toggleUser(req, res, next));
routes.delete("/users/:id", master, (req, res, next) => ConfigurationController.removeUser(req, res, next));
routes.patch("/master-credentials", master, (req, res, next) => ConfigurationController.masterCredentials(req, res, next));

export default routes;