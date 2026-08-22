import { BaseController } from "./BaseController.js";
import AuthService from "../services/AuthService.js";

class AuthController extends BaseController {
  /**
   * Monta o contexto utilizado pela auditoria.
   */
  getRequestContext(req) {
    const forwardedFor =
      req.headers["x-forwarded-for"];

    const ipAddress =
      typeof forwardedFor === "string"
        ? forwardedFor
            .split(",")[0]
            .trim()
        : req.ip ?? null;

    return {
      ipAddress,
      userAgent:
        req.get("user-agent") ?? null,
    };
  }

  /**
   * POST /api/v1/auth/login
   */
  async login(req, res) {
    const result =
      await AuthService.login(
        req.body,
        this.getRequestContext(req)
      );

    return this.success(
      res,
      "Login realizado com sucesso.",
      result
    );
  }

  /**
   * POST /api/v1/auth/refresh
   */
  async refresh(req, res) {
    const result =
      await AuthService.refresh(
        req.body?.refreshToken
      );

    return this.success(
      res,
      "Tokens renovados com sucesso.",
      result
    );
  }

  /**
   * GET /api/v1/auth/me
   */
  async me(req, res) {
    const user =
      await AuthService.getCurrentUser(
        req.user.id
      );

    return this.success(
      res,
      "Usuário autenticado carregado com sucesso.",
      {
        user,
      }
    );
  }

  /**
   * POST /api/v1/auth/logout
   */
  async logout(req, res) {
    const result =
      await AuthService.logout(
        req.user.id,
        this.getRequestContext(req)
      );

    return this.success(
      res,
      result.message
    );
  }

  /**
   * PATCH /api/v1/auth/change-password
   */
  async changePassword(req, res) {
    const result =
      await AuthService.changePassword(
        req.user.id,
        req.body,
        this.getRequestContext(req)
      );

    return this.success(
      res,
      result.message
    );
  }
}

export default new AuthController();
