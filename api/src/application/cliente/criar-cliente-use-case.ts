import { Cliente, type ClienteProps } from "../../domain/cliente/cliente.js";
import type { ClienteRepository } from "../../domain/cliente/cliente-repository.js";

export class CriarClienteUseCase {
  constructor(private readonly clienteRepository: ClienteRepository) {}

  async executar(props: ClienteProps): Promise<Cliente> {
    const cliente = Cliente.criar(props);

    await this.clienteRepository.salvar(cliente);

    return cliente;
  }
}
