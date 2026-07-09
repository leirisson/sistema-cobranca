import type {
  CobrancaDashboardDetalhe,
  CobrancaDashboardItem,
  DashboardCobrancaQuery,
  FiltroDashboardCobranca,
  TotaisDashboard,
} from "../../../src/domain/cobranca/dashboard-cobranca-query.js";

export class FakeDashboardCobrancaQuery implements DashboardCobrancaQuery {
  itens: CobrancaDashboardItem[] = [];
  totais: TotaisDashboard = { totalAReceber: 0, totalRecebido: 0, totalEmAtraso: 0 };
  detalhe: CobrancaDashboardDetalhe | null = null;
  ultimoFiltroListar: FiltroDashboardCobranca | null = null;
  ultimoFiltroTotais: Pick<FiltroDashboardCobranca, "mes" | "ano"> | null = null;
  ultimoIdBuscado: string | null = null;

  async listar(filtro: FiltroDashboardCobranca): Promise<CobrancaDashboardItem[]> {
    this.ultimoFiltroListar = filtro;
    return this.itens;
  }

  async calcularTotais(filtro: Pick<FiltroDashboardCobranca, "mes" | "ano">): Promise<TotaisDashboard> {
    this.ultimoFiltroTotais = filtro;
    return this.totais;
  }

  async buscarDetalhe(id: string): Promise<CobrancaDashboardDetalhe | null> {
    this.ultimoIdBuscado = id;
    return this.detalhe;
  }
}
