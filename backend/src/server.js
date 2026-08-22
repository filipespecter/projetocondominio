import { app } from "./app.js";
import { env } from "./config/env.js";
import prisma from "./config/prisma.js";
import { Logger } from "./utils/logger.js";
import {
  startJobs,
  stopJobs,
} from "./jobs/index.js";

const server = app.listen(env.PORT, () => {
  Logger.info("==========================================");
  Logger.info("InfinityCondo API");
  Logger.info("Star Infinity Code");
  Logger.info("==========================================");
  Logger.info(`Ambiente: ${env.NODE_ENV}`);
  Logger.info(`Servidor: http://localhost:${env.PORT}`);
  Logger.info(`Saúde: http://localhost:${env.PORT}/api/health`);

  /**
   * =====================================================
   * JOBS / SCHEDULER
   * =====================================================
   *
   * O scheduler inicia somente após o servidor HTTP
   * estar disponível.
   */
  const jobs =
    startJobs();

  Logger.info(
    `Jobs: ${
      jobs.enabled
        ? "habilitados"
        : "desabilitados"
    }`
  );

  Logger.info("==========================================");
});

let encerrando =
  false;

async function encerrarServidor(
  signal
) {
  if (encerrando) {
    return;
  }

  encerrando =
    true;

  Logger.warn(
    `Sinal ${signal} recebido. Encerrando servidor...`
  );

  /**
   * Impede novos disparos de jobs.
   */
  stopJobs();

  server.close(
    async (error) => {
      if (error) {
        Logger.error(
          "Erro ao encerrar o servidor.",
          error
        );

        process.exit(1);
      }

      try {
        /**
         * Libera conexões do PostgreSQL/Prisma.
         */
        await prisma
          .$disconnect();

        Logger.info(
          "Conexão Prisma encerrada corretamente."
        );
      } catch (prismaError) {
        Logger.error(
          "Erro ao encerrar conexão Prisma.",
          prismaError
        );
      }

      Logger.info(
        "Servidor encerrado corretamente."
      );

      process.exit(0);
    }
  );

  /**
   * Fail-safe:
   *
   * impede shutdown infinito caso alguma conexão
   * externa permaneça aberta.
   */
  const forceShutdownTimer =
    setTimeout(
      async () => {
        Logger.error(
          "Tempo máximo de shutdown excedido. Encerramento forçado."
        );

        try {
          await prisma
            .$disconnect();
        } catch {
          // processo será finalizado logo abaixo
        }

        process.exit(1);
      },
      10000
    );

  forceShutdownTimer
    .unref?.();
}

process.on(
  "SIGINT",
  () =>
    encerrarServidor(
      "SIGINT"
    )
);

process.on(
  "SIGTERM",
  () =>
    encerrarServidor(
      "SIGTERM"
    )
);

process.on(
  "unhandledRejection",
  (error) => {
    Logger.error(
      "Promise rejeitada sem tratamento.",
      error
    );
  }
);

process.on(
  "uncaughtException",
  (error) => {
    Logger.error(
      "Erro não capturado.",
      error
    );

    encerrarServidor(
      "UNCAUGHT_EXCEPTION"
    );
  }
);
