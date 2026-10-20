import { ApiError } from "../utils/ApiError.js";
import { validatePasswordPolicy } from "../utils/PasswordPolicy.js";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function resetClientPassword({ actor, condominiumId, userId, data, context = {} }, { db, hash }) {
  if (!actor || !["PLATFORM_OWNER", "PLATFORM_ADMIN"].includes(actor.role) || actor.condominiumId != null) throw new ApiError("Redefinição restrita aos administradores da Central.", 403);
  if (!uuid.test(String(condominiumId)) || !uuid.test(String(userId))) throw new ApiError("Cliente ou usuário inválido.", 400);
  if (typeof data?.temporaryPassword !== "string" || data.temporaryPassword !== data.passwordConfirmation) throw new ApiError("Confirme a senha temporária corretamente.", 400);
  validatePasswordPolicy(data.temporaryPassword, "senha temporária");
  const where = { id: userId, condominiumId, deletedAt: null, role: { in: ["CONDOMINIUM_ADMIN", "MANAGER"] } };
  const target = await db.user.findFirst({ where, select: { id: true, username: true, email: true } });
  if (!target) throw new ApiError("Administrador não encontrado neste condomínio.", 404);
  const passwordHash = await hash(data.temporaryPassword);
  await db.$transaction(async tx => {
    const updated = await tx.user.updateMany({ where, data: { passwordHash, mustChangePassword: true, failedLoginAttempts: 0, lockedUntil: null, securityVersion: { increment: 1 } } });
    if (updated.count !== 1) throw new ApiError("O cadastro mudou. Atualize a ficha antes de redefinir.", 409);
    await tx.authSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date(), revokeReason: "ADMIN_PASSWORD_RESET" } });
    await tx.passwordResetCode.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } });
    await tx.auditLog.create({ data: { condominiumId, userId: actor.id, userName: actor.name, userRole: actor.role, action: "PASSWORD_RESET", module: "PLATFORM_CLIENT_ACCESS", referenceId: userId, details: "Central redefiniu senha temporária do administrador do condomínio; sessões revogadas e troca obrigatória.", ipAddress: context.ipAddress ?? null, userAgent: context.userAgent ?? null } });
  });
  return { userId: target.id, username: target.username, email: target.email, mustChangePassword: true };
}
