import { describe, expect, it } from "vitest";

import { ErroGeracaoCobranca } from "../../../../src/domain/cobranca/erro-geracao-cobranca.js";
import { ErroGeracaoCobrancaInvalidoError } from "../../../../src/domain/cobranca/erro-geracao-cobranca-invalido-error.js";

describe("ErroGeracaoCobranca", () => {
  it("cria um registro válido com id gerado e ocorridoEm preenchido automaticamente", () => {
    const erro = ErroGeracaoCobranca.criar({
      clienteId: "cliente-1",
      nomeCliente: "Maria",
      mensagemErro: "Falha ao criar cobrança no Asaas: timeout",
    });

    expect(erro.id).toBeTruthy();
    expect(erro.clienteId).toBe("cliente-1");
    expect(erro.nomeCliente).toBe("Maria");
    expect(erro.mensagemErro).toBe("Falha ao criar cobrança no Asaas: timeout");
    expect(erro.ocorridoEm).toBeInstanceOf(Date);
  });

  it("rejeita clienteId vazio", () => {
    expect(() =>
      ErroGeracaoCobranca.criar({ clienteId: "", nomeCliente: "Maria", mensagemErro: "falha" }),
    ).toThrow(ErroGeracaoCobrancaInvalidoError);
  });

  it("rejeita mensagemErro vazia", () => {
    expect(() =>
      ErroGeracaoCobranca.criar({ clienteId: "cliente-1", nomeCliente: "Maria", mensagemErro: "" }),
    ).toThrow(ErroGeracaoCobrancaInvalidoError);
  });

  it("restaura um registro existente sem reaplicar defaults", () => {
    const ocorridoEm = new Date("2026-07-01T10:00:00Z");

    const erro = ErroGeracaoCobranca.restaurar({
      id: "erro-1",
      clienteId: "cliente-1",
      nomeCliente: "Maria",
      mensagemErro: "falha",
      ocorridoEm,
    });

    expect(erro.id).toBe("erro-1");
    expect(erro.ocorridoEm).toBe(ocorridoEm);
  });
});
