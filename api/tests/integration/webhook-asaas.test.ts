import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { buildApp } from "../../src/infra/http/app.js";
import { Cliente } from "../../src/domain/cliente/cliente.js";
import { Cobranca } from "../../src/domain/cobranca/cobranca.js";
import { prisma } from "../../src/infra/database/prisma-client.js";
import { PrismaClienteRepository } from "../../src/infra/database/prisma-cliente-repository.js";
import { PrismaCobrancaRepository } from "../../src/infra/database/prisma-cobranca-repository.js";

describe("POST /webhooks/asaas", () => {
  let app: FastifyInstance;
  const clienteRepository = new PrismaClienteRepository(prisma);
  const cobrancaRepository = new PrismaCobrancaRepository(prisma);

  beforeAll(async () => {
    await prisma.$connect();
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await prisma.cobranca.deleteMany();
    await prisma.telefoneCliente.deleteMany();
    await prisma.cliente.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  async function criarCobrancaPendente(gatewayChargeId: string) {
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
      vencimento: new Date("2026-08-10"),
      gatewayChargeId,
      linkPagamento: `https://sandbox.asaas.com/i/${gatewayChargeId}`,
    });
    await cobrancaRepository.salvar(cobranca);

    return cobranca;
  }

  it("rejeita webhook sem token válido com 401 e não altera a cobrança (PAG-R-01, PAG-R-02)", async () => {
    const cobranca = await criarCobrancaPendente("asaas_401");

    const response = await app.inject({
      method: "POST",
      url: "/webhooks/asaas",
      headers: { "asaas-access-token": "token-invalido" },
      payload: { event: "PAYMENT_RECEIVED", payment: { id: "asaas_401" } },
    });

    expect(response.statusCode).toBe(401);

    const atualizada = await cobrancaRepository.buscarPorId(cobranca.id);
    expect(atualizada?.status).toBe("PENDENTE");
  });

  it("confirma pagamento e retorna 200 com token válido (PAG-R-03)", async () => {
    const cobranca = await criarCobrancaPendente("asaas_200");

    const response = await app.inject({
      method: "POST",
      url: "/webhooks/asaas",
      headers: { "asaas-access-token": "test-token" },
      payload: { event: "PAYMENT_RECEIVED", payment: { id: "asaas_200" } },
    });

    expect(response.statusCode).toBe(200);

    const atualizada = await cobrancaRepository.buscarPorId(cobranca.id);
    expect(atualizada?.status).toBe("PAGO");
  });

  it("retorna 200 (idempotente) para gatewayChargeId inexistente, sem quebrar o webhook", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/webhooks/asaas",
      headers: { "asaas-access-token": "test-token" },
      payload: { event: "PAYMENT_RECEIVED", payment: { id: "asaas_inexistente" } },
    });

    expect(response.statusCode).toBe(200);
  });
});
