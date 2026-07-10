import type {
  CobrancaDashboardDetalhe,
  CobrancaDashboardItem,
  DashboardCobrancaQuery,
  ErroGeracaoCobrancaDashboardItem,
  FiltroDashboardCobranca,
  IndicadoresDashboard,
  MensagemComFalhaDashboardItem,
  PaginacaoInput,
  ResultadoPaginado,
  TotaisDashboard,
} from "../../../src/domain/cobranca/dashboard-cobranca-query.js";

function paginar<T>(itens: T[], paginacao: PaginacaoInput): ResultadoPaginado<T> {
  const inicio = (paginacao.pagina - 1) * paginacao.itensPorPagina;
  const totalItens = itens.length;

  return {
    itens: itens.slice(inicio, inicio + paginacao.itensPorPagina),
    paginaAtual: paginacao.pagina,
    totalPaginas: Math.max(1, Math.ceil(totalItens / paginacao.itensPorPagina)),
    totalItens,
  };
}

export class FakeDashboardCobrancaQuery implements DashboardCobrancaQuery {
  itens: CobrancaDashboardItem[] = [];
  totais: TotaisDashboard = { totalAReceber: 0, totalRecebido: 0, totalEmAtraso: 0 };
  indicadores: IndicadoresDashboard = {
    totalGeradas: 0,
    totalPagas: 0,
    totalAtrasadas: 0,
    ticketMedio: 0,
    totalAvulsas: 0,
    proximosVencimentos: { quantidade: 0, valorTotal: 0 },
  };
  detalhe: CobrancaDashboardDetalhe | null = null;
  errosGeracaoCobranca: ErroGeracaoCobrancaDashboardItem[] = [];
  mensagensComFalha: MensagemComFalhaDashboardItem[] = [];
  ultimoFiltroListar: FiltroDashboardCobranca | null = null;
  ultimoFiltroTotais: Pick<FiltroDashboardCobranca, "mes" | "ano"> | null = null;
  ultimoIdBuscado: string | null = null;

  async listar(
    filtro: FiltroDashboardCobranca,
    paginacao: PaginacaoInput,
  ): Promise<ResultadoPaginado<CobrancaDashboardItem>> {
    this.ultimoFiltroListar = filtro;
    return paginar(this.itens, paginacao);
  }

  async calcularTotais(filtro: Pick<FiltroDashboardCobranca, "mes" | "ano">): Promise<TotaisDashboard> {
    this.ultimoFiltroTotais = filtro;
    return this.totais;
  }

  async calcularIndicadores(): Promise<IndicadoresDashboard> {
    return this.indicadores;
  }

  async buscarDetalhe(id: string): Promise<CobrancaDashboardDetalhe | null> {
    this.ultimoIdBuscado = id;
    return this.detalhe;
  }

  async listarErrosGeracaoCobranca(
    paginacao: PaginacaoInput,
  ): Promise<ResultadoPaginado<ErroGeracaoCobrancaDashboardItem>> {
    return paginar(this.errosGeracaoCobranca, paginacao);
  }

  async listarMensagensComFalha(
    paginacao: PaginacaoInput,
  ): Promise<ResultadoPaginado<MensagemComFalhaDashboardItem>> {
    return paginar(this.mensagensComFalha, paginacao);
  }
}
