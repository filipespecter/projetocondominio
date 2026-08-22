import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * =====================================================
 * PLATFORM APPROVAL REPOSITORY
 * =====================================================
 *
 * Executa as operações críticas de aprovação e rejeição
 * dentro de transações do PostgreSQL.
 *
 * Nenhuma aprovação parcial deve permanecer no banco.
 */
class PlatformApprovalRepository {
  async approve(data) {
    return prisma.$transaction(
      async (transaction) => {
        const condominium =
          await transaction.condominium.findFirst({
            where: {
              id:
                data.condominiumId,

              status:
                "PENDING",

              deletedAt:
                null,
            },
          });

        if (!condominium) {
          throw new ApiError(
            "Solicitação pendente não encontrada ou já processada.",
            409
          );
        }

        const plan =
          await transaction.plan.findFirst({
            where: {
              id:
                data.planId,

              active:
                true,

              deletedAt:
                null,
            },
          });

        if (!plan) {
          throw new ApiError(
            "Plano não encontrado ou indisponível.",
            400
          );
        }

        const existingUsername =
          await transaction.user.findFirst({
            where: {
              condominiumId:
                condominium.id,

              username:
                data.username,

              deletedAt:
                null,
            },
            select: {
              id: true,
            },
          });

        if (existingUsername) {
          throw new ApiError(
            "Este nome de usuário já está em uso neste condomínio.",
            409
          );
        }

        if (data.adminEmail) {
          const existingEmail =
            await transaction.user.findFirst({
              where: {
                condominiumId:
                  condominium.id,

                email:
                  data.adminEmail,

                deletedAt:
                  null,
              },
              select: {
                id: true,
              },
            });

          if (existingEmail) {
            throw new ApiError(
              "Este e-mail já está vinculado a outro usuário do condomínio.",
              409
            );
          }
        }

        const existingSubscription =
          await transaction.subscription.findFirst({
            where: {
              condominiumId:
                condominium.id,

              status: {
                in: [
                  "TRIAL",
                  "ACTIVE",
                  "OVERDUE",
                  "SUSPENDED",
                ],
              },
            },
            select: {
              id: true,
            },
          });

        if (existingSubscription) {
          throw new ApiError(
            "Este condomínio já possui uma assinatura atual.",
            409
          );
        }

        const administrator =
          await transaction.user.create({
            data: {
              condominiumId:
                condominium.id,

              name:
                data.adminName,

              username:
                data.username,

              email:
                data.adminEmail,

              phone:
                data.adminPhone,

              passwordHash:
                data.passwordHash,

              role:
                "CONDOMINIUM_ADMIN",

              status:
                "ACTIVE",

              mustChangePassword:
                true,
            },

            select: {
              id: true,
              condominiumId: true,
              name: true,
              username: true,
              email: true,
              phone: true,
              role: true,
              status: true,
              mustChangePassword: true,
              createdAt: true,
            },
          });

        const subscription =
          await transaction.subscription.create({
            data: {
              condominiumId:
                condominium.id,

              planId:
                plan.id,

              status:
                data.subscriptionStatus,

              billingCycle:
                data.billingCycle,

              priceInCents:
                data.priceInCents,

              billingContactName:
                data.billingContactName,

              billingEmail:
                data.billingEmail,

              billingPhone:
                data.billingPhone,

              dueDay:
                data.dueDay,

              gracePeriodDays:
                data.gracePeriodDays,

              autoSuspend:
                true,

              currentPeriodStart:
                data.currentPeriodStart,

              currentPeriodEnd:
                data.currentPeriodEnd,

              nextDueDate:
                data.nextDueDate,

              trialEndsAt:
                data.trialEndsAt,
            },

            include: {
              plan: true,
            },
          });

        const approved =
          await transaction.condominium.update({
            where: {
              id:
                condominium.id,
            },

            data: {
              status:
                data.condominiumStatus,

              approvedAt:
                data.approvedAt,

              approvedByUserId:
                data.platformAdminUserId,

              rejectedAt:
                null,

              rejectedByUserId:
                null,

              rejectionReason:
                null,

              trialEndsAt:
                data.trialEndsAt,

              activatedAt:
                data.condominiumStatus ===
                "ACTIVE"
                  ? data.approvedAt
                  : null,

              suspendedAt:
                null,

              canceledAt:
                null,
            },
          });

        await transaction.auditLog.create({
          data: {
            condominiumId:
              condominium.id,

            userId:
              data.platformAdminUserId,

            userName:
              data.platformAdminName,

            userRole:
              "PLATFORM_ADMIN",

            action:
              "APPROVE",

            module:
              "CONDOMINIUM_APPROVAL",

            details:
              "Solicitação aprovada e acesso administrativo liberado.",

            referenceId:
              condominium.id,

            requestId:
              data.requestId,

            ipAddress:
              data.ipAddress,

            userAgent:
              data.userAgent,

            beforeData: {
              status:
                condominium.status,
            },

            afterData: {
              status:
                approved.status,

              administratorUserId:
                administrator.id,

              subscriptionId:
                subscription.id,

              planId:
                subscription.planId,

              priceInCents:
                subscription.priceInCents,

              dueDay:
                subscription.dueDay,
            },
          },
        });

        return {
          condominium:
            approved,

          administrator,

          subscription,
        };
      }
    );
  }

  async reject(data) {
    return prisma.$transaction(
      async (transaction) => {
        const condominium =
          await transaction.condominium.findFirst({
            where: {
              id:
                data.condominiumId,

              status:
                "PENDING",

              deletedAt:
                null,
            },
          });

        if (!condominium) {
          throw new ApiError(
            "Solicitação pendente não encontrada ou já processada.",
            409
          );
        }

        const rejected =
          await transaction.condominium.update({
            where: {
              id:
                condominium.id,
            },

            data: {
              status:
                "REJECTED",

              rejectedAt:
                data.rejectedAt,

              rejectedByUserId:
                data.platformAdminUserId,

              rejectionReason:
                data.rejectionReason,

              approvedAt:
                null,

              approvedByUserId:
                null,
            },
          });

        await transaction.auditLog.create({
          data: {
            condominiumId:
              condominium.id,

            userId:
              data.platformAdminUserId,

            userName:
              data.platformAdminName,

            userRole:
              "PLATFORM_ADMIN",

            action:
              "REJECT",

            module:
              "CONDOMINIUM_APPROVAL",

            details:
              `Solicitação rejeitada. Motivo: ${data.rejectionReason}`,

            referenceId:
              condominium.id,

            requestId:
              data.requestId,

            ipAddress:
              data.ipAddress,

            userAgent:
              data.userAgent,

            beforeData: {
              status:
                condominium.status,
            },

            afterData: {
              status:
                rejected.status,

              rejectionReason:
                rejected.rejectionReason,
            },
          },
        });

        return rejected;
      }
    );
  }
}

export default new PlatformApprovalRepository();
