import { ApiError } from "../utils/ApiError.js";

export function notFoundHandler(req, res, next) {
  next(
    new ApiError(
      `Rota não encontrada: ${req.method} ${req.originalUrl}`,
      404
    )
  );
}

export function errorHandler(error, req, res, next) {
  const statusCode =
    Number(error.statusCode) >= 400
      ? Number(error.statusCode)
      : 500;

  const isProduction =
    process.env.NODE_ENV === "production";

  if (statusCode >= 500) {
    console.error(error);
  }

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Erro interno do servidor."
        : error.message,
    details: error.details || null,
    ...(!isProduction && {
      stack: error.stack
    })
  });
}