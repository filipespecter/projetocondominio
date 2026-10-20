import { ApiError } from "./ApiError.js";
export async function enforceLoginLock(user, db, now = new Date()) {
  if (!user?.lockedUntil) return;
  if (new Date(user.lockedUntil) > now) {
    throw new ApiError("Acesso temporariamente bloqueado. Aguarde o horário informado para tentar novamente.", 429, { lockedUntil: user.lockedUntil });
  }
  // Não apagar um bloqueio renovado por outra requisição.
  await db.user.updateMany({ where: { id: user.id, lockedUntil: { lte: now } }, data: { failedLoginAttempts: 0, lockedUntil: null } });
}
