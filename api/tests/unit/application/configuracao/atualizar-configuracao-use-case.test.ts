import { describe, expect, it } from "vitest";

import { AtualizarConfiguracaoUseCase } from "../../../../src/application/configuracao/atualizar-configuracao-use-case.js";
import { FakeCifrador } from "../../fakes/fake-cifrador.js";
import { FakeConfiguracaoRepository } from "../../fakes/fake-configuracao-repository.js";

describe("AtualizarConfiguracaoUseCase", () => {
  it("salva a chave Asaas cifrada e devolve só os últimos 4 dígitos", async () => {
    const configuracaoRepository = new FakeConfiguracaoRepository();
    const cifrador = new FakeCifrador();
    const useCase = new AtualizarConfiguracaoUseCase(configuracaoRepository, cifrador);

    const resultado = await useCase.executar({ asaasApiKey: "chave-secreta-de-teste-123456" });

    expect(resultado.asaasApiKeyConfigurada).toBe(true);
    expect(resultado.asaasApiKeyUltimosDigitos).toBe("3456");

    const configuracaoSalva = await configuracaoRepository.buscar();
    expect(configuracaoSalva.asaasApiKeyCifrada).not.toBe("chave-secreta-de-teste-123456");
    expect(cifrador.decifrar(configuracaoSalva.asaasApiKeyCifrada!)).toBe("chave-secreta-de-teste-123456");
  });

  it("edição parcial: atualizar só nomeRemetente não apaga a chave já salva", async () => {
    const configuracaoRepository = new FakeConfiguracaoRepository();
    const cifrador = new FakeCifrador();
    const useCase = new AtualizarConfiguracaoUseCase(configuracaoRepository, cifrador);
    await useCase.executar({ asaasApiKey: "chave-secreta-de-teste-123456" });

    const resultado = await useCase.executar({ nomeRemetente: "Minha Empresa" });

    expect(resultado.nomeRemetente).toBe("Minha Empresa");
    expect(resultado.asaasApiKeyConfigurada).toBe(true);
    expect(resultado.asaasApiKeyUltimosDigitos).toBe("3456");
  });

  it("asaasApiKey vazia remove a credencial salva", async () => {
    const configuracaoRepository = new FakeConfiguracaoRepository();
    const cifrador = new FakeCifrador();
    const useCase = new AtualizarConfiguracaoUseCase(configuracaoRepository, cifrador);
    await useCase.executar({ asaasApiKey: "chave-secreta-de-teste-123456" });

    const resultado = await useCase.executar({ asaasApiKey: "" });

    expect(resultado.asaasApiKeyConfigurada).toBe(false);
    expect(resultado.asaasApiKeyUltimosDigitos).toBeNull();
  });

  it("atualiza o toggle de confirmação de pagamento", async () => {
    const configuracaoRepository = new FakeConfiguracaoRepository();
    const cifrador = new FakeCifrador();
    const useCase = new AtualizarConfiguracaoUseCase(configuracaoRepository, cifrador);

    const resultado = await useCase.executar({ confirmacaoPagamentoHabilitada: true });

    expect(resultado.confirmacaoPagamentoHabilitada).toBe(true);
  });

  it("salva a mensagem de cobrança personalizada", async () => {
    const configuracaoRepository = new FakeConfiguracaoRepository();
    const cifrador = new FakeCifrador();
    const useCase = new AtualizarConfiguracaoUseCase(configuracaoRepository, cifrador);

    const resultado = await useCase.executar({ mensagemCobrancaPersonalizada: "Olá {nome}!" });

    expect(resultado.mensagemCobrancaPersonalizada).toBe("Olá {nome}!");
  });

  it("edição parcial: atualizar só nomeRemetente não apaga a mensagem personalizada já salva", async () => {
    const configuracaoRepository = new FakeConfiguracaoRepository();
    const cifrador = new FakeCifrador();
    const useCase = new AtualizarConfiguracaoUseCase(configuracaoRepository, cifrador);
    await useCase.executar({ mensagemCobrancaPersonalizada: "Olá {nome}!" });

    const resultado = await useCase.executar({ nomeRemetente: "Minha Empresa" });

    expect(resultado.mensagemCobrancaPersonalizada).toBe("Olá {nome}!");
  });

  it("mensagemCobrancaPersonalizada null remove o texto customizado salvo", async () => {
    const configuracaoRepository = new FakeConfiguracaoRepository();
    const cifrador = new FakeCifrador();
    const useCase = new AtualizarConfiguracaoUseCase(configuracaoRepository, cifrador);
    await useCase.executar({ mensagemCobrancaPersonalizada: "Olá {nome}!" });

    const resultado = await useCase.executar({ mensagemCobrancaPersonalizada: null });

    expect(resultado.mensagemCobrancaPersonalizada).toBeNull();
  });
});
