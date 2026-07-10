import { beforeEach, describe, expect, it } from "vitest";

import { ListarClientesUseCase } from "../../../../src/application/cliente/listar-clientes-use-case.js";
import { Cliente } from "../../../../src/domain/cliente/cliente.js";
import { FakeClienteRepository } from "../../fakes/fake-cliente-repository.js";

describe("ListarClientesUseCase", () => {
  let repository: FakeClienteRepository;
  let useCase: ListarClientesUseCase;

  beforeEach(() => {
    repository = new FakeClienteRepository();
    useCase = new ListarClientesUseCase(repository);
  });

  async function criarCliente(nome: string, status: "ATIVO" | "INATIVO" = "ATIVO") {
    const cliente = Cliente.criar({
      nome,
      documento: "12345678900",
      telefones: [{ numero: "+5511999998888", principal: true }],
      valorCobranca: 150,
      diaVencimento: 10,
    });

    if (status === "INATIVO") {
      cliente.inativar();
    }

    await repository.salvar(cliente);

    return cliente;
  }

  it("lista todos os clientes sem filtro (CAD-HTTP-01)", async () => {
    await criarCliente("Maria Silva");
    await criarCliente("João Souza", "INATIVO");

    const resultado = await useCase.executar();

    expect(resultado.itens).toHaveLength(2);
    expect(resultado.totalItens).toBe(2);
  });

  it("filtra por busca de nome", async () => {
    await criarCliente("Maria Silva");
    await criarCliente("João Souza");

    const resultado = await useCase.executar({ busca: "maria" });

    expect(resultado.itens).toHaveLength(1);
    expect(resultado.itens[0]?.nome).toBe("Maria Silva");
  });

  it("filtra por status", async () => {
    await criarCliente("Maria Silva");
    await criarCliente("João Souza", "INATIVO");

    const resultado = await useCase.executar({ status: "INATIVO" });

    expect(resultado.itens).toHaveLength(1);
    expect(resultado.itens[0]?.nome).toBe("João Souza");
  });

  it("combina busca e status", async () => {
    await criarCliente("Maria Silva", "INATIVO");
    await criarCliente("Maria Souza", "ATIVO");

    const resultado = await useCase.executar({ busca: "maria", status: "ATIVO" });

    expect(resultado.itens).toHaveLength(1);
    expect(resultado.itens[0]?.nome).toBe("Maria Souza");
  });

  it("pagina os resultados (20 por página por padrão)", async () => {
    for (let i = 1; i <= 25; i++) {
      await criarCliente(`Cliente ${String(i).padStart(2, "0")}`);
    }

    const paginaUm = await useCase.executar();
    const paginaDois = await useCase.executar({ pagina: 2 });

    expect(paginaUm.itens).toHaveLength(20);
    expect(paginaUm.paginaAtual).toBe(1);
    expect(paginaUm.totalPaginas).toBe(2);
    expect(paginaUm.totalItens).toBe(25);

    expect(paginaDois.itens).toHaveLength(5);
    expect(paginaDois.paginaAtual).toBe(2);
  });

  it("respeita itensPorPagina customizado", async () => {
    for (let i = 1; i <= 5; i++) {
      await criarCliente(`Cliente ${i}`);
    }

    const resultado = await useCase.executar({ itensPorPagina: 2 });

    expect(resultado.itens).toHaveLength(2);
    expect(resultado.totalPaginas).toBe(3);
  });
});
