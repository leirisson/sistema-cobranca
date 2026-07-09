import "server-only";

import { apiFetch } from "./client";

export interface ConfiguracaoDTO {
  asaasApiKeyConfigurada: boolean;
  asaasApiKeyUltimosDigitos: string | null;
  nomeRemetente: string | null;
  confirmacaoPagamentoHabilitada: boolean;
}

export interface AtualizarConfiguracaoInput {
  asaasApiKey?: string;
  nomeRemetente?: string | null;
  confirmacaoPagamentoHabilitada?: boolean;
}

export interface WhatsappStatusDTO {
  status: string;
}

export interface WhatsappConectarDTO {
  qrCodeBase64: string | null;
  status: string;
}

export async function obterConfiguracao(): Promise<ConfiguracaoDTO> {
  return apiFetch<ConfiguracaoDTO>("/configuracoes");
}

export async function atualizarConfiguracao(input: AtualizarConfiguracaoInput): Promise<ConfiguracaoDTO> {
  return apiFetch<ConfiguracaoDTO>("/configuracoes", { method: "PUT", body: input });
}

export async function conectarWhatsapp(): Promise<WhatsappConectarDTO> {
  return apiFetch<WhatsappConectarDTO>("/configuracoes/whatsapp/conectar", { method: "POST", body: {} });
}

export async function obterStatusWhatsapp(): Promise<WhatsappStatusDTO> {
  return apiFetch<WhatsappStatusDTO>("/configuracoes/whatsapp/status");
}
