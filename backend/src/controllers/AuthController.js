import { BaseController } from "./BaseController.js";
import AuthService from "../services/AuthService.js";
import env from "../config/env.js";
const REFRESH_COOKIE="infinityCondoRefresh";
const cookieOptions=()=>({httpOnly:true,secure:env.NODE_ENV==="production",sameSite:"strict",path:"/api/v1/auth",maxAge:7*24*60*60*1000});
function readCookie(req,name){const entry=String(req.headers.cookie??"").split(";").map(v=>v.trim()).find(v=>v.startsWith(`${name}=`));return entry?decodeURIComponent(entry.slice(name.length+1)):null;}

class AuthController extends BaseController {
  /**
   * Monta o contexto utilizado pela auditoria.
   */
  getRequestContext(req) {
    return {
      ipAddress: req.ip ?? null,
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
    res.cookie(REFRESH_COOKIE,result.refreshToken,cookieOptions()); delete result.refreshToken;

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
        readCookie(req,REFRESH_COOKIE),
        this.getRequestContext(req)
      );
    res.cookie(REFRESH_COOKIE,result.refreshToken,cookieOptions()); delete result.refreshToken;

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
        this.getRequestContext(req),
        req.auth?.payload?.sid
      );
    res.clearCookie(REFRESH_COOKIE,cookieOptions());

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

  async requestPasswordReset(req, res) {
    const result = await AuthService.requestPasswordReset(req.body, this.getRequestContext(req));
    return this.success(res, result.message, result);
  }

  async confirmPasswordReset(req, res) {
    const result = await AuthService.confirmPasswordReset(req.body, this.getRequestContext(req));
    return this.success(res, result.message, result);
  }

}

export default new AuthController();
