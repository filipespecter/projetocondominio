import JobRegistryService from "./JobRegistryService.js";
import { Logger } from "../utils/logger.js";

/**
 * =====================================================
 * SCHEDULER SERVICE
 * =====================================================
 *
 * Motor leve de agendamento do InfinityCondo.
 *
 * Não possui regras de negócio.
 *
 * A cada "tick" verifica quais jobs registrados
 * chegaram ao horário de execução.
 */
class SchedulerService {
  constructor() {
    this.timer =
      null;

    this.startedAt =
      null;

    this.tickIntervalMs =
      60 * 1000;

    this.running =
      false;
  }

  configure({
    tickIntervalMs = null,
  } = {}) {
    if (
      tickIntervalMs !==
      null
    ) {
      const normalized =
        Number(
          tickIntervalMs
        );

      if (
        !Number.isFinite(
          normalized
        ) ||
        normalized < 1000
      ) {
        throw new Error(
          "O intervalo mínimo do scheduler é 1000ms."
        );
      }

      this.tickIntervalMs =
        normalized;
    }

    return this.status();
  }

  async tick() {
    if (!this.running) {
      return;
    }

    const now =
      new Date();

    const jobs =
      JobRegistryService
        .list();

    for (
      const jobStatus of jobs
    ) {
      const job =
        JobRegistryService
          .find(
            jobStatus.name
          );

      if (
        !job ||
        !JobRegistryService
          .isDue(
            job,
            now
          )
      ) {
        continue;
      }

      /**
       * Não aguardamos um job antes de avaliar o
       * próximo. Cada JobRegistry possui seu lock.
       */
      JobRegistryService
        .execute(
          job.name,
          {
            source:
              "SCHEDULER",
          }
        )
        .catch(
          (error) => {
            Logger.error(
              `Erro inesperado ao disparar ${job.name}.`,
              error
            );
          }
        );
    }
  }

  start({
    tickIntervalMs = null,
  } = {}) {
    if (this.running) {
      return this.status();
    }

    this.configure({
      tickIntervalMs,
    });

    this.running =
      true;

    this.startedAt =
      new Date();

    /**
     * Primeiro tick imediatamente para permitir
     * jobs com runOnStart.
     */
    this.tick();

    this.timer =
      setInterval(
        () => {
          this.tick();
        },
        this.tickIntervalMs
      );

    /**
     * O timer não deve sozinho impedir o processo
     * Node de finalizar durante shutdown.
     */
    this.timer.unref?.();

    Logger.info(
      "Scheduler iniciado.",
      {
        tickIntervalMs:
          this.tickIntervalMs,

        registeredJobs:
          JobRegistryService
            .list()
            .length,
      }
    );

    return this.status();
  }

  stop() {
    if (this.timer) {
      clearInterval(
        this.timer
      );

      this.timer =
        null;
    }

    const wasRunning =
      this.running;

    this.running =
      false;

    if (wasRunning) {
      Logger.info(
        "Scheduler encerrado."
      );
    }

    return this.status();
  }

  status() {
    return {
      running:
        this.running,

      startedAt:
        this.startedAt,

      tickIntervalMs:
        this.tickIntervalMs,

      registeredJobs:
        JobRegistryService
          .list()
          .length,
    };
  }
}

export default new SchedulerService();
