import type { FastifyInstance } from "fastify";

import { ConfirmarPagamentoUseCase } from "../../../application/cobranca/confirmar-pagamento-use-case.js";
import { CobrancaNaoEncontradaError } from "../../../domain/cobranca/cobranca-nao-encontrada-error.js";
import { env } from "../../../shared/config/env.js";
import { prisma } from "../../database/prisma-client.js";
import { PrismaCobrancaRepository } from "../../database/prisma-cobranca-repository.js";
import { LogNotificadorConfirmacao } from "../../notificacoes/log-notificador-confirmacao.js";

interface WebhookAsaasPayload {
  event: string;
  payment: { id: string };
}

export async function webhookAsaasRoutes(app: FastifyInstance) {
  const cobrancaRepository = new PrismaCobrancaRepository(prisma);
  const notificador = new LogNotificadorConfirmacao(app.log);
  const useCase = new ConfirmarPagamentoUseCase(
    cobrancaRepository,
    notificador,
    env.CONFIRMACAO_PAGAMENTO_HABILITADA,
  );

  app.post<{ Body: WebhookAsaasPayload }>("/webhooks/asaas", async (request, reply) => {
    const token = request.headers["asaas-access-token"];

    if (token !== env.ASAAS_WEBHOOK_TOKEN) {
      return reply.status(401).send({ error: "Token de webhook inválido" });
    }

    const { payment } = request.body;

    try {
      await useCase.executar({ gatewayChargeId: payment.id, paidAt: new Date() });
    } catch (error) {
      if (error instanceof CobrancaNaoEncontradaError) {
        app.log.warn({ gatewayChargeId: payment.id }, "Webhook Asaas para cobrança não encontrada");
        return reply.status(200).send({ status: "ignorado" });
      }

      throw error;
    }

    return reply.status(200).send({ status: "ok" });
  });
}
