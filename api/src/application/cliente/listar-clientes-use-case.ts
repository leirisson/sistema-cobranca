import type { Cliente, StatusCliente } from "../../domain/cliente/cliente.js";
import type { ClienteRepository } from "../../domain/cliente/cliente-repository.js";

export interface ListarClientesFiltro {
  busca?: string;
  status?: StatusCliente;
}

export class ListarClientesUseCase {
  constructor(private readonly clienteRepository: ClienteRepository) {}

  async executar(filtro: ListarClientesFiltro = {}): Promise<Cliente[]> {
    const clientes = filtro.busca
      ? await this.clienteRepository.buscarPorNome(filtro.busca)
      : await this.clienteRepository.listarTodos();

    if (!filtro.status) {
      return clientes;
    }

    return clientes.filter((cliente) => cliente.status === filtro.status);
  }
}
