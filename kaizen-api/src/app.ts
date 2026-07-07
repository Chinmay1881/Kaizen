import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { corsOptions } from "./config/cors.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found-handler.js";
import { rateLimiter } from "./middleware/rate-limiter.js";
import { requestLogger } from "./middleware/request-logger.js";
import { healthRouter } from "./routes/health.routes.js";
import { v1Router } from "./routes/index.js";
import { clerkWebhookRouter } from "./webhooks/clerk.webhook.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(compression());
  app.use(requestLogger);
  app.use(rateLimiter);

  app.use("/webhooks/clerk", express.raw({ type: "application/json" }), clerkWebhookRouter);

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use(healthRouter);
  app.use("/api/v1", v1Router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
