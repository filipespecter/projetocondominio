import crypto from "node:crypto";

import prisma from "../config/prisma.js";

import ChargeService from "./ChargeService.js";
import PaymentGatewayService from "./PaymentGatewayService.js";
import PaymentTransactionService from "./PaymentTransactionService.js";
import AuditLogService from "./AuditLogService.js";
import DelinquencyService from "./DelinquencyService.js";

import chargeRepository from "../repositories/ChargeRepository.js";
import paymentMethodRepository from "../repositories/PaymentMethodRepository.js";
import paymentTransactionRepository from "../repositories/PaymentTransactionRepository.js";

import { ApiError } from "../utils/ApiError.js";

class PaymentGatewayOrchestratorService {
  buildCustomer(
    condominium,
    subscription,
    paymentData = {}
  ) {
    const name =
      subscription
        ?.billingContactName ??
      condominium
        ?.contactName ??
      condominium
        ?.name ??
      null;

    const email =
      subscription
        ?.billingEmail ??
      condominium
        ?.email ??
      null;

    const phone =
      subscription
        ?.billingPhone ??
      condominium
        ?.phone ??
      null;

    return {
      name,
      email,
      phone,

      identificationType:
        paymentData
          ?.identificationType ??
        null,

      identificationNumber:
        paymentData
          ?.identificationNumber ??
        condominium
          ?.document ??
        null,

      address: {
        zipCode:
          paymentData
            ?.address
            ?.zipCode ??
          condominium
            ?.postalCode ??
          null,

        streetName:
          paymentData
            ?.address
            ?.streetName ??
          condominium
            ?.addressLine ??
          null,

        streetNumber:
          paymentData
            ?.address
            ?.streetNumber ??
          condominium
            ?.addressNumber ??
          null,

        neighborhood:
          paymentData
            ?.address
            ?.neighborhood ??
          condominium
            ?.neighborhood ??
          null,

        city:
          paymentData
            ?.address
            ?.city ??
          condominium
            ?.city ??
          null,

        state:
          paymentData
            ?.address
            ?.state ??
          condominium
            ?.state ??
          null,
      },
    };
  }

  async getChargeContext(
    chargeId
  ) {
    const charge =
      await ChargeService
        .findById(
          chargeId
        );

    if (
      charge.status ===
      "PAID"
    ) {
      throw new ApiError(
        "Esta cobrança já está paga.",
        409
      );
    }

    if (
      [
        "CANCELED",
        "REFUNDED",
      ].includes(
        charge.status
      )
    ) {
      throw new ApiError(
        "Esta cobrança não pode mais ser processada.",
        409
      );
    }

    const condominium =
      await prisma
        .condominium
        .findUnique({
          where: {
            id:
              charge.condominiumId,
          },
        });

    if (!condominium) {
      throw new ApiError(
        "Condomínio da cobrança não encontrado.",
        404
      );
    }

    const paymentMethodId =
      charge
        .paymentMethodId;

    const paymentMethod =
      paymentMethodId
        ? await paymentMethodRepository
            .findById(
              paymentMethodId
            )
        : await paymentMethodRepository
            .findActiveByPriority(
              charge
                .condominiumId,
              "PRIMARY"
            );

    if (!paymentMethod) {
      throw new ApiError(
        "Nenhum método de pagamento ativo foi encontrado para esta cobrança.",
        400
      );
    }

    if (
      paymentMethod.status !==
      "ACTIVE"
    ) {
      throw new ApiError(
        "O método de pagamento da cobrança não está ativo.",
        400
      );
    }

    return {
      charge,
      condominium,
      paymentMethod,
    };
  }

