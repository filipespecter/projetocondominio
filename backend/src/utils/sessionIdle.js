import { ApiError } from "./ApiError.js";
export const idleOptions = [15, 30, 45, 60];
export function idleMinutes(value) {
  return idleOptions.includes(value) ? value : 30;
}
export function sessionDeadline(session, user) {
  return Math.min(new Date(session.expiresAt).getTime(), new Date(session.lastInteractionAt ?? session.createdAt).getTime() + idleMinutes(user.idleTimeoutMinutes) * 60000);
}
export async function enforceIdle(session, user, db, now = new Date()) {
  const deadline = sessionDeadline(session, user);
  if (!Number.isFinite(deadline) || now.getTime() >= deadline) {
    const reason = new Date(session.expiresAt) <= now ? "ABSOLUTE_EXPIRY" : "IDLE_TIMEOUT";
    await db.authSession.updateMany({
      where: {
        id: session.id,
        revokedAt: null
      },
      data: {
        revokedAt: new Date(deadline || now.getTime()),
        revokeReason: reason
      }
    });
    if (db.userSession) await db.userSession.updateMany({
      where: {
        authSessionId: session.id,
        endedAt: null
      },
      data: {
        endedAt: new Date(deadline || now.getTime()),
        endReason: "EXPIRED"
      }
    });
    throw new ApiError("Sua sessão terminou por inatividade ou expiração. Entre novamente.", 401, {
      code: reason
    });
  }
}
