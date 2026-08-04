import { app } from "./app.js";
import { env } from "./config/env.js";
import { Logger } from "./utils/logger.js";

const server = app.listen(env.PORT, () => {
  Logger.info("==========================================");
  Logger.info("InfinityCondo API");
  Logger.info("Star Infinity Code");
  Logger.info("==========================================");
  Logger.info(`Ambiente: ${env.NODE_ENV}`);
  Logger.info(`Servidor: http://localhost:${env.PORT}`);
  Logger.info(`Saúde: http://localhost:${env.PORT}/api/health`);
  Logger.info("==========================================");
});

function encerrarServidor(signal) {
  Logger.warn(`Sinal ${signal} recebido. Encerrando servidor...`);

  server.close((error) => {
    if (error) {
      Logger.error("Erro ao encerrar o servidor.", error);
      process.exit(1);
    }

    Logger.info("Servidor encerrado corretamente.");
    process.exit(0);
  });
}

process.on("SIGINT", () => encerrarServidor("SIGINT"));

process.on("SIGTERM", () => encerrarServidor("SIGTERM"));

process.on("unhandledRejection", (error) => {
  Logger.error("Promise rejeitada sem tratamento.", error);
});

process.on("uncaughtException", (error) => {
  Logger.error("Erro não capturado.", error);
  process.exit(1);
});