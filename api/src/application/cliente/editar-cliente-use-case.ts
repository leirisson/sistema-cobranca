import type { Cliente, ClienteEdicao } from "../../domain/cliente/cliente.js";
import { ClienteNaoEncontradoError } from "../../domain/cliente/cliente-nao-encontrado-error.js";
import type { ClienteRepository } from "../../domain/cliente/cliente-repository.js";

export class EditarClienteUseCase {
  constructor(private readonly clienteRepository: ClienteRepository) {}

  async executar(id: string, edicao: ClienteEdicao): Promise<Cliente> {
    const cliente = await this.clienteRepository.buscarPorId(id);

    if (!cliente) {
      throw new ClienteNaoEncontradoError(id);
    }

    cliente.editar(edicao);

    await this.clienteRepository.salvar(cliente);

    return cliente;
  }
}
