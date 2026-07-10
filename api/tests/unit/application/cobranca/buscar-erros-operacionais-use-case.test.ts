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

    expect(resultado.errosGeracaoCobranca.itens).toHaveLength(1);
    expect(resultado.mensagensComFalha.itens).toHaveLength(1);
  });

  it("pagina cada listagem de forma independente", async () => {
    const query = new FakeDashboardCobrancaQuery();
    query.errosGeracaoCobranca = Array.from({ length: 25 }, (_, i) => ({
      id: `erro-${i + 1}`,
      clienteId: "c1",
      nomeCliente: "Maria",
      mensagemErro: "timeout",
      ocorridoEm: new Date(),
    }));
    const useCase = new BuscarErrosOperacionaisUseCase(query);

    const resultado = await useCase.executar({ paginaErros: 2 });

    expect(resultado.errosGeracaoCobranca.itens).toHaveLength(5);
    expect(resultado.errosGeracaoCobranca.paginaAtual).toBe(2);
    expect(resultado.mensagensComFalha.paginaAtual).toBe(1);
  });

  it("aceita itensPorPagina customizado, aplicado a ambas as listagens", async () => {
    const query = new FakeDashboardCobrancaQuery();
    query.errosGeracaoCobranca = Array.from({ length: 15 }, (_, i) => ({
      id: `erro-${i + 1}`,
      clienteId: "c1",
      nomeCliente: "Maria",
      mensagemErro: "timeout",
      ocorridoEm: new Date(),
    }));
    const useCase = new BuscarErrosOperacionaisUseCase(query);

    const resultado = await useCase.executar({ itensPorPagina: 10 });

    expect(resultado.errosGeracaoCobranca.itens).toHaveLength(10);
    expect(resultado.errosGeracaoCobranca.totalPaginas).toBe(2);
  });
});
