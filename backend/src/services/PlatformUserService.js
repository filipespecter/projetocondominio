import userRepository from "../repositories/UserRepository.js";
import Password from "../utils/Password.js";
import AuditLogService from "./AuditLogService.js";
import { ApiError } from "../utils/ApiError.js";
import prisma from "../config/prisma.js";

/**
 * =====================================================
 * PLATFORM USER SERVICE
 * =====================================================
 *
 * Gestão global de usuários realizada exclusivamente
 * pela Central Star Infinity Code.
 */
class PlatformUserService {
  validatePlatformAdmin(
    platformAdmin
  ) {
    if (
      !platformAdmin?.id ||
      ![
        "PLATFORM_OWNER",
        "PLATFORM_ADMIN",
        "PLATFORM_SUPPORT",
      ].includes(
        platformAdmin.role
      )
    ) {
      throw new ApiError(
        "Acesso restrito à Central Star.",
        403
      );
    }
  }

  validateCanCreatePlatformUser(
    actor,
    targetRole
  ) {
    if (
      actor.role ===
      "PLATFORM_OWNER"
    ) {
      if (
        ![
          "PLATFORM_ADMIN",
          "PLATFORM_SUPPORT",
        ].includes(targetRole)
      ) {
        throw new ApiError(
          "O proprietário pode criar somente PLATFORM_ADMIN ou PLATFORM_SUPPORT por esta rota.",
          403
        );
      }

      return;
    }

    if (
      actor.role ===
      "PLATFORM_ADMIN" &&
      targetRole ===
        "PLATFORM_SUPPORT"
    ) {
      return;
    }

    throw new ApiError(
      "Você não possui permissão para criar este nível de usuário da plataforma.",
      403
    );
  }

  validateCanManageTarget(
    actor,
    target
  ) {
    const platformRoles = [
      "PLATFORM_OWNER",
      "PLATFORM_ADMIN",
      "PLATFORM_SUPPORT",
    ];

    if (
      !platformRoles.includes(
        target.role
      )
    ) {
      return;
    }

    if (
      target.role ===
      "PLATFORM_OWNER"
    ) {
      throw new ApiError(
        "A conta PLATFORM_OWNER não pode ser alterada por este recurso.",
        403
      );
    }

    if (
      actor.role ===
      "PLATFORM_OWNER"
    ) {
      return;
    }

    if (
      actor.role ===
        "PLATFORM_ADMIN" &&
      target.role ===
        "PLATFORM_SUPPORT"
    ) {
      return;
    }

    throw new ApiError(
      "Você não possui permissão para alterar este usuário interno.",
      403
    );
  }

  normalizeRole(role) {
    if (!role) {
      return null;
    }

    const normalized =
      String(role)
        .trim()
        .toUpperCase();

    const allowed = [
      "PLATFORM_OWNER",
      "PLATFORM_ADMIN",
      "PLATFORM_SUPPORT",
      "CONDOMINIUM_ADMIN",
      "MANAGER",
      "DOORMAN",
      "RESIDENT",
    ];

    if (
      !allowed.includes(
        normalized
      )
    ) {
      throw new ApiError(
        "Perfil de usuário inválido.",
        400
      );
    }

    return normalized;
  }

  normalizeStatus(status) {
    if (!status) {
      return null;
    }

    const normalized =
      String(status)
        .trim()
        .toUpperCase();

    const allowed = [
      "ACTIVE",
      "INACTIVE",
      "BLOCKED",
      "PENDING",
    ];

    if (
      !allowed.includes(
        normalized
      )
    ) {
      throw new ApiError(
        "Status de usuário inválido.",
        400
      );
    }

    return normalized;
  }

  normalizeDate(
    value,
    endOfDay = false
  ) {
    if (!value) {
      return null;
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      throw new ApiError(
        "Data de filtro inválida.",
        400
      );
    }

    if (endOfDay) {
      date.setHours(
        23,
        59,
        59,
        999
      );
    } else {
      date.setHours(
        0,
        0,
        0,
        0
      );
    }

    return date;
  }

  normalizeFilters(
    query = {}
  ) {
    return {
      search:
        query.search
          ? String(
              query.search
            ).trim()
          : "",

      condominiumId:
        query.condominiumId
          ? String(
              query.condominiumId
            ).trim()
          : null,

      role:
        this.normalizeRole(
          query.role
        ),

      status:
        this.normalizeStatus(
          query.status
        ),

      createdFrom:
        this.normalizeDate(
          query.createdFrom
        ),

      createdTo:
        this.normalizeDate(
          query.createdTo,
          true
        ),

      page:
        Math.max(
          Number(
            query.page
          ) || 1,
          1
        ),

      limit:
        Math.min(
          Math.max(
            Number(
              query.limit
            ) || 20,
            1
          ),
          100
        ),

      sortBy:
        query.sortBy
          ? String(
              query.sortBy
            ).trim()
          : "createdAt",

      sortOrder:
        String(
          query.sortOrder ??
          "desc"
        )
          .trim()
          .toLowerCase() ===
        "asc"
          ? "asc"
          : "desc",
    };
  }

