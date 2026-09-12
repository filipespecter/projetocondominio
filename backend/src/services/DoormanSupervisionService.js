import prisma from "../config/prisma.js";
import doormanRepository from "../repositories/DoormanRepository.js";
import UserSessionService from "./UserSessionService.js";
import { ApiError } from "../utils/ApiError.js";

class DoormanSupervisionService {
  durationSeconds(session, now = new Date()) {
    const start = new Date(session.startedAt);
    const end = session.endedAt
      ? new Date(session.endedAt)
      : session.lastActivityAt
        ? new Date(session.lastActivityAt)
        : now;
    const seconds = Math.max(0, Math.floor((end - start) / 1000));
    // Limita sessões sem logout explícito a 24h para não distorcer relatórios.
    return Math.min(seconds, 24 * 60 * 60);
  }

  async get(doormanId, condominiumId, days = 30) {
    const doorman = await doormanRepository.findById(doormanId, condominiumId);
    if (!doorman) throw new ApiError("Porteiro não encontrado.", 404);
    const userId = doorman.userId;
    const since = new Date(Date.now() - Math.max(1, Math.min(Number(days) || 30, 90)) * 86400000);

    const [sessions, auditLogs, occurrences, packagesReceived, packagesDelivered, visitorsRegistered, visitorsAuthorized, providerEntries, providerExits, openVisitors, openProviders, urgentOccurrences] = await Promise.all([
      UserSessionService.listByUser(userId, condominiumId, days),
      prisma.auditLog.findMany({
        where: { condominiumId, userId, createdAt: { gte: since }, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 150,
        select: { id: true, action: true, module: true, details: true, referenceId: true, createdAt: true },
      }),
      prisma.occurrence.count({ where: { condominiumId, createdByUserId: userId, createdAt: { gte: since }, deletedAt: null } }),
      prisma.package.count({ where: { condominiumId, receivedByUserId: userId, receivedAt: { gte: since }, deletedAt: null } }),
      prisma.package.count({ where: { condominiumId, deliveredByUserId: userId, deliveredAt: { gte: since }, deletedAt: null } }),
      prisma.visitor.count({ where: { condominiumId, registeredByUserId: userId, createdAt: { gte: since }, deletedAt: null } }),
      prisma.visitor.count({ where: { condominiumId, authorizedByUserId: userId, authorizedAt: { gte: since }, deletedAt: null } }),
      prisma.providerAccess.count({ where: { condominiumId, entryRegisteredByUserId: userId, enteredAt: { gte: since }, deletedAt: null } }),
      prisma.providerAccess.count({ where: { condominiumId, exitRegisteredByUserId: userId, exitedAt: { gte: since }, deletedAt: null } }),
      prisma.visitor.count({ where: { condominiumId, registeredByUserId: userId, status: "INSIDE", exitedAt: null, deletedAt: null } }),
      prisma.providerAccess.count({ where: { condominiumId, entryRegisteredByUserId: userId, status: "INSIDE", exitedAt: null, deletedAt: null } }),
      prisma.occurrence.count({ where: { condominiumId, createdByUserId: userId, priority: "URGENT", status: { notIn: ["RESOLVED", "CLOSED", "CANCELED"] }, deletedAt: null } }),
    ]);

    const totalSeconds = sessions.reduce((sum, session) => sum + this.durationSeconds(session), 0);
    const activeSession = sessions.find((session) => {
      if (session.endedAt) return false;
      const last = new Date(session.lastActivityAt ?? session.startedAt).getTime();
      return Date.now() - last <= 15 * 60 * 1000;
    }) ?? null;
    const alerts = [];
    if (openVisitors > 0) alerts.push({ type: "VISITOR_OPEN", severity: "HIGH", count: openVisitors, message: `${openVisitors} visitante(s) registrado(s) por este porteiro ainda constam dentro.` });
    if (openProviders > 0) alerts.push({ type: "PROVIDER_OPEN", severity: "HIGH", count: openProviders, message: `${openProviders} prestador(es) com entrada registrada por este porteiro ainda estão sem saída.` });
    if (urgentOccurrences > 0) alerts.push({ type: "URGENT_OCCURRENCE", severity: "URGENT", count: urgentOccurrences, message: `${urgentOccurrences} ocorrência(s) urgente(s) criada(s) por este porteiro ainda estão abertas.` });

    return {
      doorman,
      periodDays: Number(days) || 30,
      metrics: {
        sessions: sessions.length,
        totalOnlineSeconds: totalSeconds,
        activeNow: Boolean(activeSession),
        occurrences,
        packagesReceived,
        packagesDelivered,
        visitorsRegistered,
        visitorsAuthorized,
        providerEntries,
        providerExits,
        pendingAlerts: alerts.reduce((sum, alert) => sum + alert.count, 0),
      },
      sessions: sessions.map((session) => ({ ...session, durationSeconds: this.durationSeconds(session) })),
      alerts,
      timeline: auditLogs,
    };
  }
}

export default new DoormanSupervisionService();
