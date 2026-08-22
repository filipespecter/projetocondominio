import userRepository from "../repositories/UserRepository.js";
import CommunicationTriggerService from "./CommunicationTriggerService.js";

class FinancialCommunicationService {
  formatCurrency(amountInCents) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(amountInCents ?? 0) / 100);
  }

  formatDate(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat("pt-BR").format(date);
  }

  async getFinancialRecipients(condominiumId) {
    const [admins, managers] = await Promise.all([
      userRepository.findActiveByRole(condominiumId, "CONDOMINIUM_ADMIN"),
      userRepository.findActiveByRole(condominiumId, "MANAGER"),
    ]);

    const unique = new Map();
    for (const user of [...admins, ...managers]) {
      unique.set(user.id, user);
    }
    return [...unique.values()];
  }

  async sendToFinancialUsers({
    condominiumId,
    content,
    module,
    referenceId,
    event,
    requestId = null,
    metadata = null,
  }) {
    try {
      const users = await this.getFinancialRecipients(condominiumId);

      const results = await Promise.all(
        users.map((user) =>
          CommunicationTriggerService.sendToUser({
            condominiumId,
            userId: user.id,
            content,
            module,
            referenceId,
            requestId,
            metadata: {
              event,
              ...(metadata ?? {}),
            },
          })
        )
      );

      return {
        recipients: users.length,
        queued: results.filter((result) => result?.queued).length,
        results,
      };
    } catch (error) {
      console.error(
        "[FINANCIAL_COMMUNICATION]",
        error?.message ?? error
      );

      return {
        recipients: 0,
        queued: 0,
        failed: true,
        error: error?.message ?? "Falha na comunicação financeira.",
      };
    }
  }

  async notifyChargeCreated({ charge, requestId = null }) {
    const amount = this.formatCurrency(charge.amountInCents);
    const dueDate = this.formatDate(charge.dueDate);

    return this.sendToFinancialUsers({
      condominiumId: charge.condominiumId,
      content:
        `InfinityCondo: nova cobrança de ${amount}, com vencimento em ${dueDate ?? "data informada no sistema"}.`,
      module: "CHARGE",
      referenceId: charge.id,
      event: "CHARGE_CREATED",
      requestId,
      metadata: {
        amountInCents: charge.amountInCents,
        dueDate: charge.dueDate,
      },
    });
  }

  async notifyChargePaid({ charge, requestId = null }) {
    const amount = this.formatCurrency(charge.amountInCents);

    return this.sendToFinancialUsers({
      condominiumId: charge.condominiumId,
      content: `InfinityCondo: pagamento de ${amount} confirmado com sucesso.`,
      module: "CHARGE",
      referenceId: charge.id,
      event: "CHARGE_PAID",
      requestId,
      metadata: {
        amountInCents: charge.amountInCents,
        paidAt: charge.paidAt,
      },
    });
  }

  async notifyChargeOverdue({ charge, requestId = null }) {
    const amount = this.formatCurrency(charge.amountInCents);
    const dueDate = this.formatDate(charge.dueDate);

    return this.sendToFinancialUsers({
      condominiumId: charge.condominiumId,
      content:
        `InfinityCondo: cobrança de ${amount} vencida em ${dueDate ?? "data registrada no sistema"}. Regularize para evitar suspensão após o período de tolerância.`,
      module: "CHARGE",
      referenceId: charge.id,
      event: "CHARGE_OVERDUE",
      requestId,
      metadata: {
        amountInCents: charge.amountInCents,
        dueDate: charge.dueDate,
      },
    });
  }

  async notifySuspension({
    subscription,
    suspensionDate = null,
    requestId = null,
  }) {
    const date = this.formatDate(suspensionDate ?? new Date());

    return this.sendToFinancialUsers({
      condominiumId: subscription.condominiumId,
      content:
        `InfinityCondo: o acesso do condomínio foi suspenso por inadimplência em ${date}. A regularização financeira permite a reativação automática quando não houver cobranças em aberto.`,
      module: "SUBSCRIPTION",
      referenceId: subscription.id,
      event: "SUBSCRIPTION_SUSPENDED",
      requestId,
      metadata: {
        suspensionDate: suspensionDate ?? new Date(),
      },
    });
  }

  async notifyFinancialRecovery({ subscription, requestId = null }) {
    return this.sendToFinancialUsers({
      condominiumId: subscription.condominiumId,
      content:
        "InfinityCondo: situação financeira regularizada. A assinatura e o acesso do condomínio estão ativos novamente.",
      module: "SUBSCRIPTION",
      referenceId: subscription.id,
      event: "FINANCIAL_RECOVERY",
      requestId,
    });
  }
}

export default new FinancialCommunicationService();
