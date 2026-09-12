import { Router } from "express";
import DocumentController from "../controllers/DocumentController.js";
import { authMiddleware, authorizeRoles } from "../middlewares/authMiddleware.js";
import { validateCreateDocument, validateDocumentId, validateDocumentList, validateUpdateDocument } from "../validators/documentValidator.js";

const routes = Router();
routes.use(authMiddleware);
const readers = authorizeRoles("CONDOMINIUM_ADMIN", "MANAGER", "RESIDENT", "DOORMAN");
const managers = authorizeRoles("CONDOMINIUM_ADMIN", "MANAGER");

routes.get("/", readers, validateDocumentList, (req,res,next) => DocumentController.index(req,res,next));
routes.post("/", managers, validateCreateDocument, (req,res,next) => DocumentController.create(req,res,next));
routes.get("/:id/download", readers, validateDocumentId, (req,res,next) => DocumentController.download(req,res,next));
routes.get("/:id", readers, validateDocumentId, (req,res,next) => DocumentController.show(req,res,next));
routes.patch("/:id", managers, validateDocumentId, validateUpdateDocument, (req,res,next) => DocumentController.update(req,res,next));
routes.delete("/:id", managers, validateDocumentId, (req,res,next) => DocumentController.remove(req,res,next));

export default routes;
