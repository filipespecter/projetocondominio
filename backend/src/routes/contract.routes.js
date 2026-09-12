import { Router } from "express";
import ContractController from "../controllers/ContractController.js";
import { authMiddleware, authorizeRoles } from "../middlewares/authMiddleware.js";
import {
  validateContractId,
  validateContractList,
  validateCreateContract,
  validateUpdateContract,
} from "../validators/contractValidator.js";

const routes = Router();
routes.use(authMiddleware, authorizeRoles("CONDOMINIUM_ADMIN", "MANAGER"));
routes.get("/", validateContractList, (req, res, next) => ContractController.index(req, res, next));
routes.post("/", validateCreateContract, (req, res, next) => ContractController.create(req, res, next));
routes.get("/:id/download", validateContractId, (req, res, next) => ContractController.download(req, res, next));
routes.get("/:id", validateContractId, (req, res, next) => ContractController.show(req, res, next));
routes.patch("/:id", validateContractId, validateUpdateContract, (req, res, next) => ContractController.update(req, res, next));
routes.delete("/:id", validateContractId, (req, res, next) => ContractController.remove(req, res, next));

export default routes;
