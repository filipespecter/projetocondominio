import { app } from "./app.js";
import { env } from "./config/env.js";

const server = app.listen(env.PORT, () => {
  console.log("");
  console.log("==========================================");
  console.log(" InfinityCondo API");
  console.log(" Star Infinity Code");
  console.log("==========================================");
  console.log(` Ambiente: ${env.NODE_ENV}`);
  console.log(` Servidor: http://localhost:${env.PORT}`);
  console.log(` Saúde: http://localhost:${env.PORT}/api/health`);
  console.log("==========================================");
  console.log("");
});

function encerrarServidor(signal) {
  console.log(`\nSinal ${signal} recebido.`);

  server.close((error) => {
    if (error) {
      console.error(
        "Erro ao encerrar o servidor:",
        error
      );

      process.exit(1);
    }

    console.log("Servidor encerrado corretamente.");
    process.exit(0);
  });
}

process.on("SIGINT", () =>
  encerrarServidor("SIGINT")
);

process.on("SIGTERM", () =>
  encerrarServidor("SIGTERM")
);

process.on("unhandledRejection", (error) => {
  console.error("Promise rejeitada sem tratamento:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Erro não capturado:", error);
  process.exit(1);
});