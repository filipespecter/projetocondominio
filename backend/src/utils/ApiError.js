export class ApiError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);

    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace?.(this, ApiError);
  }
}