  sanitize(user) {
    if (!user) {
      return null;
    }

    const safe = {
      ...user,
    };

    delete safe.passwordHash;

    return safe;
  }

  async createPlatformUser(
    data,
    actor,
    requestContext = null
  ) {
    this.validatePlatformAdmin(
      actor
    );

    const role =
      String(
        data.role ?? ""
      )
        .trim()
        .toUpperCase();

    this.validateCanCreatePlatformUser(
      actor,
      role
    );

    const name =
      String(
        data.name ?? ""
      ).trim();

    const username =
      String(
        data.username ?? ""
      )
        .trim()
        .toLowerCase();

    const email =
      data.email
        ? String(
            data.email
          )
            .trim()
            .toLowerCase()
        : null;

    if (name.length < 2) {
      throw new ApiError(
        "Nome inválido.",
        400
      );
    }

    if (
      username.length < 3 ||
      username.length > 50 ||
      !/^[a-z0-9._-]+$/.test(
        username
      )
    ) {
      throw new ApiError(
        "Username inválido.",
        400
      );
    }

    if (
      !data.password ||
      String(
        data.password
      ).length < 8
    ) {
      throw new ApiError(
        "A senha temporária deve possuir pelo menos 8 caracteres.",
        400
      );
    }

    const phone = data.phone
      ? String(data.phone).replace(/\D/g, "")
      : null;

    const document = data.document
      ? String(data.document).replace(/\D/g, "")
      : null;

    const platformStartDate = data.platformStartDate
      ? new Date(data.platformStartDate)
      : null;

    const existingUsername =
      await userRepository
        .findByUsername(
          username,
          null
        );

    if (existingUsername) {
      throw new ApiError(
        "Este username já está sendo utilizado na plataforma.",
        409
      );
    }

    if (email) {
      const existingEmail =
        await userRepository
          .findByEmail(
            email,
            null
          );

      if (existingEmail) {
        throw new ApiError(
          "Este e-mail já está sendo utilizado na plataforma.",
          409
        );
      }
    }

    const passwordHash =
      await Password.hash(
        String(
          data.password
        )
      );

    const created =
      await userRepository
        .createPlatformUser({
          name,
          username,
          email,
          phone,
          document,
          platformEmployeeCode:
            data.platformEmployeeCode || null,
          platformJobTitle:
            data.platformJobTitle || null,
          platformDepartment:
            data.platformDepartment || null,
          platformEmploymentType:
            data.platformEmploymentType || null,
          platformStartDate,
          platformNotes:
            data.platformNotes || null,
          passwordHash,
          role,
          status:
            data.status ??
            "ACTIVE",
          mustChangePassword:
            data.mustChangePassword ??
            true,
        });

    await AuditLogService
      .logCreate({
        condominiumId:
          null,

        user:
          actor,

        module:
          "PLATFORM_USER",

        referenceId:
          created.id,

        afterData:
          created,

        details:
          `Usuário interno ${role} criado pela Central Star.`,

        requestContext,
      });

    return this.sanitize(
      created
    );
  }

  async list(
    query = {},
    platformAdmin
  ) {
    this.validatePlatformAdmin(
      platformAdmin
    );

    const filters =
      this.normalizeFilters(
        query
      );

    const [
      items,
      total,
    ] = await Promise.all([
      userRepository
        .findPlatformPage(
          filters
        ),

      userRepository
        .countPlatform(
          filters
        ),
    ]);

    const totalPages =
      Math.max(
        Math.ceil(
          total /
          filters.limit
        ),
        1
      );

    return {
      items:
        items.map(
          (item) =>
            this.sanitize(
              item
            )
        ),

      pagination: {
        page:
          filters.page,

        limit:
          filters.limit,

        total,

        totalPages,

        hasPreviousPage:
          filters.page > 1,

        hasNextPage:
          filters.page <
          totalPages,
      },
    };
  }

  async findById(
    id,
    platformAdmin
  ) {
    this.validatePlatformAdmin(
      platformAdmin
    );

    const user =
      await userRepository.findById(
        id
      );

    if (!user) {
      throw new ApiError(
        "Usuário não encontrado.",
        404
      );
    }

    return this.sanitize(
      user
    );
  }

