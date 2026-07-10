import "server-only";

import { apiFetch, ApiError } from "./client";

export type StatusCobranca = "PENDENTE" | "PAGO" | "ATRASADO" | "CANCELADO";
export type TipoMensagem = "LEMBRETE" | "VENCIMENTO" | "ATRASO" | "CONFIRMACAO";
export type CanalNotificacao = "whatsapp" | "email";
export type StatusEnvioMensagem = "ENVIADO" | "FALHA";
export type OrigemCobranca = "RECORRENTE" | "AVULSA";

export interface CobrancaDashboardItem {
  id: string;
  nomeCliente: string;
  valor: number;
  vencimento: string;
  status: StatusCobranca;
  origem: OrigemCobranca;
}

export interface TotaisDashboard {
  totalAReceber: number;
  totalRecebido: number;
  totalEmAtraso: number;
}

export interface ResultadoPaginado<T> {
  itens: T[];
  paginaAtual: number;
  totalPaginas: number;
  totalItens: number;
}

export interface ListarCobrancasDashboardResposta extends ResultadoPaginado<CobrancaDashboardItem> {
  totais: TotaisDashboard;
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
  canal: CanalNotificacao;
  statusEnvio: StatusEnvioMensagem;
  enviadoEm: string;
}

export interface CobrancaDashboardDetalhe {
  id: string;
  nomeCliente: string;
  valor: number;
  vencimento: string;
  status: StatusCobranca;
  linkPagamento: string | null;
  pixCopiaECola: string | null;
  origem: OrigemCobranca;
  descricao: string | null;
  mensagens: MensagemEnviadaHistoricoItem[];
}

export interface ListarCobrancasDashboardFiltro {
  status?: StatusCobranca;
  busca?: string;
  mes?: number;
  ano?: number;
  pagina?: number;
  itensPorPagina?: number;
}

export async function listarCobrancasDashboard(
  filtro: ListarCobrancasDashboardFiltro = {},
): Promise<ListarCobrancasDashboardResposta> {
  const params = new URLSearchParams();
  if (filtro.status) params.set("status", filtro.status);
  if (filtro.busca) params.set("busca", filtro.busca);
  if (filtro.mes) params.set("mes", String(filtro.mes));
  if (filtro.ano) params.set("ano", String(filtro.ano));
  if (filtro.pagina) params.set("pagina", String(filtro.pagina));
  if (filtro.itensPorPagina) params.set("itensPorPagina", String(filtro.itensPorPagina));

  const query = params.toString();
  return apiFetch<ListarCobrancasDashboardResposta>(`/dashboard/cobrancas${query ? `?${query}` : ""}`);
}

export async function buscarIndicadoresDashboard(
  filtro: { mes?: number; ano?: number } = {},
): Promise<IndicadoresDashboard> {
  const params = new URLSearchParams();
  if (filtro.mes) params.set("mes", String(filtro.mes));
  if (filtro.ano) params.set("ano", String(filtro.ano));

  const query = params.toString();
  return apiFetch<IndicadoresDashboard>(`/dashboard/indicadores${query ? `?${query}` : ""}`);
}

export async function buscarCobrancaDetalhe(id: string): Promise<CobrancaDashboardDetalhe | null> {
  try {
    return await apiFetch<CobrancaDashboardDetalhe>(`/dashboard/cobrancas/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export interface CriarCobrancaManualInput {
  clienteId: string;
  valor: number;
  vencimento: string;
  descricao?: string | null;
}

export interface CobrancaManualCriada {
  id: string;
  status: StatusCobranca;
  origem: OrigemCobranca;
  descricao: string | null;
  linkPagamento: string | null;
  pixCopiaECola: string | null;
}

export async function criarCobrancaManual(input: CriarCobrancaManualInput): Promise<CobrancaManualCriada> {
  return apiFetch<CobrancaManualCriada>("/cobrancas", { method: "POST", body: input });
}

export async function cancelarCobranca(id: string): Promise<CobrancaDashboardDetalhe> {
  return apiFetch<CobrancaDashboardDetalhe>(`/dashboard/cobrancas/${id}/cancelar`, { method: "PATCH", body: {} });
}

export async function reenviarMensagem(cobrancaId: string, mensagemId: string): Promise<CobrancaDashboardDetalhe> {
  return apiFetch<CobrancaDashboardDetalhe>(
    `/dashboard/cobrancas/${cobrancaId}/mensagens/${mensagemId}/reenviar`,
    { method: "POST", body: {} },
  );
}

export interface ErroGeracaoCobrancaItem {
  id: string;
  clienteId: string;
  nomeCliente: string;
  mensagemErro: string;
  ocorridoEm: string;
}

export interface MensagemComFalhaItem {
  id: string;
  cobrancaId: string;
  nomeCliente: string;
  tipo: TipoMensagem;
  canal: CanalNotificacao;
  enviadoEm: string;
}

export interface ErrosOperacionais {
  errosGeracaoCobranca: ResultadoPaginado<ErroGeracaoCobrancaItem>;
  mensagensComFalha: ResultadoPaginado<MensagemComFalhaItem>;
}

export async function buscarErrosOperacionais(
  filtro: { paginaErros?: number; paginaMensagens?: number } = {},
): Promise<ErrosOperacionais> {
  const params = new URLSearchParams();
  if (filtro.paginaErros) params.set("paginaErros", String(filtro.paginaErros));
  if (filtro.paginaMensagens) params.set("paginaMensagens", String(filtro.paginaMensagens));

  const query = params.toString();
  return apiFetch<ErrosOperacionais>(`/dashboard/erros${query ? `?${query}` : ""}`);
}
