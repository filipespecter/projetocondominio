import BaseService from "./BaseService.js";
import AuditLogService from "./AuditLogService.js";

import subscriptionRepository from "../repositories/SubscriptionRepository.js";
import condominiumRepository from "../repositories/CondominiumRepository.js";
import planRepository from "../repositories/PlanRepository.js";

import { ApiError } from "../utils/ApiError.js";

class SubscriptionService extends BaseService {
  constructor() {
    super(subscriptionRepository);
  }

  /**
   * Status permitidos pelo schema.
   */
  validateStatus(status) {
    const allowedStatuses = [
      "TRIAL",
      "ACTIVE",
      "OVERDUE",
      "SUSPENDED",
      "CANCELED",
    ];

    if (!allowedStatuses.includes(status)) {
      throw new ApiError(
        "Status de assinatura inválido.",
        400
      );
    }
  }

  /**
   * Ciclos permitidos pelo schema.
   */
  validateBillingCycle(billingCycle) {
    const allowedCycles = [
      "MONTHLY",
      "QUARTERLY",
      "SEMIANNUAL",
      "ANNUAL",
    ];

    if (!allowedCycles.includes(billingCycle)) {
      throw new ApiError(
        "Ciclo de cobrança inválido.",
        400
      );
    }
  }

  /**
   * Valida e normaliza um valor monetário
   * armazenado em centavos.
   */
  normalizePriceInCents(value) {
    const priceInCents = Number(value);

    if (
      !Number.isInteger(priceInCents) ||
      priceInCents < 0
    ) {
      throw new ApiError(
        "O preço deve ser informado em centavos e não pode ser negativo.",
        400
      );
    }

    return priceInCents;
  }

  /**
   * Normaliza uma data.
   */
  normalizeDate(value, fieldName) {
    const date =
      value instanceof Date
        ? new Date(value)
        : new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new ApiError(
        `${fieldName} inválida.`,
        400
      );
    }