  /**
   * Atualização administrativa de dados básicos.
   *
   * PLATFORM_ADMIN não é alterado por este endpoint.
   */
  async update(
    id,
    data,
    platformAdmin,
    requestContext = null
  ) {
    this.validatePlatformAdmin(
      platformAdmin
    );

    const before =
      await userRepository.findById(
        id
      );

    if (!before) {
      throw new ApiError(
        "Usuário não encontrado.",
        404
      );
    }

    this.validateCanManageTarget(
      platformAdmin,
      before
    );

    const updateData = {};

    if (
      data.name !== undefined
    ) {
      const name =
        String(
          data.name
        ).trim();

      if (
        name.length < 2
      ) {
        throw new ApiError(
          "Nome inválido.",
          400
        );
      }

      updateData.name =
        name;
    }

    if (
      data.username !==
      undefined
    ) {
      const username =
        String(
          data.username
        )
          .trim()
          .toLowerCase();

      if (
        username.length < 3 ||
        username.length > 50
      ) {
        throw new ApiError(
          "O username deve possuir entre 3 e 50 caracteres.",
          400
        );
      }

      if (
        !/^[a-z0-9._-]+$/.test(
          username
        )
      ) {
        throw new ApiError(
          "Username inválido.",
          400
        );
      }

      const existing =
        await userRepository
          .findByUsername(
            username,
            before.condominiumId
          );

      if (
        existing &&
        existing.id !== id
      ) {
        throw new ApiError(
          "Este username já está sendo utilizado neste condomínio.",
          409
        );
      }

      updateData.username =
        username;
    }

    if (
      data.email !== undefined
    ) {
      const email =
        data.email
          ? String(
              data.email
            )
              .trim()
              .toLowerCase()
          : null;

      if (email) {
        const existing =
          await userRepository
            .findByEmail(
              email,
              before.condominiumId
            );

        if (
          existing &&
          existing.id !== id
        ) {
          throw new ApiError(
            "Este e-mail já está sendo utilizado neste condomínio.",
            409
          );
        }
      }

      updateData.email =
        email;
    }

    if (
      data.phone !== undefined
    ) {
      updateData.phone =
        data.phone
          ? String(data.phone).replace(/\D/g, "")
          : null;
    }

    if (data.document !== undefined) {
      updateData.document = data.document
        ? String(data.document).replace(/\D/g, "")
        : null;
    }

    for (const field of [
      "platformEmployeeCode",
      "platformJobTitle",
      "platformDepartment",
      "platformEmploymentType",
      "platformNotes",
    ]) {
      if (data[field] !== undefined) {
        updateData[field] = data[field] || null;
      }
    }

    if (data.platformStartDate !== undefined) {
      updateData.platformStartDate = data.platformStartDate
        ? new Date(data.platformStartDate)
        : null;
    }

    if (data.role !== undefined) {
      const nextRole = String(data.role).trim().toUpperCase();

      if (platformAdmin.role !== "PLATFORM_OWNER") {
        throw new ApiError(
          "Somente o PLATFORM_OWNER pode alterar o nível de permissão de um colaborador.",
          403
        );
      }

      if (!["PLATFORM_ADMIN", "PLATFORM_SUPPORT"].includes(nextRole)) {
        throw new ApiError(
          "Perfil interno inválido.",
          400
        );
      }

      updateData.role = nextRole;
    }

    if (
      Object.keys(
        updateData
      ).length === 0
    ) {
      throw new ApiError(
        "Nenhum dado válido foi informado.",
        400
      );
    }

    const updated =
      await userRepository
        .updatePlatformManagedUser(
          id,
          updateData
        );

    if (!updated) {
      throw new ApiError(
        "Não foi possível atualizar o usuário.",
        409
      );
    }

    await AuditLogService
      .logUpdate({
        condominiumId:
          before.condominiumId,

        user:
          platformAdmin,

        module:
          "PLATFORM_USER",

        referenceId:
          id,

        beforeData:
          before,

        afterData:
          updated,

        details:
          "Usuário alterado pela Central Star.",

        requestContext,
      });

    return this.sanitize(
      updated
    );
  }

  async changeStatus(
    id,
    status,
    platformAdmin,
    requestContext = null
  ) {
    this.validatePlatformAdmin(
      platformAdmin
    );

    const normalizedStatus =
      this.normalizeStatus(
        status
      );

    const before =
      await userRepository.findById(
        id
      );

    if (!before) {
      throw new ApiError(
        "Usuário não encontrado.",
        404
      );
    }

    this.validateCanManageTarget(
      platformAdmin,
      before
    );

    if (
      before.status ===
      normalizedStatus
    ) {
      throw new ApiError(
        "O usuário já possui este status.",
        409
      );
    }

    const updated =
      await userRepository
        .changePlatformManagedStatus(
          id,
          normalizedStatus
        );

    if (!updated) {
      throw new ApiError(
        "Não foi possível alterar o status do usuário.",
        409
      );
    }

    await AuditLogService
      .logStatusChange({
        condominiumId:
          before.condominiumId,

        user:
          platformAdmin,

        module:
          "PLATFORM_USER",

        referenceId:
          id,

        previousStatus:
          before.status,

        newStatus:
          normalizedStatus,

        details:
          "Status do usuário alterado pela Central Star.",

        requestContext,
      });

    return this.sanitize(
      updated
    );
  }

