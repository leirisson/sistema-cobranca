import { describe, expect, it } from "vitest";

import { Configuracao, ID_CONFIGURACAO_DEFAULT } from "../../../../src/domain/configuracao/configuracao.js";

describe("Configuracao", () => {
  it("cria com id fixo e defaults quando nenhum campo é informado", () => {
    const configuracao = Configuracao.criar({});

    expect(configuracao.id).toBe(ID_CONFIGURACAO_DEFAULT);
    expect(configuracao.asaasApiKeyCifrada).toBeNull();
    expect(configuracao.nomeRemetente).toBeNull();
    expect(configuracao.confirmacaoPagamentoHabilitada).toBe(false);
    expect(configuracao.confirmacaoPagamentoConfiguradaPeloUsuario).toBe(false);
    expect(configuracao.possuiAsaasApiKeyConfigurada()).toBe(false);
  });

  it("restaura preservando id e timestamps originais", () => {
    const createdAt = new Date("2026-01-01T00:00:00Z");
    const updatedAt = new Date("2026-01-02T00:00:00Z");

    const configuracao = Configuracao.restaurar({
      id: ID_CONFIGURACAO_DEFAULT,
      asaasApiKeyCifrada: "iv:tag:cipher",
      nomeRemetente: "Minha Empresa",
      confirmacaoPagamentoHabilitada: true,
      confirmacaoPagamentoConfiguradaPeloUsuario: true,
      createdAt,
      updatedAt,
    });

    expect(configuracao.id).toBe(ID_CONFIGURACAO_DEFAULT);
    expect(configuracao.createdAt).toBe(createdAt);
    expect(configuracao.updatedAt).toBe(updatedAt);
    expect(configuracao.possuiAsaasApiKeyConfigurada()).toBe(true);
  });

  it("atualizarAsaasApiKeyCifrada altera o campo e updatedAt", () => {
    const configuracao = Configuracao.criar({});
    const updatedAtAntes = configuracao.updatedAt;

    configuracao.atualizarAsaasApiKeyCifrada("iv:tag:cipher");

    expect(configuracao.asaasApiKeyCifrada).toBe("iv:tag:cipher");
    expect(configuracao.possuiAsaasApiKeyConfigurada()).toBe(true);
    expect(configuracao.updatedAt.getTime()).toBeGreaterThanOrEqual(updatedAtAntes.getTime());
  });

  it("atualizarAsaasApiKeyCifrada com null remove a credencial configurada", () => {
    const configuracao = Configuracao.restaurar({
      id: ID_CONFIGURACAO_DEFAULT,
      asaasApiKeyCifrada: "iv:tag:cipher",
      nomeRemetente: null,
      confirmacaoPagamentoHabilitada: false,
      confirmacaoPagamentoConfiguradaPeloUsuario: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    configuracao.atualizarAsaasApiKeyCifrada(null);

    expect(configuracao.asaasApiKeyCifrada).toBeNull();
    expect(configuracao.possuiAsaasApiKeyConfigurada()).toBe(false);
  });

  it("atualizarNomeRemetente altera o campo", () => {
    const configuracao = Configuracao.criar({});

    configuracao.atualizarNomeRemetente("Minha Empresa");

    expect(configuracao.nomeRemetente).toBe("Minha Empresa");
  });

  it("atualizarConfirmacaoPagamentoHabilitada altera o campo e marca como configurado pelo usuário", () => {
    const configuracao = Configuracao.criar({});

    configuracao.atualizarConfirmacaoPagamentoHabilitada(true);

    expect(configuracao.confirmacaoPagamentoHabilitada).toBe(true);
    expect(configuracao.confirmacaoPagamentoConfiguradaPeloUsuario).toBe(true);
  });

  it("atualizarConfirmacaoPagamentoHabilitada com false também marca como configurado pelo usuário", () => {
    const configuracao = Configuracao.criar({});

    configuracao.atualizarConfirmacaoPagamentoHabilitada(false);

    expect(configuracao.confirmacaoPagamentoHabilitada).toBe(false);
    expect(configuracao.confirmacaoPagamentoConfiguradaPeloUsuario).toBe(true);
  });

  it("atualizarMensagemCobrancaPersonalizada altera o campo", () => {
    const configuracao = Configuracao.criar({});

    configuracao.atualizarMensagemCobrancaPersonalizada("Olá {nome}! Sua cobrança de {valor} vence em {vencimento}.");

    expect(configuracao.mensagemCobrancaPersonalizada).toBe(
      "Olá {nome}! Sua cobrança de {valor} vence em {vencimento}.",
    );
  });

  it("atualizarMensagemCobrancaPersonalizada com null remove o texto customizado", () => {
    const configuracao = Configuracao.restaurar({
      id: ID_CONFIGURACAO_DEFAULT,
      asaasApiKeyCifrada: null,
      nomeRemetente: null,
      mensagemCobrancaPersonalizada: "texto antigo",
      confirmacaoPagamentoHabilitada: false,
      confirmacaoPagamentoConfiguradaPeloUsuario: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    configuracao.atualizarMensagemCobrancaPersonalizada(null);

    expect(configuracao.mensagemCobrancaPersonalizada).toBeNull();
  });
});
