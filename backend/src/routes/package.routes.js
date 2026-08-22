import { Router } from "express";

import PackageController from "../controllers/PackageController.js";

import {
  authMiddleware,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

import {
  validatePackageId,
  validatePackageResidentId,
  validatePackageListQuery,
  validateCreateExpectedPackage,
  validateCreateReceivedPackage,
  validateUpdatePackage,
  validateDeliverPackage,
  validatePickupCredentialRequest,
  validatePickup,
  validateConfirmPickup,
  validateCancelPackage,
} from "../validators/packageValidator.js";

const packageRoutes = Router();

/**
 * Todas as rotas de encomendas exigem autenticação.
 */
packageRoutes.use(
  authMiddleware
);

/**
 * Administração e portaria podem acompanhar
 * e operar o fluxo geral de encomendas.
 */
const operationalRoles =
  authorizeRoles(
    "CONDOMINIUM_ADMIN",
    "MANAGER",
    "DOORMAN"
  );

/**
 * Somente a administração pode editar
 * ou remover registros.
 */
const administrativeRoles =
  authorizeRoles(
    "CONDOMINIUM_ADMIN",
    "MANAGER"
  );

/**
 * GET /api/v1/packages/statistics
 *
 * Estatísticas para dashboard e BI.
 *
 * Deve ficar antes de "/:id".
 */
packageRoutes.get(
  "/statistics",
  operationalRoles,
  (req, res, next) =>
    PackageController.statistics(
      req,
      res,
      next
    )
);

/**
 * GET /api/v1/packages
 *
 * Lista encomendas.
 *
 * Filtros opcionais:
 * ?status=RECEIVED
 * ?apartmentId=UUID
 * ?pending=true
 */
packageRoutes.get(
  "/",
  operationalRoles,
  validatePackageListQuery,
  (req, res, next) =>
    PackageController.index(
      req,
      res,
      next
    )
);

/**
 * GET /api/v1/packages/resident/:residentId/expected
 *
 * Lista encomendas esperadas por um morador.
 */
packageRoutes.get(
  "/resident/:residentId/expected",
  operationalRoles,
  validatePackageResidentId,
  (req, res, next) =>
    PackageController.expectedByResident(
      req,
      res,
      next
    )
);

/**
 * POST /api/v1/packages/expected
 *
 * Morador registra uma encomenda esperada.
 *
 * O ResidentService resolve o perfil do morador
 * pelo usuário autenticado.
 */
packageRoutes.post(
  "/expected",
  authorizeRoles(
    "RESIDENT"
  ),
  validateCreateExpectedPackage,
  (req, res, next) =>
    PackageController.createExpected(
      req,
      res,
      next
    )
);

/**
 * POST /api/v1/packages/received
 *
 * Portaria ou administração registra
 * uma encomenda que já chegou.
 */
packageRoutes.post(
  "/received",
  operationalRoles,
  validateCreateReceivedPackage,
  (req, res, next) =>
    PackageController.createReceived(
      req,
      res,
      next
    )
);

/**
 * GET /api/v1/packages/my
 *
 * Lista as encomendas do apartamento do morador
 * autenticado.
 *
 * Segurança:
 * - somente RESIDENT;
 * - residentId e apartmentId são resolvidos pelo backend;
 * - o frontend não consegue consultar outro apartamento.
 *
 * Deve ficar antes de "/:id".
 */
packageRoutes.get(
  "/my",
  authorizeRoles(
    "RESIDENT"
  ),
  (req, res, next) =>
    PackageController.myPackages(
      req,
      res,
      next
    )
);

/**
 * POST /api/v1/packages/:id/pickup-credential
 *
 * Morador gera/renova QR e codigo de 6 digitos
 * para uma encomenda RECEIVED do proprio apartamento.
 */
packageRoutes.post(
  "/:id/pickup-credential",
  authorizeRoles(
    "RESIDENT"
  ),
  validatePackageId,
  validatePickupCredentialRequest,
  (req, res, next) =>
    PackageController.pickupCredential(
      req,
      res,
      next
    )
);

/**
 * POST /api/v1/packages/pickup/validate
 *
 * Portaria valida QR ou codigo antes
 * da confirmacao da retirada.
 *
 * Precisa ficar antes de "/:id".
 */
packageRoutes.post(
  "/pickup/validate",
  operationalRoles,
  validatePickup,
  (req, res, next) =>
    PackageController.validatePickup(
      req,
      res,
      next
    )
);

/**
 * POST /api/v1/packages/:id/pickup/confirm
 *
 * Confirma quem retirou e invalida a credencial.
 */
packageRoutes.post(
  "/:id/pickup/confirm",
  operationalRoles,
  validatePackageId,
  validateConfirmPickup,
  (req, res, next) =>
    PackageController.confirmPickup(
      req,
      res,
      next
    )
);

/**
 * GET /api/v1/packages/:id
 *
 * Busca uma encomenda específica.
 */
packageRoutes.get(
  "/:id",
  operationalRoles,
  validatePackageId,
  (req, res, next) =>
    PackageController.show(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/packages/:id
 *
 * Atualiza os dados editáveis.
 */
packageRoutes.patch(
  "/:id",
  administrativeRoles,
  validatePackageId,
  validateUpdatePackage,
  (req, res, next) =>
    PackageController.update(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/packages/:id/received
 *
 * Marca uma encomenda esperada como recebida.
 */
packageRoutes.patch(
  "/:id/received",
  operationalRoles,
  validatePackageId,
  (req, res, next) =>
    PackageController.registerReceived(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/packages/:id/deliver
 *
 * Registra a retirada da encomenda.
 */
packageRoutes.patch(
  "/:id/deliver",
  operationalRoles,
  validatePackageId,
  validateDeliverPackage,
  (req, res, next) =>
    PackageController.deliver(
      req,
      res,
      next
    )
);

/**
 * PATCH /api/v1/packages/:id/cancel
 *
 * Cancela uma encomenda esperada ou recebida.
 */
packageRoutes.patch(
  "/:id/cancel",
  operationalRoles,
  validatePackageId,
  validateCancelPackage,
  (req, res, next) =>
    PackageController.cancel(
      req,
      res,
      next
    )
);

/**
 * DELETE /api/v1/packages/:id
 *
 * Executa exclusão lógica.
 *
 * O Service impede a remoção de encomendas
 * aguardando retirada.
 */
packageRoutes.delete(
  "/:id",
  administrativeRoles,
  validatePackageId,
  (req, res, next) =>
    PackageController.remove(
      req,
      res,
      next
    )
);

export default packageRoutes;
