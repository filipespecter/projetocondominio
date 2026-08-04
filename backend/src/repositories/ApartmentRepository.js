import BaseRepository from "./BaseRepository.js";

class ApartmentRepository extends BaseRepository {
  constructor() {
    super("apartment");
  }

  /**
   * Busca um apartamento pelo ID dentro do condomínio.
   */
  async findById(id, condominiumId) {
    return this.findFirst(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        include: {
          residents: {
            where: {
              deletedAt: null,
            },
            include: {
              user: true,
            },
          },
        },
      }
    );
  }

  /**
   * Lista todos os apartamentos não excluídos
   * pertencentes ao condomínio.
   */
  async findByCondominium(condominiumId) {
    return this.findMany(
      {
        condominiumId,
        deletedAt: null,
      },
      {
        include: {
          residents: {
            where: {
              deletedAt: null,
            },
            include: {
              user: true,
            },
          },
        },
        orderBy: [
          {
            block: "asc",
          },
          {
            number: "asc",
          },
        ],
      }
    );
  }

  /**
   * Lista apartamentos por status.
   *
   * Exemplos:
   * OCCUPIED
   * VACANT
   * MAINTENANCE
   * INACTIVE
   */
  async findByStatus(condominiumId, status) {
    return this.findMany(
      {
        condominiumId,
        status,
        deletedAt: null,
      },
      {
        include: {
          residents: {
            where: {
              deletedAt: null,
            },
            include: {
              user: true,
            },
          },
        },
        orderBy: [
          {
            block: "asc",
          },
          {
            number: "asc",
          },
        ],
      }
    );
  }

  /**
   * Lista apartamentos disponíveis, sem moradores ativos.
   *
   * O status VACANT representa uma unidade desocupada.
   */
  async findVacant(condominiumId) {
    return this.findByStatus(
      condominiumId,
      "VACANT"
    );
  }

  /**
   * Busca um apartamento pelo bloco e número.
   *
   * Será utilizado pelo Service para impedir
   * cadastros duplicados.
   */
  async findByBlockAndNumber(
    condominiumId,
    block,
    number
  ) {
    return this.findFirst({
      condominiumId,
      block: String(block).trim(),
      number: String(number).trim(),
      deletedAt: null,
    });
  }

  /**
   * Cria um apartamento vinculado ao condomínio.
   */
  async createForCondominium(
    condominiumId,
    data
  ) {
    return this.create(
      {
        condominiumId,
        block: String(data.block).trim(),
        number: String(data.number).trim(),
        floor:
          data.floor !== undefined &&
          data.floor !== null
            ? Number(data.floor)
            : null,
        status: data.status ?? "OCCUPIED",
        notes: data.notes ?? null,
      },
      {
        include: {
          residents: true,
        },
      }
    );
  }

  /**
   * Atualiza os campos enviados.
   *
   * Campos não informados não serão sobrescritos.
   */
  async updateById(
    id,
    condominiumId,
    data
  ) {
    const updateData = {};

    if (data.block !== undefined) {
      updateData.block =
        String(data.block).trim();
    }

    if (data.number !== undefined) {
      updateData.number =
        String(data.number).trim();
    }

    if (data.floor !== undefined) {
      updateData.floor =
        data.floor === null ||
        data.floor === ""
          ? null
          : Number(data.floor);
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.notes !== undefined) {
      updateData.notes =
        data.notes || null;
    }

    const result = await this.updateMany(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      updateData
    );

    if (result.count === 0) {
      return null;
    }

    return this.findById(
      id,
      condominiumId
    );
  }

  /**
   * Marca o apartamento como ocupado.
   */
  async markAsOccupied(id, condominiumId) {
    return this.changeStatus(
      id,
      condominiumId,
      "OCCUPIED"
    );
  }

  /**
   * Marca o apartamento como desocupado.
   */
  async markAsVacant(id, condominiumId) {
    return this.changeStatus(
      id,
      condominiumId,
      "VACANT"
    );
  }

  /**
   * Coloca o apartamento em manutenção.
   */
  async markAsMaintenance(
    id,
    condominiumId
  ) {
    return this.changeStatus(
      id,
      condominiumId,
      "MAINTENANCE"
    );
  }

  /**
   * Desativa o apartamento.
   */
  async deactivate(id, condominiumId) {
    return this.changeStatus(
      id,
      condominiumId,
      "INACTIVE"
    );
  }

  /**
   * Ativa novamente um apartamento.
   *
   * Como não existe status ACTIVE, ele retorna
   * ao estado OCCUPIED por padrão.
   */
  async activate(
    id,
    condominiumId,
    status = "OCCUPIED"
  ) {
    if (
      ![
        "OCCUPIED",
        "VACANT",
        "MAINTENANCE",
      ].includes(status)
    ) {
      status = "OCCUPIED";
    }

    return this.changeStatus(
      id,
      condominiumId,
      status
    );
  }

  /**
   * Método interno para alteração de status.
   */
  async changeStatus(
    id,
    condominiumId,
    status
  ) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        status,
      }
    );

    if (result.count === 0) {
      return null;
    }

    return this.findById(
      id,
      condominiumId
    );
  }

  /**
   * Realiza exclusão lógica.
   *
   * O apartamento permanece no banco para preservar
   * vínculos com moradores, visitantes, reservas,
   * encomendas e ocorrências.
   */
  async softDelete(id, condominiumId) {
    const result = await this.updateMany(
      {
        id,
        condominiumId,
        deletedAt: null,
      },
      {
        status: "INACTIVE",
        deletedAt: new Date(),
      }
    );

    return result.count > 0;
  }

  /**
   * Conta todos os apartamentos cadastrados.
   */
  async countByCondominium(condominiumId) {
    return this.count({
      condominiumId,
      deletedAt: null,
    });
  }

  /**
   * Conta apartamentos por status.
   */
  async countByStatus(
    condominiumId,
    status
  ) {
    return this.count({
      condominiumId,
      status,
      deletedAt: null,
    });
  }
}

export default new ApartmentRepository();