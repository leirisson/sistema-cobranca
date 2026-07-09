import type { CobrancaDashboardDetalhe, DashboardCobrancaQuery } from "../../domain/cobranca/dashboard-cobranca-query.js";

export class BuscarDetalheCobrancaUseCase {
  constructor(private readonly dashboardCobrancaQuery: DashboardCobrancaQuery) {}

  async executar(id: string): Promise<CobrancaDashboardDetalhe | null> {
    return this.dashboardCobrancaQuery.buscarDetalhe(id);
  }
}
