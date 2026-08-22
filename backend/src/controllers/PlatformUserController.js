import PlatformUserService from "../services/PlatformUserService.js";

class PlatformUserController {
  getRequestContext(req) {
    return {
      requestId:
        req.requestId ?? null,

      ipAddress:
        req.ip ?? null,

      userAgent:
        req.headers[
          "user-agent"
        ] ?? null,
    };
  }

  async store(
    req,
    res,
    next
  ) {
    try {
      const result =
        await PlatformUserService
          .createPlatformUser(
            req.body,
            req.user,
            this.getRequestContext(
              req
            )
          );

      return res.status(201).json({
        success: true,

        message:
          "Usuário interno da plataforma criado com sucesso.",

        data:
          result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async index(
    req,
    res,
    next
  ) {
    try {
      const result =
        await PlatformUserService
          .list(
            req.query,
            req.user
          );

      return res.status(200).json({
        success: true,

        message:
          "Usuários carregados com sucesso.",

        data:
          result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async statistics(
    req,
    res,
    next
  ) {
    try {
      const result =
        await PlatformUserService
          .statistics(
            req.user
          );

      return res.status(200).json({
        success: true,

        message:
          "Estatísticas de usuários carregadas com sucesso.",

        data:
          result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async show(
    req,
    res,
    next
  ) {
    try {
      const result =
        await PlatformUserService
          .findById(
            req.params.id,
            req.user
          );

      return res.status(200).json({
        success: true,

        message:
          "Usuário carregado com sucesso.",

        data:
          result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async update(
    req,
    res,
    next
  ) {
    try {
      const result =
        await PlatformUserService
          .update(
            req.params.id,
            req.body,
            req.user,
            this.getRequestContext(
              req
            )
          );

      return res.status(200).json({
        success: true,

        message:
          "Usuário atualizado com sucesso.",

        data:
          result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async changeStatus(
    req,
    res,
    next
  ) {
    try {
      const result =
        await PlatformUserService
          .changeStatus(
            req.params.id,
            req.body.status,
            req.user,
            this.getRequestContext(
              req
            )
          );

      return res.status(200).json({
        success: true,

        message:
          "Status do usuário atualizado com sucesso.",

        data:
          result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async resetPassword(
    req,
    res,
    next
  ) {
    try {
      const result =
        await PlatformUserService
          .resetPassword(
            req.params.id,
            req.body.newPassword,
            req.user,
            this.getRequestContext(
              req
            )
          );

      return res.status(200).json({
        success: true,

        message:
          "Senha redefinida com sucesso. O usuário deverá alterá-la no próximo acesso.",

        data:
          result,
      });
    } catch (error) {
      return next(error);
    }
  }
  async profile(
    req,
    res,
    next
  ) {
    try {
      const result =
        await PlatformUserService.profile(
          req.params.id,
          req.user
        );

      return res.status(200).json({
        success: true,
        message:
          "Ficha do colaborador carregada com sucesso.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

}

export default new PlatformUserController();