  async processCharge(
    chargeId,
    paymentData,
    authenticatedUser = null,
    requestContext = null
  ) {
    const {
      charge,
      condominium,
      paymentMethod,
    } =
      await this.getChargeContext(
        chargeId
      );

    const provider =
      paymentMethod
        .provider ??
      "MERCADO_PAGO";

    const customer =
      this.buildCustomer(
        condominium,
        charge.subscription,
        paymentData
      );

    const idempotencyKey =
      requestContext
        ?.requestId ??
      crypto.randomUUID();

    const providerPayment =
      await PaymentGatewayService
        .createCharge({
          provider,
          charge,
          paymentMethod,
          customer,
          paymentData,
          idempotencyKey,
        });

    const transactionStatus =
      PaymentGatewayService
        .mapTransactionStatus({
          provider,
          providerStatus:
            providerPayment
              .status,
        });

    const transaction =
      await PaymentTransactionService
        .create(
          {
            chargeId:
              charge.id,

            status:
              transactionStatus,

            amountInCents:
              charge.amountInCents,

            provider,

            providerPaymentId:
              providerPayment
                .providerPaymentId,

            requestId:
              idempotencyKey,

            failureReason:
              transactionStatus ===
                "REJECTED" ||
              transactionStatus ===
                "ERROR"
                ? providerPayment
                    .statusDetail
                : null,

            metadata: {
              providerStatus:
                providerPayment
                  .status,

              providerStatusDetail:
                providerPayment
                  .statusDetail,

              paymentMethodId:
                providerPayment
                  .paymentMethodId,

              paymentTypeId:
                providerPayment
                  .paymentTypeId,
            },

            processedAt:
              new Date(),
          },
          authenticatedUser,
          requestContext
        );

    const updatedCharge =
      await chargeRepository
        .updateProviderData(
          charge.id,
          {
            provider,

            providerChargeId:
              providerPayment
                .providerPaymentId,

            paymentMethodId:
              paymentMethod.id,

            paymentUrl:
              providerPayment
                .paymentUrl,

            boletoBarcode:
              providerPayment
                .boletoBarcode,

            pixCopyPaste:
              providerPayment
                .pixCopyPaste,

            expiresAt:
              null,

            metadata: {
              ...(charge.metadata ??
                {}),

              pixQrCodeBase64:
                providerPayment
                  .pixQrCodeBase64,

              providerStatus:
                providerPayment
                  .status,

              providerStatusDetail:
                providerPayment
                  .statusDetail,
            },
          }
        );

    let finalCharge =
      updatedCharge;

    if (
      transactionStatus ===
      "APPROVED"
    ) {
      finalCharge =
        await chargeRepository
          .markPaid(
            charge.id,
            providerPayment
              .dateApproved
              ? new Date(
                  providerPayment
                    .dateApproved
                )
              : new Date()
          );

      if (finalCharge) {
        await DelinquencyService
          .handlePaymentConfirmed(
            finalCharge,
            finalCharge.paidAt ??
            new Date(),
            requestContext
          );
      }
    }

    if (
      transactionStatus ===
        "REJECTED" ||
      transactionStatus ===
        "ERROR"
    ) {
      finalCharge =
        await chargeRepository
          .markFailed(
            charge.id,
            providerPayment
              .statusDetail
          );
    }

    await AuditLogService
      .createLog({
        condominiumId:
          charge
            .condominiumId,

        userId:
          authenticatedUser
            ?.id ??
          null,

        userName:
          authenticatedUser
            ?.name ??
          null,

        userRole:
          authenticatedUser
            ?.role ??
          null,

        supportSessionId:
          requestContext
            ?.supportSessionId ??
          null,

        action:
          "GATEWAY_PROCESS",

        module:
          "PAYMENT",

        details:
          `Cobrança enviada ao gateway ${provider}.`,

        referenceId:
          charge.id,

        requestId:
          requestContext
            ?.requestId ??
          null,

        afterData: {
          chargeId:
            charge.id,

          transactionId:
            transaction.id,

          provider,

          providerPaymentId:
            providerPayment
              .providerPaymentId,

          providerStatus:
            providerPayment
              .status,
        },

        ipAddress:
          requestContext
            ?.ipAddress ??
          null,

        userAgent:
          requestContext
            ?.userAgent ??
          null,
      });

    return {
      charge:
        finalCharge,

      transaction,

      providerPayment: {
        provider:
          providerPayment
            .provider,

        providerPaymentId:
          providerPayment
            .providerPaymentId,

        status:
          providerPayment
            .status,

        statusDetail:
          providerPayment
            .statusDetail,

        paymentUrl:
          providerPayment
            .paymentUrl,

        pixCopyPaste:
          providerPayment
            .pixCopyPaste,

        pixQrCodeBase64:
          providerPayment
            .pixQrCodeBase64,

        boletoBarcode:
          providerPayment
            .boletoBarcode,
      },
    };
  }

