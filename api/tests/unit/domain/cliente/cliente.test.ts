import { describe, expect, it } from "vitest";

import { Cliente } from "../../../../src/domain/cliente/cliente.js";
import { ClienteInvalidoError } from "../../../../src/domain/cliente/cliente-invalido-error.js";

function dadosValidos() {
  return {
    nome: "Maria Silva",
    telefone: "+5511999998888",
    valorCobranca: 150,
    diaVencimento: 10,
  };
}

describe("Cliente", () => {
  it("cria cliente com status ATIVO por padrão (CAD-R-04)", () => {
    const cliente = Cliente.criar(dadosValidos());

    expect(cliente.status).toBe("ATIVO");
    expect(cliente.nome).toBe("Maria Silva");
    expect(cliente.id).toBeDefined();
  });

  it("rejeita nome vazio (CAD-R-01)", () => {
    expect(() => Cliente.criar({ ...dadosValidos(), nome: "" })).toThrow(ClienteInvalidoError);
    expect(() => Cliente.criar({ ...dadosValidos(), nome: "   " })).toThrow(ClienteInvalidoError);
  });

  it("rejeita telefone fora do formato E.164 (CAD-R-02)", () => {
    expect(() => Cliente.criar({ ...dadosValidos(), telefone: "11999998888" })).toThrow(
      ClienteInvalidoError,
    );
    expect(() => Cliente.criar({ ...dadosValidos(), telefone: "+55 11 99999-8888" })).toThrow(
      ClienteInvalidoError,
    );
  });

  it("aceita telefone válido em E.164", () => {
    expect(() => Cliente.criar({ ...dadosValidos(), telefone: "+5511999998888" })).not.toThrow();
  });

  it("rejeita dia de vencimento fora do intervalo 1-28 (CAD-R-03)", () => {
    expect(() => Cliente.criar({ ...dadosValidos(), diaVencimento: 0 })).toThrow(
      ClienteInvalidoError,
    );
    expect(() => Cliente.criar({ ...dadosValidos(), diaVencimento: 29 })).toThrow(
      ClienteInvalidoError,
    );
    expect(() => Cliente.criar({ ...dadosValidos(), diaVencimento: 1.5 })).toThrow(
      ClienteInvalidoError,
    );
  });

  it("aceita dia de vencimento nos limites 1 e 28", () => {
    expect(() => Cliente.criar({ ...dadosValidos(), diaVencimento: 1 })).not.toThrow();
    expect(() => Cliente.criar({ ...dadosValidos(), diaVencimento: 28 })).not.toThrow();
  });

  it("rejeita valor de cobrança menor ou igual a zero", () => {
    expect(() => Cliente.criar({ ...dadosValidos(), valorCobranca: 0 })).toThrow(
      ClienteInvalidoError,
    );
    expect(() => Cliente.criar({ ...dadosValidos(), valorCobranca: -10 })).toThrow(
      ClienteInvalidoError,
    );
  });

  it("restaura um cliente existente sem reaplicar status inicial", () => {
    const cliente = Cliente.restaurar({
      id: "123e4567-e89b-12d3-a456-426614174000",
      nome: "João",
      telefone: "+5511988887777",
      email: null,
      documento: null,
      valorCobranca: 200,
      diaVencimento: 15,
      status: "INATIVO",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    });

    expect(cliente.status).toBe("INATIVO");
  });

  it("inativa um cliente ativo (CAD-R-05)", () => {
    const cliente = Cliente.criar(dadosValidos());

    cliente.inativar();

    expect(cliente.status).toBe("INATIVO");
  });

  it("reativa um cliente inativo (CAD-R-06)", () => {
    const cliente = Cliente.criar(dadosValidos());
    cliente.inativar();

    cliente.reativar();

    expect(cliente.status).toBe("ATIVO");
  });

  it("edita nome, telefone, valor e dia de vencimento reaplicando invariantes", () => {
    const cliente = Cliente.criar(dadosValidos());

    cliente.editar({ nome: "Maria S. Souza", diaVencimento: 20 });

    expect(cliente.nome).toBe("Maria S. Souza");
    expect(cliente.diaVencimento).toBe(20);
  });

  it("rejeita edição que viole invariantes", () => {
    const cliente = Cliente.criar(dadosValidos());

    expect(() => cliente.editar({ nome: "" })).toThrow(ClienteInvalidoError);
    expect(cliente.nome).toBe("Maria Silva");
  });
});
