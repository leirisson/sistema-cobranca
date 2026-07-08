import { beforeEach, describe, expect, it } from "vitest";

import { EditarClienteUseCase } from "../../../../src/application/cliente/editar-cliente-use-case.js";
import { Cliente } from "../../../../src/domain/cliente/cliente.js";
import { ClienteInvalidoError } from "../../../../src/domain/cliente/cliente-invalido-error.js";
import { ClienteNaoEncontradoError } from "../../../../src/domain/cliente/cliente-nao-encontrado-error.js";
import { FakeClienteRepository } from "../../fakes/fake-cliente-repository.js";

describe("EditarClienteUseCase", () => {
  let repository: FakeClienteRepository;
  let useCase: EditarClienteUseCase;

  beforeEach(() => {
    repository = new FakeClienteRepository();
    useCase = new EditarClienteUseCase(repository);
  });

  it("edita dados de um cliente existente e persiste a mudança (CAD-US-04)", async () => {
    const cliente = Cliente.criar({
      nome: "Maria Silva",
      telefone: "+5511999998888",
      valorCobranca: 150,
      diaVencimento: 10,
    });
    await repository.salvar(cliente);

    const editado = await useCase.executar(cliente.id, { nome: "Maria S. Souza", diaVencimento: 20 });

    expect(editado.nome).toBe("Maria S. Souza");
    expect(editado.diaVencimento).toBe(20);

    const persistido = await repository.buscarPorId(cliente.id);
    expect(persistido?.nome).toBe("Maria S. Souza");
  });

  it("lança erro ao tentar editar cliente inexistente", async () => {
    await expect(useCase.executar("id-inexistente", { nome: "Novo Nome" })).rejects.toThrow(
      ClienteNaoEncontradoError,
    );
  });

  it("propaga erro de domínio e não persiste edição inválida", async () => {
    const cliente = Cliente.criar({
      nome: "Maria Silva",
      telefone: "+5511999998888",
      valorCobranca: 150,
      diaVencimento: 10,
    });
    await repository.salvar(cliente);

    await expect(useCase.executar(cliente.id, { nome: "" })).rejects.toThrow(ClienteInvalidoError);

    const persistido = await repository.buscarPorId(cliente.id);
    expect(persistido?.nome).toBe("Maria Silva");
  });
});
