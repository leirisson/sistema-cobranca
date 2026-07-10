import type { DashboardCobrancaQuery, IndicadoresDashboard } from "../../domain/cobranca/dashboard-cobranca-query.js";

export interface BuscarIndicadoresDashboardInput {
  mes?: number;
  ano?: number;
}

export class BuscarIndicadoresDashboardUseCase {
  constructor(private readonly dashboardCobrancaQuery: DashboardCobrancaQuery) {}

  async executar(
    input: BuscarIndicadoresDashboardInput,
    referencia: Date = new Date(),
  ): Promise<IndicadoresDashboard> {
    const mes = input.mes ?? referencia.getUTCMonth() + 1;
    const ano = input.ano ?? referencia.getUTCFullYear();

    return this.dashboardCobrancaQuery.calcularIndicadores({ mes, ano }, referencia);
  }
}