  async refundCharge(
    chargeId,
    amountInCents = null,
    authenticatedUser = null,
    requestContext = null
  ) {
    const charge =
      await ChargeService
        .findById(
          chargeId
        );

    if (
      charge.status !==
      "PAID"
    ) {
      throw new ApiError(
        "Somente cobranças pagas podem ser reembolsadas.",
        409
      );
    }

    if (
      !charge.provider ||
      !charge.providerChargeId
    ) {
      throw new ApiError(
        "A cobrança não possui pagamento externo associado.",
        409
      );
    }

    const refund =
      await PaymentGatewayService
        .refundPayment({
          provider:
            charge.provider,

          providerPaymentId:
            charge.providerChargeId,

          amountInCents,

          idempotencyKey:
            requestContext
              ?.requestId ??
            crypto.randomUUID(),
        });

    const updated =
      amountInCents === null ||
      Number(
        amountInCents
      ) >=
        charge.amountInCents
        ? await chargeRepository
            .markRefunded(
              charge.id
            )
        : charge;

    await AuditLogService
      .createLog({
        condominiumId:
          charge
            .condominiumId,

        userId:
          authenticatedUser
            ?.id ??
          null,

        userName:
          authenticatedUser
            ?.name ??
          null,

        userRole:
          authenticatedUser
            ?.role ??
          null,

        action:
          "REFUND",

        module:
          "PAYMENT",

        details:
          amountInCents === null
            ? "Reembolso total solicitado ao gateway."
            : "Reembolso parcial solicitado ao gateway.",

        referenceId:
          charge.id,

        requestId:
          requestContext
            ?.requestId ??
          null,

        afterData:
          refund,

        ipAddress:
          requestContext
            ?.ipAddress ??
          null,

        userAgent:
          requestContext
            ?.userAgent ??
          null,
      });

    return {
      charge:
        updated,

      refund,
    };
  }

  async synchronizeProviderPayment({
    provider,
    providerPaymentId,
    requestContext = null,
  }) {
    const providerPayment =
      await PaymentGatewayService
        .getPayment({
          provider,
          providerPaymentId,
        });

    const charge =
      await chargeRepository
        .findByProviderChargeId(
          provider,
          String(
            providerPaymentId
          )
        );

    if (!charge) {
      return {
        ignored:
          true,

        reason:
          "Cobrança local não encontrada.",
      };
    }

    const status =
      PaymentGatewayService
        .mapTransactionStatus({
          provider,
          providerStatus:
            providerPayment
              .status,
        });

    const existingTransaction =
      await paymentTransactionRepository
        .findByProviderPaymentId(
          provider,
          String(
            providerPaymentId
          )
        );

    let transaction;

    if (existingTransaction) {
      transaction =
        await paymentTransactionRepository
          .updateStatus(
            existingTransaction
              .id,
            status,
            {
              provider,

              providerPaymentId:
                String(
                  providerPaymentId
                ),

              failureReason:
                status ===
                  "REJECTED" ||
                status ===
                  "ERROR"
                  ? providerPayment
                      .statusDetail
                  : null,

              metadata: {
                providerStatus:
                  providerPayment
                    .status,

                providerStatusDetail:
                  providerPayment
                    .statusDetail,
              },

              processedAt:
                new Date(),
            }
          );
    } else {
      transaction =
        await paymentTransactionRepository
          .createTransaction({
            chargeId:
              charge.id,

            status,

            amountInCents:
              charge
                .amountInCents,

            provider,

            providerPaymentId:
              String(
                providerPaymentId
              ),

            requestId:
              requestContext
                ?.requestId ??
              null,

            failureReason:
              status ===
                "REJECTED" ||
              status ===
                "ERROR"
                ? providerPayment
                    .statusDetail
                : null,

            metadata: {
              providerStatus:
                providerPayment
                  .status,

              providerStatusDetail:
                providerPayment
                  .statusDetail,
            },

            processedAt:
              new Date(),
          });
    }

    let updatedCharge =
      charge;

    if (
      status ===
      "APPROVED"
    ) {
      updatedCharge =
        await chargeRepository
          .markPaid(
            charge.id,
            providerPayment
              .dateApproved
              ? new Date(
                  providerPayment
                    .dateApproved
                )
              : new Date()
          ) ??
        await chargeRepository
          .findById(
            charge.id
          );

      if (
        updatedCharge?.status ===
        "PAID"
      ) {
        await DelinquencyService
          .handlePaymentConfirmed(
            updatedCharge,
            updatedCharge.paidAt ??
            new Date(),
            requestContext
          );
      }
    }

    if (
      status ===
      "REJECTED" ||
      status ===
      "ERROR"
    ) {
      updatedCharge =
        await chargeRepository
          .markFailed(
            charge.id,
            providerPayment
              .statusDetail
          ) ??
        await chargeRepository
          .findById(
            charge.id
          );
    }

    if (
      status ===
      "REFUNDED"
    ) {
      updatedCharge =
        await chargeRepository
          .markRefunded(
            charge.id
          ) ??
        await chargeRepository
          .findById(
            charge.id
          );
    }

    return {
      ignored:
        false,

      charge:
        updatedCharge,

      transaction,

      providerPayment,
    };
  }
}

export default new PaymentGatewayOrchestratorService();
