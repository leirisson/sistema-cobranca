import { describe, expect, it } from "vitest";

import { montarTextoMensagem } from "../../../../src/domain/mensagem/template-mensagem.js";

function dadosBase() {
  return {
    nomeCliente: "Maria Silva",
    valor: 150,
    vencimento: new Date("2026-08-10"),
    linkPagamento: "https://sandbox.asaas.com/i/asaas_123",
  };
}

describe("montarTextoMensagem", () => {
  it("monta texto de LEMBRETE com nome, valor, vencimento e link (MSG-R-01)", () => {
    const texto = montarTextoMensagem("LEMBRETE", dadosBase());

    expect(texto).toContain("Maria Silva");
    expect(texto).toContain("150");
    expect(texto).toContain("10/08/2026");
    expect(texto).toContain(dadosBase().linkPagamento);
  });

  it("monta texto de VENCIMENTO", () => {
    const texto = montarTextoMensagem("VENCIMENTO", dadosBase());

    expect(texto).toContain("vence hoje");
  });

  it("monta texto de ATRASO", () => {
    const texto = montarTextoMensagem("ATRASO", dadosBase());

    expect(texto).toContain("atraso");
  });

  it("rejeita template para CONFIRMACAO (fora de escopo deste helper)", () => {
    expect(() =>
      montarTextoMensagem("CONFIRMACAO" as unknown as "LEMBRETE", dadosBase()),
    ).toThrow();
  });

  it("inclui o código PIX copia-e-cola quando informado", () => {
    const texto = montarTextoMensagem("LEMBRETE", { ...dadosBase(), pixCopiaECola: "00020126...pix_123" });

    expect(texto).toContain("00020126...pix_123");
  });

  it("não menciona PIX quando o código não é informado", () => {
    const texto = montarTextoMensagem("LEMBRETE", dadosBase());

    expect(texto).not.toContain("Pix");
  });
});
