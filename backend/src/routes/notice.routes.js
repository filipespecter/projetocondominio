import prisma from "../config/prisma.js";
import { evidence } from "../services/OperationalEvidenceService.js";
import { requireTrustedOrigin } from "../middlewares/securityMiddleware.js";
import { Router } from "express";

import NoticeController from "../controllers/NoticeController.js";

import {
  authMiddleware,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

import {
  validateNoticeId,
  validateNoticeListQuery,
  validateCreateNotice,
  validateUpdateNotice,
  validateNoticeAttachmentParams,
} from "../validators/noticeValidator.js";

const noticeRoutes = Router();

/**
 * =====================================================
 * TODAS AS ROTAS EXIGEM AUTENTICAÇÃO
 * =====================================================
 */
noticeRoutes.use(authMiddleware);

/**
 * Perfis administrativos.
 */
const adminRoles = authorizeRoles(
  "CONDOMINIUM_ADMIN",
  "MANAGER"
);

/**
 * Perfis que podem visualizar avisos.
 */
const viewerRoles = authorizeRoles(
  "CONDOMINIUM_ADMIN",
  "MANAGER",
  "DOORMAN",
  "RESIDENT"
);

/**
 * =====================================================
 * ESTATÍSTICAS
 * =====================================================
 */
noticeRoutes.get("/:id/assembly",adminRoles,async(req,res,next)=>{try{res.set("Cache-Control","no-store").json({success:true,data:await evidence(prisma,req.user,"assembly",req.params.id)});}catch(e){next(e);}});
noticeRoutes.post("/:id/assembly",adminRoles,requireTrustedOrigin,async(req,res,next)=>{try{res.status(201).json({success:true,data:await evidence(prisma,req.user,"assembly",req.params.id,req.body)});}catch(e){next(e);}});

noticeRoutes.get(
  "/statistics",
  adminRoles,
  (req,res,next)=>
    NoticeController.statistics(req,res,next)
);

/**
 * =====================================================
 * LISTAGEM
 * =====================================================
 */
noticeRoutes.get(
  "/",
  viewerRoles,
  validateNoticeListQuery,
  (req,res,next)=>
    NoticeController.index(req,res,next)
);

/**
 * Download de anexo de aviso/assembleia aplicando a mesma visibilidade do registro.
 */
noticeRoutes.get(
  "/:id/attachments/:index",
  viewerRoles,
  validateNoticeAttachmentParams,
  (req, res, next) => NoticeController.downloadAttachment(req, res, next)
);

/**
 * =====================================================
 * BUSCA POR ID
 * =====================================================
 */
noticeRoutes.get(
  "/:id",
  viewerRoles,
  validateNoticeId,
  (req,res,next)=>
    NoticeController.show(req,res,next)
);

/**
 * =====================================================
 * CRIAR AVISO
 * =====================================================
 */
noticeRoutes.post(
  "/",
  adminRoles,
  validateCreateNotice,
  (req,res,next)=>
    NoticeController.create(req,res,next)
);

/**
 * =====================================================
 * ATUALIZAR AVISO
 * =====================================================
 */
noticeRoutes.patch(
  "/:id",
  adminRoles,
  validateNoticeId,
  validateUpdateNotice,
  (req,res,next)=>
    NoticeController.update(req,res,next)
);

/**
 * Publicar aviso.
 */
noticeRoutes.patch(
  "/:id/publish",
  adminRoles,
  validateNoticeId,
  (req,res,next)=>
    NoticeController.publish(req,res,next)
);

/**
 * Retornar para rascunho.
 */
noticeRoutes.patch(
  "/:id/draft",
  adminRoles,
  validateNoticeId,
  (req,res,next)=>
    NoticeController.moveToDraft(req,res,next)
);

/**
 * Arquivar aviso.
 */
noticeRoutes.patch(
  "/:id/archive",
  adminRoles,
  validateNoticeId,
  (req,res,next)=>
    NoticeController.archive(req,res,next)
);

/**
 * Exclusão lógica.
 */
noticeRoutes.delete(
  "/:id",
  adminRoles,
  validateNoticeId,
  (req,res,next)=>
    NoticeController.remove(req,res,next)
);

export default noticeRoutes;
