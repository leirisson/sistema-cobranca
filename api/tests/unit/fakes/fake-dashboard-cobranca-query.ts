import type {
  CobrancaDashboardItem,
  DashboardCobrancaQuery,
  FiltroDashboardCobranca,
  TotaisDashboard,
} from "../../../src/domain/cobranca/dashboard-cobranca-query.js";

export class FakeDashboardCobrancaQuery implements DashboardCobrancaQuery {
  itens: CobrancaDashboardItem[] = [];
  totais: TotaisDashboard = { totalAReceber: 0, totalRecebido: 0, totalEmAtraso: 0 };
  ultimoFiltroListar: FiltroDashboardCobranca | null = null;
  ultimoFiltroTotais: Pick<FiltroDashboardCobranca, "mes" | "ano"> | null = null;

  async listar(filtro: FiltroDashboardCobranca): Promise<CobrancaDashboardItem[]> {
    this.ultimoFiltroListar = filtro;
    return this.itens;
  }

  async calcularTotais(filtro: Pick<FiltroDashboardCobranca, "mes" | "ano">): Promise<TotaisDashboard> {
    this.ultimoFiltroTotais = filtro;
    return this.totais;
  }
}
