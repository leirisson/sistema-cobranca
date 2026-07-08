import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { Cliente } from "../../src/domain/cliente/cliente.js";
import { prisma } from "../../src/infra/database/prisma-client.js";
import { PrismaClienteRepository } from "../../src/infra/database/prisma-cliente-repository.js";

describe("PrismaClienteRepository", () => {
  const repository = new PrismaClienteRepository(prisma);

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterEach(async () => {
    await prisma.cliente.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  function criarCliente(nome: string) {
    return Cliente.criar({
      nome,
      telefone: "+5511999998888",
      valorCobranca: 150,
      diaVencimento: 10,
    });
  }

  it("salva e busca um cliente por id", async () => {
    const cliente = criarCliente("Maria Silva");

    await repository.salvar(cliente);
    const encontrado = await repository.buscarPorId(cliente.id);

    expect(encontrado?.id).toBe(cliente.id);
    expect(encontrado?.nome).toBe("Maria Silva");
    expect(encontrado?.status).toBe("ATIVO");
    expect(encontrado?.valorCobranca).toBe(150);
  });

  it("retorna null ao buscar id inexistente", async () => {
    const encontrado = await repository.buscarPorId("id-inexistente");

    expect(encontrado).toBeNull();
  });

  it("atualiza um cliente existente ao salvar novamente (upsert)", async () => {
    const cliente = criarCliente("Maria Silva");
    await repository.salvar(cliente);

    cliente.inativar();
    await repository.salvar(cliente);

    const encontrado = await repository.buscarPorId(cliente.id);
    expect(encontrado?.status).toBe("INATIVO");
  });

  it("busca clientes por nome (parcial, case-insensitive) (CAD-05)", async () => {
    await repository.salvar(criarCliente("Maria Silva"));
    await repository.salvar(criarCliente("João Souza"));
    await repository.salvar(criarCliente("Mariana Costa"));

    const encontrados = await repository.buscarPorNome("mari");

    expect(encontrados).toHaveLength(2);
    expect(encontrados.map((c) => c.nome).sort()).toEqual(["Maria Silva", "Mariana Costa"]);
  });
});
