import { Router } from "express";

import AuthController from "../controllers/AuthController.js";

import {
  validateLogin,
  validateRefresh,
  validateChangePassword,
} from "../validators/authValidator.js";

import {
  authMiddleware,
} from "../middlewares/authMiddleware.js";

const authRoutes = Router();

/**
 * =====================================================
 * ROTAS PÚBLICAS
 * =====================================================
 */

/**
 * Realiza login e devolve accessToken,
 * refreshToken e dados seguros do usuário.
 *
 * POST /api/v1/auth/login
 */
authRoutes.post(
  "/login",
  validateLogin,
  (req, res, next) =>
    AuthController.login(
      req,
      res,
      next
    )
);

/**
 * Renova o par de tokens.
 *
 * POST /api/v1/auth/refresh
 */
authRoutes.post(
  "/refresh",
  validateRefresh,
  (req, res, next) =>
    AuthController.refresh(
      req,
      res,
      next
    )
);

/**
 * =====================================================
 * ROTAS PROTEGIDAS
 * =====================================================
 */

/**
 * Retorna o usuário autenticado atual.
 *
 * GET /api/v1/auth/me
 */
authRoutes.get(
  "/me",
  authMiddleware,
  (req, res, next) =>
    AuthController.me(
      req,
      res,
      next
    )
);

/**
 * Registra o logout do usuário.
 *
 * POST /api/v1/auth/logout
 */
authRoutes.post(
  "/logout",
  authMiddleware,
  (req, res, next) =>
    AuthController.logout(
      req,
      res,
      next
    )
);

/**
 * Altera a senha do próprio usuário.
 *
 * PATCH /api/v1/auth/change-password
 */
authRoutes.patch(
  "/change-password",
  authMiddleware,
  validateChangePassword,
  (req, res, next) =>
    AuthController.changePassword(
      req,
      res,
      next
    )
);

export default authRoutes;
