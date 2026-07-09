import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { Configuracao, ID_CONFIGURACAO_DEFAULT } from "../../src/domain/configuracao/configuracao.js";
import { prisma } from "../../src/infra/database/prisma-client.js";
import { PrismaConfiguracaoRepository } from "../../src/infra/database/prisma-configuracao-repository.js";

describe("PrismaConfiguracaoRepository", () => {
  const repository = new PrismaConfiguracaoRepository(prisma);

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterEach(async () => {
    await prisma.configuracao.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("cria o registro default na primeira leitura, quando ainda não existe nenhum", async () => {
    const configuracao = await repository.buscar();

    expect(configuracao.id).toBe(ID_CONFIGURACAO_DEFAULT);
    expect(configuracao.confirmacaoPagamentoHabilitada).toBe(false);
    expect(configuracao.possuiAsaasApiKeyConfigurada()).toBe(false);
  });

  it("buscar() chamado duas vezes não duplica a linha", async () => {
    await repository.buscar();
    await repository.buscar();

    const total = await prisma.configuracao.count();

    expect(total).toBe(1);
  });

  it("salvar() persiste alterações e buscar() reflete o novo estado", async () => {
    const configuracao = await repository.buscar();

    configuracao.atualizarAsaasApiKeyCifrada("iv:tag:cipher");
    configuracao.atualizarNomeRemetente("Minha Empresa");
    configuracao.atualizarConfirmacaoPagamentoHabilitada(true);

    await repository.salvar(configuracao);

    const recarregada = await repository.buscar();

    expect(recarregada.asaasApiKeyCifrada).toBe("iv:tag:cipher");
    expect(recarregada.nomeRemetente).toBe("Minha Empresa");
    expect(recarregada.confirmacaoPagamentoHabilitada).toBe(true);
  });

  it("salvar() com asaasApiKeyCifrada null remove a credencial salva", async () => {
    const configuracao = Configuracao.criar({ asaasApiKeyCifrada: "iv:tag:cipher" });
    await repository.salvar(configuracao);

    configuracao.atualizarAsaasApiKeyCifrada(null);
    await repository.salvar(configuracao);

    const recarregada = await repository.buscar();

    expect(recarregada.possuiAsaasApiKeyConfigurada()).toBe(false);
  });
});
