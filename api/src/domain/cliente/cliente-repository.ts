import type { Cliente } from "./cliente.js";

export interface ClienteRepository {
  salvar(cliente: Cliente): Promise<void>;
  buscarPorId(id: string): Promise<Cliente | null>;
  buscarPorNome(nome: string): Promise<Cliente[]>;
  listarAtivos(): Promise<Cliente[]>;
  listarTodos(): Promise<Cliente[]>;
}
