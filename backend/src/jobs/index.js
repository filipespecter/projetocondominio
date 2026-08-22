import SchedulerService from "../services/SchedulerService.js";
import JobRegistryService from "../services/JobRegistryService.js";
import { Logger } from "../utils/logger.js";

import runDelinquencyJob from "./DelinquencyJob.js";
import runCommunicationRetryJob from "./CommunicationRetryJob.js";
import runDatabaseBackupJob from "./DatabaseBackupJob.js";

/**
 * =====================================================
 * JOBS BOOTSTRAP
 * =====================================================
 *
 * Ponto único de registro e inicialização das
 * rotinas automáticas do InfinityCondo.
 *
 * REGRA:
 *
 * jobs apenas orquestram Services.
 * Regras de negócio permanecem nos Services.
 */

let jobsRegistered =
  false;

function normalizePositiveNumber(
  value,
  fallback
) {
  const normalized =
    Number(value);

  if (
    !Number.isFinite(
      normalized
    ) ||
    normalized <= 0
  ) {
    return fallback;
  }

  return normalized;
}

export function registerJobs() {
  if (jobsRegistered) {
    return JobRegistryService
      .list();
  }

  /**
   * =====================================================
   * INADIMPLÊNCIA
   * =====================================================
   *
   * Padrão: uma vez a cada 24 horas.
   *
   * Não executamos no boot para evitar que cada restart
   * de desenvolvimento dispare processamento financeiro.
   */
  JobRegistryService.register({
    name:
      "DELINQUENCY_DAILY",

    description:
      "Processa vencimentos, período de tolerância e suspensões por inadimplência.",

    handler:
      runDelinquencyJob,

    intervalMs:
      normalizePositiveNumber(
        process.env
          .DELINQUENCY_JOB_INTERVAL_MS,
        24 * 60 * 60 * 1000
      ),

    enabled:
      String(
        process.env
          .DELINQUENCY_JOB_ENABLED ??
        "true"
      )
        .trim()
        .toLowerCase() !==
      "false",

    runOnStart:
      false,
  });

  /**
   * =====================================================
   * RETRY DE COMUNICAÇÕES
   * =====================================================
   *
   * Padrão: verifica falhas a cada 5 minutos.
   *
   * O próprio job respeita:
   *
   * - delay mínimo entre tentativas;
   * - limite máximo de tentativas;
   * - tamanho máximo do lote.
   */
  JobRegistryService.register({
    name:
      "COMMUNICATION_RETRY",

    description:
      "Reprocessa comunicações com falha elegíveis para nova tentativa.",

    handler:
      runCommunicationRetryJob,

    intervalMs:
      normalizePositiveNumber(
        process.env
          .COMMUNICATION_RETRY_JOB_INTERVAL_MS,
        5 * 60 * 1000
      ),

    enabled:
      String(
        process.env
          .COMMUNICATION_RETRY_JOB_ENABLED ??
        "true"
      )
        .trim()
        .toLowerCase() !==
      "false",

    runOnStart:
      false,
  });


  /**
   * =====================================================
   * BACKUP DO POSTGRESQL
   * =====================================================
   *
   * Padrão: uma vez a cada 24 horas.
   *
   * Não roda no boot para evitar geração de dumps
   * a cada restart durante desenvolvimento.
   */
  JobRegistryService.register({
    name:
      "DATABASE_BACKUP",

    description:
      "Gera backup físico do PostgreSQL e remove arquivos vencidos pela retenção.",

    handler:
      runDatabaseBackupJob,

    intervalMs:
      normalizePositiveNumber(
        process.env
          .DATABASE_BACKUP_JOB_INTERVAL_MS,
        24 * 60 * 60 * 1000
      ),

    enabled:
      String(
        process.env
          .DATABASE_BACKUP_JOB_ENABLED ??
        "true"
      )
        .trim()
        .toLowerCase() !==
      "false",

    runOnStart:
      false,
  });

  jobsRegistered =
    true;

  Logger.info(
    `${JobRegistryService.list().length} jobs registrados.`
  );

  return JobRegistryService
    .list();
}

export function startJobs() {
  const enabled =
    String(
      process.env
        .JOBS_ENABLED ??
      "true"
    )
      .trim()
      .toLowerCase() !==
    "false";

  if (!enabled) {
    Logger.warn(
      "Scheduler desabilitado por JOBS_ENABLED=false."
    );

    return {
      enabled:
        false,

      jobs:
        [],

      scheduler:
        SchedulerService
          .status(),
    };
  }

  const jobs =
    registerJobs();

  const tickIntervalMs =
    normalizePositiveNumber(
      process.env
        .JOBS_TICK_INTERVAL_MS,
      60000
    );

  const scheduler =
    SchedulerService
      .start({
        tickIntervalMs,
      });

  return {
    enabled:
      true,

    jobs,

    scheduler,
  };
}

export function stopJobs() {
  return SchedulerService
    .stop();
}
