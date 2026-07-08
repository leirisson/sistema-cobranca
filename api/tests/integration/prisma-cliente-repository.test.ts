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
    await prisma.telefoneCliente.deleteMany();
    await prisma.cliente.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  function criarCliente(nome: string) {
    return Cliente.criar({
      nome,
      documento: "12345678900",
      telefones: [{ numero: "+5511999998888", principal: true }],
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
    expect(encontrado?.telefonePrincipal?.numero).toBe("+5511999998888");
  });

  it("salva e busca múltiplos telefones de um cliente (CAD-EXT-R-04)", async () => {
    const cliente = Cliente.criar({
      nome: "Maria Silva",
      documento: "12345678900",
      telefones: [
        { numero: "+5511999998888", principal: false },
        { numero: "+5511988887777", principal: true },
      ],
      valorCobranca: 150,
      diaVencimento: 10,
    });

    await repository.salvar(cliente);
    const encontrado = await repository.buscarPorId(cliente.id);

    expect(encontrado?.telefones).toHaveLength(2);
    expect(encontrado?.telefonePrincipal?.numero).toBe("+5511988887777");
  });

  it("persiste campos opcionais de endereço e contato quando presentes (CAD-EXT-R-03)", async () => {
    const cliente = Cliente.criar({
      nome: "Oficina Norte Freios",
      documento: "12345678000199",
      telefones: [{ numero: "+5592999998888", principal: true }],
      valorCobranca: 300,
      diaVencimento: 5,
      inscricaoEstadual: "123456789",
      endereco: {
        rua: "Rua das Flores",
        numero: "100",
        bairro: "Centro",
        cidade: "Manaus",
        uf: "AM",
        cep: "69000-000",
      },
      nomeContato: "GEL",
      referenciaServico: "Placa ABC-1234",
    });

    await repository.salvar(cliente);
    const encontrado = await repository.buscarPorId(cliente.id);

    expect(encontrado?.tipoDocumento).toBe("CNPJ");
    expect(encontrado?.endereco?.cidade).toBe("Manaus");
    expect(encontrado?.nomeContato).toBe("GEL");
    expect(encontrado?.referenciaServico).toBe("Placa ABC-1234");
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
