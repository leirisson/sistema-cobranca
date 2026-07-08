import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { Cliente } from "../../src/domain/cliente/cliente.js";
import { Cobranca } from "../../src/domain/cobranca/cobranca.js";
import { MensagemEnviada } from "../../src/domain/mensagem/mensagem-enviada.js";
import { prisma } from "../../src/infra/database/prisma-client.js";
import { PrismaClienteRepository } from "../../src/infra/database/prisma-cliente-repository.js";
import { PrismaCobrancaRepository } from "../../src/infra/database/prisma-cobranca-repository.js";
import { PrismaMensagemEnviadaRepository } from "../../src/infra/database/prisma-mensagem-enviada-repository.js";

describe("PrismaMensagemEnviadaRepository", () => {
  const clienteRepository = new PrismaClienteRepository(prisma);
  const cobrancaRepository = new PrismaCobrancaRepository(prisma);
  const repository = new PrismaMensagemEnviadaRepository(prisma);

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterEach(async () => {
    await prisma.mensagemEnviada.deleteMany();
    await prisma.cobranca.deleteMany();
    await prisma.telefoneCliente.deleteMany();
    await prisma.cliente.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  let contador = 0;

  async function criarClienteECobrancaSalvos(vencimento: Date) {
    contador += 1;
    const cliente = Cliente.criar({
      nome: "Maria Silva",
      documento: "12345678900",
      telefones: [{ numero: "+5511999998888", principal: true }],
      valorCobranca: 150,
      diaVencimento: 10,
    });
    await clienteRepository.salvar(cliente);

    const cobranca = Cobranca.criar({
      clienteId: cliente.id,
      valor: 150,
      vencimento,
      gatewayChargeId: `asaas_${contador}`,
      linkPagamento: `https://sandbox.asaas.com/i/asaas_${contador}`,
    });
    await cobrancaRepository.salvar(cobranca);

    return cobranca;
  }

  it("salva um registro de mensagem enviada", async () => {
    const cobranca = await criarClienteECobrancaSalvos(new Date("2026-08-10"));
    const mensagem = MensagemEnviada.criar({
      cobrancaId: cobranca.id,
      tipo: "LEMBRETE",
      statusEnvio: "ENVIADO",
    });

    await repository.salvar(mensagem);

    const registros = await prisma.mensagemEnviada.findMany({ where: { cobrancaId: cobranca.id } });
    expect(registros).toHaveLength(1);
    expect(registros[0]?.tipo).toBe("LEMBRETE");
    expect(registros[0]?.statusEnvio).toBe("ENVIADO");
    expect(registros[0]?.canal).toBe("whatsapp");
  });

  it("salva e recupera um registro enviado por e-mail (EMAIL-R-06)", async () => {
    const cobranca = await criarClienteECobrancaSalvos(new Date("2026-08-10"));
    const mensagem = MensagemEnviada.criar({
      cobrancaId: cobranca.id,
      tipo: "LEMBRETE",
      statusEnvio: "ENVIADO",
      canal: "email",
    });

    await repository.salvar(mensagem);

    const registros = await prisma.mensagemEnviada.findMany({ where: { cobrancaId: cobranca.id } });
    expect(registros[0]?.canal).toBe("email");
  });

  it("identifica mensagem já enviada para a cobrança e tipo (deduplicação)", async () => {
    const cobranca = await criarClienteECobrancaSalvos(new Date("2026-08-10"));
    await repository.salvar(
      MensagemEnviada.criar({ cobrancaId: cobranca.id, tipo: "VENCIMENTO", statusEnvio: "ENVIADO" }),
    );

    const existeVencimento = await repository.existeParaCobrancaETipo(cobranca.id, "VENCIMENTO");
    const existeAtraso = await repository.existeParaCobrancaETipo(cobranca.id, "ATRASO");

    expect(existeVencimento).toBe(true);
    expect(existeAtraso).toBe(false);
  });

  it("lista cobranças PENDENTE e ATRASADO via PrismaCobrancaRepository (usado pela régua)", async () => {
    const cobrancaPendente = await criarClienteECobrancaSalvos(new Date("2026-08-10"));
    const cobrancaAtrasada = await criarClienteECobrancaSalvos(new Date("2026-08-05"));
    cobrancaAtrasada.marcarComoAtrasada();
    await cobrancaRepository.salvar(cobrancaAtrasada);

    const cobrancaPaga = await criarClienteECobrancaSalvos(new Date("2026-08-01"));
    cobrancaPaga.marcarComoPaga(new Date("2026-07-30"));
    await cobrancaRepository.salvar(cobrancaPaga);

    const resultado = await cobrancaRepository.listarPendentesOuAtrasadas();
    const ids = resultado.map((c) => c.id);

    expect(ids).toContain(cobrancaPendente.id);
    expect(ids).toContain(cobrancaAtrasada.id);
    expect(ids).not.toContain(cobrancaPaga.id);
  });
});