  async resetPassword(
    id,
    newPassword,
    platformAdmin,
    requestContext = null
  ) {
    this.validatePlatformAdmin(
      platformAdmin
    );

    const before =
      await userRepository.findById(
        id
      );

    if (!before) {
      throw new ApiError(
        "Usuário não encontrado.",
        404
      );
    }

    this.validateCanManageTarget(
      platformAdmin,
      before
    );

    if (
      !newPassword ||
      String(
        newPassword
      ).length < 8
    ) {
      throw new ApiError(
        "A nova senha deve possuir pelo menos 8 caracteres.",
        400
      );
    }

    const passwordHash =
      await Password.hash(
        String(
          newPassword
        )
      );

    const updated =
      await userRepository
        .updatePassword(
          id,
          passwordHash,
          true
        );

    await AuditLogService
      .createLog({
        condominiumId:
          before.condominiumId,

        userId:
          platformAdmin.id,

        userName:
          platformAdmin.name,

        userRole:
          platformAdmin.role,

        action:
          "PASSWORD_RESET",

        module:
          "PLATFORM_USER",

        details:
          "Senha redefinida pela Central Star. Troca obrigatória no próximo acesso.",

        referenceId:
          id,

        ipAddress:
          requestContext?.ipAddress ??
          null,

        userAgent:
          requestContext?.userAgent ??
          null,
      });

    return this.sanitize(
      updated
    );
  }

  async profile(
    id,
    platformAdmin
  ) {
    this.validatePlatformAdmin(platformAdmin);

    const user = await userRepository.findById(id);

    if (!user) {
      throw new ApiError("Usuário não encontrado.", 404);
    }

    const platformRoles = [
      "PLATFORM_OWNER",
      "PLATFORM_ADMIN",
      "PLATFORM_SUPPORT",
    ];

    if (!platformRoles.includes(user.role)) {
      throw new ApiError(
        "Este recurso é exclusivo para colaboradores internos da Star Infinity Code.",
        404
      );
    }

    const [
      auditLogs,
      supportSessions,
      auditCount,
      supportCount,
    ] = await Promise.all([
      prisma.auditLog.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 40,
        select: {
          id: true,
          action: true,
          module: true,
          details: true,
          referenceId: true,
          requestId: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
          condominium: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      }),
      prisma.supportSession.findMany({
        where: { platformAdminUserId: id },
        orderBy: { startedAt: "desc" },
        take: 30,
        select: {
          id: true,
          status: true,
          reason: true,
          startedAt: true,
          lastActivityAt: true,
          endedAt: true,
          condominium: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      }),
      prisma.auditLog.count({
        where: { userId: id },
      }),
      prisma.supportSession.count({
        where: { platformAdminUserId: id },
      }),
    ]);

    const startDate =
      user.platformStartDate ?? user.createdAt;

    const companyTimeMs =
      Math.max(
        Date.now() -
          new Date(startDate).getTime(),
        0
      );

    const companyDays =
      Math.floor(
        companyTimeMs /
          (1000 * 60 * 60 * 24)
      );

    return {
      user: this.sanitize(user),
      summary: {
        companyDays,
        auditCount,
        supportCount,
        lastLoginAt:
          user.lastLoginAt ?? null,
        lastLogoutAt:
          user.lastLogoutAt ?? null,
      },
      auditLogs,
      supportSessions,
    };
  }

  async statistics(
    platformAdmin
  ) {
    this.validatePlatformAdmin(
      platformAdmin
    );

    const [
      total,
      active,
      inactive,
      blocked,
      pending,
      condominiumAdmins,
      managers,
      doormen,
      residents,
    ] = await Promise.all([
      userRepository
        .countPlatform(),

      userRepository
        .countGlobalByStatus(
          "ACTIVE"
        ),

      userRepository
        .countGlobalByStatus(
          "INACTIVE"
        ),

      userRepository
        .countGlobalByStatus(
          "BLOCKED"
        ),

      userRepository
        .countGlobalByStatus(
          "PENDING"
        ),

      userRepository
        .countGlobalByRole(
          "CONDOMINIUM_ADMIN"
        ),

      userRepository
        .countGlobalByRole(
          "MANAGER"
        ),

      userRepository
        .countGlobalByRole(
          "DOORMAN"
        ),

      userRepository
        .countGlobalByRole(
          "RESIDENT"
        ),
    ]);

    return {
      total,

      byStatus: {
        active,
        inactive,
        blocked,
        pending,
      },

      byRole: {
        condominiumAdmins,
        managers,
        doormen,
        residents,
      },
    };
  }
}

export default new PlatformUserService();
