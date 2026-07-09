import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { buildApp } from "../../src/infra/http/app.js";
import { Cliente } from "../../src/domain/cliente/cliente.js";
import { Cobranca } from "../../src/domain/cobranca/cobranca.js";
import { prisma } from "../../src/infra/database/prisma-client.js";
import { PrismaClienteRepository } from "../../src/infra/database/prisma-cliente-repository.js";
import { PrismaCobrancaRepository } from "../../src/infra/database/prisma-cobranca-repository.js";

describe("GET /dashboard/cobrancas", () => {
  let app: FastifyInstance;
  const clienteRepository = new PrismaClienteRepository(prisma);
  const cobrancaRepository = new PrismaCobrancaRepository(prisma);

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

  async function criarClienteComCobranca(
    nome: string,
    vencimento: string,
    status: "PENDENTE" | "PAGO" | "ATRASADO" | "CANCELADO",
    valor = 150,
  ) {
    const cliente = Cliente.criar({
      nome,
      documento: "12345678900",
      telefones: [{ numero: "+5511999998888", principal: true }],
      valorCobranca: valor,
      diaVencimento: 10,
    });
    await clienteRepository.salvar(cliente);

    const cobranca = Cobranca.criar({
      clienteId: cliente.id,
      valor,
      vencimento: new Date(vencimento),
      gatewayChargeId: `asaas_${cliente.id}`,
      linkPagamento: `https://sandbox.asaas.com/i/asaas_${cliente.id}`,
    });

    if (status === "PAGO") {
      cobranca.marcarComoPaga(new Date(vencimento));
    } else if (status === "ATRASADO") {
      cobranca.marcarComoAtrasada();
    } else if (status === "CANCELADO") {
      cobranca.cancelar();
    }

    await cobrancaRepository.salvar(cobranca);

    return cobranca;
  }

  it("lista cobranças do mês corrente por padrão (DASH-R-01)", async () => {
    await criarClienteComCobranca("Maria Silva", "2026-07-10", "PENDENTE");
    await criarClienteComCobranca("João Souza", "2026-08-10", "PENDENTE");

    const response = await app.inject({ method: "GET", url: "/dashboard/cobrancas" });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.itens).toHaveLength(1);
    expect(body.itens[0].nomeCliente).toBe("Maria Silva");
  });

  it("filtra por status (DASH-R-02)", async () => {
    await criarClienteComCobranca("Maria Silva", "2026-07-10", "PENDENTE");
    await criarClienteComCobranca("João Souza", "2026-07-12", "ATRASADO");

    const response = await app.inject({
      method: "GET",
      url: "/dashboard/cobrancas?mes=7&ano=2026&status=ATRASADO",
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.itens).toHaveLength(1);
    expect(body.itens[0].nomeCliente).toBe("João Souza");
  });

  it("calcula totais por status (DASH-R-03)", async () => {
    await criarClienteComCobranca("Maria Silva", "2026-07-10", "PENDENTE", 100);
    await criarClienteComCobranca("João Souza", "2026-07-12", "ATRASADO", 200);
    await criarClienteComCobranca("Ana Costa", "2026-07-15", "PAGO", 300);

    const response = await app.inject({ method: "GET", url: "/dashboard/cobrancas?mes=7&ano=2026" });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.totais).toEqual({ totalAReceber: 300, totalRecebido: 300, totalEmAtraso: 200 });
  });

  it("busca por nome do cliente, case-insensitive (DASH-R-04)", async () => {
    await criarClienteComCobranca("Maria Silva", "2026-07-10", "PENDENTE");
    await criarClienteComCobranca("João Souza", "2026-07-12", "PENDENTE");

    const response = await app.inject({
      method: "GET",
      url: "/dashboard/cobrancas?mes=7&ano=2026&busca=maria",
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.itens).toHaveLength(1);
    expect(body.itens[0].nomeCliente).toBe("Maria Silva");
  });

  it("retorna 400 para status inválido", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/dashboard/cobrancas?status=INVALIDO",
    });

    expect(response.statusCode).toBe(400);
  });
});
