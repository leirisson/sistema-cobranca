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

  it("inclui o nome do remetente ao final quando informado", () => {
    const texto = montarTextoMensagem("LEMBRETE", { ...dadosBase(), nomeRemetente: "Minha Empresa" });

    expect(texto).toContain("Minha Empresa");
  });

  it("não inclui assinatura quando o nome do remetente não é informado (regressão)", () => {
    const texto = montarTextoMensagem("LEMBRETE", dadosBase());

    expect(texto.endsWith(dadosBase().linkPagamento)).toBe(true);
  });

  it("usa a mensagem personalizada substituindo os placeholders quando informada", () => {
    const texto = montarTextoMensagem("LEMBRETE", {
      ...dadosBase(),
      mensagemPersonalizada: "Olá {nome}! Sua cobrança de {valor} vence em {vencimento}. Pague aqui: {link}",
    });

    expect(texto).toBe(
      "Olá Maria Silva! Sua cobrança de R$ 150,00 vence em 10/08/2026. Pague aqui: https://sandbox.asaas.com/i/asaas_123",
    );
  });

  it("mensagem personalizada vale para os 3 tipos (LEMBRETE/VENCIMENTO/ATRASO)", () => {
    const dados = { ...dadosBase(), mensagemPersonalizada: "Oi {nome}, {valor} até {vencimento}: {link}" };

    expect(montarTextoMensagem("LEMBRETE", dados)).toBe(montarTextoMensagem("VENCIMENTO", dados));
    expect(montarTextoMensagem("VENCIMENTO", dados)).toBe(montarTextoMensagem("ATRASO", dados));
  });

  it("mensagem personalizada suporta placeholders repetidos", () => {
    const texto = montarTextoMensagem("LEMBRETE", {
      ...dadosBase(),
      mensagemPersonalizada: "{nome}, {nome}!",
    });

    expect(texto).toBe("Maria Silva, Maria Silva!");
  });

  it("mensagem personalizada ainda anexa o PIX copia-e-cola e a assinatura", () => {
    const texto = montarTextoMensagem("LEMBRETE", {
      ...dadosBase(),
      mensagemPersonalizada: "Olá {nome}!",
      pixCopiaECola: "00020126...pix_123",
      nomeRemetente: "Minha Empresa",
    });

    expect(texto).toBe("Olá Maria Silva! Ou pague via Pix copia-e-cola: 00020126...pix_123\n\n— Minha Empresa");
  });

  it("ignora mensagem personalizada em branco (só espaços) e usa o template fixo", () => {
    const texto = montarTextoMensagem("LEMBRETE", { ...dadosBase(), mensagemPersonalizada: "   " });

    expect(texto).toContain("Maria Silva! Sua cobrança de");
  });

  it("ignora mensagem personalizada null/undefined e usa o template fixo (fallback)", () => {
    const textoNull = montarTextoMensagem("LEMBRETE", { ...dadosBase(), mensagemPersonalizada: null });
    const textoUndefined = montarTextoMensagem("LEMBRETE", dadosBase());

    expect(textoNull).toBe(textoUndefined);
  });
});
