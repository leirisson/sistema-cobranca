import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { Cliente } from "../../src/domain/cliente/cliente.js";
import { Cobranca } from "../../src/domain/cobranca/cobranca.js";
import { prisma } from "../../src/infra/database/prisma-client.js";
import { PrismaClienteRepository } from "../../src/infra/database/prisma-cliente-repository.js";
import { PrismaCobrancaRepository } from "../../src/infra/database/prisma-cobranca-repository.js";

describe("PrismaCobrancaRepository", () => {
  const clienteRepository = new PrismaClienteRepository(prisma);
  const repository = new PrismaCobrancaRepository(prisma);

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterEach(async () => {
    await prisma.cobranca.deleteMany();
    await prisma.telefoneCliente.deleteMany();
    await prisma.cliente.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function criarClienteSalvo() {
    const cliente = Cliente.criar({
      nome: "Maria Silva",
      documento: "12345678900",
      telefones: [{ numero: "+5511999998888", principal: true }],
      valorCobranca: 150,
      diaVencimento: 10,
    });
    await clienteRepository.salvar(cliente);

    return cliente;
  }

  function criarCobranca(clienteId: string, vencimento: Date) {
    return Cobranca.criar({
      clienteId,
      valor: 150,
      vencimento,
      gatewayChargeId: "asaas_123",
      linkPagamento: "https://sandbox.asaas.com/i/asaas_123",
    });
  }

  it("salva e busca uma cobrança por id", async () => {
    const cliente = await criarClienteSalvo();
    const cobranca = criarCobranca(cliente.id, new Date("2026-08-10"));

    await repository.salvar(cobranca);
    const encontrada = await repository.buscarPorId(cobranca.id);

    expect(encontrada?.id).toBe(cobranca.id);
    expect(encontrada?.clienteId).toBe(cliente.id);
    expect(encontrada?.status).toBe("PENDENTE");
    expect(encontrada?.valor).toBe(150);
  });

  it("retorna null ao buscar id inexistente", async () => {
    const encontrada = await repository.buscarPorId("id-inexistente");

    expect(encontrada).toBeNull();
  });

  it("atualiza uma cobrança existente ao salvar novamente (upsert)", async () => {
    const cliente = await criarClienteSalvo();
    const cobranca = criarCobranca(cliente.id, new Date("2026-08-10"));
    await repository.salvar(cobranca);

    cobranca.marcarComoPaga(new Date("2026-08-09"));
    await repository.salvar(cobranca);

    const encontrada = await repository.buscarPorId(cobranca.id);
    expect(encontrada?.status).toBe("PAGO");
    expect(encontrada?.paidAt).toEqual(new Date("2026-08-09"));
  });

  it("identifica cobrança existente para o ciclo vigente (COB-R-04)", async () => {
    const cliente = await criarClienteSalvo();
    await repository.salvar(criarCobranca(cliente.id, new Date("2026-08-10")));

    const existe = await repository.existeParaCicloVigente(cliente.id, new Date("2026-08-20"));

    expect(existe).toBe(true);
  });

  it("não considera cobrança cancelada como duplicidade", async () => {
    const cliente = await criarClienteSalvo();
    const cobranca = criarCobranca(cliente.id, new Date("2026-08-10"));
    cobranca.cancelar();
    await repository.salvar(cobranca);

    const existe = await repository.existeParaCicloVigente(cliente.id, new Date("2026-08-20"));

    expect(existe).toBe(false);
  });

  it("não identifica duplicidade para ciclo de outro mês", async () => {
    const cliente = await criarClienteSalvo();
    await repository.salvar(criarCobranca(cliente.id, new Date("2026-08-10")));

    const existe = await repository.existeParaCicloVigente(cliente.id, new Date("2026-09-10"));

    expect(existe).toBe(false);
  });
});
