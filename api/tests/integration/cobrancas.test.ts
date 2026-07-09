import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { buildApp } from "../../src/infra/http/app.js";
import { Cliente } from "../../src/domain/cliente/cliente.js";
import { env } from "../../src/shared/config/env.js";
import { prisma } from "../../src/infra/database/prisma-client.js";
import { PrismaClienteRepository } from "../../src/infra/database/prisma-cliente-repository.js";
import { PrismaCobrancaRepository } from "../../src/infra/database/prisma-cobranca-repository.js";
import { JwtGeradorToken } from "../../src/infra/auth/jwt-gerador-token.js";

describe("Rotas /cobrancas", () => {
  let app: FastifyInstance;
  const clienteRepository = new PrismaClienteRepository(prisma);
  const geradorToken = new JwtGeradorToken({ secret: env.JWT_SECRET, expiresIn: env.JWT_EXPIRES_IN });
  const token = geradorToken.gerar({ sub: "usuario-teste", email: "dono@cobracerta.com" });
  const authHeader = { authorization: `Bearer ${token}` };

  beforeAll(async () => {
    await prisma.$connect();
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await prisma.mensagemEnviada.deleteMany();
    await prisma.cobranca.deleteMany();
    await prisma.telefoneCliente.deleteMany();
    await prisma.cliente.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  async function criarCliente(status: "ATIVO" | "INATIVO" = "ATIVO") {
    const cliente = Cliente.criar({
      nome: "Maria Silva",
      documento: "24971563792",
      telefones: [{ numero: "+5511999998888", principal: true }],
      valorCobranca: 150,
      diaVencimento: 10,
    });

    if (status === "INATIVO") {
      cliente.inativar();
    }

    await clienteRepository.salvar(cliente);

    return cliente;
  }

  it("rejeita requisição sem token com 401", async () => {
    const response = await app.inject({ method: "POST", url: "/cobrancas", payload: {} });

    expect(response.statusCode).toBe(401);
  });

  it("cria cobrança avulsa para cliente ativo (AVULSA-R-01)", async () => {
    const cliente = await criarCliente();

    const response = await app.inject({
      method: "POST",
      url: "/cobrancas",
      headers: authHeader,
      payload: {
        clienteId: cliente.id,
        valor: 300,
        vencimento: "2026-08-20",
        descricao: "Serviço extra - troca de peça",
      },
    });
    const body = response.json();

    expect(response.statusCode).toBe(201);
    expect(body.status).toBe("PENDENTE");
    expect(body.origem).toBe("AVULSA");
    expect(body.linkPagamento).toEqual(expect.any(String));

    const cobrancaPersistida = await prisma.cobranca.findUnique({ where: { id: body.id } });
    expect(cobrancaPersistida?.origem).toBe("AVULSA");
    expect(cobrancaPersistida?.descricao).toBe("Serviço extra - troca de peça");
    expect(Number(cobrancaPersistida?.valor)).toBe(300);
  });

  it("retorna 404 quando clienteId não existe (AVULSA-R-01)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/cobrancas",
      headers: authHeader,
      payload: { clienteId: "id-inexistente", valor: 100, vencimento: "2026-08-20" },
    });

    expect(response.statusCode).toBe(404);
  });

  it("retorna 400 quando cliente está INATIVO (AVULSA-R-02)", async () => {
    const cliente = await criarCliente("INATIVO");

    const response = await app.inject({
      method: "POST",
      url: "/cobrancas",
      headers: authHeader,
      payload: { clienteId: cliente.id, valor: 100, vencimento: "2026-08-20" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("retorna 400 para valor inválido", async () => {
    const cliente = await criarCliente();

    const response = await app.inject({
      method: "POST",
      url: "/cobrancas",
      headers: authHeader,
      payload: { clienteId: cliente.id, valor: -10, vencimento: "2026-08-20" },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe("PATCH /dashboard/cobrancas/:id/cancelar", () => {
  let app: FastifyInstance;
  const clienteRepository = new PrismaClienteRepository(prisma);
  const geradorToken = new JwtGeradorToken({ secret: env.JWT_SECRET, expiresIn: env.JWT_EXPIRES_IN });
  const token = geradorToken.gerar({ sub: "usuario-teste", email: "dono@cobracerta.com" });
  const authHeader = { authorization: `Bearer ${token}` };

  beforeAll(async () => {
    await prisma.$connect();
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await prisma.mensagemEnviada.deleteMany();
    await prisma.cobranca.deleteMany();
    await prisma.telefoneCliente.deleteMany();
    await prisma.cliente.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  async function criarClienteECobrancaViaApi() {
    const cliente = Cliente.criar({
      nome: "Maria Silva",
      documento: "24971563792",
      telefones: [{ numero: "+5511999998888", principal: true }],
      valorCobranca: 150,
      diaVencimento: 10,
    });
    await clienteRepository.salvar(cliente);

    const criacao = await app.inject({
      method: "POST",
      url: "/cobrancas",
      headers: authHeader,
      payload: { clienteId: cliente.id, valor: 150, vencimento: "2026-08-20" },
    });

    const cobrancaId = criacao.json().id as string;

    // POST /cobrancas dispara o lembrete inicial de forma assíncrona (fire-and-forget);
    // aguarda a MensagemEnviada ser persistida para não colidir com o afterEach (FK).
    for (let tentativas = 0; tentativas < 20; tentativas++) {
      const existeMensagem = await prisma.mensagemEnviada.findFirst({ where: { cobrancaId } });
      if (existeMensagem) break;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    return cobrancaId;
  }

  it("rejeita requisição sem token com 401", async () => {
    const response = await app.inject({ method: "PATCH", url: "/dashboard/cobrancas/qualquer-id/cancelar" });

    expect(response.statusCode).toBe(401);
  });

  it("cancela cobrança PENDENTE e persiste CANCELADO (CANC-R-01)", async () => {
    const cobrancaId = await criarClienteECobrancaViaApi();

    const response = await app.inject({
      method: "PATCH",
      url: `/dashboard/cobrancas/${cobrancaId}/cancelar`,
      headers: authHeader,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe("CANCELADO");

    const persistida = await prisma.cobranca.findUnique({ where: { id: cobrancaId } });
    expect(persistida?.status).toBe("CANCELADO");
  });

  it("retorna 404 quando a cobrança não existe", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/dashboard/cobrancas/inexistente/cancelar",
      headers: authHeader,
    });

    expect(response.statusCode).toBe(404);
  });

  it("retorna 400 ao tentar cancelar cobrança já PAGO (CANC-R-02)", async () => {
    const cobrancaId = await criarClienteECobrancaViaApi();
    const cobranca = await new PrismaCobrancaRepository(prisma).buscarPorId(cobrancaId);
    cobranca!.marcarComoPaga(new Date());
    await new PrismaCobrancaRepository(prisma).salvar(cobranca!);

    const response = await app.inject({
      method: "PATCH",
      url: `/dashboard/cobrancas/${cobrancaId}/cancelar`,
      headers: authHeader,
    });

    expect(response.statusCode).toBe(400);
  });
});
