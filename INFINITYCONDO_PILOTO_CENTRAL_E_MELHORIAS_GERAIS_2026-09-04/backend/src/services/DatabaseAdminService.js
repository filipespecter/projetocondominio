import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import BackupService from "./BackupService.js";
import AuditLogService from "./AuditLogService.js";

class DatabaseAdminService {
  ensureAllowed(user) {
    if (user?.role !== "PLATFORM_OWNER") throw new ApiError("Operação exclusiva do proprietário da plataforma.", 403);
  }

  async overview(user) {
    this.ensureAllowed(user);
    const [condominiums, users, apartments, residents, doormen, visitors, packages, reservations, occurrences, expenses, charges, supportTickets, auditLogs, backups] = await Promise.all([
      prisma.condominium.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.apartment.count({ where: { deletedAt: null } }),
      prisma.resident.count({ where: { deletedAt: null } }),
      prisma.doorman.count({ where: { deletedAt: null } }),
      prisma.visitor.count({ where: { deletedAt: null } }),
      prisma.package.count({ where: { deletedAt: null } }),
      prisma.reservation.count({ where: { deletedAt: null } }),
      prisma.occurrence.count({ where: { deletedAt: null } }),
      prisma.expense.count({ where: { deletedAt: null } }),
      prisma.charge.count(),
      prisma.supportTicket.count(),
      prisma.auditLog.count({ where: { deletedAt: null } }),
      prisma.backupRecord.count(),
    ]);
    const latestBackup = await prisma.backupRecord.findFirst({ orderBy: { createdAt: "desc" } });
    return { environment: process.env.NODE_ENV ?? "development", canReset: (process.env.NODE_ENV ?? "development") !== "production", counts: { condominiums, users, apartments, residents, doormen, visitors, packages, reservations, occurrences, expenses, charges, supportTickets, auditLogs, backups }, latestBackup };
  }

  async resetHomologation({ confirmation, user, requestContext = null }) {
    this.ensureAllowed(user);
    if ((process.env.NODE_ENV ?? "development") === "production") throw new ApiError("O reset de dados é bloqueado em produção.", 403);
    if (String(confirmation ?? "").trim().toUpperCase() !== "ZERAR HOMOLOGACAO") throw new ApiError("Digite ZERAR HOMOLOGACAO para confirmar.", 400);

    // O reset só prossegue após um backup físico válido.
    const backup = await BackupService.createBackup({ trigger: "MANUAL", createdByUserId: user.id, metadata: { source: "PRE_HOMOLOGATION_RESET", requestId: requestContext?.requestId ?? null } });

    const before = await this.overview(user);
    await prisma.$transaction(async (tx) => {
      await tx.paymentTransaction.deleteMany({});
      await tx.supportTicket.deleteMany({});
      await tx.charge.deleteMany({});
      await tx.paymentMethod.deleteMany({});
      await tx.subscription.deleteMany({});
      const tenantUsers = await tx.user.findMany({ where: { condominiumId: { not: null } }, select: { id: true } });
      const tenantUserIds = tenantUsers.map((item) => item.id);
      if (tenantUserIds.length) await tx.passwordResetCode.deleteMany({ where: { userId: { in: tenantUserIds } } });
      await tx.occurrenceReply.deleteMany({});
      await tx.providerAccess.deleteMany({});
      await tx.operationalRecord.deleteMany({});
      await tx.expense.deleteMany({});
      await tx.expenseCategory.deleteMany({});
      await tx.notification.deleteMany({});
      await tx.reservation.deleteMany({});
      await tx.package.deleteMany({});
      await tx.visitor.deleteMany({});
      await tx.occurrence.deleteMany({});
      await tx.notice.deleteMany({});
      await tx.serviceProvider.deleteMany({});
      await tx.commonArea.deleteMany({});
      await tx.doorman.deleteMany({});
      await tx.resident.deleteMany({});
      await tx.apartment.deleteMany({});
      await tx.auditLog.deleteMany({ where: { condominiumId: { not: null } } });
      await tx.supportSession.deleteMany({});
      await tx.communicationLog.deleteMany({ where: { condominiumId: { not: null } } });
      await tx.jobExecution.deleteMany({ where: { condominiumId: { not: null } } });
      await tx.user.deleteMany({ where: { condominiumId: { not: null } } });
      await tx.condominium.deleteMany({});
    });

    await AuditLogService.createLog({ userId: user.id, userName: user.name, userRole: user.role, action: "RESET_HOMOLOGATION", module: "DATABASE_ADMIN", details: "Dados de homologação zerados após backup automático.", afterData: { backupId: backup.id, previousCounts: before.counts }, requestId: requestContext?.requestId ?? null, ipAddress: requestContext?.ipAddress ?? null, userAgent: requestContext?.userAgent ?? null });
    return { backup, previousCounts: before.counts, resetAt: new Date() };
  }
}

export default new DatabaseAdminService();
