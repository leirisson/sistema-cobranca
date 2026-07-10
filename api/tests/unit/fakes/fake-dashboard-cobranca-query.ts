import type {
  CobrancaDashboardDetalhe,
  CobrancaDashboardItem,
  DashboardCobrancaQuery,
  ErroGeracaoCobrancaDashboardItem,
  FiltroDashboardCobranca,
  MensagemComFalhaDashboardItem,
  TotaisDashboard,
} from "../../../src/domain/cobranca/dashboard-cobranca-query.js";

export class FakeDashboardCobrancaQuery implements DashboardCobrancaQuery {
  itens: CobrancaDashboardItem[] = [];
  totais: TotaisDashboard = { totalAReceber: 0, totalRecebido: 0, totalEmAtraso: 0 };
  detalhe: CobrancaDashboardDetalhe | null = null;
  errosGeracaoCobranca: ErroGeracaoCobrancaDashboardItem[] = [];
  mensagensComFalha: MensagemComFalhaDashboardItem[] = [];
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

  async listarErrosGeracaoCobranca(limite: number): Promise<ErroGeracaoCobrancaDashboardItem[]> {
    return this.errosGeracaoCobranca.slice(0, limite);
  }

  async listarMensagensComFalha(limite: number): Promise<MensagemComFalhaDashboardItem[]> {
    return this.mensagensComFalha.slice(0, limite);
  }
}
