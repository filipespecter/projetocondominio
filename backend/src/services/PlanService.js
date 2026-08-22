import BaseService from "./BaseService.js";
import AuditLogService from "./AuditLogService.js";

import planRepository from "../repositories/PlanRepository.js";

import { ApiError } from "../utils/ApiError.js";

class PlanService extends BaseService {
  constructor() {
    super(planRepository);
  }

  /**
   * Ciclos de cobrança existentes no schema.
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
   * Normaliza o nome do plano.
   */
  normalizeName(name) {
    if (!name) {
      throw new ApiError(
        "O nome do plano é obrigatório.",
        400
      );
    }

    const normalizedName =
      String(name).trim();

    if (normalizedName.length < 2) {
      throw new ApiError(
        "O nome do plano deve possuir pelo menos 2 caracteres.",
        400
      );
    }

    if (normalizedName.length > 100) {
      throw new ApiError(
        "O nome do plano deve possuir no máximo 100 caracteres.",
        400
      );
    }

    return normalizedName;
  }

  /**
   * Normaliza o código comercial do plano.
   *
   * Exemplo:
   * plano profissional -> PLANO_PROFISSIONAL
   */
  normalizeCode(code) {
    if (!code) {
      throw new ApiError(
        "O código do plano é obrigatório.",
        400
      );
    }

    const normalizedCode =
      String(code)
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "_")
        .replace(/[^A-Z0-9_-]/g, "");

    if (normalizedCode.length < 2) {
      throw new ApiError(
        "O código do plano é inválido.",
        400
      );
    }

    if (normalizedCode.length > 50) {
      throw new ApiError(
        "O código do plano deve possuir no máximo 50 caracteres.",
        400
      );
    }

