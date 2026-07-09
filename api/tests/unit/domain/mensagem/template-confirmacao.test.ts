import { describe, expect, it } from "vitest";

import {
  montarEmailConfirmacao,
  montarTextoConfirmacao,
} from "../../../../src/domain/mensagem/template-confirmacao.js";

function dadosBase() {
  return {
    nomeCliente: "Maria Silva",
    valor: 150,
    vencimento: new Date("2026-08-10"),
  };
}

describe("montarTextoConfirmacao", () => {
  it("monta texto de confirmação com nome e valor pago", () => {
    const texto = montarTextoConfirmacao(dadosBase());

    expect(texto).toContain("Maria Silva");
    expect(texto).toContain("150");
  });
});

describe("montarEmailConfirmacao", () => {
  it("monta assunto e corpo HTML de confirmação", () => {
    const email = montarEmailConfirmacao(dadosBase());

    expect(email.assunto).toContain("Confirmação");
    expect(email.corpoHtml).toContain("Maria Silva");
    expect(email.corpoHtml).toContain("150");
  });

  it("inclui o nome do remetente no corpo quando informado", () => {
    const email = montarEmailConfirmacao({ ...dadosBase(), nomeRemetente: "Minha Empresa" });

    expect(email.corpoHtml).toContain("Minha Empresa");
  });
});

describe("montarTextoConfirmacao com nomeRemetente", () => {
  it("inclui o nome do remetente ao final quando informado", () => {
    const texto = montarTextoConfirmacao({ ...dadosBase(), nomeRemetente: "Minha Empresa" });

    expect(texto).toContain("Minha Empresa");
  });
});
