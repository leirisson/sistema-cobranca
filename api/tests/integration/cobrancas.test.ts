import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { buildApp } from "../../src/infra/http/app.js";
import { Cliente } from "../../src/domain/cliente/cliente.js";
import { env } from "../../src/shared/config/env.js";
import { prisma } from "../../src/infra/database/prisma-client.js";
import { PrismaClienteRepository } from "../../src/infra/database/prisma-cliente-repository.js";
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
