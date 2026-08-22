import BaseRepository from "./BaseRepository.js";
import prisma from "../config/prisma.js";

class ApartmentRepository extends BaseRepository {
  constructor() {
    super("apartment");
  }

  /**
   * Dados seguros do usuário vinculado ao morador.
   *
   * Nunca retornar passwordHash, tentativas de login,
   * bloqueios ou outros campos sensíveis.
   */
  get safeUserSelect() {
    return {
      id: true,
      condominiumId: true,
      name: true,
      username: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      mustChangePassword: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    };
  }

  /**
   * Relações carregadas nas consultas de apartamento.
   */
  get defaultInclude() {
    return {
      residents: {
        where: {
          deletedAt: null,
        },
        include: {
          user: {
            select: this.safeUserSelect,
          },
        },
        orderBy: [
          {
            isPrimary: "desc",
          },
          {
            createdAt: "asc",
          },
        ],
      },
    };
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
        include: this.defaultInclude,
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
        include: this.defaultInclude,
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
   * Valores permitidos:
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
        include: this.defaultInclude,
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
   * Lista apartamentos disponíveis.
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
   * Utilizado pelo Service para impedir
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
   *
   * Um apartamento novo começa como VACANT,
   * salvo quando outro status válido for informado.
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
          data.floor !== null &&
          data.floor !== ""
            ? Number(data.floor)
            : null,
        status: data.status ?? "VACANT",
        notes:
          data.notes !== undefined &&
          data.notes !== null &&
          String(data.notes).trim() !== ""
            ? String(data.notes).trim()
            : null,
      },
      {
        include: this.defaultInclude,
      }
    );
  }

  /**
   * Atualiza somente os campos enviados.
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
        data.notes === null ||
        String(data.notes).trim() === ""
          ? null
          : String(data.notes).trim();
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
   * Conta moradores ativos vinculados ao apartamento.
   *
   * Um morador é considerado ativo quando:
   * - o vínculo Resident não foi excluído;
   * - o User não foi excluído;
   * - o User está com status ACTIVE.
   */
  async countActiveResidents(
    apartmentId,
    condominiumId
  ) {
    return prisma.resident.count({
      where: {
        apartmentId,
        condominiumId,
        deletedAt: null,
        user: {
          deletedAt: null,
          status: "ACTIVE",
        },
      },
    });
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
   * O status padrão de reativação é VACANT,
   * pois a ocupação depende de moradores ativos.
   */
  async activate(
    id,
    condominiumId,
    status = "VACANT"
  ) {
    if (
      ![
        "OCCUPIED",
        "VACANT",
        "MAINTENANCE",
      ].includes(status)
    ) {
      status = "VACANT";
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
   * A validação de moradores ativos é feita no Service
   * antes da execução deste método.
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
