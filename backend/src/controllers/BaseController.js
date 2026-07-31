import { ApiResponse } from "../utils/ApiResponse.js";
import { Logger } from "../utils/logger.js";

export class BaseController {
  /**
   * Resposta de sucesso
   */
  success(res, message, data = null) {
    return ApiResponse.success(res, message, data);
  }

  /**
   * Recurso criado
   */
  created(res, message, data = null) {
    return ApiResponse.created(res, message, data);
  }

  /**
   * Erro de validação
   */
  badRequest(res, message, errors = null) {
    return ApiResponse.badRequest(res, message, errors);
  }

  /**
   * Não autenticado
   */
  unauthorized(res, message) {
    return ApiResponse.unauthorized(res, message);
  }

  /**
   * Sem permissão
   */
  forbidden(res, message) {
    return ApiResponse.forbidden(res, message);
  }

  /**
   * Não encontrado
   */
  notFound(res, message) {
    return ApiResponse.notFound(res, message);
  }

  /**
   * Conflito
   */
  conflict(res, message) {
    return ApiResponse.conflict(res, message);
  }

  /**
   * Erro interno
   */
  error(res, error, message = "Erro interno do servidor.") {
    Logger.error(message, error);

    return ApiResponse.error(res, message);
  }

  /**
   * Resposta paginada
   */
  paginated(res, message, data, pagination) {
    return ApiResponse.paginated(
      res,
      message,
      data,
      pagination
    );
  }
}
