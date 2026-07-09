import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";

import { env } from "../../shared/config/env.js";
import { authRoutes } from "./routes/auth.js";
import { clientesRoutes } from "./routes/clientes.js";
import { cobrancasRoutes } from "./routes/cobrancas.js";
import { configuracoesRoutes } from "./routes/configuracoes.js";
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

  app.register(cors, {
    origin: env.CORS_ALLOWED_ORIGINS.split(",").map((origem) => origem.trim()),
  });

  // Limite geral (SEC-03): throughput normal de uso, não é anti-brute-force.
  app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: "1 minute",
  });

  app.register(healthRoutes);
  app.register(authRoutes);
  app.register(webhookAsaasRoutes);
  app.register(dashboardRoutes);
  app.register(clientesRoutes);
  app.register(cobrancasRoutes);
  app.register(configuracoesRoutes);

  return app;
}
