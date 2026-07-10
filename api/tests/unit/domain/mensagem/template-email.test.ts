import { describe, expect, it } from "vitest";

import { montarEmailMensagem } from "../../../../src/domain/mensagem/template-email.js";

function dadosBase() {
  return {
    nomeCliente: "Maria Silva",
    valor: 150,
    vencimento: new Date("2026-08-10"),
    linkPagamento: "https://sandbox.asaas.com/i/asaas_123",
  };
}

describe("montarEmailMensagem", () => {
  it("monta assunto e corpo HTML de LEMBRETE com nome, valor, vencimento e link (EMAIL-R-03)", () => {
    const email = montarEmailMensagem("LEMBRETE", dadosBase());

    expect(email.assunto).toContain("Lembrete");
    expect(email.corpoHtml).toContain("Maria Silva");
    expect(email.corpoHtml).toContain("150");
    expect(email.corpoHtml).toContain("10/08/2026");
    expect(email.corpoHtml).toContain(dadosBase().linkPagamento);
    expect(email.corpoHtml).toMatch(/<a\s+href="https:\/\/sandbox\.asaas\.com\/i\/asaas_123"/);
  });

  it("monta assunto de VENCIMENTO", () => {
    const email = montarEmailMensagem("VENCIMENTO", dadosBase());

    expect(email.assunto).toContain("vence hoje");
  });

  it("monta assunto de ATRASO", () => {
    const email = montarEmailMensagem("ATRASO", dadosBase());

    expect(email.assunto).toContain("Atraso");
  });

  it("rejeita template para CONFIRMACAO (fora de escopo deste helper)", () => {
    expect(() => montarEmailMensagem("CONFIRMACAO" as unknown as "LEMBRETE", dadosBase())).toThrow();
  });

  it("inclui o código PIX copia-e-cola no corpo quando informado", () => {
    const email = montarEmailMensagem("LEMBRETE", { ...dadosBase(), pixCopiaECola: "00020126...pix_123" });

    expect(email.corpoHtml).toContain("00020126...pix_123");
  });

  it("não menciona PIX no corpo quando o código não é informado", () => {
    const email = montarEmailMensagem("LEMBRETE", dadosBase());

    expect(email.corpoHtml).not.toContain("Pix");
  });

  it("inclui o nome do remetente no corpo quando informado", () => {
    const email = montarEmailMensagem("LEMBRETE", { ...dadosBase(), nomeRemetente: "Minha Empresa" });

    expect(email.corpoHtml).toContain("Minha Empresa");
  });

  it("usa a mensagem personalizada no corpo quando informada, mantendo o link como <a href>", () => {
    const email = montarEmailMensagem("LEMBRETE", {
      ...dadosBase(),
      mensagemPersonalizada: "Olá {nome}! Pague aqui: {link}",
    });

    expect(email.corpoHtml).toContain("Olá Maria Silva!");
    expect(email.corpoHtml).toMatch(/<a\s+href="https:\/\/sandbox\.asaas\.com\/i\/asaas_123"/);
  });

  it("mensagem personalizada não altera o assunto (segue fixo por tipo)", () => {
    const email = montarEmailMensagem("LEMBRETE", {
      ...dadosBase(),
      mensagemPersonalizada: "Olá {nome}!",
    });

    expect(email.assunto).toContain("Lembrete");
  });
});
