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

  app.register(healthRoutes);
  app.register(authRoutes);
  app.register(webhookAsaasRoutes);
  app.register(dashboardRoutes);
  app.register(clientesRoutes);
  app.register(cobrancasRoutes);
  app.register(configuracoesRoutes);

  return app;
}
