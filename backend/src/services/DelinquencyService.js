import chargeRepository from "../repositories/ChargeRepository.js";
import subscriptionRepository from "../repositories/SubscriptionRepository.js";
import condominiumRepository from "../repositories/CondominiumRepository.js";
import AuditLogService from "./AuditLogService.js";
import FinancialCommunicationService from "./FinancialCommunicationService.js";

class DelinquencyService {
  startOfDay(value = new Date()) {
    const result =
      new Date(value);

    result.setHours(
      0,
      0,
      0,
      0
    );

    return result;
  }

  addDays(date, days) {
    const result =
      new Date(date);

    result.setDate(
      result.getDate() +
      Number(days ?? 0)
    );

    return result;
  }

  async markPastDueCharges(
    referenceDate = new Date(),
    requestContext = null
  ) {
    const today =
      this.startOfDay(
        referenceDate
      );

    const charges =
      await chargeRepository
        .findPendingPastDue(
          today
        );

    const summary = {
      found:
        charges.length,
      chargesMarkedOverdue:
        0,
      subscriptionsMarkedOverdue:
        0,
      errors: [],
    };

    for (const charge of charges) {
      try {
        const updatedCharge =
          await chargeRepository
            .markOverdue(
              charge.id,
              new Date()
            );

        if (updatedCharge) {
          summary
            .chargesMarkedOverdue += 1;

          await AuditLogService
            .createLog({
              condominiumId:
                charge.condominiumId,
              action:
                "STATUS_CHANGE",
              module:
                "CHARGE",
              details:
                "Cobrança marcada automaticamente como vencida.",
              referenceId:
                charge.id,
              requestId:
                requestContext
                  ?.requestId ??
                null,
              beforeData: {
                status:
                  charge.status,
              },
              afterData: {
                status:
                  "OVERDUE",
                dueDate:
                  charge.dueDate,
              },
            });

          await FinancialCommunicationService
            .notifyChargeOverdue({
              charge: updatedCharge,
              requestId:
                requestContext
                  ?.requestId ??
                null,
            });
        }

        if (
          [
            "TRIAL",
            "ACTIVE",
          ].includes(
            charge.subscription
              .status
          )
        ) {
          const subscription =
            await subscriptionRepository
              .markAsOverdue(
                charge.subscriptionId
              );

          if (subscription) {
            summary
              .subscriptionsMarkedOverdue += 1;
          }
        }
      } catch (error) {
        summary.errors.push({
          chargeId:
            charge.id,
          message:
            error?.message ??
            "Erro desconhecido.",
        });
      }
    }

    return summary;
  }

  async suspendExpiredGracePeriods(
    referenceDate = new Date(),
    requestContext = null
  ) {
    const today =
      this.startOfDay(
        referenceDate
      );

    const subscriptions =
      await subscriptionRepository
        .findOverdueAutoSuspend();

    const summary = {
      evaluated:
        subscriptions.length,
      suspendedSubscriptions:
        0,
      suspendedCondominiums:
        0,
      errors: [],
    };

    for (const subscription of subscriptions) {
      try {
        const oldestCharge =
          await chargeRepository
            .findOldestOpenBySubscription(
              subscription.id
            );

        if (!oldestCharge) {
          continue;
        }

        const gracePeriodDays =
          Number(
            subscription
              .gracePeriodDays ??
            30
          );

        const suspensionDate =
          this.addDays(
            this.startOfDay(
              oldestCharge.dueDate
            ),
            gracePeriodDays
          );

        if (
          today <
          suspensionDate
        ) {
          continue;
        }

        const updatedSubscription =
          await subscriptionRepository
            .suspend(
              subscription.id
            );

        if (updatedSubscription) {
          summary
            .suspendedSubscriptions += 1;

          await AuditLogService
            .createLog({
              condominiumId:
                subscription
                  .condominiumId,
              action:
                "STATUS_CHANGE",
              module:
                "SUBSCRIPTION",
              details:
                `Assinatura suspensa automaticamente após ${gracePeriodDays} dias de inadimplência.`,
              referenceId:
                subscription.id,
              requestId:
                requestContext
                  ?.requestId ??
                null,
              beforeData: {
                status:
                  subscription.status,
              },
              afterData: {
                status:
                  "SUSPENDED",
                suspensionDate,
              },
            });

          await FinancialCommunicationService
            .notifySuspension({
              subscription:
                updatedSubscription,
              suspensionDate,
              requestId:
                requestContext
                  ?.requestId ??
                null,
            });
        }

        if (
          subscription
            .condominium
            ?.status !==
          "SUSPENDED"
        ) {
          const condominium =
            await condominiumRepository
              .suspend(
                subscription
                  .condominiumId
              );

          if (condominium) {
            summary
              .suspendedCondominiums += 1;
          }
        }
      } catch (error) {
        summary.errors.push({
          subscriptionId:
            subscription.id,
          message:
            error?.message ??
            "Erro desconhecido.",
        });
      }
    }

    return summary;
  }

