import type { Cliente, StatusCliente } from "../../domain/cliente/cliente.js";
import type { ClienteRepository, ResultadoPaginado } from "../../domain/cliente/cliente-repository.js";

const ITENS_POR_PAGINA_PADRAO = 20;

export interface ListarClientesFiltro {
  busca?: string;
  status?: StatusCliente;
  pagina?: number;
  itensPorPagina?: number;
}

export class ListarClientesUseCase {
  constructor(private readonly clienteRepository: ClienteRepository) {}

  async executar(filtro: ListarClientesFiltro = {}): Promise<ResultadoPaginado<Cliente>> {
    const pagina = filtro.pagina ?? 1;
    const itensPorPagina = filtro.itensPorPagina ?? ITENS_POR_PAGINA_PADRAO;

    return this.clienteRepository.listarPaginado(
      { busca: filtro.busca, status: filtro.status },
      { pagina, itensPorPagina },
    );
  }
}
