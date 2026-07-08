import type { Cliente } from "../../../src/domain/cliente/cliente.js";
import type { ClienteRepository } from "../../../src/domain/cliente/cliente-repository.js";

export class FakeClienteRepository implements ClienteRepository {
  readonly clientes: Cliente[] = [];

  async salvar(cliente: Cliente): Promise<void> {
    const indice = this.clientes.findIndex((c) => c.id === cliente.id);

    if (indice >= 0) {
      this.clientes[indice] = cliente;
    } else {
      this.clientes.push(cliente);
    }
  }

  async buscarPorId(id: string): Promise<Cliente | null> {
    return this.clientes.find((cliente) => cliente.id === id) ?? null;
  }

  async buscarPorNome(nome: string): Promise<Cliente[]> {
    const termo = nome.toLowerCase();

    return this.clientes.filter((cliente) => cliente.nome.toLowerCase().includes(termo));
  }

  async listarAtivos(): Promise<Cliente[]> {
    return this.clientes.filter((cliente) => cliente.status === "ATIVO");
  }
}