    return date;
  }

  /**
   * Normaliza uma data opcional.
   */
  normalizeOptionalDate(
    value,
    fieldName
  ) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return null;
    }

    return this.normalizeDate(
      value,
      fieldName
    );
  }

  /**
   * Soma meses preservando uma data válida.
   *
   * Evita problemas como:
   * 31 de janeiro + 1 mês.
   */
  addMonths(date, months) {
    const result = new Date(date);
    const originalDay = result.getDate();

    result.setDate(1);
    result.setMonth(
      result.getMonth() + months
    );

    const lastDayOfTargetMonth =
      new Date(
        result.getFullYear(),
        result.getMonth() + 1,
        0
      ).getDate();

    result.setDate(
      Math.min(
        originalDay,
        lastDayOfTargetMonth
      )
    );

    return result;
  }

  /**
   * Calcula o fim do período conforme
   * o ciclo de cobrança.
   */
  calculatePeriodEnd(
    currentPeriodStart,
    billingCycle
  ) {
    this.validateBillingCycle(
      billingCycle
    );

    const monthsByCycle = {
      MONTHLY: 1,
      QUARTERLY: 3,
      SEMIANNUAL: 6,
      ANNUAL: 12,
    };

    return this.addMonths(
      currentPeriodStart,
      monthsByCycle[billingCycle]
    );
  }

  /**
   * Confere se o condomínio existe.
   */
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
      await condominiumRepository.findById(
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

  /**
   * Confere se o plano existe e está disponível.
   */
  async validatePlan(planId) {
    if (!planId) {
      throw new ApiError(
        "O plano é obrigatório.",
        400
      );
    }

    const plan =
      await planRepository.findById(
        planId
      );

    if (!plan) {
      throw new ApiError(
        "Plano não encontrado.",
        404
      );
    }

    if (!plan.active) {
      throw new ApiError(
        "O plano informado está inativo.",
        400
      );
    }

    if (plan.deletedAt) {
      throw new ApiError(
        "O plano informado foi removido.",
        400
      );
    }

    return plan;
  }

  /**
   * Busca assinatura por ID.
   */
  async findById(id) {
    if (!id) {
      throw new ApiError(
        "O ID da assinatura é obrigatório.",
        400
      );
    }

    const subscription =
      await subscriptionRepository.findById(
        id
      );

    if (!subscription) {
      throw new ApiError(
        "Assinatura não encontrada.",
        404
      );
    }

    return subscription;
  }

  /**
   * Lista todas as assinaturas da plataforma.
   */
  async findAll() {
    return subscriptionRepository.findAll();
  }

  /**
   * Lista o histórico de assinaturas
   * de um condomínio.
   */
  async findByCondominium(
    condominiumId
  ) {
    await this.validateCondominium(
      condominiumId
    );

    return subscriptionRepository
      .findByCondominium(
        condominiumId
      );
  }

  /**
   * Busca a assinatura atual do condomínio.
   */
  async findCurrentByCondominium(
    condominiumId
  ) {
    await this.validateCondominium(
      condominiumId
    );

    const subscription =
      await subscriptionRepository
        .findCurrentByCondominium(
          condominiumId
        );

    if (!subscription) {
      throw new ApiError(
        "O condomínio não possui assinatura atual.",
        404
      );
    }

    return subscription;
  }

  /**
   * Lista assinaturas por status.
   */
  async findByStatus(status) {
    this.validateStatus(status);

    return subscriptionRepository
      .findByStatus(status);
  }

  /**
   * Lista assinaturas vinculadas a um plano.
   */
  async findByPlan(planId) {
    await this.validatePlan(planId);

    return subscriptionRepository
      .findByPlan(planId);
  }

  /**
   * Cria uma assinatura para o condomínio.
   *
   * Por padrão, a assinatura começa em TRIAL.
   */
  async create(
    condominiumId,
    planId,
    data = {},
    authenticatedUser,
    requestContext = null
  ) {
    const condominium =
      await this.validateCondominium(
        condominiumId
      );

    const plan =
      await this.validatePlan(planId);

    const currentSubscription =
      await subscriptionRepository
        .findCurrentByCondominium(
          condominiumId
        );

    if (currentSubscription) {
      throw new ApiError(
        "Este condomínio já possui uma assinatura atual.",
        409
      );
    }

    const status =
      data.status ?? "TRIAL";

    this.validateStatus(status);

    if (status === "CANCELED") {
      throw new ApiError(
        "Uma nova assinatura não pode ser criada como cancelada.",
        400
      );
    }

    const billingCycle =
      data.billingCycle ??
      plan.billingCycle;

    this.validateBillingCycle(
      billingCycle
    );

    const priceInCents =
      this.normalizePriceInCents(
        data.priceInCents ??
          plan.monthlyPriceInCents
      );

    const currentPeriodStart =
      data.currentPeriodStart
        ? this.normalizeDate(
            data.currentPeriodStart,
            "Data inicial do período"
          )
        : new Date();

    const currentPeriodEnd =
      data.currentPeriodEnd
        ? this.normalizeDate(
            data.currentPeriodEnd,
            "Data final do período"
          )
        : this.calculatePeriodEnd(
            currentPeriodStart,
            billingCycle
          );

    if (
      currentPeriodEnd <=
      currentPeriodStart
    ) {
      throw new ApiError(
        "A data final do período deve ser posterior à data inicial.",
        400
      );
    }

    let trialEndsAt =
      this.normalizeOptionalDate(
        data.trialEndsAt,
        "Data final do período de teste"
      );

    if (
      status === "TRIAL" &&
      !trialEndsAt
    ) {
      trialEndsAt =
        new Date(currentPeriodEnd);
    }

    if (
      trialEndsAt &&
      trialEndsAt <
        currentPeriodStart
    ) {
      throw new ApiError(
        "A data final do teste não pode ser anterior ao início da assinatura.",
        400
      );
    }

    const subscription =
      await subscriptionRepository
        .createSubscription({
          condominiumId:
            condominium.id,

          planId:
            plan.id,

          status,
          billingCycle,
          priceInCents,
          currentPeriodStart,
          currentPeriodEnd,
          trialEndsAt,

          suspendedAt:
            status === "SUSPENDED"
              ? new Date()
              : null,

          canceledAt: null,
          cancellationReason: null,
        });

    await AuditLogService.logCreate({
      condominiumId,
      user: authenticatedUser,
      module: "SUBSCRIPTION",
      referenceId:
        subscription.id,
      afterData:
        subscription,
      details:
        "Assinatura criada para o condomínio.",
      requestContext,
    });

    return subscription;
  }

  /**
   * Altera o plano da assinatura.
   */
  async changePlan(
    id,
    planId,
    data = {},
    authenticatedUser,
    requestContext = null
  ) {
    const before =
      await this.findById(id);

    if (before.status === "CANCELED") {
      throw new ApiError(
        "Não é possível alterar o plano de uma assinatura cancelada.",
        409
      );
    }

    const plan =
      await this.validatePlan(planId);

    if (before.planId === plan.id) {
      throw new ApiError(
        "A assinatura já utiliza este plano.",
        409
      );
    }

    const billingCycle =
      data.billingCycle ??
      plan.billingCycle;

    this.validateBillingCycle(
      billingCycle
    );

    const priceInCents =
      this.normalizePriceInCents(
        data.priceInCents ??
          plan.monthlyPriceInCents
      );

    const updateData = {
      planId: plan.id,
      billingCycle,
      priceInCents,
    };

    if (data.restartPeriod === true) {
      const currentPeriodStart =
        new Date();

      updateData.currentPeriodStart =
        currentPeriodStart;

      updateData.currentPeriodEnd =
        this.calculatePeriodEnd(
          currentPeriodStart,
          billingCycle
        );
    }

    const subscription =
      await subscriptionRepository
        .changePlan(
          id,
          updateData
        );

    if (!subscription) {
      throw new ApiError(
        "Não foi possível alterar o plano da assinatura.",
        409
      );
    }

    await AuditLogService.logUpdate({
      condominiumId:
        subscription.condominiumId,
      user: authenticatedUser,
      module: "SUBSCRIPTION",
      referenceId: id,
      beforeData: before,
      afterData: subscription,
      details:
        "Plano da assinatura alterado.",
      requestContext,
    });

    return subscription;
  }

  /**
   * Ativa ou reativa uma assinatura.
   */
  async activate(
    id,
    data = {},
    authenticatedUser,
    requestContext = null
  ) {
    const before =
      await this.findById(id);

    if (before.status === "ACTIVE") {
      throw new ApiError(
        "A assinatura já está ativa.",
        409
      );
    }

    if (before.status === "CANCELED") {
      throw new ApiError(
        "Uma assinatura cancelada não pode ser reativada. Crie uma nova assinatura.",
        409
      );
    }

    const activationData = {};

    if (data.restartPeriod === true) {
      const currentPeriodStart =
        new Date();

      activationData.currentPeriodStart =
        currentPeriodStart;

      activationData.currentPeriodEnd =
        this.calculatePeriodEnd(
          currentPeriodStart,
          before.billingCycle
        );
    }

    if (data.trialEndsAt !== undefined) {
      activationData.trialEndsAt =
        this.normalizeOptionalDate(
          data.trialEndsAt,
          "Data final do teste"
        );
    }

    const subscription =
      await subscriptionRepository.activate(
        id,
        activationData
      );

    if (!subscription) {
      throw new ApiError(
        "A assinatura não pode ser ativada no status atual.",
        409
      );
    }

    await AuditLogService
      .logStatusChange({
        condominiumId:
          subscription.condominiumId,
        user: authenticatedUser,
        module: "SUBSCRIPTION",
        referenceId: id,
        previousStatus:
          before.status,
        newStatus:
          subscription.status,
        details:
          "Assinatura ativada.",
        requestContext,
      });

    return subscription;
  }

  /**
   * Marca a assinatura como vencida.
   */
  async markAsOverdue(
    id,
    authenticatedUser = null,
    requestContext = null
  ) {
    const before =
      await this.findById(id);

    if (
      ![
        "TRIAL",
        "ACTIVE",
      ].includes(before.status)
    ) {
      throw new ApiError(
        "A assinatura não pode ser marcada como vencida no status atual.",
        409
      );
    }

    const subscription =
      await subscriptionRepository
        .markAsOverdue(id);

    if (!subscription) {
      throw new ApiError(
        "Não foi possível marcar a assinatura como vencida.",
        409
      );
    }

    await AuditLogService
      .logStatusChange({
        condominiumId:
          subscription.condominiumId,
        user: authenticatedUser,
        module: "SUBSCRIPTION",
        referenceId: id,
        previousStatus:
          before.status,
        newStatus:
          subscription.status,
        details:
          "Assinatura marcada como vencida.",
        requestContext,
      });

    return subscription;
  }

  /**
   * Suspende a assinatura.
   */
  async suspend(
    id,
    authenticatedUser,
    requestContext = null
  ) {
    const before =
      await this.findById(id);

    if (before.status === "SUSPENDED") {
      throw new ApiError(
        "A assinatura já está suspensa.",
        409
      );
    }

    if (before.status === "CANCELED") {
      throw new ApiError(
        "Uma assinatura cancelada não pode ser suspensa.",
        409
      );
    }

    const subscription =
      await subscriptionRepository.suspend(
        id
      );

    if (!subscription) {
      throw new ApiError(
        "A assinatura não pode ser suspensa no status atual.",
        409
      );
    }

    await AuditLogService
      .logStatusChange({
        condominiumId:
          subscription.condominiumId,
        user: authenticatedUser,
        module: "SUBSCRIPTION",
        referenceId: id,
        previousStatus:
          before.status,
        newStatus:
          subscription.status,
        details:
          "Assinatura suspensa.",
        requestContext,
      });

    return subscription;
  }

  /**
   * Cancela a assinatura.
   */
  async cancel(
    id,
    cancellationReason,
    authenticatedUser,
    requestContext = null
  ) {
    const before =
      await this.findById(id);

    if (before.status === "CANCELED") {
      throw new ApiError(
        "A assinatura já está cancelada.",
        409
      );
    }

    if (!cancellationReason) {
      throw new ApiError(
        "O motivo do cancelamento é obrigatório.",
        400
      );
    }

    const normalizedReason =
      String(cancellationReason).trim();

    const subscription =
      await subscriptionRepository.cancel(
        id,
        normalizedReason
      );

    if (!subscription) {
      throw new ApiError(
        "Não foi possível cancelar a assinatura.",
        409
      );
    }

    await AuditLogService
      .logStatusChange({
        condominiumId:
          subscription.condominiumId,
        user: authenticatedUser,
        module: "SUBSCRIPTION",
        referenceId: id,
        previousStatus:
          before.status,
        newStatus:
          subscription.status,
        details:
          `Assinatura cancelada. Motivo: ${normalizedReason}`,
        requestContext,
      });

    return subscription;
  }

  /**
   * Renova o período da assinatura.
   */
  async renew(
    id,
    authenticatedUser,
    requestContext = null
  ) {
    const before =
      await this.findById(id);

    if (before.status === "CANCELED") {
      throw new ApiError(
        "Uma assinatura cancelada não pode ser renovada.",
        409
      );
    }

    const currentPeriodStart =
      new Date();

    const currentPeriodEnd =
      this.calculatePeriodEnd(
        currentPeriodStart,
        before.billingCycle
      );

    const subscription =
      await subscriptionRepository
        .renewPeriod(
          id,
          currentPeriodStart,
          currentPeriodEnd
        );

    if (!subscription) {
      throw new ApiError(
        "A assinatura não pode ser renovada no status atual.",
        409
      );
    }

    await AuditLogService.logUpdate({
      condominiumId:
        subscription.condominiumId,
      user: authenticatedUser,
      module: "SUBSCRIPTION",
      referenceId: id,
      beforeData: before,
      afterData: subscription,
      details:
        "Período da assinatura renovado.",
      requestContext,
    });

    return subscription;
  }

  /**
   * Atualiza o término do período de teste.
   */
  async updateTrial(
    id,
    trialEndsAt,
    authenticatedUser,
    requestContext = null
  ) {
    const before =
      await this.findById(id);

    if (before.status !== "TRIAL") {
      throw new ApiError(
        "Somente assinaturas em período de teste podem ter o prazo alterado.",
        409
      );
    }

    const normalizedTrialEndsAt =
      this.normalizeDate(
        trialEndsAt,
        "Data final do período de teste"
      );

    if (
      normalizedTrialEndsAt <=
      new Date()
    ) {
      throw new ApiError(
        "A nova data final do teste deve ser futura.",
        400
      );
    }

    const subscription =
      await subscriptionRepository
        .updateTrial(
          id,
          normalizedTrialEndsAt,
          normalizedTrialEndsAt
        );

    if (!subscription) {
      throw new ApiError(
        "Não foi possível atualizar o período de teste.",
        409
      );
    }

    await AuditLogService.logUpdate({
      condominiumId:
        subscription.condominiumId,
      user: authenticatedUser,
      module: "SUBSCRIPTION",
      referenceId: id,
      beforeData: before,
      afterData: subscription,
      details:
        "Período de teste atualizado.",
      requestContext,
    });

    return subscription;
  }

  /**
   * Retorna assinaturas próximas do fim
   * do período atual.
   */
  async findEndingBetween(
    startDate,
    endDate
  ) {
    const start =
      this.normalizeDate(
        startDate,
        "Data inicial"
      );

    const end =
      this.normalizeDate(
        endDate,
        "Data final"
      );

    if (start > end) {
      throw new ApiError(
        "A data inicial não pode ser posterior à data final.",
        400
      );
    }

    return subscriptionRepository
      .findEndingBetween(
        start,
        end
      );
  }

  /**
   * Busca períodos vencidos.
   */
  async findExpiredPeriods(
    referenceDate = new Date()
  ) {
    const normalizedDate =
      this.normalizeDate(
        referenceDate,
        "Data de referência"
      );

    return subscriptionRepository
      .findExpiredPeriods(
        normalizedDate
      );
  }

  /**
   * Estatísticas da plataforma.
   */
  async statistics() {
    const [
      total,
      trial,
      active,
      overdue,
      suspended,
      canceled,
    ] = await Promise.all([
      subscriptionRepository.countAll(),

      subscriptionRepository
        .countByStatus("TRIAL"),

      subscriptionRepository
        .countByStatus("ACTIVE"),

      subscriptionRepository
        .countByStatus("OVERDUE"),

      subscriptionRepository
        .countByStatus("SUSPENDED"),

      subscriptionRepository
        .countByStatus("CANCELED"),
    ]);

    return {
      total,
      trial,
      active,
      overdue,
      suspended,
      canceled,
    };
  }
}

export default new SubscriptionService();