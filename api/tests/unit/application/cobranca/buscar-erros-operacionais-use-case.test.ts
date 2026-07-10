import { describe, expect, it } from "vitest";

import { BuscarErrosOperacionaisUseCase } from "../../../../src/application/cobranca/buscar-erros-operacionais-use-case.js";
import { FakeDashboardCobrancaQuery } from "../../fakes/fake-dashboard-cobranca-query.js";

describe("BuscarErrosOperacionaisUseCase", () => {
  it("devolve erros de geração de cobrança e mensagens com falha, respeitando o limite padrão", async () => {
    const query = new FakeDashboardCobrancaQuery();
    query.errosGeracaoCobranca = [
      { id: "erro-1", clienteId: "c1", nomeCliente: "Maria", mensagemErro: "timeout", ocorridoEm: new Date() },
    ];
    query.mensagensComFalha = [
      {
        id: "msg-1",
        cobrancaId: "cob-1",
        nomeCliente: "João",
        tipo: "LEMBRETE",
        canal: "whatsapp",
        enviadoEm: new Date(),
      },
    ];
    const useCase = new BuscarErrosOperacionaisUseCase(query);

    const resultado = await useCase.executar();

    expect(resultado.errosGeracaoCobranca).toHaveLength(1);
    expect(resultado.mensagensComFalha).toHaveLength(1);
  });

  it("aceita um limite customizado, passado a ambas as listagens", async () => {
    const query = new FakeDashboardCobrancaQuery();
    const useCase = new BuscarErrosOperacionaisUseCase(query);

    await useCase.executar(10);

    expect(query.errosGeracaoCobranca.length).toBeLessThanOrEqual(10);
  });
});
