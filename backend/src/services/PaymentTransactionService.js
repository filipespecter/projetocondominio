import paymentTransactionRepository from "../repositories/PaymentTransactionRepository.js";
import chargeRepository from "../repositories/ChargeRepository.js";
import AuditLogService from "./AuditLogService.js";
import { ApiError } from "../utils/ApiError.js";

class PaymentTransactionService {
  validateStatus(status) {
    const normalized =
      String(status ?? "")
        .trim()
        .toUpperCase();

    const allowed = [
      "PENDING",
      "APPROVED",
      "REJECTED",
      "CANCELED",
      "REFUNDED",
      "CHARGEBACK",
      "ERROR",
    ];

    if (!allowed.includes(normalized)) {
      throw new ApiError(
        "Status da transação inválido.",
        400
      );
    }

    return normalized;
  }

  async findById(id) {
    const transaction =
      await paymentTransactionRepository
        .findById(id);

    if (!transaction) {
      throw new ApiError(
        "Transação de pagamento não encontrada.",
        404
      );
    }

    return transaction;
  }

  async findByCharge(chargeId) {
    const charge =
      await chargeRepository
        .findById(chargeId);

    if (!charge) {
      throw new ApiError(
        "Cobrança não encontrada.",
        404
      );
    }

    return paymentTransactionRepository
      .findByCharge(
        chargeId
      );
  }

  async create(
    data,
    authenticatedUser = null,
    requestContext = null
  ) {
    const charge =
      await chargeRepository
        .findById(
          data.chargeId
        );

    if (!charge) {
      throw new ApiError(
        "Cobrança não encontrada.",
        404
      );
    }

    const amountInCents =
      Number(
        data.amountInCents ??
        charge.amountInCents
      );

    if (
      !Number.isInteger(
        amountInCents
      ) ||
      amountInCents <= 0
    ) {
      throw new ApiError(
        "Valor da transação inválido.",
        400
      );
    }

    const transaction =
      await paymentTransactionRepository
        .createTransaction({
          chargeId:
            charge.id,
          status:
            data.status
              ? this.validateStatus(
                  data.status
                )
              : "PENDING",
          amountInCents,
          provider:
            data.provider ??
            charge.provider ??
            null,
          providerPaymentId:
            data.providerPaymentId ??
            null,
          requestId:
            requestContext
              ?.requestId ??
            data.requestId ??
            null,
          failureReason:
            data.failureReason ??
            null,
          metadata:
            data.metadata ??
            null,
          processedAt:
            data.processedAt ??
            null,
        });

    await AuditLogService.logCreate({
      condominiumId:
        charge.condominiumId,
      user:
        authenticatedUser,
      module:
        "PAYMENT_TRANSACTION",
      referenceId:
        transaction.id,
      afterData:
        transaction,
      details:
        "Transação financeira registrada.",
      requestContext,
    });

    return transaction;
  }

  async updateStatus(
    id,
    status,
    data = {},
    authenticatedUser = null,
    requestContext = null
  ) {
    const before =
      await this.findById(id);

    const normalizedStatus =
      this.validateStatus(
        status
      );

    const updated =
      await paymentTransactionRepository
        .updateStatus(
          id,
          normalizedStatus,
          data
        );

    if (!updated) {
      throw new ApiError(
        "Não foi possível atualizar a transação.",
        409
      );
    }

    await AuditLogService
      .logStatusChange({
        condominiumId:
          before.charge
            .condominiumId,
        user:
          authenticatedUser,
        module:
          "PAYMENT_TRANSACTION",
        referenceId:
          id,
        previousStatus:
          before.status,
        newStatus:
          updated.status,
        requestContext,
      });

    return updated;
  }
}

export default new PaymentTransactionService();
