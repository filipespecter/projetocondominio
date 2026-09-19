import { ApiError } from "../utils/ApiError.js";
import prisma from "../config/prisma.js";
function sanitizedDetails(value){const blocked=/password|senha|token|authorization|cookie|secret|api.?key|database_url/i;if(Array.isArray(value))return value.map(sanitizedDetails);if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,blocked.test(key)?"[REDACTED]":sanitizedDetails(item)]));return value;}

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
        stack: process.env.NODE_ENV==="production"?null:error?.stack??null,
        details: sanitizedDetails(error?.details??null),
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
