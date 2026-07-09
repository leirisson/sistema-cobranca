import type { FastifyInstance } from "fastify";

import { AtualizarConfiguracaoUseCase } from "../../../application/configuracao/atualizar-configuracao-use-case.js";
import { ConectarWhatsappUseCase } from "../../../application/configuracao/conectar-whatsapp-use-case.js";
import { ObterConfiguracaoUseCase } from "../../../application/configuracao/obter-configuracao-use-case.js";
import { ObterStatusWhatsappUseCase } from "../../../application/configuracao/obter-status-whatsapp-use-case.js";
import { env } from "../../../shared/config/env.js";
import { PrismaConfiguracaoRepository } from "../../database/prisma-configuracao-repository.js";
import { prisma } from "../../database/prisma-client.js";
import { EvolutionInstanceGateway } from "../../gateways/evolution-instance-gateway.js";
import { CifradorAes256Gcm } from "../../security/cifrador-aes-256-gcm.js";
import { autenticar } from "../plugins/auth.js";

interface AtualizarConfiguracaoBody {
  asaasApiKey?: string;
  nomeRemetente?: string | null;
  confirmacaoPagamentoHabilitada?: boolean;
}

const ERRO_WHATSAPP_INDISPONIVEL = { error: "Não foi possível conectar ao WhatsApp no momento" };

export async function configuracoesRoutes(app: FastifyInstance) {
  const configuracaoRepository = new PrismaConfiguracaoRepository(prisma);
  const cifrador = new CifradorAes256Gcm({ chave: env.CONFIG_ENCRYPTION_KEY });
  const obterConfiguracaoUseCase = new ObterConfiguracaoUseCase(configuracaoRepository, cifrador);
  const atualizarConfiguracaoUseCase = new AtualizarConfiguracaoUseCase(configuracaoRepository, cifrador);
  const instanciaWhatsappGateway = new EvolutionInstanceGateway({
    baseUrl: env.EVOLUTION_API_URL,
    apiKey: env.EVOLUTION_API_KEY,
    instance: env.EVOLUTION_INSTANCE,
  });
  const conectarWhatsappUseCase = new ConectarWhatsappUseCase(instanciaWhatsappGateway);
  const obterStatusWhatsappUseCase = new ObterStatusWhatsappUseCase(instanciaWhatsappGateway);

  app.addHook("preHandler", autenticar);

  app.get("/configuracoes", async (_request, reply) => {
    const configuracao = await obterConfiguracaoUseCase.executar();

    return reply.status(200).send(configuracao);
  });

  app.put<{ Body: AtualizarConfiguracaoBody }>("/configuracoes", async (request, reply) => {
    const configuracao = await atualizarConfiguracaoUseCase.executar(request.body);

    return reply.status(200).send(configuracao);
  });

  app.post("/configuracoes/whatsapp/conectar", async (_request, reply) => {
    try {
      const resultado = await conectarWhatsappUseCase.executar();

      return reply.status(200).send(resultado);
    } catch (error) {
      app.log.error({ err: error }, "Falha ao conectar instância do WhatsApp");
      return reply.status(502).send(ERRO_WHATSAPP_INDISPONIVEL);
    }
  });

  app.get("/configuracoes/whatsapp/status", async (_request, reply) => {
    try {
      const resultado = await obterStatusWhatsappUseCase.executar();

      return reply.status(200).send(resultado);
    } catch (error) {
      app.log.error({ err: error }, "Falha ao consultar status da instância do WhatsApp");
      return reply.status(502).send(ERRO_WHATSAPP_INDISPONIVEL);
    }
  });
}
