import type {
  DashboardCobrancaQuery,
  ErroGeracaoCobrancaDashboardItem,
  MensagemComFalhaDashboardItem,
} from "../../domain/cobranca/dashboard-cobranca-query.js";

const LIMITE_PADRAO = 20;

export interface BuscarErrosOperacionaisOutput {
  errosGeracaoCobranca: ErroGeracaoCobrancaDashboardItem[];
  mensagensComFalha: MensagemComFalhaDashboardItem[];
}

export class BuscarErrosOperacionaisUseCase {
  constructor(private readonly dashboardCobrancaQuery: DashboardCobrancaQuery) {}

  async executar(limite: number = LIMITE_PADRAO): Promise<BuscarErrosOperacionaisOutput> {
    const [errosGeracaoCobranca, mensagensComFalha] = await Promise.all([
      this.dashboardCobrancaQuery.listarErrosGeracaoCobranca(limite),
      this.dashboardCobrancaQuery.listarMensagensComFalha(limite),
    ]);

    return { errosGeracaoCobranca, mensagensComFalha };
  }
}
