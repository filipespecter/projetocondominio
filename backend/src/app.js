import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";

import { env } from "./config/env.js";
import { router } from "./routes/index.js";
import {
  errorHandler,
  notFoundHandler
} from "./middlewares/errorHandler.js";

export const app = express();

app.disable("x-powered-by");

app.use(morgan("dev"));

app.use(helmet());

app.use(compression());

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS"
    ]
  })
);

app.use(
  express.json({
    limit: "1mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb"
  })
);

/**
 * Health Check
 */
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "online",
    service: "InfinityCondo API",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

/**
 * Rotas da API
 */
app.use("/api", router);

/**
 * Tratamento de erros
 */
app.use(notFoundHandler);
app.use(errorHandler);