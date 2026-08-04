import BaseService from "./BaseService.js";
import condominiumRepository from "../repositories/CondominiumRepository.js";
import AuditLogService from "./AuditLogService.js";
import { ApiError } from "../utils/ApiError.js";

class CondominiumService extends BaseService {
  constructor() {
    super(condominiumRepository);
  }

  normalizeCode(code) {
    return String(code)
      .trim()
      .toUpperCase();
  }

  normalizeEmail(email) {
    if (!email) {
      return null;
    }

    return String(email)
      .trim()
      .toLowerCase();
  }

  /**
   * Busca um condomínio.
   */
  async findById(id) {
    const condominium =
      await condominiumRepository.findById(id);

    if (!condominium) {
      throw new ApiError(
        "Condomínio não encontrado.",
        404
      );
    }

    return condominium;
  }

  /**
   * Lista todos.
   * (uso da Star Infinity Code)
   */
  async findAll() {
    return condominiumRepository.findAll();
  }

  /**
   * Cria um condomínio.
   */
  async create(data, authenticatedUser = null) {

    if (!data.code)
      throw new ApiError(
        "Código obrigatório.",
        400
      );

    if (!data.name)
      throw new ApiError(
        "Nome obrigatório.",
        400
      );

    const code =
      this.normalizeCode(data.code);

    const existingCode =
      await condominiumRepository.findByCode(
        code
      );

    if (existingCode) {
      throw new ApiError(
        "Já existe um condomínio com esse código.",
        409
      );
    }

    if (data.document) {
      const existingDocument =
        await condominiumRepository.findByDocument(
          data.document
        );

      if (existingDocument) {
        throw new ApiError(
          "Documento já cadastrado.",
          409
        );
      }
    }

    const condominium =
      await condominiumRepository.createCondominium({
        ...data,
        code,
        email:
          this.normalizeEmail(
            data.email
          ),
      });

    if (authenticatedUser) {
      await AuditLogService.logCreate({
        condominiumId: condominium.id,
        user: authenticatedUser,
        module: "CONDOMINIUM",
        referenceId: condominium.id,
        afterData: condominium,
        details:
          "Condomínio criado.",
      });
    }

    return condominium;
  }

  /**
   * Atualiza os dados.
   */
  async update(
    id,
    data,
    authenticatedUser = null
  ) {

    const before =
      await this.findById(id);

    if (
      data.code &&
      data.code !== before.code
    ) {

      const existing =
        await condominiumRepository.findByCode(
          this.normalizeCode(
            data.code
          )
        );

      if (existing) {
        throw new ApiError(
          "Código já utilizado.",
          409
        );
      }
    }

    if (
      data.document &&
      data.document !== before.document
    ) {

      const existing =
        await condominiumRepository.findByDocument(
          data.document
        );

      if (existing) {
        throw new ApiError(
          "Documento já cadastrado.",
          409
        );
      }
    }

    const updated =
      await condominiumRepository.updateById(
        id,
        {
          ...data,
          code:
            data.code
              ? this.normalizeCode(
                  data.code
                )
              : undefined,

          email:
            data.email !== undefined
              ? this.normalizeEmail(
                  data.email
                )
              : undefined,
        }
      );

    await AuditLogService.logUpdate({
      condominiumId: id,
      user: authenticatedUser,
      module: "CONDOMINIUM",
      referenceId: id,
      beforeData: before,
      afterData: updated,
      details:
        "Dados do condomínio atualizados.",
    });

    return updated;
  }

  /**
   * Ativa.
   */
  async activate(
    id,
    authenticatedUser
  ) {

    const before =
      await this.findById(id);

    const updated =
      await condominiumRepository.activate(id);

    await AuditLogService.logStatusChange({
      condominiumId: id,
      user: authenticatedUser,
      module: "CONDOMINIUM",
      referenceId: id,
      previousStatus: before.status,
      newStatus: updated.status,
    });

    return updated;
  }

  /**
   * Suspende.
   */
  async suspend(
    id,
    authenticatedUser
  ) {

    const before =
      await this.findById(id);

    const updated =
      await condominiumRepository.suspend(id);

    await AuditLogService.logStatusChange({
      condominiumId: id,
      user: authenticatedUser,
      module: "CONDOMINIUM",
      referenceId: id,
      previousStatus: before.status,
      newStatus: updated.status,
    });

    return updated;
  }

  /**
   * Cancela.
   */
  async cancel(
    id,
    authenticatedUser
  ) {

    const before =
      await this.findById(id);

    const updated =
      await condominiumRepository.cancel(id);

    await AuditLogService.logStatusChange({
      condominiumId: id,
      user: authenticatedUser,
      module: "CONDOMINIUM",
      referenceId: id,
      previousStatus: before.status,
      newStatus: updated.status,
    });

    return updated;
  }

  /**
   * Atualiza configurações.
   */
  async updateSettings(
    id,
    settings
  ) {

    return condominiumRepository.updateSettings(
      id,
      settings
    );
  }

  /**
   * Atualiza regras.
   */
  async updateRules(
    id,
    rules
  ) {

    return condominiumRepository.updateRules(
      id,
      rules
    );
  }

  /**
   * Exclusão lógica.
   */
  async remove(
    id,
    authenticatedUser
  ) {

    const before =
      await this.findById(id);

    await condominiumRepository.softDelete(id);

    await AuditLogService.logDelete({
      condominiumId: id,
      user: authenticatedUser,
      module: "CONDOMINIUM",
      referenceId: id,
      beforeData: before,
      details:
        "Condomínio removido logicamente.",
    });

    return {
      message:
        "Condomínio removido com sucesso.",
    };
  }

  /**
   * Estatísticas.
   */
  async statistics() {

    return {
      total:
        await condominiumRepository.countAll(),

      trial:
        await condominiumRepository.countByStatus(
          "TRIAL"
        ),

      active:
        await condominiumRepository.countByStatus(
          "ACTIVE"
        ),

      suspended:
        await condominiumRepository.countByStatus(
          "SUSPENDED"
        ),

      canceled:
        await condominiumRepository.countByStatus(
          "CANCELED"
        ),
    };
  }
}

export default new CondominiumService();