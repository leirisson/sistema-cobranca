import { describe, expect, it } from "vitest";

import { ResolverCredenciaisAsaasUseCase } from "../../../../src/application/configuracao/resolver-credenciais-asaas-use-case.js";
import { FakeCifrador } from "../../fakes/fake-cifrador.js";
import { FakeConfiguracaoRepository } from "../../fakes/fake-configuracao-repository.js";

describe("ResolverCredenciaisAsaasUseCase", () => {
  it("usa a env var quando nenhuma chave foi salva na Configuracao", async () => {
    const configuracaoRepository = new FakeConfiguracaoRepository();
    const cifrador = new FakeCifrador();
    const useCase = new ResolverCredenciaisAsaasUseCase(configuracaoRepository, cifrador, "chave-do-env");

    const resultado = await useCase.executar();

    expect(resultado.apiKey).toBe("chave-do-env");
  });

  it("decifra e usa a chave salva na Configuracao quando presente, ignorando a env var", async () => {
    const configuracaoRepository = new FakeConfiguracaoRepository();
    const cifrador = new FakeCifrador();
    const configuracao = await configuracaoRepository.buscar();
    configuracao.atualizarAsaasApiKeyCifrada(cifrador.cifrar("chave-do-banco"));
    await configuracaoRepository.salvar(configuracao);

    const useCase = new ResolverCredenciaisAsaasUseCase(configuracaoRepository, cifrador, "chave-do-env");

    const resultado = await useCase.executar();

    expect(resultado.apiKey).toBe("chave-do-banco");
  });
});
