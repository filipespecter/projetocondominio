import { Router } from "express";
import ConfigurationController from "../controllers/ConfigurationController.js";
import { authorizeRoles } from "../middlewares/authMiddleware.js";

const routes = Router();
const adminOrManager = authorizeRoles("CONDOMINIUM_ADMIN", "MANAGER");
const master = authorizeRoles("CONDOMINIUM_ADMIN");

routes.get("/", adminOrManager, (req, res, next) => ConfigurationController.show(req, res, next));
routes.patch("/condominium", master, (req, res, next) => ConfigurationController.updateCondominium(req, res, next));
routes.patch("/settings/:group", adminOrManager, (req, res, next) => ConfigurationController.updateGroup(req, res, next));
routes.post("/users", master, (req, res, next) => ConfigurationController.createUser(req, res, next));
routes.patch("/users/:id", master, (req, res, next) => ConfigurationController.updateUser(req, res, next));
routes.patch("/users/:id/status", master, (req, res, next) => ConfigurationController.toggleUser(req, res, next));
routes.delete("/users/:id", master, (req, res, next) => ConfigurationController.removeUser(req, res, next));
routes.patch("/master-credentials", master, (req, res, next) => ConfigurationController.masterCredentials(req, res, next));

export default routes;