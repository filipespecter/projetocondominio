import prisma from "../config/prisma.js";

/**
 * =====================================================
 * PLATFORM DASHBOARD SERVICE
 * =====================================================
 *
 * Centraliza os indicadores globais da plataforma
 * InfinityCondo para uso exclusivo do PLATFORM_ADMIN.
 *
 * Este Service consulta diretamente o Prisma porque
 * agrega dados de diversos domínios ao mesmo tempo:
 *
 * - condomínios;
 * - usuários;
 * - assinaturas;
 * - planos;
 * - operação;
 * - financeiro;
 * - comunicações;
 * - jobs;
 * - backups;
 * - eventos do sistema.
 *
 * O objetivo é evitar espalhar consultas de dashboard
 * por vários Services de domínio.
 */
class PlatformDashboardService {
  /**
   * Soma valores em centavos de cobranças.
   */
  async sumCharges(where = {}) {
    const result =
      await prisma.charge.aggregate({
        where,
        _sum: {
          amountInCents: true,
        },
      });

    return (
      result._sum.amountInCents ??
      0
    );
  }

  /**
   * Retorna os indicadores globais da Central.
   */
  async getDashboard() {
    const [
      condominiumsTotal,
      condominiumsPending,
      condominiumsTrial,
      condominiumsActive,
      condominiumsSuspended,
      condominiumsCanceled,
      condominiumsRejected,

      usersTotal,
      usersActive,
      usersInactive,
      usersBlocked,
      usersPending,
      platformOwners,
      platformAdmins,
      platformSupports,
      condominiumAdmins,
      managers,
      doormenUsers,
      residentsUsers,

      subscriptionsTotal,
      subscriptionsTrial,
      subscriptionsActive,
      subscriptionsOverdue,
      subscriptionsSuspended,
      subscriptionsCanceled,

      plansTotal,
      plansActive,
      plansInactive,

      apartmentsTotal,
      residentsTotal,
      doormenTotal,
      visitorsTotal,
      packagesTotal,
      reservationsTotal,
      occurrencesTotal,
      serviceProvidersTotal,

      chargesTotal,
      chargesPending,
      chargesPaid,
      chargesOverdue,
      chargesFailed,
      chargesCanceled,
      chargesRefunded,

      amountPending,
      amountPaid,
      amountOverdue,

      communicationsTotal,
      communicationsPending,
      communicationsSent,
      communicationsDelivered,
      communicationsFailed,

      jobsTotal,
      jobsPending,
      jobsRunning,
      jobsSuccess,
      jobsFailed,

      backupsTotal,
      backupsPending,
      backupsRunning,
      backupsSuccess,
      backupsFailed,
      backupsVerified,

      systemEventsTotal,
      systemEventsWarning,
      systemEventsError,
      systemEventsCritical,
      unresolvedSystemEvents,

      recentPendingCondominiums,
      recentAuditLogs,
      recentFailedCommunications,
      recentFailedJobs,
      recentSystemEvents,
      latestBackup,
    ] = await Promise.all([
      prisma.condominium.count({
        where: {
          status: {
            in: ["PENDING", "TRIAL", "ACTIVE", "SUSPENDED"],
          },
          deletedAt: null,
        },
      }),

      prisma.condominium.count({
        where: {
          status: "PENDING",
          deletedAt: null,
        },
      }),

      prisma.condominium.count({
        where: {
          status: "TRIAL",
          deletedAt: null,
        },
      }),

      prisma.condominium.count({
        where: {
          status: "ACTIVE",
          deletedAt: null,
        },
      }),

      prisma.condominium.count({
        where: {
          status: "SUSPENDED",
          deletedAt: null,
        },
      }),

      prisma.condominium.count({
        where: {
          status: "CANCELED",
          deletedAt: null,
        },
      }),

      prisma.condominium.count({
        where: {
          status: "REJECTED",
          deletedAt: null,
        },
      }),

      prisma.user.count({
        where: {
          deletedAt: null,
        },
      }),

      prisma.user.count({
        where: {
          status: "ACTIVE",
          deletedAt: null,
        },
      }),

      prisma.user.count({
        where: {
          status: "INACTIVE",
          deletedAt: null,
        },
      }),

      prisma.user.count({
        where: {
          status: "BLOCKED",
          deletedAt: null,
        },
      }),

      prisma.user.count({
        where: {
          status: "PENDING",
          deletedAt: null,
        },
      }),

      prisma.user.count({
        where: {
          role: "PLATFORM_OWNER",
          deletedAt: null,
        },
      }),

      prisma.user.count({
        where: {
          role: "PLATFORM_ADMIN",
          deletedAt: null,
        },
      }),

      prisma.user.count({
        where: {
          role: "PLATFORM_SUPPORT",
          deletedAt: null,
        },
      }),

      prisma.user.count({
        where: {
          role: "CONDOMINIUM_ADMIN",
          deletedAt: null,
        },
      }),

      prisma.user.count({
        where: {
          role: "MANAGER",
          deletedAt: null,
        },
      }),

      prisma.user.count({
        where: {
          role: "DOORMAN",
          deletedAt: null,
        },
      }),

      prisma.user.count({
        where: {
          role: "RESIDENT",
          deletedAt: null,
        },
      }),

      prisma.subscription.count(),

      prisma.subscription.count({
        where: {
          status: "TRIAL",
        },
      }),

      prisma.subscription.count({
        where: {
          status: "ACTIVE",
        },
      }),

      prisma.subscription.count({
        where: {
          status: "OVERDUE",
        },
      }),

      prisma.subscription.count({
        where: {
          status: "SUSPENDED",
        },
      }),

      prisma.subscription.count({
        where: {
          status: "CANCELED",
        },
      }),

      prisma.plan.count({
        where: {
          deletedAt: null,
        },
      }),

      prisma.plan.count({
        where: {
          active: true,
          deletedAt: null,
        },
      }),

      prisma.plan.count({
        where: {
          active: false,
          deletedAt: null,
        },
      }),

      prisma.apartment.count({
        where: {
          deletedAt: null,
        },
      }),

      prisma.resident.count({
        where: {
          deletedAt: null,
        },
      }),

      prisma.doorman.count({
        where: {
          deletedAt: null,
        },
      }),

      prisma.visitor.count({
        where: {
          deletedAt: null,
        },
      }),

      prisma.package.count({
        where: {
          deletedAt: null,
        },
      }),

      prisma.reservation.count({
        where: {
          deletedAt: null,
        },
      }),

      prisma.occurrence.count({
        where: {
          deletedAt: null,
        },
      }),

      prisma.serviceProvider.count({
        where: {
          deletedAt: null,
        },
      }),

      prisma.charge.count(),

      prisma.charge.count({
        where: {
          status: "PENDING",
        },
      }),

      prisma.charge.count({
        where: {
          status: "PAID",
        },
      }),

      prisma.charge.count({
        where: {
          status: "OVERDUE",
        },
      }),

      prisma.charge.count({
        where: {
          status: "FAILED",
        },
      }),

      prisma.charge.count({
        where: {
          status: "CANCELED",
        },
      }),

      prisma.charge.count({
        where: {
          status: "REFUNDED",
        },
      }),

      this.sumCharges({
        status: "PENDING",
      }),

      this.sumCharges({
        status: "PAID",
      }),

      this.sumCharges({
        status: "OVERDUE",
      }),

      prisma.communicationLog.count(),

      prisma.communicationLog.count({
        where: {
          status: "PENDING",
        },
      }),

      prisma.communicationLog.count({
        where: {
          status: "SENT",
        },
      }),

      prisma.communicationLog.count({
        where: {
          status: "DELIVERED",
        },
      }),

      prisma.communicationLog.count({
        where: {
          status: "FAILED",
        },
      }),

      prisma.jobExecution.count(),

      prisma.jobExecution.count({
        where: {
          status: "PENDING",
        },
      }),

      prisma.jobExecution.count({
        where: {
          status: "RUNNING",
        },
      }),

      prisma.jobExecution.count({
        where: {
          status: "SUCCESS",
        },
      }),

      prisma.jobExecution.count({
        where: {
          status: "FAILED",
        },
      }),

      prisma.backupRecord.count(),

      prisma.backupRecord.count({
        where: {
          status: "PENDING",
        },
      }),

      prisma.backupRecord.count({
        where: {
          status: "RUNNING",
        },
      }),

      prisma.backupRecord.count({
        where: {
          status: "SUCCESS",
        },
      }),

      prisma.backupRecord.count({
        where: {
          status: "FAILED",
        },
      }),

      prisma.backupRecord.count({
        where: {
          status: "VERIFIED",
        },
      }),

      prisma.systemEvent.count(),

      prisma.systemEvent.count({
        where: {
          severity: "WARNING",
        },
      }),

      prisma.systemEvent.count({
        where: {
          severity: "ERROR",
        },
      }),

      prisma.systemEvent.count({
        where: {
          severity: "CRITICAL",
        },
      }),

      prisma.systemEvent.count({
        where: {
          resolvedAt: null,
        },
      }),

      prisma.condominium.findMany({
        where: {
          status: "PENDING",
          deletedAt: null,
        },

        select: {
          id: true,
          code: true,
          name: true,
          legalName: true,
          document: true,
          contactName: true,
          email: true,
          phone: true,
          city: true,
          state: true,
          createdAt: true,
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 10,
      }),

      prisma.auditLog.findMany({
        select: {
          id: true,
          condominiumId: true,
          userId: true,
          userName: true,
          userRole: true,
          action: true,
          module: true,
          details: true,
          referenceId: true,
          requestId: true,
          createdAt: true,
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 20,
      }),

      prisma.communicationLog.findMany({
        where: {
          status: "FAILED",
        },

        select: {
          id: true,
          condominiumId: true,
          channel: true,
          recipient: true,
          module: true,
          referenceId: true,
          attemptCount: true,
          lastError: true,
          createdAt: true,
          updatedAt: true,
        },

        orderBy: {
          updatedAt: "desc",
        },

        take: 10,
      }),

      prisma.jobExecution.findMany({
        where: {
          status: "FAILED",
        },

        select: {
          id: true,
          condominiumId: true,
          jobName: true,
          attempt: true,
          maxAttempts: true,
          error: true,
          scheduledAt: true,
          startedAt: true,
          finishedAt: true,
          createdAt: true,
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 10,
      }),

      prisma.systemEvent.findMany({
        where: {
          severity: {
            in: [
              "WARNING",
              "ERROR",
              "CRITICAL",
            ],
          },
        },

        select: {
          id: true,
          condominiumId: true,
          userId: true,
          severity: true,
          type: true,
          source: true,
          message: true,
          requestId: true,
          errorCode: true,
          statusCode: true,
          occurredAt: true,
          resolvedAt: true,
        },

        orderBy: {
          occurredAt: "desc",
        },

        take: 10,
      }),

      prisma.backupRecord.findFirst({
        orderBy: {
          createdAt: "desc",
        },

        select: {
          id: true,
          status: true,
          trigger: true,
          storageProvider: true,
          fileName: true,
          sizeBytes: true,
          checksumSha256: true,
          startedAt: true,
          completedAt: true,
          verifiedAt: true,
          retentionUntil: true,
          failureReason: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      generatedAt:
        new Date().toISOString(),

      condominiums: {
        total:
          condominiumsTotal,

        pending:
          condominiumsPending,

        trial:
          condominiumsTrial,

        active:
          condominiumsActive,

        suspended:
          condominiumsSuspended,

        canceled:
          condominiumsCanceled,

        rejected:
          condominiumsRejected,
      },

      users: {
        total:
          usersTotal,

        byStatus: {
          active:
            usersActive,

          inactive:
            usersInactive,

          blocked:
            usersBlocked,

          pending:
            usersPending,
        },

        byRole: {
          platformOwners,
          platformAdmins,
          platformSupports,
          condominiumAdmins,
          managers,
          doormen:
            doormenUsers,

          residents:
            residentsUsers,
        },
      },

      subscriptions: {
        total:
          subscriptionsTotal,

        trial:
          subscriptionsTrial,

        active:
          subscriptionsActive,

        overdue:
          subscriptionsOverdue,

        suspended:
          subscriptionsSuspended,

        canceled:
          subscriptionsCanceled,
      },

      plans: {
        total:
          plansTotal,

        active:
          plansActive,

        inactive:
          plansInactive,
      },

      operation: {
        apartments:
          apartmentsTotal,

        residents:
          residentsTotal,

        doormen:
          doormenTotal,

        visitors:
          visitorsTotal,

        packages:
          packagesTotal,

        reservations:
          reservationsTotal,

        occurrences:
          occurrencesTotal,

        serviceProviders:
          serviceProvidersTotal,
      },

      billing: {
        charges: {
          total:
            chargesTotal,

          pending:
            chargesPending,

          paid:
            chargesPaid,

          overdue:
            chargesOverdue,

          failed:
            chargesFailed,

          canceled:
            chargesCanceled,

          refunded:
            chargesRefunded,
        },

        amountsInCents: {
          pending:
            amountPending,

          paid:
            amountPaid,

          overdue:
            amountOverdue,
        },
      },

      communications: {
        total:
          communicationsTotal,

        pending:
          communicationsPending,

        sent:
          communicationsSent,

        delivered:
          communicationsDelivered,

        failed:
          communicationsFailed,
      },

      jobs: {
        total:
          jobsTotal,

        pending:
          jobsPending,

        running:
          jobsRunning,

        success:
          jobsSuccess,

        failed:
          jobsFailed,
      },

      backups: {
        total:
          backupsTotal,

        pending:
          backupsPending,

        running:
          backupsRunning,

        success:
          backupsSuccess,

        failed:
          backupsFailed,

        verified:
          backupsVerified,

        latest:
          latestBackup,
      },

      system: {
        events: {
          total:
            systemEventsTotal,

          warning:
            systemEventsWarning,

          error:
            systemEventsError,

          critical:
            systemEventsCritical,

          unresolved:
            unresolvedSystemEvents,
        },
      },

      recent: {
        pendingCondominiums:
          recentPendingCondominiums,

        auditLogs:
          recentAuditLogs,

        failedCommunications:
          recentFailedCommunications,

        failedJobs:
          recentFailedJobs,

        systemEvents:
          recentSystemEvents,
      },
    };
  }
}

export default new PlatformDashboardService();
