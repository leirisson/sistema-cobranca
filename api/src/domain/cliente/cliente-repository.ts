import type { Cliente, StatusCliente } from "./cliente.js";

export interface PaginacaoInput {
  pagina: number;
  itensPorPagina: number;
}

export interface ResultadoPaginado<T> {
  itens: T[];
  paginaAtual: number;
  totalPaginas: number;
  totalItens: number;
}

export interface ClienteRepository {
  salvar(cliente: Cliente): Promise<void>;
  buscarPorId(id: string): Promise<Cliente | null>;
  buscarPorNome(nome: string): Promise<Cliente[]>;
  listarAtivos(): Promise<Cliente[]>;
  listarTodos(): Promise<Cliente[]>;
  listarPaginado(
    filtro: { busca?: string; status?: StatusCliente },
    paginacao: PaginacaoInput,
  ): Promise<ResultadoPaginado<Cliente>>;
  remover(id: string): Promise<void>;
}
