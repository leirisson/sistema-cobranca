import { GerarCobrancaUseCase } from "../../application/cobranca/gerar-cobranca-use-case.js";
import { DispararLembreteInicialUseCase } from "../../application/mensagem/disparar-lembrete-inicial-use-case.js";
import { DispararReguaAtrasoUseCase } from "../../application/mensagem/disparar-regua-atraso-use-case.js";
import { env } from "../../shared/config/env.js";
import { PrismaClienteRepository } from "../database/prisma-cliente-repository.js";
import { PrismaCobrancaRepository } from "../database/prisma-cobranca-repository.js";
import { PrismaMensagemEnviadaRepository } from "../database/prisma-mensagem-enviada-repository.js";
import { prisma } from "../database/prisma-client.js";
import { AsaasGateway } from "../gateways/asaas-gateway.js";
import { EvolutionCanalMensagem } from "../gateways/evolution-canal-mensagem.js";
import { NodemailerGmailNotificador } from "../gateways/nodemailer-gmail-notificador.js";

export function criarGerarCobrancaUseCase(): GerarCobrancaUseCase {
  const clienteRepository = new PrismaClienteRepository(prisma);
  const cobrancaRepository = new PrismaCobrancaRepository(prisma);
  const gatewayPagamento = new AsaasGateway({
    baseUrl: env.ASAAS_BASE_URL,
    apiKey: env.ASAAS_API_KEY,
  });

  return new GerarCobrancaUseCase(
    clienteRepository,
    cobrancaRepository,
    gatewayPagamento,
    env.COBRANCA_ANTECEDENCIA_DIAS,
  );
}

export function criarDispararLembreteInicialUseCase(): DispararLembreteInicialUseCase {
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

  return new DispararLembreteInicialUseCase(
    clienteRepository,
    mensagemEnviadaRepository,
    canalMensagem,
    canalNotificacao,
  );
}

export function criarDispararReguaAtrasoUseCase(): DispararReguaAtrasoUseCase {
  const clienteRepository = new PrismaClienteRepository(prisma);
  const cobrancaRepository = new PrismaCobrancaRepository(prisma);
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

  return new DispararReguaAtrasoUseCase(
    clienteRepository,
    cobrancaRepository,
    mensagemEnviadaRepository,
    canalMensagem,
    canalNotificacao,
  );
}
