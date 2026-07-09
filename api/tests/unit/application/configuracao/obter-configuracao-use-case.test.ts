import { describe, expect, it } from "vitest";

import { ObterConfiguracaoUseCase } from "../../../../src/application/configuracao/obter-configuracao-use-case.js";
import { FakeCifrador } from "../../fakes/fake-cifrador.js";
import { FakeConfiguracaoRepository } from "../../fakes/fake-configuracao-repository.js";

describe("ObterConfiguracaoUseCase", () => {
  it("devolve defaults quando nenhuma configuração foi salva ainda", async () => {
    const useCase = new ObterConfiguracaoUseCase(new FakeConfiguracaoRepository(), new FakeCifrador());

    const resultado = await useCase.executar();

    expect(resultado).toEqual({
      asaasApiKeyConfigurada: false,
      asaasApiKeyUltimosDigitos: null,
      nomeRemetente: null,
      confirmacaoPagamentoHabilitada: false,
    });
  });

  it("nunca devolve a chave Asaas em claro, só os últimos 4 dígitos", async () => {
    const configuracaoRepository = new FakeConfiguracaoRepository();
    const cifrador = new FakeCifrador();
    const configuracao = await configuracaoRepository.buscar();
    configuracao.atualizarAsaasApiKeyCifrada(cifrador.cifrar("chave-secreta-de-teste-123456"));
    await configuracaoRepository.salvar(configuracao);

    const useCase = new ObterConfiguracaoUseCase(configuracaoRepository, cifrador);
    const resultado = await useCase.executar();

    expect(resultado.asaasApiKeyConfigurada).toBe(true);
    expect(resultado.asaasApiKeyUltimosDigitos).toBe("3456");
    expect(JSON.stringify(resultado)).not.toContain("chave-secreta-de-teste-123456");
  });
});
