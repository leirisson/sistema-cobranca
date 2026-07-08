import { beforeEach, describe, expect, it } from "vitest";

import { InativarClienteUseCase } from "../../../../src/application/cliente/inativar-cliente-use-case.js";
import { Cliente } from "../../../../src/domain/cliente/cliente.js";
import { ClienteNaoEncontradoError } from "../../../../src/domain/cliente/cliente-nao-encontrado-error.js";
import { FakeClienteRepository } from "../../fakes/fake-cliente-repository.js";

describe("InativarClienteUseCase", () => {
  let repository: FakeClienteRepository;
  let useCase: InativarClienteUseCase;

  beforeEach(() => {
    repository = new FakeClienteRepository();
    useCase = new InativarClienteUseCase(repository);
  });

  it("inativa cliente existente e persiste a mudança (CAD-US-03, CAD-R-05)", async () => {
    const cliente = Cliente.criar({
      nome: "Maria Silva",
      documento: "12345678900",
      telefones: [{ numero: "+5511999998888", principal: true }],
      valorCobranca: 150,
      diaVencimento: 10,
    });
    await repository.salvar(cliente);

    await useCase.executar(cliente.id);

    const persistido = await repository.buscarPorId(cliente.id);
    expect(persistido?.status).toBe("INATIVO");
  });

  it("lança erro ao tentar inativar cliente inexistente", async () => {
    await expect(useCase.executar("id-inexistente")).rejects.toThrow(ClienteNaoEncontradoError);
  });
});
