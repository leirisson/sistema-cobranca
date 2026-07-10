import type { StatusCobranca } from "../../domain/cobranca/cobranca.js";
import type {
  CobrancaDashboardItem,
  DashboardCobrancaQuery,
  ResultadoPaginado,
  TotaisDashboard,
} from "../../domain/cobranca/dashboard-cobranca-query.js";

const ITENS_POR_PAGINA_PADRAO = 20;

export interface ListarCobrancasDashboardInput {
  mes?: number;
  ano?: number;
  status?: StatusCobranca;
  busca?: string;
  pagina?: number;
  itensPorPagina?: number;
}

export interface ListarCobrancasDashboardOutput extends ResultadoPaginado<CobrancaDashboardItem> {
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
    const pagina = input.pagina ?? 1;
    const itensPorPagina = input.itensPorPagina ?? ITENS_POR_PAGINA_PADRAO;

    const resultado = await this.dashboardCobrancaQuery.listar(
      { mes, ano, status: input.status, busca: input.busca },
      { pagina, itensPorPagina },
    );
    const totais = await this.dashboardCobrancaQuery.calcularTotais({ mes, ano });

    return { ...resultado, totais };
  }
}
