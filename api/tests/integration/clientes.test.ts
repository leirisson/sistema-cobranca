import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { buildApp } from "../../src/infra/http/app.js";
import { Cliente } from "../../src/domain/cliente/cliente.js";
import { env } from "../../src/shared/config/env.js";
import { prisma } from "../../src/infra/database/prisma-client.js";
import { PrismaClienteRepository } from "../../src/infra/database/prisma-cliente-repository.js";
import { JwtGeradorToken } from "../../src/infra/auth/jwt-gerador-token.js";

describe("Rotas /clientes", () => {
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

  async function criarCliente(nome: string, status: "ATIVO" | "INATIVO" = "ATIVO") {
    const cliente = Cliente.criar({
      nome,
      documento: "12345678900",
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

  it("rejeita requisição sem token com 401 (AUTH-04)", async () => {
    const response = await app.inject({ method: "GET", url: "/clientes" });

    expect(response.statusCode).toBe(401);
  });

  it("rejeita token inválido com 401", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/clientes",
      headers: { authorization: "Bearer token-invalido" },
    });

    expect(response.statusCode).toBe(401);
  });

  it("lista clientes com token válido (CAD-HTTP-01)", async () => {
    await criarCliente("Maria Silva");
    await criarCliente("João Souza", "INATIVO");

    const response = await app.inject({ method: "GET", url: "/clientes", headers: authHeader });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveLength(2);
  });

  it("filtra clientes por busca e status combinados", async () => {
    await criarCliente("Maria Silva");
    await criarCliente("Maria Souza", "INATIVO");

    const response = await app.inject({
      method: "GET",
      url: "/clientes?busca=maria&status=ATIVO",
      headers: authHeader,
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].nome).toBe("Maria Silva");
  });

  it("retorna 400 para status inválido na listagem", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/clientes?status=INVALIDO",
      headers: authHeader,
    });

    expect(response.statusCode).toBe(400);
  });

  it("busca cliente por id (CAD-HTTP-05)", async () => {
    const cliente = await criarCliente("Maria Silva");

    const response = await app.inject({ method: "GET", url: `/clientes/${cliente.id}`, headers: authHeader });

    expect(response.statusCode).toBe(200);
    expect(response.json().nome).toBe("Maria Silva");
  });

  it("retorna 404 para id inexistente", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/clientes/id-inexistente",
      headers: authHeader,
    });

    expect(response.statusCode).toBe(404);
  });

  it("cria cliente (CAD-HTTP-02)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/clientes",
      headers: authHeader,
      payload: {
        nome: "Nova Cliente",
        documento: "98765432100",
        telefones: [{ numero: "+5511988887777", principal: true }],
        valorCobranca: 200,
        diaVencimento: 15,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().nome).toBe("Nova Cliente");
    expect(response.json().status).toBe("ATIVO");
  });

  it("retorna 400 com erro estruturado para dados inválidos na criação", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/clientes",
      headers: authHeader,
      payload: {
        nome: "",
        documento: "98765432100",
        telefones: [{ numero: "+5511988887777", principal: true }],
        valorCobranca: 200,
        diaVencimento: 15,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toEqual(expect.any(String));
  });

  it("edita cliente (CAD-HTTP-03)", async () => {
    const cliente = await criarCliente("Maria Silva");

    const response = await app.inject({
      method: "PUT",
      url: `/clientes/${cliente.id}`,
      headers: authHeader,
      payload: { nome: "Maria Silva Atualizada" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().nome).toBe("Maria Silva Atualizada");
  });

  it("retorna 404 ao editar cliente inexistente", async () => {
    const response = await app.inject({
      method: "PUT",
      url: "/clientes/id-inexistente",
      headers: authHeader,
      payload: { nome: "Qualquer" },
    });

    expect(response.statusCode).toBe(404);
  });

  it("inativa cliente via PATCH /clientes/:id/status (CAD-HTTP-04)", async () => {
    const cliente = await criarCliente("Maria Silva");

    const response = await app.inject({
      method: "PATCH",
      url: `/clientes/${cliente.id}/status`,
      headers: authHeader,
      payload: { status: "INATIVO" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe("INATIVO");
  });

  it("reativa cliente via PATCH /clientes/:id/status (CAD-HTTP-04)", async () => {
    const cliente = await criarCliente("Maria Silva", "INATIVO");

    const response = await app.inject({
      method: "PATCH",
      url: `/clientes/${cliente.id}/status`,
      headers: authHeader,
      payload: { status: "ATIVO" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe("ATIVO");
  });

  it("retorna 400 para status inválido no PATCH", async () => {
    const cliente = await criarCliente("Maria Silva");

    const response = await app.inject({
      method: "PATCH",
      url: `/clientes/${cliente.id}/status`,
      headers: authHeader,
      payload: { status: "QUALQUER" },
    });

    expect(response.statusCode).toBe(400);
  });
});
