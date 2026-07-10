import { Cliente, type ClienteProps } from "../../domain/cliente/cliente.js";
import { ClienteInvalidoError } from "../../domain/cliente/cliente-invalido-error.js";
import type { ClienteRepository } from "../../domain/cliente/cliente-repository.js";

export class CriarClienteUseCase {
  constructor(private readonly clienteRepository: ClienteRepository) {}

  async executar(props: ClienteProps): Promise<Cliente> {
    if (!props.email || !props.email.trim()) {
      throw new ClienteInvalidoError("E-mail é obrigatório");
    }

    const cliente = Cliente.criar(props);

    await this.clienteRepository.salvar(cliente);

    return cliente;
  }
}
