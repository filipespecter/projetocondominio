import prisma from "../config/prisma.js";

/**
 * Repository base do InfinityCondo.
 *
 * Centraliza operações comuns de acesso ao banco.
 * Os repositories específicos herdarão desta classe.
 *
 * Esta camada:
 * - pode acessar o Prisma;
 * - não possui regras de negócio;
 * - não recebe req ou res do Express;
 * - apenas consulta, cria, atualiza e remove registros.
 */
export class BaseRepository {
  constructor(modelName) {
    if (!modelName) {
      throw new Error(
        "O nome do model é obrigatório para criar um repository."
      );
    }

    this.modelName = modelName;
  }

  /**
   * Retorna o model correspondente no Prisma.
   *
   * Exemplo:
   * new BaseRepository("apartment")
   * acessará prisma.apartment.
   */
  get model() {
    const prismaModel = prisma[this.modelName];

    if (!prismaModel) {
      throw new Error(
        `O model "${this.modelName}" não foi encontrado no Prisma Client.`
      );
    }

    return prismaModel;
  }

  /**
   * Cria um novo registro.
   */
  async create(data, options = {}) {
    return this.model.create({
      data,
      ...options,
    });
  }

  /**
   * Procura um registro usando uma chave única.
   *
   * Exemplo:
   * findUnique({ id })
   */
  async findUnique(where, options = {}) {
    return this.model.findUnique({
      where,
      ...options,
    });
  }

  /**
   * Procura o primeiro registro compatível com os filtros.
   *
   * Este método será bastante usado para garantir o
   * isolamento dos dados pelo condominiumId.
   */
  async findFirst(where, options = {}) {
    return this.model.findFirst({
      where,
      ...options,
    });
  }

  /**
   * Retorna uma lista de registros.
   */
  async findMany(where = {}, options = {}) {
    return this.model.findMany({
      where,
      ...options,
    });
  }

  /**
   * Conta quantos registros correspondem aos filtros.
   */
  async count(where = {}) {
    return this.model.count({
      where,
    });
  }

  /**
   * Atualiza um registro usando uma chave única.
   */
  async update(where, data, options = {}) {
    return this.model.update({
      where,
      data,
      ...options,
    });
  }

  /**
   * Atualiza vários registros.
   */
  async updateMany(where, data) {
    return this.model.updateMany({
      where,
      data,
    });
  }

  /**
   * Exclui definitivamente um registro.
   *
   * Nos módulos que utilizarem exclusão lógica,
   * o repository específico atualizará deletedAt
   * em vez de chamar este método.
   */
  async delete(where, options = {}) {
    return this.model.delete({
      where,
      ...options,
    });
  }

  /**
   * Exclui definitivamente vários registros.
   */
  async deleteMany(where) {
    return this.model.deleteMany({
      where,
    });
  }

  /**
   * Verifica se existe algum registro com os filtros informados.
   */
  async exists(where) {
    const total = await this.model.count({
      where,
    });

    return total > 0;
  }
}

export default BaseRepository;