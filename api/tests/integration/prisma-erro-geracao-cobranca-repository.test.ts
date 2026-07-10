import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { ErroGeracaoCobranca } from "../../src/domain/cobranca/erro-geracao-cobranca.js";
import { prisma } from "../../src/infra/database/prisma-client.js";
import { PrismaErroGeracaoCobrancaRepository } from "../../src/infra/database/prisma-erro-geracao-cobranca-repository.js";

describe("PrismaErroGeracaoCobrancaRepository", () => {
  const repository = new PrismaErroGeracaoCobrancaRepository(prisma);

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterEach(async () => {
    await prisma.erroGeracaoCobranca.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("salva um registro de erro de geração de cobrança", async () => {
    const erro = ErroGeracaoCobranca.criar({
      clienteId: "cliente-1",
      nomeCliente: "Maria Silva",
      mensagemErro: "Falha ao criar cobrança no Asaas: timeout",
    });

    await repository.salvar(erro);

    const registros = await prisma.erroGeracaoCobranca.findMany({ where: { clienteId: "cliente-1" } });
    expect(registros).toHaveLength(1);
    expect(registros[0]?.nomeCliente).toBe("Maria Silva");
    expect(registros[0]?.mensagemErro).toBe("Falha ao criar cobrança no Asaas: timeout");
  });

  it("lista os erros mais recentes primeiro, respeitando o limite", async () => {
    const erroAntigo = ErroGeracaoCobranca.restaurar({
      id: "erro-antigo",
      clienteId: "cliente-1",
      nomeCliente: "Cliente 1",
      mensagemErro: "falha antiga",
      ocorridoEm: new Date("2026-07-01T10:00:00Z"),
    });
    const erroRecente = ErroGeracaoCobranca.restaurar({
      id: "erro-recente",
      clienteId: "cliente-2",
      nomeCliente: "Cliente 2",
      mensagemErro: "falha recente",
      ocorridoEm: new Date("2026-07-05T10:00:00Z"),
    });

    await repository.salvar(erroAntigo);
    await repository.salvar(erroRecente);

    const recentes = await repository.listarRecentes(1);

    expect(recentes).toHaveLength(1);
    expect(recentes[0]?.id).toBe("erro-recente");
  });
});