  async handlePaymentConfirmed(
    charge,
    paidAt = new Date(),
    requestContext = null
  ) {
    if (!charge) {
      return {
        recovered:
          false,
        reason:
          "Cobrança não informada.",
      };
    }

    const subscription =
      await subscriptionRepository
        .findById(
          charge.subscriptionId
        );

    if (!subscription) {
      return {
        recovered:
          false,
        reason:
          "Assinatura não encontrada.",
      };
    }

    await subscriptionRepository
      .registerPayment(
        subscription.id,
        paidAt
      );

    const openCharges =
      await chargeRepository
        .countOpenBySubscription(
          subscription.id
        );

    if (openCharges > 0) {
      return {
        recovered:
          false,
        reason:
          "Ainda existem cobranças em aberto.",
        openCharges,
      };
    }

    let updatedSubscription =
      subscription;

    if (
      [
        "OVERDUE",
        "SUSPENDED",
      ].includes(
        subscription.status
      )
    ) {
      updatedSubscription =
        await subscriptionRepository
          .activate(
            subscription.id,
            {}
          ) ??
        subscription;
    }

    const condominium =
      subscription
        .condominium ??
      await condominiumRepository
        .findById(
          subscription
            .condominiumId
        );

    let updatedCondominium =
      condominium;

    if (
      condominium?.status ===
      "SUSPENDED"
    ) {
      updatedCondominium =
        await condominiumRepository
          .activate(
            condominium.id
          ) ??
        condominium;
    }

    await AuditLogService
      .createLog({
        condominiumId:
          subscription
            .condominiumId,
        action:
          "FINANCIAL_RECOVERY",
        module:
          "SUBSCRIPTION",
        details:
          "Assinatura e condomínio regularizados após pagamento.",
        referenceId:
          subscription.id,
        requestId:
          requestContext
            ?.requestId ??
          null,
        afterData: {
          subscriptionStatus:
            updatedSubscription
              ?.status,
          condominiumStatus:
            updatedCondominium
              ?.status,
        },
      });

    await FinancialCommunicationService
      .notifyFinancialRecovery({
        subscription:
          updatedSubscription,
        requestId:
          requestContext
            ?.requestId ??
          null,
      });

    return {
      recovered:
        true,
      openCharges:
        0,
      subscription:
        updatedSubscription,
      condominium:
        updatedCondominium,
    };
  }

  async runDaily(
    referenceDate = new Date(),
    requestContext = null
  ) {
    const startedAt =
      new Date();

    const overdue =
      await this.markPastDueCharges(
        referenceDate,
        requestContext
      );

    const suspension =
      await this
        .suspendExpiredGracePeriods(
          referenceDate,
          requestContext
        );

    return {
      startedAt,
      finishedAt:
        new Date(),
      referenceDate:
        new Date(
          referenceDate
        ),
      overdue,
      suspension,
    };
  }
}

export default new DelinquencyService();
