import { describe, expect, it } from "vitest";

import { Cliente } from "../../../../src/domain/cliente/cliente.js";
import { ClienteInvalidoError } from "../../../../src/domain/cliente/cliente-invalido-error.js";

function dadosValidos() {
  return {
    nome: "Maria Silva",
    documento: "12345678900",
    telefones: [{ numero: "+5511999998888", principal: true }],
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
    expect(() =>
      Cliente.criar({ ...dadosValidos(), telefones: [{ numero: "11999998888", principal: true }] }),
    ).toThrow(ClienteInvalidoError);
    expect(() =>
      Cliente.criar({
        ...dadosValidos(),
        telefones: [{ numero: "+55 11 99999-8888", principal: true }],
      }),
    ).toThrow(ClienteInvalidoError);
  });

  it("aceita telefone válido em E.164", () => {
    expect(() => Cliente.criar(dadosValidos())).not.toThrow();
  });

  it("rejeita cliente sem nenhum telefone (CAD-EXT-R-04)", () => {
    expect(() => Cliente.criar({ ...dadosValidos(), telefones: [] })).toThrow(ClienteInvalidoError);
  });

  it("rejeita cliente com mais de um telefone marcado como principal (CAD-EXT-R-04)", () => {
    expect(() =>
      Cliente.criar({
        ...dadosValidos(),
        telefones: [
          { numero: "+5511999998888", principal: true },
          { numero: "+5511988887777", principal: true },
        ],
      }),
    ).toThrow(ClienteInvalidoError);
  });

  it("rejeita cliente com telefones mas nenhum marcado como principal (CAD-EXT-R-04)", () => {
    expect(() =>
      Cliente.criar({
        ...dadosValidos(),
        telefones: [{ numero: "+5511999998888", principal: false }],
      }),
    ).toThrow(ClienteInvalidoError);
  });

  it("aceita múltiplos telefones com exatamente um principal (CAD-EXT-R-04)", () => {
    const cliente = Cliente.criar({
      ...dadosValidos(),
      telefones: [
        { numero: "+5511999998888", principal: false },
        { numero: "+5511988887777", principal: true },
      ],
    });

    expect(cliente.telefones).toHaveLength(2);
    expect(cliente.telefonePrincipal?.numero).toBe("+5511988887777");
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

  it("trata documento com 11 dígitos como CPF (CAD-EXT-R-01)", () => {
    const cliente = Cliente.criar({ ...dadosValidos(), documento: "12345678900" });

    expect(cliente.tipoDocumento).toBe("CPF");
  });

  it("trata documento com 14 dígitos como CNPJ (CAD-EXT-R-01)", () => {
    const cliente = Cliente.criar({ ...dadosValidos(), documento: "12345678000199" });

    expect(cliente.tipoDocumento).toBe("CNPJ");
  });

  it("rejeita documento vazio (CAD-EXT-R-01)", () => {
    expect(() => Cliente.criar({ ...dadosValidos(), documento: "" })).toThrow(ClienteInvalidoError);
  });

  it("rejeita documento com tamanho diferente de 11 ou 14 dígitos (CAD-EXT-R-01)", () => {
    expect(() => Cliente.criar({ ...dadosValidos(), documento: "123456789" })).toThrow(
      ClienteInvalidoError,
    );
    expect(() => Cliente.criar({ ...dadosValidos(), documento: "123456789012345" })).toThrow(
      ClienteInvalidoError,
    );
  });

  it("aceita cadastro sem endereço, inscrição estadual, nome de contato ou referência de serviço (CAD-EXT-R-03)", () => {
    const cliente = Cliente.criar(dadosValidos());

    expect(cliente.endereco).toBeNull();
    expect(cliente.inscricaoEstadual).toBeNull();
    expect(cliente.nomeContato).toBeNull();
    expect(cliente.referenciaServico).toBeNull();
  });

  it("aceita cadastro com endereço, inscrição estadual, nome de contato e referência de serviço preenchidos", () => {
    const cliente = Cliente.criar({
      ...dadosValidos(),
      inscricaoEstadual: "123456789",
      endereco: {
        rua: "Rua das Flores",
        numero: "100",
        bairro: "Centro",
        cidade: "Manaus",
        uf: "AM",
        cep: "69000-000",
      },
      nomeContato: "GEL",
      referenciaServico: "Placa ABC-1234",
    });

    expect(cliente.endereco?.cidade).toBe("Manaus");
    expect(cliente.nomeContato).toBe("GEL");
    expect(cliente.referenciaServico).toBe("Placa ABC-1234");
  });

  it("restaura um cliente existente sem reaplicar status inicial", () => {
    const cliente = Cliente.restaurar({
      id: "123e4567-e89b-12d3-a456-426614174000",
      nome: "João",
      documento: "12345678900",
      telefones: [{ id: "323e4567-e89b-12d3-a456-426614174000", numero: "+5511988887777", principal: true }],
      email: null,
      valorCobranca: 200,
      diaVencimento: 15,
      status: "INATIVO",
      inscricaoEstadual: null,
      endereco: null,
      nomeContato: null,
      referenciaServico: null,
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

  it("edita nome, telefones, valor e dia de vencimento reaplicando invariantes", () => {
    const cliente = Cliente.criar(dadosValidos());

    cliente.editar({
      nome: "Maria S. Souza",
      diaVencimento: 20,
      telefones: [{ numero: "+5511988887777", principal: true }],
    });

    expect(cliente.nome).toBe("Maria S. Souza");
    expect(cliente.diaVencimento).toBe(20);
    expect(cliente.telefonePrincipal?.numero).toBe("+5511988887777");
  });

  it("rejeita edição que viole invariantes", () => {
    const cliente = Cliente.criar(dadosValidos());

    expect(() => cliente.editar({ nome: "" })).toThrow(ClienteInvalidoError);
    expect(cliente.nome).toBe("Maria Silva");
  });

  it("rejeita edição que remova o documento", () => {
    const cliente = Cliente.criar(dadosValidos());

    expect(() => cliente.editar({ documento: "" })).toThrow(ClienteInvalidoError);
  });
});
