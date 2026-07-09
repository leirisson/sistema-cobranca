import type { OrigemCobranca, StatusCobranca } from "./cobranca.js";
import type { CanalNotificacaoTipo, StatusEnvioMensagem, TipoMensagem } from "../mensagem/mensagem-enviada.js";

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
  origem: OrigemCobranca;
}

export interface TotaisDashboard {
  totalAReceber: number;
  totalRecebido: number;
  totalEmAtraso: number;
}

export interface MensagemEnviadaHistoricoItem {
  id: string;
  tipo: TipoMensagem;
  canal: CanalNotificacaoTipo;
  statusEnvio: StatusEnvioMensagem;
  enviadoEm: Date;
}

export interface CobrancaDashboardDetalhe {
  id: string;
  nomeCliente: string;
  valor: number;
  vencimento: Date;
  status: StatusCobranca;
  linkPagamento: string | null;
  pixCopiaECola: string | null;
  origem: OrigemCobranca;
  descricao: string | null;
  mensagens: MensagemEnviadaHistoricoItem[];
}

export interface DashboardCobrancaQuery {
  listar(filtro: FiltroDashboardCobranca): Promise<CobrancaDashboardItem[]>;
  calcularTotais(filtro: Pick<FiltroDashboardCobranca, "mes" | "ano">): Promise<TotaisDashboard>;
  buscarDetalhe(id: string): Promise<CobrancaDashboardDetalhe | null>;
}
