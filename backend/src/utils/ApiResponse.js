export class ApiResponse {
  static success(res, message = "Operação realizada com sucesso.", data = null) {
    return res.status(200).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static created(res, message = "Recurso criado com sucesso.", data = null) {
    return res.status(201).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static badRequest(res, message = "Requisição inválida.", errors = null) {
    return res.status(400).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    });
  }

  static unauthorized(res, message = "Não autenticado.") {
    return res.status(401).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  static forbidden(res, message = "Acesso negado.") {
    return res.status(403).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  static notFound(res, message = "Recurso não encontrado.") {
    return res.status(404).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  static conflict(res, message = "Conflito de dados.") {
    return res.status(409).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  static error(res, message = "Erro interno do servidor.") {
    return res.status(500).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  static paginated(
    res,
    message,
    data,
    pagination
  ) {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination,
      timestamp: new Date().toISOString()
    });
  }
}