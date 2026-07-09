import { CancelarCobrancaUseCase } from "../../application/cobranca/cancelar-cobranca-use-case.js";
import { CriarCobrancaManualUseCase } from "../../application/cobranca/criar-cobranca-manual-use-case.js";
import { GerarCobrancaUseCase } from "../../application/cobranca/gerar-cobranca-use-case.js";
import { ResolverCredenciaisAsaasUseCase } from "../../application/configuracao/resolver-credenciais-asaas-use-case.js";
import { DispararLembreteInicialUseCase } from "../../application/mensagem/disparar-lembrete-inicial-use-case.js";
import { DispararReguaAtrasoUseCase } from "../../application/mensagem/disparar-regua-atraso-use-case.js";
import { ReenviarMensagemUseCase } from "../../application/mensagem/reenviar-mensagem-use-case.js";
import { env } from "../../shared/config/env.js";
import { PrismaClienteRepository } from "../database/prisma-cliente-repository.js";
import { PrismaCobrancaRepository } from "../database/prisma-cobranca-repository.js";
import { PrismaConfiguracaoRepository } from "../database/prisma-configuracao-repository.js";
import { PrismaMensagemEnviadaRepository } from "../database/prisma-mensagem-enviada-repository.js";
import { prisma } from "../database/prisma-client.js";
import { AsaasGateway } from "../gateways/asaas-gateway.js";
import { EvolutionCanalMensagem } from "../gateways/evolution-canal-mensagem.js";
import { NodemailerGmailNotificador } from "../gateways/nodemailer-gmail-notificador.js";
import { CifradorAes256Gcm } from "../security/cifrador-aes-256-gcm.js";

async function resolverAsaasApiKey(): Promise<string> {
  const configuracaoRepository = new PrismaConfiguracaoRepository(prisma);
  const cifrador = new CifradorAes256Gcm({ chave: env.CONFIG_ENCRYPTION_KEY });
  const resolver = new ResolverCredenciaisAsaasUseCase(configuracaoRepository, cifrador, env.ASAAS_API_KEY);
  const { apiKey } = await resolver.executar();

  return apiKey;
}

export async function criarGerarCobrancaUseCase(): Promise<GerarCobrancaUseCase> {
  const clienteRepository = new PrismaClienteRepository(prisma);
  const cobrancaRepository = new PrismaCobrancaRepository(prisma);
  const gatewayPagamento = new AsaasGateway({
    baseUrl: env.ASAAS_BASE_URL,
    apiKey: await resolverAsaasApiKey(),
  });

  return new GerarCobrancaUseCase(
    clienteRepository,
    cobrancaRepository,
    gatewayPagamento,
    env.COBRANCA_ANTECEDENCIA_DIAS,
  );
}

export async function criarCriarCobrancaManualUseCase(): Promise<CriarCobrancaManualUseCase> {
  const clienteRepository = new PrismaClienteRepository(prisma);
  const cobrancaRepository = new PrismaCobrancaRepository(prisma);
  const gatewayPagamento = new AsaasGateway({
    baseUrl: env.ASAAS_BASE_URL,
    apiKey: await resolverAsaasApiKey(),
  });

  return new CriarCobrancaManualUseCase(clienteRepository, cobrancaRepository, gatewayPagamento);
}

export async function criarCancelarCobrancaUseCase(): Promise<CancelarCobrancaUseCase> {
  const cobrancaRepository = new PrismaCobrancaRepository(prisma);
  const gatewayPagamento = new AsaasGateway({
    baseUrl: env.ASAAS_BASE_URL,
    apiKey: await resolverAsaasApiKey(),
  });

  return new CancelarCobrancaUseCase(cobrancaRepository, gatewayPagamento);
}

export function criarDispararLembreteInicialUseCase(): DispararLembreteInicialUseCase {
  const clienteRepository = new PrismaClienteRepository(prisma);
  const mensagemEnviadaRepository = new PrismaMensagemEnviadaRepository(prisma);
  const configuracaoRepository = new PrismaConfiguracaoRepository(prisma);
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
    configuracaoRepository,
  );
}

export function criarDispararReguaAtrasoUseCase(): DispararReguaAtrasoUseCase {
  const clienteRepository = new PrismaClienteRepository(prisma);
  const cobrancaRepository = new PrismaCobrancaRepository(prisma);
  const mensagemEnviadaRepository = new PrismaMensagemEnviadaRepository(prisma);
  const configuracaoRepository = new PrismaConfiguracaoRepository(prisma);
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
    configuracaoRepository,
  );
}

export function criarReenviarMensagemUseCase(): ReenviarMensagemUseCase {
  const clienteRepository = new PrismaClienteRepository(prisma);
  const cobrancaRepository = new PrismaCobrancaRepository(prisma);
  const mensagemEnviadaRepository = new PrismaMensagemEnviadaRepository(prisma);
  const configuracaoRepository = new PrismaConfiguracaoRepository(prisma);
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

  return new ReenviarMensagemUseCase(
    clienteRepository,
    cobrancaRepository,
    mensagemEnviadaRepository,
    canalMensagem,
    canalNotificacao,
    configuracaoRepository,
  );
}
