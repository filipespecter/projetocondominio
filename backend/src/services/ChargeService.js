import chargeRepository from "../repositories/ChargeRepository.js";
import paymentMethodRepository from "../repositories/PaymentMethodRepository.js";
import subscriptionRepository from "../repositories/SubscriptionRepository.js";
import condominiumRepository from "../repositories/CondominiumRepository.js";
import AuditLogService from "./AuditLogService.js";
import DelinquencyService from "./DelinquencyService.js";
import FinancialCommunicationService from "./FinancialCommunicationService.js";
import { ApiError } from "../utils/ApiError.js";

class ChargeService {
  normalizeAmount(value) {
    const amount =
      Number(value);

    if (
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      throw new ApiError(
        "O valor da cobrança deve ser informado em centavos e ser maior que zero.",
        400
      );
    }

    return amount;
  }

  normalizeDate(value, fieldName) {
    const date =
      value instanceof Date
        ? new Date(value)
        : new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      throw new ApiError(
        `${fieldName} inválida.`,
        400
      );
    }

    return date;
  }


  async findAllPlatform() {
    return chargeRepository.findAllPlatform();
  }

  async findById(id) {
    const charge =
      await chargeRepository
        .findById(id);

    if (!charge) {
      throw new ApiError(
        "Cobrança não encontrada.",
        404
      );
    }

    return charge;
  }

  async findByCondominium(
    condominiumId
  ) {
    const condominium =
      await condominiumRepository
        .findById(
          condominiumId
        );

    if (!condominium) {
      throw new ApiError(
        "Condomínio não encontrado.",
        404
      );
    }

    return chargeRepository
      .findByCondominium(
        condominiumId
      );
  }

  async create(
    data,
    authenticatedUser = null,
    requestContext = null
  ) {
    if (
      !data.condominiumId ||
      !data.subscriptionId
    ) {
      throw new ApiError(
        "Condomínio e assinatura são obrigatórios.",
        400
      );
    }

    const subscription =
      await subscriptionRepository
        .findById(
          data.subscriptionId
        );

    if (!subscription) {
      throw new ApiError(
        "Assinatura não encontrada.",
        404
      );
    }

    if (
      subscription.condominiumId !==
      data.condominiumId
    ) {
      throw new ApiError(
        "A assinatura não pertence ao condomínio informado.",
        400
      );
    }

    if (
      subscription.status ===
      "CANCELED"
    ) {
      throw new ApiError(
        "Não é possível gerar cobrança para uma assinatura cancelada.",
        400
      );
    }

    let paymentMethodId =
      data.paymentMethodId ??
      null;

    if (!paymentMethodId) {
      const primary =
        await paymentMethodRepository
          .findActiveByPriority(
            data.condominiumId,
            "PRIMARY"
          );

      paymentMethodId =
        primary?.id ??
        null;
    }

    if (paymentMethodId) {
      const paymentMethod =
        await paymentMethodRepository
          .findById(
            paymentMethodId
          );

      if (
        !paymentMethod ||
        paymentMethod.condominiumId !==
          data.condominiumId
      ) {
        throw new ApiError(
          "Método de pagamento inválido para este condomínio.",
          400
        );
      }

      if (
        paymentMethod.status !==
        "ACTIVE"
      ) {
        throw new ApiError(
          "O método de pagamento selecionado não está ativo.",
          400
        );
      }
    }

    const charge =
      await chargeRepository
        .createCharge({
          condominiumId:
            data.condominiumId,
          subscriptionId:
            data.subscriptionId,
          paymentMethodId,
          amountInCents:
            this.normalizeAmount(
              data.amountInCents ??
              subscription.priceInCents
            ),
          dueDate:
            this.normalizeDate(
              data.dueDate,
              "Data de vencimento"
            ),
          requestId:
            requestContext
              ?.requestId ??
            data.requestId ??
            null,
          metadata:
            data.metadata ??
            null,
        });

    await AuditLogService.logCreate({
      condominiumId:
        data.condominiumId,
      user:
        authenticatedUser,
      module:
        "CHARGE",
      referenceId:
        charge.id,
      afterData:
        charge,
      details:
        "Cobrança criada.",
      requestContext,
    });

    await FinancialCommunicationService
      .notifyChargeCreated({
        charge,
        requestId:
          requestContext
            ?.requestId ??
          null,
      });

    return charge;
  }

  async changeStatus(
    id,
    action,
    authenticatedUser = null,
    requestContext = null,
    options = {}
  ) {
    const before =
      await this.findById(id);

    let updated;

    if (action === "PAID") {
      updated =
        await chargeRepository
          .markPaid(
            id,
            options.paidAt
              ? this.normalizeDate(
                  options.paidAt,
                  "Data do pagamento"
                )
              : new Date()
          );
    } else if (
      action === "OVERDUE"
    ) {
      updated =
        await chargeRepository
          .markOverdue(id);
    } else if (
      action === "FAILED"
    ) {
      updated =
        await chargeRepository
          .markFailed(
            id,
            options.failureReason ??
            null
          );
    } else if (
      action === "CANCELED"
    ) {
      updated =
        await chargeRepository
          .cancel(id);
    } else if (
      action === "REFUNDED"
    ) {
      updated =
        await chargeRepository
          .markRefunded(id);
    } else {
      throw new ApiError(
        "Ação financeira inválida.",
        400
      );
    }

    if (!updated) {
      throw new ApiError(
        `Não foi possível alterar a cobrança de ${before.status} para ${action}.`,
        409
      );
    }

    await AuditLogService
      .logStatusChange({
        condominiumId:
          before.condominiumId,
        user:
          authenticatedUser,
        module:
          "CHARGE",
        referenceId:
          id,
        previousStatus:
          before.status,
        newStatus:
          updated.status,
        requestContext,
      });

    if (action === "PAID") {
      await FinancialCommunicationService
        .notifyChargePaid({
          charge: updated,
          requestId:
            requestContext
              ?.requestId ??
            null,
        });
    }

    if (action === "OVERDUE") {
      await FinancialCommunicationService
        .notifyChargeOverdue({
          charge: updated,
          requestId:
            requestContext
              ?.requestId ??
            null,
        });
    }

    /**
     * REGRA CENTRAL DO BLOCO 7
     *
     * Qualquer confirmação de pagamento feita por este
     * Service dispara a verificação de regularização.
     *
     * A reativação só ocorre quando não existe mais
     * cobrança aberta para a assinatura.
     */
    if (action === "PAID") {
      await DelinquencyService
        .handlePaymentConfirmed(
          updated,
          updated.paidAt ??
          new Date(),
          requestContext
        );
    }

    return updated;
  }

  async statistics() {
    const [
      pending,
      paid,
      overdue,
      failed,
      canceled,
      refunded,
    ] = await Promise.all([
      chargeRepository
        .countByStatus(
          "PENDING"
        ),
      chargeRepository
        .countByStatus(
          "PAID"
        ),
      chargeRepository
        .countByStatus(
          "OVERDUE"
        ),
      chargeRepository
        .countByStatus(
          "FAILED"
        ),
      chargeRepository
        .countByStatus(
          "CANCELED"
        ),
      chargeRepository
        .countByStatus(
          "REFUNDED"
        ),
    ]);

    return {
      pending,
      paid,
      overdue,
      failed,
      canceled,
      refunded,
      total:
        pending +
        paid +
        overdue +
        failed +
        canceled +
        refunded,
    };
  }
}

export default new ChargeService();
