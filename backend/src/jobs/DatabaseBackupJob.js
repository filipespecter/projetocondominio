import BackupService from "../services/BackupService.js";
import { Logger } from "../utils/logger.js";

/**
 * =====================================================
 * DATABASE BACKUP JOB
 * =====================================================
 *
 * Executa o backup automático do PostgreSQL
 * usando o BackupService.
 */
export async function runDatabaseBackupJob({
  startedAt = new Date(),
} = {}) {
  Logger.info(
    "Executando backup automático do PostgreSQL."
  );

  const backup =
    await BackupService
      .createBackup({
        trigger:
          "AUTOMATIC",

        metadata: {
          source:
            "JOB",

          startedAt,
        },
      });

  const cleanup =
    await BackupService
      .cleanupExpired();

  return {
    backup,
    cleanup,
  };
}

export default runDatabaseBackupJob;
