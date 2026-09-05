import prisma from "../config/prisma.js";
import BackupService from "./BackupService.js";
import AuditLogService from "./AuditLogService.js";
import { ApiError } from "../utils/ApiError.js";

class HomologationService {
  ensureAllowed(user) {
    if (process.env.NODE_ENV === "production") {
      throw new ApiError("A limpeza de homologação não está disponível em produção.", 403);
    }
    if (user?.role !== "PLATFORM_OWNER" || user?.condominiumId) {
      throw new ApiError("A limpeza de homologação é exclusiva do proprietário da plataforma.", 403);
    }
  }

  async statistics(user) {
    this.ensureAllowed(user);
    const [condominiums, users, residents, apartments, packages, reservations, expenses, tickets, auditLogs, backups] = await Promise.all([
      prisma.condominium.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { condominiumId: { not: null }, deletedAt: null } }),
      prisma.resident.count({ where: { deletedAt: null } }),
      prisma.apartment.count({ where: { deletedAt: null } }),
      prisma.package.count({ where: { deletedAt: null } }),
      prisma.reservation.count({ where: { deletedAt: null } }),
      prisma.expense.count({ where: { deletedAt: null } }),
      prisma.supportTicket.count(),
      prisma.auditLog.count(),
      prisma.backupRecord.count(),
    ]);
    return { environment: process.env.NODE_ENV ?? "development", condominiums, users, residents, apartments, packages, reservations, expenses, tickets, auditLogs, backups };
  }

  async reset({ phrase, user, requestContext = null }) {
    this.ensureAllowed(user);
    if (String(phrase ?? "").trim().toUpperCase() !== "ZERAR HOMOLOGACAO") {
      throw new ApiError("Digite ZERAR HOMOLOGACAO para confirmar a limpeza.", 422);
    }

    const backup = await BackupService.createBackup({
      trigger: "MANUAL",
      createdByUserId: user.id,
      metadata: { source: "HOMOLOGATION_RESET", requestId: requestContext?.requestId ?? null },
    });

    await prisma.$transaction(async (tx) => {
      await tx.passwordResetCode.deleteMany();
      await tx.paymentTransaction.deleteMany();
      await tx.charge.deleteMany();
      await tx.paymentMethod.deleteMany();
      await tx.communicationLog.deleteMany();
      await tx.jobExecution.deleteMany();
      await tx.systemEvent.deleteMany();
      await tx.supportTicket.deleteMany();
      await tx.auditLog.deleteMany();
      await tx.supportSession.deleteMany();
      await tx.expense.deleteMany();
      await tx.expenseCategory.deleteMany();
      await tx.notification.deleteMany();
      await tx.occurrenceReply.deleteMany();
      await tx.occurrence.deleteMany();
      await tx.providerAccess.deleteMany();
      await tx.serviceProvider.deleteMany();
      await tx.operationalRecord.deleteMany();
      await tx.notice.deleteMany();
      await tx.reservation.deleteMany();
      await tx.package.deleteMany();
      await tx.visitor.deleteMany();
      await tx.resident.deleteMany();
      await tx.doorman.deleteMany();
      await tx.apartment.deleteMany();
      await tx.commonArea.deleteMany();
      await tx.subscription.deleteMany();
      await tx.user.deleteMany({ where: { condominiumId: { not: null } } });
      await tx.condominium.deleteMany();
    }, { timeout: 120000 });

    try { await prisma.$executeRawUnsafe('ALTER SEQUENCE "SupportTicket_ticketNumber_seq" RESTART WITH 1'); } catch { /* sequência pode variar entre ambientes */ }

    await AuditLogService.logCreate({
      condominiumId: null,
      user,
      module: "HOMOLOGATION",
      referenceId: backup?.id ?? null,
      afterData: { resetAt: new Date().toISOString(), backupId: backup?.id ?? null },
      details: "Ambiente de homologação zerado após backup de segurança.",
      requestContext,
    });

    return { backup, statistics: await this.statistics(user) };
  }
}

export default new HomologationService();
