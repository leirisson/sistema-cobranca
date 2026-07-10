import type { Cliente, StatusCliente } from "../../../src/domain/cliente/cliente.js";
import type {
  ClienteRepository,
  PaginacaoInput,
  ResultadoPaginado,
} from "../../../src/domain/cliente/cliente-repository.js";

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

  async listarTodos(): Promise<Cliente[]> {
    return [...this.clientes];
  }

  async listarPaginado(
    filtro: { busca?: string; status?: StatusCliente },
    paginacao: PaginacaoInput,
  ): Promise<ResultadoPaginado<Cliente>> {
    const termo = filtro.busca?.toLowerCase();

    const filtrados = this.clientes.filter((cliente) => {
      const bateBusca = termo ? cliente.nome.toLowerCase().includes(termo) : true;
      const bateStatus = filtro.status ? cliente.status === filtro.status : true;
      return bateBusca && bateStatus;
    });

    const totalItens = filtrados.length;
    const inicio = (paginacao.pagina - 1) * paginacao.itensPorPagina;

    return {
      itens: filtrados.slice(inicio, inicio + paginacao.itensPorPagina),
      paginaAtual: paginacao.pagina,
      totalPaginas: Math.max(1, Math.ceil(totalItens / paginacao.itensPorPagina)),
      totalItens,
    };
  }

  async remover(id: string): Promise<void> {
    const indice = this.clientes.findIndex((c) => c.id === id);

    if (indice >= 0) {
      this.clientes.splice(indice, 1);
    }
  }
}
