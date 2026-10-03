import { ApiError } from "../utils/ApiError.js";
const allowed = new Set([
  "GET /api/v1/auth/me",
  "PATCH /api/v1/auth/change-password",
  "POST /api/v1/auth/logout",
]);
export function enforcePasswordChange(user, req) {
  const path = String(req.originalUrl ?? "").split("?")[0].replace(/\/+$/, "");
  if (user.mustChangePassword && !allowed.has(`${req.method} ${path}`)) {
    throw new ApiError("Altere sua senha temporária antes de continuar.", 403, { code: "PASSWORD_CHANGE_REQUIRED" });
  }
}
