import Fastify from "fastify";

import { env } from "../../shared/config/env.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { healthRoutes } from "./routes/health.js";
import { webhookAsaasRoutes } from "./routes/webhook-asaas.js";

export function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "test" ? "silent" : "info",
      transport:
        env.NODE_ENV === "development"
          ? { target: "pino-pretty" }
          : undefined,
    },
  });

  app.register(healthRoutes);
  app.register(webhookAsaasRoutes);
  app.register(dashboardRoutes);

  return app;
}
