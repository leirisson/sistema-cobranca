import type { StatusCobranca } from "./cobranca.js";

export interface FiltroDashboardCobranca {
  mes: number;
  ano: number;
  status?: StatusCobranca;
  busca?: string;
}

export interface CobrancaDashboardItem {
  id: string;
  nomeCliente: string;
  valor: number;
  vencimento: Date;
  status: StatusCobranca;
}

export interface TotaisDashboard {
  totalAReceber: number;
  totalRecebido: number;
  totalEmAtraso: number;
}

export interface DashboardCobrancaQuery {
  listar(filtro: FiltroDashboardCobranca): Promise<CobrancaDashboardItem[]>;
  calcularTotais(filtro: Pick<FiltroDashboardCobranca, "mes" | "ano">): Promise<TotaisDashboard>;
}
