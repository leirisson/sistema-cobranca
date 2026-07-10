import type { OrigemCobranca, StatusCobranca } from "./cobranca.js";
import type { CanalNotificacaoTipo, StatusEnvioMensagem, TipoMensagem } from "../mensagem/mensagem-enviada.js";

export interface FiltroDashboardCobranca {
  mes: number;
  ano: number;
  status?: StatusCobranca;
  busca?: string;
}

export interface PaginacaoInput {
  pagina: number;
  itensPorPagina: number;
}

export interface ResultadoPaginado<T> {
  itens: T[];
  paginaAtual: number;
  totalPaginas: number;
  totalItens: number;
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

export interface IndicadoresDashboard {
  totalGeradas: number;
  totalPagas: number;
  totalAtrasadas: number;
  ticketMedio: number;
  totalAvulsas: number;
  proximosVencimentos: { quantidade: number; valorTotal: number };
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

export interface ErroGeracaoCobrancaDashboardItem {
  id: string;
  clienteId: string;
  nomeCliente: string;
  mensagemErro: string;
  ocorridoEm: Date;
}

export interface MensagemComFalhaDashboardItem {
  id: string;
  cobrancaId: string;
  nomeCliente: string;
  tipo: TipoMensagem;
  canal: CanalNotificacaoTipo;
  enviadoEm: Date;
}

export interface DashboardCobrancaQuery {
  listar(filtro: FiltroDashboardCobranca, paginacao: PaginacaoInput): Promise<ResultadoPaginado<CobrancaDashboardItem>>;
  calcularTotais(filtro: Pick<FiltroDashboardCobranca, "mes" | "ano">): Promise<TotaisDashboard>;
  calcularIndicadores(
    filtro: Pick<FiltroDashboardCobranca, "mes" | "ano">,
    referencia: Date,
  ): Promise<IndicadoresDashboard>;
  buscarDetalhe(id: string): Promise<CobrancaDashboardDetalhe | null>;
  listarErrosGeracaoCobranca(paginacao: PaginacaoInput): Promise<ResultadoPaginado<ErroGeracaoCobrancaDashboardItem>>;
  listarMensagensComFalha(paginacao: PaginacaoInput): Promise<ResultadoPaginado<MensagemComFalhaDashboardItem>>;
}
