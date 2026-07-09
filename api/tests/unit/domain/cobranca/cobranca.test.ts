import { describe, expect, it } from "vitest";

import { Cobranca } from "../../../../src/domain/cobranca/cobranca.js";
import { CobrancaInvalidaError } from "../../../../src/domain/cobranca/cobranca-invalida-error.js";

function dadosValidos() {
  return {
    clienteId: "123e4567-e89b-12d3-a456-426614174000",
    valor: 150,
    vencimento: new Date("2026-08-10"),
    gatewayChargeId: "asaas_123",
    linkPagamento: "https://sandbox.asaas.com/i/asaas_123",
  };
}

describe("Cobranca", () => {
  it("cria cobrança com status PENDENTE por padrão (COB-R-02)", () => {
    const cobranca = Cobranca.criar(dadosValidos());

    expect(cobranca.status).toBe("PENDENTE");
    expect(cobranca.clienteId).toBe(dadosValidos().clienteId);
    expect(cobranca.id).toBeDefined();
  });

  it("rejeita cobrança sem gatewayChargeId (COB-R-03)", () => {
    expect(() =>
      Cobranca.criar({ ...dadosValidos(), gatewayChargeId: "" }),
    ).toThrow(CobrancaInvalidaError);
  });

  it("rejeita cobrança sem linkPagamento (COB-R-03)", () => {
    expect(() =>
      Cobranca.criar({ ...dadosValidos(), linkPagamento: "" }),
    ).toThrow(CobrancaInvalidaError);
  });

  it("rejeita valor menor ou igual a zero", () => {
    expect(() => Cobranca.criar({ ...dadosValidos(), valor: 0 })).toThrow(CobrancaInvalidaError);
    expect(() => Cobranca.criar({ ...dadosValidos(), valor: -10 })).toThrow(CobrancaInvalidaError);
  });

  it("restaura uma cobrança existente sem reaplicar status inicial", () => {
    const cobranca = Cobranca.restaurar({
      id: "223e4567-e89b-12d3-a456-426614174000",
      clienteId: dadosValidos().clienteId,
      valor: 150,
      vencimento: new Date("2026-08-10"),
      status: "PAGO",
      gatewayChargeId: "asaas_123",
      linkPagamento: "https://sandbox.asaas.com/i/asaas_123",
      pixCopiaECola: null,
      paidAt: new Date("2026-08-05"),
      createdAt: new Date("2026-08-01"),
      updatedAt: new Date("2026-08-05"),
    });

    expect(cobranca.status).toBe("PAGO");
    expect(cobranca.paidAt).toEqual(new Date("2026-08-05"));
  });

  it("aceita e expõe o código PIX copia-e-cola quando informado", () => {
    const cobranca = Cobranca.criar({ ...dadosValidos(), pixCopiaECola: "00020126...6304ABCD" });

    expect(cobranca.pixCopiaECola).toBe("00020126...6304ABCD");
  });

  it("permite criar cobrança sem código PIX (nem todo gateway/situação devolve)", () => {
    const cobranca = Cobranca.criar(dadosValidos());

    expect(cobranca.pixCopiaECola).toBeNull();
  });

  it("marca cobrança como paga (transição PENDENTE → PAGO)", () => {
    const cobranca = Cobranca.criar(dadosValidos());

    cobranca.marcarComoPaga(new Date("2026-08-09"));

    expect(cobranca.status).toBe("PAGO");
    expect(cobranca.paidAt).toEqual(new Date("2026-08-09"));
  });

  it("rejeita marcar como paga uma cobrança cancelada", () => {
    const cobranca = Cobranca.criar(dadosValidos());
    cobranca.cancelar();

    expect(() => cobranca.marcarComoPaga(new Date())).toThrow(CobrancaInvalidaError);
  });

  it("rejeita marcar uma cobrança já paga como paga novamente", () => {
    const cobranca = Cobranca.criar(dadosValidos());
    cobranca.marcarComoPaga(new Date("2026-08-09"));

    expect(() => cobranca.marcarComoPaga(new Date("2026-08-10"))).toThrow(CobrancaInvalidaError);
  });

  it("cancela uma cobrança pendente", () => {
    const cobranca = Cobranca.criar(dadosValidos());

    cobranca.cancelar();

    expect(cobranca.status).toBe("CANCELADO");
  });

  it("rejeita cancelar uma cobrança já paga (entidade protege transição)", () => {
    const cobranca = Cobranca.criar(dadosValidos());
    cobranca.marcarComoPaga(new Date());

    expect(() => cobranca.cancelar()).toThrow(CobrancaInvalidaError);
  });

  it("marca cobrança pendente como atrasada", () => {
    const cobranca = Cobranca.criar(dadosValidos());

    cobranca.marcarComoAtrasada();

    expect(cobranca.status).toBe("ATRASADO");
  });
});
