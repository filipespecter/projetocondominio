import {
  createHash,
} from "node:crypto";

import {
  access,
  mkdir,
  rm,
  stat,
} from "node:fs/promises";

import {
  constants as fsConstants,
  createReadStream,
} from "node:fs";

import {
  join,
  resolve,
} from "node:path";

import {
  spawn,
} from "node:child_process";

import backupRepository from "../repositories/BackupRepository.js";
import { Logger } from "../utils/logger.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * =====================================================
 * BACKUP SERVICE
 * =====================================================
 *
 * Backup físico do PostgreSQL utilizando pg_dump.
 *
 * O banco NÃO é convertido para JSON.
 *
 * O dump é gerado no formato custom do PostgreSQL,
 * adequado para restauração via pg_restore.
 */
class BackupService {
  get backupDirectory() {
    return resolve(
      process.env
        .BACKUP_DIRECTORY ??
      "./backups"
    );
  }

  get pgDumpBinary() {
    return String(
      process.env
        .PG_DUMP_PATH ??
      "pg_dump"
    ).trim();
  }

  get retentionDays() {
    return Math.max(
      1,
      Number(
        process.env
          .BACKUP_RETENTION_DAYS ??
        30
      ) || 30
    );
  }

  sanitizeFileDate(
    date = new Date()
  ) {
    return date
      .toISOString()
      .replace(
        /[:.]/g,
        "-"
      );
  }

  buildFileName(
    date = new Date()
  ) {
    return `infinitycondo-${this.sanitizeFileDate(date)}.dump`;
  }

  async ensureDirectory() {
    await mkdir(
      this.backupDirectory,
      {
        recursive:
          true,
      }
    );

    await access(
      this.backupDirectory,
      fsConstants.W_OK
    );
  }

  async executePgDump({
    outputPath,
  }) {
    const databaseUrl =
      process.env
        .DATABASE_URL;

    if (!databaseUrl) {
      throw new ApiError(
        "DATABASE_URL não configurada.",
        500
      );
    }

    const args = [
      "--format=custom",
      "--no-owner",
      "--no-privileges",
      "--file",
      outputPath,
      databaseUrl,
    ];

    return new Promise(
      (
        resolvePromise,
        rejectPromise
      ) => {
        const child =
          spawn(
            this.pgDumpBinary,
            args,
            {
              stdio: [
                "ignore",
                "pipe",
                "pipe",
              ],

              windowsHide:
                true,
            }
          );

        let stderr =
          "";

        child.stderr.on(
          "data",
          (chunk) => {
            stderr +=
              chunk.toString();
          }
        );

        child.on(
          "error",
          (error) => {
            rejectPromise(
              new Error(
                `Não foi possível executar pg_dump: ${error.message}`
              )
            );
          }
        );

        child.on(
          "close",
          (code) => {
            if (code !== 0) {
              rejectPromise(
                new Error(
                  stderr.trim() ||
                  `pg_dump finalizou com código ${code}.`
                )
              );

              return;
            }

            resolvePromise({
              success:
                true,
            });
          }
        );
      }
    );
  }

  async calculateSha256(
    filePath
  ) {
    /**
     * Hash por streaming.
     *
     * Não carregamos o dump inteiro na memória,
     * porque em produção o banco poderá possuir
     * centenas de MB ou vários GB.
     */
    return new Promise(
      (
        resolvePromise,
        rejectPromise
      ) => {
        const hash =
          createHash(
            "sha256"
          );

        const stream =
          createReadStream(
            filePath
          );

        stream.on(
          "data",
          (chunk) => {
            hash.update(
              chunk
            );
          }
        );

        stream.on(
          "error",
          rejectPromise
        );

        stream.on(
          "end",
          () => {
            resolvePromise(
              hash.digest(
                "hex"
              )
            );
          }
        );
      }
    );
  }

  serializeBackup(
    backup
  ) {
    if (!backup) {
      return backup;
    }

    return {
      ...backup,

      /**
       * Prisma devolve BigInt para sizeBytes.
       * JSON/Express não serializa BigInt nativamente.
       *
       * String preserva o valor exato e evita erro
       * "Do not know how to serialize a BigInt".
       */
      sizeBytes:
        backup.sizeBytes ===
        null ||
        backup.sizeBytes ===
        undefined
          ? null
          : String(
              backup.sizeBytes
            ),
    };
  }

