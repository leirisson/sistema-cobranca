import { describe, expect, it } from "vitest";

import { Configuracao } from "../../../../src/domain/configuracao/configuracao.js";
import { resolverConfirmacaoHabilitada } from "../../../../src/application/configuracao/resolver-confirmacao-habilitada.js";

describe("resolverConfirmacaoHabilitada", () => {
  it("usa o valor da env var enquanto o usuário nunca configurou o toggle pela tela", () => {
    const configuracao = Configuracao.criar({});

    expect(resolverConfirmacaoHabilitada(configuracao, true)).toBe(true);
    expect(resolverConfirmacaoHabilitada(configuracao, false)).toBe(false);
  });

  it("usa o valor persistido na Configuracao assim que o usuário configurou pela tela, mesmo ligando", () => {
    const configuracao = Configuracao.criar({});
    configuracao.atualizarConfirmacaoPagamentoHabilitada(true);

    expect(resolverConfirmacaoHabilitada(configuracao, false)).toBe(true);
  });

  it("usa o valor persistido na Configuracao assim que o usuário configurou pela tela, mesmo desligando", () => {
    const configuracao = Configuracao.criar({});
    configuracao.atualizarConfirmacaoPagamentoHabilitada(false);

    expect(resolverConfirmacaoHabilitada(configuracao, true)).toBe(false);
  });
});
