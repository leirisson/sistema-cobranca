import { beforeEach, describe, expect, it } from "vitest";

import { CriarClienteUseCase } from "../../../../src/application/cliente/criar-cliente-use-case.js";
import { ClienteInvalidoError } from "../../../../src/domain/cliente/cliente-invalido-error.js";
import { FakeClienteRepository } from "../../fakes/fake-cliente-repository.js";

describe("CriarClienteUseCase", () => {
  let repository: FakeClienteRepository;
  let useCase: CriarClienteUseCase;

  beforeEach(() => {
    repository = new FakeClienteRepository();
    useCase = new CriarClienteUseCase(repository);
  });

  it("cria e persiste um cliente ativo (CAD-US-01, CAD-R-04)", async () => {
    const cliente = await useCase.executar({
      nome: "Maria Silva",
      telefone: "+5511999998888",
      valorCobranca: 150,
      diaVencimento: 10,
    });

    expect(cliente.status).toBe("ATIVO");
    expect(repository.clientes).toHaveLength(1);
    expect(repository.clientes[0]?.id).toBe(cliente.id);
  });

  it("propaga erro de domínio sem persistir cliente inválido (CAD-R-01)", async () => {
    await expect(
      useCase.executar({
        nome: "",
        telefone: "+5511999998888",
        valorCobranca: 150,
        diaVencimento: 10,
      }),
    ).rejects.toThrow(ClienteInvalidoError);

    expect(repository.clientes).toHaveLength(0);
  });
});
