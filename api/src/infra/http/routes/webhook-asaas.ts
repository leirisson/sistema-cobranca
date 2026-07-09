import type { FastifyInstance } from "fastify";

import { ConfirmarPagamentoUseCase } from "../../../application/cobranca/confirmar-pagamento-use-case.js";
import { CobrancaNaoEncontradaError } from "../../../domain/cobranca/cobranca-nao-encontrada-error.js";
import { env } from "../../../shared/config/env.js";
import { PrismaClienteRepository } from "../../database/prisma-cliente-repository.js";
import { PrismaCobrancaRepository } from "../../database/prisma-cobranca-repository.js";
import { PrismaMensagemEnviadaRepository } from "../../database/prisma-mensagem-enviada-repository.js";
import { prisma } from "../../database/prisma-client.js";
import { EvolutionCanalMensagem } from "../../gateways/evolution-canal-mensagem.js";
import { NodemailerGmailNotificador } from "../../gateways/nodemailer-gmail-notificador.js";
import { MensagemNotificadorConfirmacao } from "../../notificacoes/mensagem-notificador-confirmacao.js";

interface WebhookAsaasPayload {
  event: string;
  payment: { id: string };
}

export async function webhookAsaasRoutes(app: FastifyInstance) {
  const cobrancaRepository = new PrismaCobrancaRepository(prisma);
  const clienteRepository = new PrismaClienteRepository(prisma);
  const mensagemEnviadaRepository = new PrismaMensagemEnviadaRepository(prisma);
  const canalMensagem = new EvolutionCanalMensagem({
    baseUrl: env.EVOLUTION_API_URL,
    apiKey: env.EVOLUTION_API_KEY,
    instance: env.EVOLUTION_INSTANCE,
  });
  const canalNotificacao = new NodemailerGmailNotificador({
    usuario: env.GMAIL_USUARIO,
    senhaApp: env.GMAIL_SENHA_APP,
    remetente: env.GMAIL_REMETENTE,
  });
  const notificador = new MensagemNotificadorConfirmacao(
    clienteRepository,
    mensagemEnviadaRepository,
    canalMensagem,
    canalNotificacao,
  );
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