  async verifyFile(
    filePath,
    expectedChecksum
  ) {
    const fileStat =
      await stat(
        filePath
      );

    if (
      !fileStat.isFile() ||
      fileStat.size <= 0
    ) {
      return {
        valid:
          false,
        reason:
          "Arquivo de backup vazio ou inválido.",
      };
    }

    const checksum =
      await this
        .calculateSha256(
          filePath
        );

    if (
      expectedChecksum &&
      checksum !==
        expectedChecksum
    ) {
      return {
        valid:
          false,
        reason:
          "Checksum do backup não confere.",
        checksum,
      };
    }

    return {
      valid:
        true,
      checksum,
      sizeBytes:
        fileStat.size,
    };
  }

  async createBackup({
    trigger = "AUTOMATIC",
    createdByUserId = null,
    metadata = null,
  } = {}) {
    const startedAt =
      new Date();

    const retentionUntil =
      new Date(
        startedAt.getTime() +
        this.retentionDays *
          24 *
          60 *
          60 *
          1000
      );

    const record =
      await backupRepository
        .createPending({
          trigger,
          createdByUserId,
          retentionUntil,
          metadata,
        });

    let outputPath =
      null;

    try {
      await backupRepository
        .markRunning(
          record.id
        );

      await this
        .ensureDirectory();

      const fileName =
        this.buildFileName(
          startedAt
        );

      outputPath =
        join(
          this.backupDirectory,
          fileName
        );

      await this
        .executePgDump({
          outputPath,
        });

      const verification =
        await this.verifyFile(
          outputPath
        );

      if (!verification.valid) {
        throw new Error(
          verification.reason
        );
      }

      const success =
        await backupRepository
          .markSuccess(
            record.id,
            {
              storageProvider:
                "LOCAL_FILESYSTEM",
              storageKey:
                outputPath,
              fileName,
              sizeBytes:
                verification
                  .sizeBytes,
              checksumSha256:
                verification
                  .checksum,
              metadata: {
                ...(metadata ??
                  {}),
                format:
                  "POSTGRES_CUSTOM",
                createdAt:
                  startedAt,
              },
            }
          );

      const recheck =
        await this.verifyFile(
          outputPath,
          verification.checksum
        );

      if (!recheck.valid) {
        throw new Error(
          recheck.reason
        );
      }

      const verified =
        await backupRepository
          .markVerified(
            record.id
          );

      Logger.info(
        "Backup PostgreSQL concluído e verificado.",
        {
          backupId:
            record.id,
          fileName,
          sizeBytes:
            verification
              .sizeBytes,
        }
      );

      return this
        .serializeBackup(
          verified ??
          success
        );
    } catch (error) {
      await backupRepository
        .markFailed(
          record.id,
          error?.message ??
          "Falha ao gerar backup.",
          {
            outputPath,
          }
        );

      if (outputPath) {
        try {
          await rm(
            outputPath,
            {
              force: true,
            }
          );
        } catch {
          // falha de limpeza não substitui erro principal
        }
      }

      Logger.error(
        "Falha ao gerar backup PostgreSQL.",
        error
      );

      throw error;
    }
  }

  async cleanupExpired() {
    const expired =
      await backupRepository
        .findExpiredRetention(
          new Date(),
          100
        );

    const result = {
      found:
        expired.length,
      removed:
        0,
      failed:
        0,
      items: [],
    };

    for (
      const backup of
        expired
    ) {
      if (!backup.storageKey) {
        continue;
      }

      try {
        await rm(
          backup.storageKey,
          {
            force:
              true,
          }
        );

        result.removed +=
          1;

        result.items.push({
          id:
            backup.id,
          removed:
            true,
        });
      } catch (error) {
        result.failed +=
          1;

        result.items.push({
          id:
            backup.id,
          removed:
            false,
          error:
            error?.message ??
            null,
        });
      }
    }

    return result;
  }

  async listRecent(
    limit = 50
  ) {
    const backups =
      await backupRepository
        .findRecent(limit);

    return backups.map(
      (backup) =>
        this.serializeBackup(
          backup
        )
    );
  }

  async statistics() {
    const [
      pending,
      running,
      success,
      failed,
      verified,
    ] = await Promise.all([
      backupRepository
        .countByStatus(
          "PENDING"
        ),

      backupRepository
        .countByStatus(
          "RUNNING"
        ),

      backupRepository
        .countByStatus(
          "SUCCESS"
        ),

      backupRepository
        .countByStatus(
          "FAILED"
        ),

      backupRepository
        .countByStatus(
          "VERIFIED"
        ),
    ]);

    return {
      pending,
      running,
      success,
      failed,
      verified,
      total:
        pending +
        running +
        success +
        failed +
        verified,
    };
  }
}

export default new BackupService();
