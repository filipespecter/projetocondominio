import ApiError from "../utils/ApiError.js";

class BaseService {
  constructor(repository) {
    if (!repository) {
      throw new Error(
        "Um repository deve ser informado para o BaseService."
      );
    }

    this.repository = repository;
  }

  /**
   * Busca um registro pelo ID.
   */
  async findById(id, condominiumId) {
    const record = await this.repository.findById(
      id,
      condominiumId
    );

    if (!record) {
      throw new ApiError(
        "Registro não encontrado.",
        404
      );
    }

    return record;
  }

  /**
   * Lista registros.
   */
  async findAll(condominiumId) {
    return this.repository.findByCondominium(
      condominiumId
    );
  }

  /**
   * Cria um registro.
   *
   * Cada Service poderá sobrescrever este método
   * quando possuir regras específicas.
   */
  async create(data) {
    return this.repository.create(data);
  }

  /**
   * Atualiza um registro.
   */
  async update(id, condominiumId, data) {
    const record = await this.repository.updateById(
      id,
      condominiumId,
      data
    );

    if (!record) {
      throw new ApiError(
        "Registro não encontrado.",
        404
      );
    }

    return record;
  }

  /**
   * Ativa um registro.
   */
  async activate(id, condominiumId) {
    if (!this.repository.activate) {
      throw new ApiError(
        "Operação não suportada.",
        400
      );
    }

    return this.repository.activate(
      id,
      condominiumId
    );
  }

  /**
   * Desativa um registro.
   */
  async deactivate(id, condominiumId) {
    if (!this.repository.deactivate) {
      throw new ApiError(
        "Operação não suportada.",
        400
      );
    }

    return this.repository.deactivate(
      id,
      condominiumId
    );
  }

  /**
   * Conta registros.
   */
  async count(condominiumId) {
    if (!this.repository.countByCondominium) {
      return 0;
    }

    return this.repository.countByCondominium(
      condominiumId
    );
  }

  /**
   * Verifica se um registro existe.
   */
  async exists(id, condominiumId) {
    const record = await this.repository.findById(
      id,
      condominiumId
    );

    return !!record;
  }
}

export default BaseService;