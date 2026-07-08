import { ClienteNaoEncontradoError } from "../../domain/cliente/cliente-nao-encontrado-error.js";
import type { ClienteRepository } from "../../domain/cliente/cliente-repository.js";

export class InativarClienteUseCase {
  constructor(private readonly clienteRepository: ClienteRepository) {}

  async executar(id: string): Promise<void> {
    const cliente = await this.clienteRepository.buscarPorId(id);

    if (!cliente) {
      throw new ClienteNaoEncontradoError(id);
    }

    cliente.inativar();

    await this.clienteRepository.salvar(cliente);
  }
}