    return normalizedCode;
  }

  /**
   * Valida o preço armazenado em centavos.
   *
   * Exemplo:
   * R$ 199,90 = 19990
   */
  normalizePriceInCents(value) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      throw new ApiError(
        "O preço mensal do plano é obrigatório.",
        400
      );
    }

    const priceInCents =
      Number(value);

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
   * Valida a ordem de exibição.
   */
  normalizeDisplayOrder(value) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return 0;
    }

    const displayOrder =
      Number(value);

    if (
      !Number.isInteger(displayOrder) ||
      displayOrder < 0
    ) {
      throw new ApiError(
        "A ordem de exibição deve ser um número inteiro igual ou maior que zero.",
        400
      );
    }

    return displayOrder;
  }

  /**
   * Normaliza descrição opcional.
   */
  normalizeDescription(description) {
    if (
      description === undefined ||
      description === null ||
      description === ""
    ) {
      return null;
    }

    const normalizedDescription =
      String(description).trim();

    if (normalizedDescription.length > 1000) {
      throw new ApiError(
        "A descrição do plano deve possuir no máximo 1000 caracteres.",
        400
      );
    }

    return normalizedDescription;
  }

  /**
   * Valida nome duplicado.
   */
  async validateUniqueName(
    name,
    ignoredPlanId = null
  ) {
    const normalizedName =
      this.normalizeName(name);

    const existingPlan =
      await planRepository.findByName(
        normalizedName
      );

    if (
      existingPlan &&
      existingPlan.id !== ignoredPlanId
    ) {
      throw new ApiError(
        "Já existe um plano com este nome.",
        409
      );
    }

    return normalizedName;
  }

  /**
   * Valida código duplicado.
   */
  async validateUniqueCode(
    code,
    ignoredPlanId = null
  ) {
    const normalizedCode =
      this.normalizeCode(code);

    const existingPlan =
      await planRepository.findByCode(
        normalizedCode
      );

    if (
      existingPlan &&
      existingPlan.id !== ignoredPlanId
    ) {
      throw new ApiError(
        "Já existe um plano com este código.",
        409
      );
    }

    return normalizedCode;
  }

  /**
   * Busca um plano pelo ID.
   */
  async findById(id) {
    if (!id) {
      throw new ApiError(
        "O ID do plano é obrigatório.",
        400
      );
    }

    const plan =
      await planRepository.findById(id);

    if (!plan) {
      throw new ApiError(
        "Plano não encontrado.",
        404
      );
    }

    return plan;
  }

  /**
   * Lista todos os planos não removidos.
   */
  async findAll() {
    return planRepository.findAll();
  }

  /**
   * Lista somente planos ativos.
   */
  async findActive() {
    return planRepository.findActive();
  }

  /**
   * Lista somente planos inativos.
   */
  async findInactive() {
    return planRepository.findInactive();
  }

  /**
   * Busca plano pelo código.
   */
  async findByCode(code) {
    const normalizedCode =
      this.normalizeCode(code);

    const plan =
      await planRepository.findByCode(
        normalizedCode
      );

    if (!plan) {
      throw new ApiError(
        "Plano não encontrado.",
        404
      );
    }

    return plan;
  }

  /**
   * Cria um novo plano comercial.
   */
  async create(
    data,
    authenticatedUser,
    requestContext = null
  ) {
    if (!authenticatedUser?.id) {
      throw new ApiError(
        "Usuário responsável não identificado.",
        401
      );
    }

    const name =
      await this.validateUniqueName(
        data.name
      );

    const code =
      await this.validateUniqueCode(
        data.code
      );

    const billingCycle =
      data.billingCycle ??
      "MONTHLY";

    this.validateBillingCycle(
      billingCycle
    );

    const monthlyPriceInCents =
      this.normalizePriceInCents(
        data.monthlyPriceInCents
      );

    const displayOrder =
      this.normalizeDisplayOrder(
        data.displayOrder
      );

    const description =
      this.normalizeDescription(
        data.description
      );

    const plan =
      await planRepository.createPlan({
        name,
        code,
        description,
        monthlyPriceInCents,
        billingCycle,

        active:
          data.active !== undefined
            ? Boolean(data.active)
            : true,

        displayOrder,
      });

    await AuditLogService.logCreate({
      condominiumId: null,
      user: authenticatedUser,
      module: "PLAN",
      referenceId: plan.id,
      afterData: plan,
      details:
        "Plano comercial criado.",
      requestContext,
    });

    return plan;
  }

  /**
   * Atualiza os dados comerciais do plano.
   *
   * Ativação e desativação utilizam métodos
   * separados.
   */
  async update(
    id,
    data,
    authenticatedUser,
    requestContext = null
  ) {
    const before =
      await this.findById(id);

    const updateData = {};

    if (data.name !== undefined) {
      updateData.name =
        await this.validateUniqueName(
          data.name,
          id
        );
    }

    if (data.code !== undefined) {
      updateData.code =
        await this.validateUniqueCode(
          data.code,
          id
        );
    }

    if (
      data.description !== undefined
    ) {
      updateData.description =
        this.normalizeDescription(
          data.description
        );
    }

    if (
      data.monthlyPriceInCents !==
      undefined
    ) {
      updateData.monthlyPriceInCents =
        this.normalizePriceInCents(
          data.monthlyPriceInCents
        );
    }

    if (
      data.billingCycle !== undefined
    ) {
      this.validateBillingCycle(
        data.billingCycle
      );

      updateData.billingCycle =
        data.billingCycle;
    }

    if (
      data.displayOrder !== undefined
    ) {
      updateData.displayOrder =
        this.normalizeDisplayOrder(
          data.displayOrder
        );
    }

    if (
      Object.keys(updateData).length === 0
    ) {
      throw new ApiError(
        "Nenhum dado válido foi informado para atualização.",
        400
      );
    }

    const updated =
      await planRepository.updateById(
        id,
        updateData
      );

    if (!updated) {
      throw new ApiError(
        "Plano não encontrado.",
        404
      );
    }

    await AuditLogService.logUpdate({
      condominiumId: null,
      user: authenticatedUser,
      module: "PLAN",
      referenceId: id,
      beforeData: before,
      afterData: updated,
      details:
        "Plano comercial atualizado.",
      requestContext,
    });

    return updated;
  }

  /**
   * Ativa um plano.
   */
  async activate(
    id,
    authenticatedUser,
    requestContext = null
  ) {
    const before =
      await this.findById(id);

    if (before.active) {
      throw new ApiError(
        "O plano já está ativo.",
        409
      );
    }

    const updated =
      await planRepository.activate(id);

    if (!updated) {
      throw new ApiError(
        "Não foi possível ativar o plano.",
        409
      );
    }

    /*
     * O model Plan não possui status.
     * Por isso auditamos a alteração do campo active.
     */
    await AuditLogService.logUpdate({
      condominiumId: null,
      user: authenticatedUser,
      module: "PLAN",
      referenceId: id,

      beforeData: {
        active: before.active,
      },

      afterData: {
        active: updated.active,
      },

      details:
        "Plano comercial ativado.",
      requestContext,
    });

    return updated;
  }

  /**
   * Desativa um plano.
   *
   * As assinaturas existentes continuam
   * preservadas. Apenas novas assinaturas
   * deixam de utilizar o plano.
   */
  async deactivate(
    id,
    authenticatedUser,
    requestContext = null
  ) {
    const before =
      await this.findById(id);

    if (!before.active) {
      throw new ApiError(
        "O plano já está inativo.",
        409
      );
    }

    const updated =
      await planRepository.deactivate(
        id
      );

    if (!updated) {
      throw new ApiError(
        "Não foi possível desativar o plano.",
        409
      );
    }

    await AuditLogService.logUpdate({
      condominiumId: null,
      user: authenticatedUser,
      module: "PLAN",
      referenceId: id,

      beforeData: {
        active: before.active,
      },

      afterData: {
        active: updated.active,
      },

      details:
        "Plano comercial desativado.",
      requestContext,
    });

    return updated;
  }

  /**
   * Atualiza a posição do plano nas telas
   * comerciais.
   */
  async updateDisplayOrder(
    id,
    displayOrder,
    authenticatedUser,
    requestContext = null
  ) {
    const before =
      await this.findById(id);

    const normalizedDisplayOrder =
      this.normalizeDisplayOrder(
        displayOrder
      );

    if (
      before.displayOrder ===
      normalizedDisplayOrder
    ) {
      throw new ApiError(
        "O plano já utiliza esta ordem de exibição.",
        409
      );
    }

    const updated =
      await planRepository
        .updateDisplayOrder(
          id,
          normalizedDisplayOrder
        );

    if (!updated) {
      throw new ApiError(
        "Plano não encontrado.",
        404
      );
    }

    await AuditLogService.logUpdate({
      condominiumId: null,
      user: authenticatedUser,
      module: "PLAN",
      referenceId: id,

      beforeData: {
        displayOrder:
          before.displayOrder,
      },

      afterData: {
        displayOrder:
          updated.displayOrder,
      },

      details:
        "Ordem de exibição do plano atualizada.",
      requestContext,
    });

    return updated;
  }

  /**
   * Remove logicamente um plano.
   *
   * Planos que possuem assinaturas não serão
   * removidos para preservar o histórico.
   * Nesse caso, devem ser apenas desativados.
   */
  async remove(
    id,
    authenticatedUser,
    requestContext = null
  ) {
    const before =
      await this.findById(id);

    const hasSubscriptions =
      await planRepository.hasSubscriptions(
        id
      );

    if (hasSubscriptions) {
      throw new ApiError(
        "Este plano possui assinaturas vinculadas e não pode ser removido. Desative o plano para impedir novas contratações.",
        409
      );
    }

    const deleted =
      await planRepository.softDelete(id);

    if (!deleted) {
      throw new ApiError(
        "Não foi possível remover o plano.",
        400
      );
    }

    await AuditLogService.logDelete({
      condominiumId: null,
      user: authenticatedUser,
      module: "PLAN",
      referenceId: id,
      beforeData: before,
      details:
        "Plano comercial removido logicamente.",
      requestContext,
    });

    return {
      message:
        "Plano removido com sucesso.",
    };
  }

  /**
   * Estatísticas dos planos.
   */
  async statistics() {
    const [
      total,
      active,
      inactive,
    ] = await Promise.all([
      planRepository.countAll(),

      planRepository.countActive(),

      planRepository.countInactive(),
    ]);

    return {
      total,
      active,
      inactive,
    };
  }
}

export default new PlanService();