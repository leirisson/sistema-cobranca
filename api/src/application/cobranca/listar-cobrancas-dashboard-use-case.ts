import type { StatusCobranca } from "../../domain/cobranca/cobranca.js";
import type {
  CobrancaDashboardItem,
  DashboardCobrancaQuery,
  TotaisDashboard,
} from "../../domain/cobranca/dashboard-cobranca-query.js";

export interface ListarCobrancasDashboardInput {
  mes?: number;
  ano?: number;
  status?: StatusCobranca;
  busca?: string;
}

export interface ListarCobrancasDashboardOutput {
  itens: CobrancaDashboardItem[];
  totais: TotaisDashboard;
}

export class ListarCobrancasDashboardUseCase {
  constructor(private readonly dashboardCobrancaQuery: DashboardCobrancaQuery) {}

  async executar(
    input: ListarCobrancasDashboardInput,
    referencia: Date = new Date(),
  ): Promise<ListarCobrancasDashboardOutput> {
    const mes = input.mes ?? referencia.getUTCMonth() + 1;
    const ano = input.ano ?? referencia.getUTCFullYear();

    const itens = await this.dashboardCobrancaQuery.listar({
      mes,
      ano,
      status: input.status,
      busca: input.busca,
    });
    const totais = await this.dashboardCobrancaQuery.calcularTotais({ mes, ano });

    return { itens, totais };
  }
}
