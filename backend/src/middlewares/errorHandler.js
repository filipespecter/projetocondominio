import { ApiError } from "../utils/ApiError.js";
import prisma from "../config/prisma.js";

export function notFoundHandler(req, res, next) {
  next(new ApiError(`Rota não encontrada: ${req.method} ${req.originalUrl}`, 404));
}

function severityFromStatus(statusCode) {
  if (statusCode >= 500) return "ERROR";
  if (statusCode >= 400) return "WARNING";
  return "INFO";
}

async function registerSystemEvent(error, req, statusCode) {
  try {
    await prisma.systemEvent.create({
      data: {
        condominiumId: req.user?.condominiumId ?? req.supportSession?.condominiumId ?? null,
        userId: req.user?.id ?? null,
        severity: severityFromStatus(statusCode),
        type: error?.name || "HTTP_ERROR",
        source: "API",
        message: error?.message || "Erro não identificado.",
        requestId: req.requestId ?? null,
        errorCode: error?.code ? String(error.code) : null,
        httpMethod: req.method ?? null,
        route: req.originalUrl ?? req.url ?? null,
        statusCode,
        stack: error?.stack ?? null,
        details: error?.details ?? null,
      },
    });
  } catch (loggingError) {
    console.error("Falha ao registrar SystemEvent:", loggingError);
  }
}

export async function errorHandler(error, req, res, _next) {
  const statusCode = Number(error.statusCode) >= 400 ? Number(error.statusCode) : 500;
  const isProduction = process.env.NODE_ENV === "production";

  if (statusCode >= 500) {
    console.error(error);
    await registerSystemEvent(error, req, statusCode);
  }

  return res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? "Erro interno do servidor." : error.message,
    details: error.details || null,
    requestId: req.requestId ?? null,
    ...(!isProduction && { stack: error.stack }),
  });
}
