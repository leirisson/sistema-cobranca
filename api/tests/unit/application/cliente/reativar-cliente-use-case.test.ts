import { beforeEach, describe, expect, it } from "vitest";

import { ReativarClienteUseCase } from "../../../../src/application/cliente/reativar-cliente-use-case.js";
import { Cliente } from "../../../../src/domain/cliente/cliente.js";
import { ClienteNaoEncontradoError } from "../../../../src/domain/cliente/cliente-nao-encontrado-error.js";
import { FakeClienteRepository } from "../../fakes/fake-cliente-repository.js";

describe("ReativarClienteUseCase", () => {
  let repository: FakeClienteRepository;
  let useCase: ReativarClienteUseCase;

  beforeEach(() => {
    repository = new FakeClienteRepository();
    useCase = new ReativarClienteUseCase(repository);
  });

  it("reativa cliente inativo e persiste a mudança (CAD-HTTP-04)", async () => {
    const cliente = Cliente.criar({
      nome: "Maria Silva",
      documento: "12345678900",
      telefones: [{ numero: "+5511999998888", principal: true }],
      valorCobranca: 150,
      diaVencimento: 10,
    });
    cliente.inativar();
    await repository.salvar(cliente);

    await useCase.executar(cliente.id);

    const persistido = await repository.buscarPorId(cliente.id);
    expect(persistido?.status).toBe("ATIVO");
  });

  it("lança erro ao tentar reativar cliente inexistente", async () => {
    await expect(useCase.executar("id-inexistente")).rejects.toThrow(ClienteNaoEncontradoError);
  });
});
