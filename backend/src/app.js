import express from "express";
import cors from "cors";
import helmet from "helmet";

import { env } from "./config/env.js";
import { router } from "./routes/index.js";
import {
  errorHandler,
  notFoundHandler
} from "./middlewares/errorHandler.js";

export const app = express();

app.disable("x-powered-by");

app.use(helmet());

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

app.use("/api", router);

app.use(notFoundHandler);
app.use(errorHandler);