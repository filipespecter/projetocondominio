import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";

import { env } from "./config/env.js";
import { router } from "./routes/index.js";
import requestContextMiddleware from "./middlewares/requestContextMiddleware.js";
import {
  errorHandler,
  notFoundHandler
} from "./middlewares/errorHandler.js";
import { apiLimiter } from "./middlewares/securityMiddleware.js";

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy",env.TRUST_PROXY);

/**
 * Contexto único por requisição para correlação entre
 * auditoria, erros e eventos operacionais.
 */
app.use(requestContextMiddleware);

app.use(morgan(env.NODE_ENV==="production"?"combined":"dev"));

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

/**
 * =====================================================
 * BODY PARSERS
 * =====================================================
 *
 * O rawBody é preservado para permitir a validação
 * criptográfica de webhooks externos, principalmente
 * o X-Hub-Signature-256 da WhatsApp Cloud API.
 *
 * O restante da aplicação continua recebendo req.body
 * normalmente como JSON.
 */
app.use(
  express.json({
    limit: "12mb",

    verify: (
      req,
      res,
      buffer
    ) => {
      /**
       * Preservamos somente o Buffer bruto.
       *
       * A validação específica permanece no Service
       * responsável pelo webhook.
       */
      req.rawBody =
        Buffer.from(buffer);
    }
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb"
  })
);

/**
 * Health Check
 */
app.get("/api/health", (_req,res)=>res.status(200).json({status:"ok"}));

/**
 * Rotas da API
 */
app.use("/api",apiLimiter,router);

/**
 * Tratamento de erros
 */
app.use(notFoundHandler);
app.use(errorHandler);
