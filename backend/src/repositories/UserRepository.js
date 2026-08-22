import BaseRepository from "./BaseRepository.js";

class UserRepository extends BaseRepository {
  constructor() {
    super("user");
  }

  /**
   * =====================================================
   * CONSULTAS PADRÃO
   * =====================================================
   */

  get defaultInclude() {
    return {
      condominium: true,

      resident: {
        include: {
          apartment: true,
        },
      },

      doorman: true,
    };
  }

  async findById(id, condominiumId = null) {
    const where = {
      id,
      deletedAt: null,
    };

    if (condominiumId) {
      where.condominiumId =
        condominiumId;
    }

    return this.findFirst(
      where,
      {
        include:
          this.defaultInclude,
      }
    );
  }

  async findByUsername(
    username,
    condominiumId
  ) {
    return this.findFirst(
      {
        condominiumId,

        username:
          String(username)
            .trim()
            .toLowerCase(),

        deletedAt:
          null,
      },
      {
        include:
          this.defaultInclude,
      }
    );
  }

  async findByEmail(
    email,
    condominiumId
  ) {
    return this.findFirst(
      {
        condominiumId,

        email:
          String(email)
            .trim()
            .toLowerCase(),

        deletedAt:
          null,
      },
      {
        include:
          this.defaultInclude,
      }
    );
  }

  async findPlatformUserByUsername(
    username
  ) {
    return this.findFirst(
      {
        condominiumId:
          null,

        username:
          String(username)
            .trim()
            .toLowerCase(),

        role: {
          in: [
            "PLATFORM_OWNER",
            "PLATFORM_ADMIN",
            "PLATFORM_SUPPORT",
          ],
        },

        deletedAt:
          null,
      },
      {
        include:
          this.defaultInclude,
      }
    );
  }

  /**
   * Alias temporário para compatibilidade com código
   * anterior ao Bloco 10.1-B.
   */
  async findPlatformAdminByUsername(
    username
  ) {
    return this.findPlatformUserByUsername(
      username
    );
  }

  async findByCondominium(
    condominiumId
  ) {
    return this.findMany(
      {
        condominiumId,
        deletedAt:
          null,
      },
      {
        include:
          this.defaultInclude,

        orderBy: {
          name:
            "asc",
        },
      }
    );
  }

  async findByRole(
    condominiumId,
    role
  ) {
    return this.findMany(
      {
        condominiumId,
        role,
        deletedAt:
          null,
      },
      {
        include:
          this.defaultInclude,

        orderBy: {
          name:
            "asc",
        },
      }
    );
  }

  async findActiveByRole(
    condominiumId,
    role
  ) {
    return this.findMany(
      {
        condominiumId,
        role,
        status:
          "ACTIVE",

        deletedAt:
          null,
      },
      {
        orderBy: {
          name:
            "asc",
        },
      }
    );
  }

  /**
   * =====================================================
   * CENTRAL STAR - CONSULTA GLOBAL
   * =====================================================
   */

  buildPlatformWhere(
    filters = {}
  ) {
    const where = {
      deletedAt:
        null,
    };

    if (
      filters.condominiumId
    ) {
      where.condominiumId =
        filters.condominiumId;
    }

    if (filters.role) {
      where.role =
        filters.role;
    }

    if (filters.status) {
      where.status =
        filters.status;
    }

    const search =
      String(
        filters.search ?? ""
      ).trim();

    if (search) {
      where.OR = [
        {
          name: {
            contains:
              search,

            mode:
              "insensitive",
          },
        },

        {
          username: {
            contains:
              search,

            mode:
              "insensitive",
          },
        },

        {
          email: {
            contains:
              search,

            mode:
              "insensitive",
          },
        },

        {
          phone: {
            contains:
              search,
          },
        },

        {
          condominium: {
            is: {
              name: {
                contains:
                  search,

                mode:
                  "insensitive",
              },
            },
          },
        },

        {
          condominium: {
            is: {
              code: {
                contains:
                  search.toUpperCase(),

                mode:
                  "insensitive",
              },
            },
          },
        },
      ];
    }

    if (
      filters.createdFrom ||
      filters.createdTo
    ) {
      where.createdAt = {};

      if (
        filters.createdFrom
      ) {
        where.createdAt.gte =
          filters.createdFrom;
      }

      if (
        filters.createdTo
      ) {
        where.createdAt.lte =
          filters.createdTo;
      }
    }

    return where;
  }

  async findPlatformPage(
    filters = {}
  ) {
    const where =
      this.buildPlatformWhere(
        filters
      );

    const page =
      Math.max(
        Number(
          filters.page
        ) || 1,
        1
      );

    const limit =
      Math.min(
        Math.max(
          Number(
            filters.limit
          ) || 20,
          1
        ),
        100
      );

    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "name",
      "username",
      "lastLoginAt",
      "status",
      "role",
    ];

