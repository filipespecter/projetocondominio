import JobRegistryService from "../services/JobRegistryService.js";
import SchedulerService from "../services/SchedulerService.js";
import BackupService from "../services/BackupService.js";
import { ApiError } from "../utils/ApiError.js";
import DatabaseAdminService from "../services/DatabaseAdminService.js";

class PlatformOperationsController {
  async jobs(
    req,
    res,
    next
  ) {
    try {
      return res.status(200).json({
        success: true,

        message:
          "Jobs carregados com sucesso.",

        data: {
          scheduler:
            SchedulerService
              .status(),

          jobs:
            JobRegistryService
              .list(),
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  async executeJob(
    req,
    res,
    next
  ) {
    try {
      const name =
        String(
          req.params.name ??
          ""
        )
          .trim()
          .toUpperCase();

      if (!name) {
        throw new ApiError(
          "Nome do job é obrigatório.",
          400
        );
      }

      const registeredJob =
        JobRegistryService
          .find(name);

      if (!registeredJob) {
        throw new ApiError(
          "Job não encontrado.",
          404
        );
      }

      const result =
        await JobRegistryService
          .execute(
            name,
            {
              force:
                true,

              source:
                "PLATFORM_ADMIN",
            }
          );

      return res.status(200).json({
        success: true,

        message:
          result.success ===
          false
            ? "Job executado com falha."
            : "Job executado com sucesso.",

        data:
          result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async enableJob(
    req,
    res,
    next
  ) {
    try {
      const result =
        JobRegistryService
          .enable(
            req.params.name
          );

      if (!result) {
        throw new ApiError(
          "Job não encontrado.",
          404
        );
      }

      return res.status(200).json({
        success: true,

        message:
          "Job habilitado com sucesso.",

        data:
          result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async disableJob(
    req,
    res,
    next
  ) {
    try {
      const result =
        JobRegistryService
          .disable(
            req.params.name
          );

      if (!result) {
        throw new ApiError(
          "Job não encontrado.",
          404
        );
      }

      return res.status(200).json({
        success: true,

        message:
          "Job desabilitado com sucesso.",

        data:
          result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async backups(
    req,
    res,
    next
  ) {
    try {
      const limit =
        Number(
          req.query.limit ??
          50
        );

      const [
        items,
        statistics,
      ] = await Promise.all([
        BackupService
          .listRecent(
            limit
          ),

        BackupService
          .statistics(),
      ]);

      return res.status(200).json({
        success: true,

        message:
          "Backups carregados com sucesso.",

        data: {
          statistics,
          items,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  async createBackup(
    req,
    res,
    next
  ) {
    try {
      const backup =
        await BackupService
          .createBackup({
            trigger:
              "MANUAL",

            createdByUserId:
              req.user.id,

            metadata: {
              source:
                "PLATFORM_ADMIN",
              requestId:
                req.requestId ??
                null,
            },
          });

      return res.status(201).json({
        success: true,

        message:
          "Backup manual concluído com sucesso.",

        data:
          backup,
      });
    } catch (error) {
      return next(error);
    }
  }

  async databaseOverview(req, res, next) {
    try {
      const data = await DatabaseAdminService.overview(req.user);
      return res.status(200).json({ success: true, message: "Visão do ambiente carregada com sucesso.", data });
    } catch (error) { return next(error); }
  }

  async resetHomologation(req, res, next) {
    try {
      const data = await DatabaseAdminService.resetHomologation({
        confirmation: req.body?.confirmation, user: req.user,
        requestContext: { requestId: req.requestId ?? null, ipAddress: req.ip ?? null, userAgent: req.headers["user-agent"] ?? null },
      });
      return res.status(200).json({ success: true, message: "Ambiente de homologação zerado com sucesso.", data });
    } catch (error) { return next(error); }
  }

  async cleanupBackups(
    req,
    res,
    next
  ) {
    try {
      const result =
        await BackupService
          .cleanupExpired();

      return res.status(200).json({
        success: true,

        message:
          "Limpeza de backups processada com sucesso.",

        data:
          result,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default new PlatformOperationsController();
