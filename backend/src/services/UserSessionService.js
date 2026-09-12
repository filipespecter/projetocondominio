import prisma from "../config/prisma.js";

function isMissingSchemaError(error) {
  return ["P2021", "P2022"].includes(error?.code);
}

class UserSessionService {
  async start(user, requestContext = null) {
    if (!user?.id) return null;
    const now = new Date();
    try {
      await prisma.userSession.updateMany({
        where: { userId: user.id, endedAt: null },
        data: { endedAt: now, endReason: "NEW_LOGIN", lastActivityAt: now },
      });
      return prisma.userSession.create({
        data: {
          userId: user.id,
          condominiumId: user.condominiumId ?? null,
          startedAt: now,
          lastActivityAt: now,
          ipAddress: requestContext?.ipAddress ?? null,
          userAgent: requestContext?.userAgent ?? null,
        },
      });
    } catch (error) {
      if (isMissingSchemaError(error)) return null;
      throw error;
    }
  }

  async touch(userId) {
    if (!userId) return null;
    try {
      const now = new Date();
      return await prisma.userSession.updateMany({
        where: { userId, endedAt: null },
        data: { lastActivityAt: now },
      });
    } catch (error) {
      if (isMissingSchemaError(error)) return null;
      throw error;
    }
  }

  async endLatest(userId, reason = "LOGOUT") {
    if (!userId) return null;
    try {
      const session = await prisma.userSession.findFirst({
        where: { userId, endedAt: null },
        orderBy: { startedAt: "desc" },
      });
      if (!session) return null;
      const now = new Date();
      return prisma.userSession.update({
        where: { id: session.id },
        data: { endedAt: now, lastActivityAt: now, endReason: reason },
      });
    } catch (error) {
      if (isMissingSchemaError(error)) return null;
      throw error;
    }
  }

  async listByUser(userId, condominiumId, days = 30) {
    const since = new Date(Date.now() - Math.max(1, days) * 86400000);
    try {
      return prisma.userSession.findMany({
        where: { userId, condominiumId, startedAt: { gte: since } },
        orderBy: { startedAt: "desc" },
        take: 200,
      });
    } catch (error) {
      if (isMissingSchemaError(error)) return [];
      throw error;
    }
  }
}

export default new UserSessionService();
