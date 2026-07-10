import type {
  DashboardCobrancaQuery,
  ErroGeracaoCobrancaDashboardItem,
  MensagemComFalhaDashboardItem,
  ResultadoPaginado,
} from "../../domain/cobranca/dashboard-cobranca-query.js";

const ITENS_POR_PAGINA_PADRAO = 20;

export interface BuscarErrosOperacionaisInput {
  paginaErros?: number;
  paginaMensagens?: number;
  itensPorPagina?: number;
}

export interface BuscarErrosOperacionaisOutput {
  errosGeracaoCobranca: ResultadoPaginado<ErroGeracaoCobrancaDashboardItem>;
  mensagensComFalha: ResultadoPaginado<MensagemComFalhaDashboardItem>;
}

export class BuscarErrosOperacionaisUseCase {
  constructor(private readonly dashboardCobrancaQuery: DashboardCobrancaQuery) {}

  async executar(input: BuscarErrosOperacionaisInput = {}): Promise<BuscarErrosOperacionaisOutput> {
    const itensPorPagina = input.itensPorPagina ?? ITENS_POR_PAGINA_PADRAO;

    const [errosGeracaoCobranca, mensagensComFalha] = await Promise.all([
      this.dashboardCobrancaQuery.listarErrosGeracaoCobranca({
        pagina: input.paginaErros ?? 1,
        itensPorPagina,
      }),
      this.dashboardCobrancaQuery.listarMensagensComFalha({
        pagina: input.paginaMensagens ?? 1,
        itensPorPagina,
      }),
    ]);

    return { errosGeracaoCobranca, mensagensComFalha };
  }
}
