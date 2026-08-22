import paymentMethodRepository from "../repositories/PaymentMethodRepository.js";
import condominiumRepository from "../repositories/CondominiumRepository.js";
import AuditLogService from "./AuditLogService.js";
import { ApiError } from "../utils/ApiError.js";

class PaymentMethodService {
  validateType(type) {
    const normalized =
      String(type ?? "")
        .trim()
        .toUpperCase();

    const allowed = [
      "CARD",
      "PIX",
      "BOLETO",
    ];

    if (!allowed.includes(normalized)) {
      throw new ApiError(
        "Tipo de método de pagamento inválido.",
        400
      );
    }

    return normalized;
  }

  validatePriority(priority) {
    const normalized =
      String(priority ?? "")
        .trim()
        .toUpperCase();

    const allowed = [
      "PRIMARY",
      "SECONDARY",
    ];

    if (!allowed.includes(normalized)) {
      throw new ApiError(
        "Prioridade do método de pagamento inválida.",
        400
      );
    }

    return normalized;
  }

  async validateCondominium(
    condominiumId
  ) {
    if (!condominiumId) {
      throw new ApiError(
        "Condomínio não identificado.",
        400
      );
    }

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

    return condominium;
  }

  sanitizeCardData(data) {
    if (data.type !== "CARD") {
      return {
        ...data,
        cardBrand: null,
        cardLast4: null,
        cardExpirationMonth: null,
        cardExpirationYear: null,
      };
    }

    if (
      data.cardLast4 &&
      !/^\d{4}$/.test(
        String(data.cardLast4)
      )
    ) {
      throw new ApiError(
        "Os últimos 4 dígitos do cartão são inválidos.",
        400
      );
    }

    return data;
  }

  async findById(id) {
    const paymentMethod =
      await paymentMethodRepository
        .findById(id);

    if (!paymentMethod) {
      throw new ApiError(
        "Método de pagamento não encontrado.",
        404
      );
    }

    return paymentMethod;
  }

  async findByCondominium(
    condominiumId
  ) {
    await this.validateCondominium(
      condominiumId
    );

    return paymentMethodRepository
      .findByCondominium(
        condominiumId
      );
  }

  async create(
    data,
    authenticatedUser = null,
    requestContext = null
  ) {
    await this.validateCondominium(
      data.condominiumId
    );

    const type =
      this.validateType(
        data.type
      );

    const priority =
      this.validatePriority(
        data.priority
      );

    const existing =
      await paymentMethodRepository
        .findByPriority(
          data.condominiumId,
          priority
        );

    if (existing) {
      throw new ApiError(
        `O condomínio já possui um método ${priority === "PRIMARY" ? "principal" : "secundário"} configurado.`,
        409
      );
    }

    const normalizedData =
      this.sanitizeCardData({
        ...data,
        type,
        priority,
        provider:
          data.provider
            ? String(
                data.provider
              )
                .trim()
                .toUpperCase()
            : null,
      });

    const paymentMethod =
      await paymentMethodRepository
        .createPaymentMethod(
          normalizedData
        );

    await AuditLogService.logCreate({
      condominiumId:
        data.condominiumId,
      user:
        authenticatedUser,
      module:
        "PAYMENT_METHOD",
      referenceId:
        paymentMethod.id,
      afterData:
        paymentMethod,
      details:
        `Método de pagamento ${priority} configurado.`,
      requestContext,
    });

    return paymentMethod;
  }

  async update(
    id,
    data,
    authenticatedUser = null,
    requestContext = null
  ) {
    const before =
      await this.findById(id);

    const updateData = {
      ...data,
    };

    if (data.type !== undefined) {
      updateData.type =
        this.validateType(
          data.type
        );
    }

    if (
      data.priority !== undefined
    ) {
      updateData.priority =
        this.validatePriority(
          data.priority
        );

      if (
        updateData.priority !==
        before.priority
      ) {
        const existing =
          await paymentMethodRepository
            .findByPriority(
              before.condominiumId,
              updateData.priority
            );

        if (
          existing &&
          existing.id !== id
        ) {
          throw new ApiError(
            "Já existe outro método com essa prioridade.",
            409
          );
        }
      }
    }

    if (data.provider !== undefined) {
      updateData.provider =
        data.provider
          ? String(data.provider)
              .trim()
              .toUpperCase()
          : null;
    }

    const finalType =
      updateData.type ??
      before.type;

    const sanitized =
      this.sanitizeCardData({
        ...updateData,
        type: finalType,
      });

    const updated =
      await paymentMethodRepository
        .updateById(
          id,
          sanitized
        );

    await AuditLogService.logUpdate({
      condominiumId:
        before.condominiumId,
      user:
        authenticatedUser,
      module:
        "PAYMENT_METHOD",
      referenceId:
        id,
      beforeData:
        before,
      afterData:
        updated,
      details:
        "Método de pagamento atualizado.",
      requestContext,
    });

    return updated;
  }

  async changeStatus(
    id,
    status,
    authenticatedUser = null,
    requestContext = null
  ) {
    const normalized =
      String(status ?? "")
        .trim()
        .toUpperCase();

    if (
      ![
        "ACTIVE",
        "INACTIVE",
        "EXPIRED",
      ].includes(normalized)
    ) {
      throw new ApiError(
        "Status do método de pagamento inválido.",
        400
      );
    }

    const before =
      await this.findById(id);

    const updated =
      await paymentMethodRepository
        .changeStatus(
          id,
          normalized
        );

    await AuditLogService
      .logStatusChange({
        condominiumId:
          before.condominiumId,
        user:
          authenticatedUser,
        module:
          "PAYMENT_METHOD",
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

export default new PaymentMethodService();