    const sortBy =
      allowedSortFields.includes(
        filters.sortBy
      )
        ? filters.sortBy
        : "createdAt";

    const sortOrder =
      filters.sortOrder ===
      "asc"
        ? "asc"
        : "desc";

    return this.findMany(
      where,
      {
        select: {
          id:
            true,

          condominiumId:
            true,

          name:
            true,

          username:
            true,

          email:
            true,

          phone:
            true,

          document:
            true,

          platformEmployeeCode:
            true,

          platformJobTitle:
            true,

          platformDepartment:
            true,

          platformEmploymentType:
            true,

          platformStartDate:
            true,

          platformNotes:
            true,

          role:
            true,

          status:
            true,

          mustChangePassword:
            true,

          failedLoginAttempts:
            true,

          lockedUntil:
            true,

          lastLoginAt:
            true,

          lastLogoutAt:
            true,

          passwordChangedAt:
            true,

          createdAt:
            true,

          updatedAt:
            true,

          condominium: {
            select: {
              id:
                true,

              code:
                true,

              name:
                true,

              status:
                true,
            },
          },

          resident: {
            select: {
              id:
                true,

              apartment: {
                select: {
                  id:
                    true,

                  number:
                    true,

                  block:
                    true,
                },
              },
            },
          },

          doorman: {
            select: {
              id:
                true,
            },
          },
        },

        orderBy: {
          [sortBy]:
            sortOrder,
        },

        skip:
          (page - 1) *
          limit,

        take:
          limit,
      }
    );
  }

  async countPlatform(
    filters = {}
  ) {
    return this.count(
      this.buildPlatformWhere(
        filters
      )
    );
  }

  async countGlobalByRole(
    role
  ) {
    return this.count({
      role,
      deletedAt:
        null,
    });
  }

  async countGlobalByStatus(
    status
  ) {
    return this.count({
      status,
      deletedAt:
        null,
    });
  }

  /**
   * =====================================================
   * CRIAÇÃO / ALTERAÇÃO
   * =====================================================
   */

  async createPlatformUser(
    data
  ) {
    return this.create(
      {
        condominiumId:
          null,

        name:
          data.name,

        username:
          String(
            data.username
          )
            .trim()
            .toLowerCase(),

        email:
          data.email
            ? String(
                data.email
              )
                .trim()
                .toLowerCase()
            : null,

        phone:
          data.phone ?? null,

        document:
          data.document ?? null,

        platformEmployeeCode:
          data.platformEmployeeCode ?? null,

        platformJobTitle:
          data.platformJobTitle ?? null,

        platformDepartment:
          data.platformDepartment ?? null,

        platformEmploymentType:
          data.platformEmploymentType ?? null,

        platformStartDate:
          data.platformStartDate ?? null,

        platformNotes:
          data.platformNotes ?? null,

        passwordHash:
          data.passwordHash,

        role:
          data.role,

        status:
          data.status ?? "ACTIVE",

        mustChangePassword:
          data.mustChangePassword ?? true,
      },
      {
        include:
          this.defaultInclude,
      }
    );
  }

  async createForCondominium(
    condominiumId,
    data
  ) {
    return this.create({
      condominiumId,

      name:
        data.name,

      username:
        String(
          data.username
        )
          .trim()
          .toLowerCase(),

      email:
        data.email
          ? String(
              data.email
            )
              .trim()
              .toLowerCase()
          : null,

      phone:
        data.phone ??
        null,

      passwordHash:
        data.passwordHash,

      role:
        data.role,

      status:
        data.status ??
        "ACTIVE",

      mustChangePassword:
        data.mustChangePassword ??
        true,
    });
  }

  async updateById(
    id,
    condominiumId,
    data
  ) {
    const updateData = {};

    if (
      data.name !== undefined
    ) {
      updateData.name =
        data.name;
    }

    if (
      data.username !==
      undefined
    ) {
      updateData.username =
        String(
          data.username
        )
          .trim()
          .toLowerCase();
    }

    if (
      data.email !== undefined
    ) {
      updateData.email =
        data.email
          ? String(
              data.email
            )
              .trim()
              .toLowerCase()
          : null;
    }

    if (
      data.phone !== undefined
    ) {
      updateData.phone =
        data.phone;
    }

    if (
      data.role !== undefined
    ) {
      updateData.role =
        data.role;
    }

    if (
      data.status !== undefined
    ) {
      updateData.status =
        data.status;
    }

    if (
      data.mustChangePassword !==
      undefined
    ) {
      updateData.mustChangePassword =
        data.mustChangePassword;
    }

    const result =
      await this.updateMany(
        {
          id,
          condominiumId,
          deletedAt:
            null,
        },
        updateData
      );

    if (
      result.count === 0
    ) {
      return null;
    }

    return this.findById(
      id,
      condominiumId
    );
  }

  /**
   * Alteração global utilizada exclusivamente pela
   * Central Star.
   *
   * Não exige condominiumId no WHERE porque a própria
   * camada PLATFORM_ADMIN valida o escopo antes.
   */
  async updatePlatformManagedUser(
    id,
    data
  ) {
    const updateData = {};

    if (
      data.name !== undefined
    ) {
      updateData.name =
        data.name;
    }

    if (
      data.username !==
      undefined
    ) {
      updateData.username =
        String(
          data.username
        )
          .trim()
          .toLowerCase();
    }

    if (
      data.email !== undefined
    ) {
      updateData.email =
        data.email
          ? String(
              data.email
            )
              .trim()
              .toLowerCase()
          : null;
    }

    if (
      data.phone !== undefined
    ) {
      updateData.phone =
        data.phone;
    }

    for (const field of [
      "document",
      "platformEmployeeCode",
      "platformJobTitle",
      "platformDepartment",
      "platformEmploymentType",
      "platformStartDate",
      "platformNotes",
      "role",
    ]) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    if (
      data.status !== undefined
    ) {
      updateData.status =
        data.status;
    }

    if (
      data.mustChangePassword !==
      undefined
    ) {
      updateData.mustChangePassword =
        data.mustChangePassword;
    }

    const result =
      await this.updateMany(
        {
          id,

          role: {
            not:
              "PLATFORM_OWNER",
          },

          deletedAt:
            null,
        },
        updateData
      );

    if (
      result.count === 0
    ) {
      return null;
    }

    return this.findById(
      id
    );
  }

  /**
   * =====================================================
   * LOGIN / SENHA
   * =====================================================
   */

  async registerSuccessfulLogin(
    id
  ) {
    return this.update(
      { id },
      {
        lastLoginAt:
          new Date(),

        failedLoginAttempts:
          0,

        lockedUntil:
          null,
      }
    );
  }

  async registerFailedLogin(
    id
  ) {
    return this.model.update({
      where: {
        id,
      },

      data: {
        failedLoginAttempts: {
          increment:
            1,
        },
      },
    });
  }

  async lockUntil(
    id,
    lockedUntil
  ) {
    return this.update(
      { id },
      {
        lockedUntil,
      }
    );
  }

  async registerLogout(id) {
    return this.update(
      { id },
      {
        lastLogoutAt:
          new Date(),
      }
    );
  }

  async updatePassword(
    id,
    passwordHash,
    mustChangePassword = false
  ) {
    return this.update(
      { id },
      {
        passwordHash,

        mustChangePassword,

        passwordChangedAt:
          new Date(),

        failedLoginAttempts:
          0,

        lockedUntil:
          null,
      }
    );
  }

  /**
   * =====================================================
   * STATUS
   * =====================================================
   */

  async activate(
    id,
    condominiumId
  ) {
    const result =
      await this.updateMany(
        {
          id,
          condominiumId,
          deletedAt:
            null,
        },
        {
          status:
            "ACTIVE",
        }
      );

    if (
      result.count === 0
    ) {
      return null;
    }

    return this.findById(
      id,
      condominiumId
    );
  }

  async deactivate(
    id,
    condominiumId
  ) {
    const result =
      await this.updateMany(
        {
          id,
          condominiumId,
          deletedAt:
            null,
        },
        {
          status:
            "INACTIVE",
        }
      );

    if (
      result.count === 0
    ) {
      return null;
    }

    return this.findById(
      id,
      condominiumId
    );
  }

  async block(
    id,
    condominiumId
  ) {
    const result =
      await this.updateMany(
        {
          id,
          condominiumId,
          deletedAt:
            null,
        },
        {
          status:
            "BLOCKED",
        }
      );

    if (
      result.count === 0
    ) {
      return null;
    }

    return this.findById(
      id,
      condominiumId
    );
  }

  async changePlatformManagedStatus(
    id,
    status
  ) {
    const result =
      await this.updateMany(
        {
          id,

          role: {
            not:
              "PLATFORM_OWNER",
          },

          deletedAt:
            null,
        },
        {
          status,
        }
      );

    if (
      result.count === 0
    ) {
      return null;
    }

    return this.findById(
      id
    );
  }

  /**
   * =====================================================
   * EXCLUSÃO LÓGICA
   * =====================================================
   */

  async softDelete(
    id,
    condominiumId
  ) {
    const result =
      await this.updateMany(
        {
          id,
          condominiumId,
          deletedAt:
            null,
        },
        {
          status:
            "INACTIVE",

          deletedAt:
            new Date(),
        }
      );

    return (
      result.count > 0
    );
  }
}

export default new UserRepository();
