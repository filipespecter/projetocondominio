import { Logger } from "../utils/logger.js";

/**
 * =====================================================
 * JOB REGISTRY SERVICE
 * =====================================================
 *
 * Registro central de rotinas automáticas do backend.
 *
 * Responsabilidades:
 *
 * - registrar jobs;
 * - impedir execução simultânea do mesmo job;
 * - armazenar estado operacional em memória;
 * - registrar início, sucesso e falha;
 * - disponibilizar status para a Central Star.
 *
 * REGRA DE ARQUITETURA:
 *
 * O Job nunca deve conter regra de negócio.
 *
 * Ele apenas chama Services já existentes.
 */
class JobRegistryService {
  constructor() {
    this.jobs =
      new Map();
  }

  normalizeName(name) {
    return String(
      name ?? ""
    )
      .trim()
      .toUpperCase();
  }

  register({
    name,
    handler,
    intervalMs,
    enabled = true,
    runOnStart = false,
    description = null,
  }) {
    const normalizedName =
      this.normalizeName(name);

    if (!normalizedName) {
      throw new Error(
        "Nome do job é obrigatório."
      );
    }

    if (
      typeof handler !==
      "function"
    ) {
      throw new Error(
        `Handler inválido para o job ${normalizedName}.`
      );
    }

    const normalizedInterval =
      Number(intervalMs);

    if (
      !Number.isFinite(
        normalizedInterval
      ) ||
      normalizedInterval <= 0
    ) {
      throw new Error(
        `Intervalo inválido para o job ${normalizedName}.`
      );
    }

    if (
      this.jobs.has(
        normalizedName
      )
    ) {
      throw new Error(
        `Job ${normalizedName} já registrado.`
      );
    }

    const now =
      new Date();

    const job = {
      name:
        normalizedName,

      description:
        description ??
        null,

      handler,

      intervalMs:
        normalizedInterval,

      enabled:
        Boolean(enabled),

      runOnStart:
        Boolean(runOnStart),

      running:
        false,

      registeredAt:
        now,

      lastStartedAt:
        null,

      lastFinishedAt:
        null,

      lastSuccessAt:
        null,

      lastFailureAt:
        null,

      lastDurationMs:
        null,

      lastError:
        null,

      executionCount:
        0,

      successCount:
        0,

      failureCount:
        0,

      skippedCount:
        0,

      nextRunAt:
        runOnStart
          ? now
          : new Date(
              now.getTime() +
              normalizedInterval
            ),
    };

    this.jobs.set(
      normalizedName,
      job
    );

    Logger.info(
      `Job registrado: ${normalizedName}.`
    );

    return this.serializeJob(
      job
    );
  }

  find(name) {
    return this.jobs.get(
      this.normalizeName(name)
    ) ?? null;
  }

  list() {
    return Array.from(
      this.jobs.values()
    ).map(
      (job) =>
        this.serializeJob(
          job
        )
    );
  }

  serializeJob(job) {
    return {
      name:
        job.name,

      description:
        job.description,

      intervalMs:
        job.intervalMs,

      enabled:
        job.enabled,

      runOnStart:
        job.runOnStart,

      running:
        job.running,

      registeredAt:
        job.registeredAt,

      lastStartedAt:
        job.lastStartedAt,

      lastFinishedAt:
        job.lastFinishedAt,

      lastSuccessAt:
        job.lastSuccessAt,

      lastFailureAt:
        job.lastFailureAt,

      lastDurationMs:
        job.lastDurationMs,

      lastError:
        job.lastError,

      executionCount:
        job.executionCount,

      successCount:
        job.successCount,

      failureCount:
        job.failureCount,

      skippedCount:
        job.skippedCount,

      nextRunAt:
        job.nextRunAt,
    };
  }

  isDue(
    job,
    referenceDate = new Date()
  ) {
    return (
      job.enabled &&
      !job.running &&
      job.nextRunAt &&
      job.nextRunAt <=
        referenceDate
    );
  }

  async execute(
    name,
    {
      force = false,
      source = "SCHEDULER",
    } = {}
  ) {
    const job =
      this.find(name);

    if (!job) {
      throw new Error(
        `Job ${name} não encontrado.`
      );
    }

    if (
      !job.enabled &&
      !force
    ) {
      return {
        executed:
          false,

        skipped:
          true,

        reason:
          "JOB_DISABLED",

        job:
          this.serializeJob(
            job
          ),
      };
    }

    /**
     * LOCK LOCAL
     *
     * Evita duas execuções simultâneas do mesmo job
     * dentro desta instância do backend.
     *
     * No Bloco 9.5 vamos deixar preparado o caminho
     * para lock distribuído em produção multi-instância.
     */
    if (job.running) {
      job.skippedCount +=
        1;

      Logger.warn(
        `Job ${job.name} ignorado porque já está em execução.`
      );

      return {
        executed:
          false,

        skipped:
          true,

        reason:
          "ALREADY_RUNNING",

        job:
          this.serializeJob(
            job
          ),
      };
    }

    const startedAt =
      new Date();

    job.running =
      true;

    job.lastStartedAt =
      startedAt;

    job.executionCount +=
      1;

    job.lastError =
      null;

    Logger.info(
      `Job iniciado: ${job.name}.`,
      {
        source,
      }
    );

    try {
      const result =
        await job.handler({
          jobName:
            job.name,

          source,

          startedAt,
        });

      const finishedAt =
        new Date();

      job.running =
        false;

      job.lastFinishedAt =
        finishedAt;

      job.lastSuccessAt =
        finishedAt;

      job.successCount +=
        1;

      job.lastDurationMs =
        finishedAt.getTime() -
        startedAt.getTime();

      job.nextRunAt =
        new Date(
          finishedAt.getTime() +
          job.intervalMs
        );

      Logger.info(
        `Job concluído: ${job.name}.`,
        {
          durationMs:
            job.lastDurationMs,
        }
      );

      return {
        executed:
          true,

        success:
          true,

        result,

        job:
          this.serializeJob(
            job
          ),
      };
    } catch (error) {
      const finishedAt =
        new Date();

      job.running =
        false;

      job.lastFinishedAt =
        finishedAt;

      job.lastFailureAt =
        finishedAt;

      job.failureCount +=
        1;

      job.lastDurationMs =
        finishedAt.getTime() -
        startedAt.getTime();

      job.lastError = {
        name:
          error?.name ??
          "Error",

        message:
          error?.message ??
          "Falha desconhecida.",
      };

      job.nextRunAt =
        new Date(
          finishedAt.getTime() +
          job.intervalMs
        );

      Logger.error(
        `Falha no job ${job.name}.`,
        error
      );

      return {
        executed:
          true,

        success:
          false,

        error:
          job.lastError,

        job:
          this.serializeJob(
            job
          ),
      };
    }
  }

  enable(name) {
    const job =
      this.find(name);

    if (!job) {
      return null;
    }

    job.enabled =
      true;

    if (!job.nextRunAt) {
      job.nextRunAt =
        new Date(
          Date.now() +
          job.intervalMs
        );
    }

    return this.serializeJob(
      job
    );
  }

  disable(name) {
    const job =
      this.find(name);

    if (!job) {
      return null;
    }

    job.enabled =
      false;

    return this.serializeJob(
      job
    );
  }
}

export default new JobRegistryService();
