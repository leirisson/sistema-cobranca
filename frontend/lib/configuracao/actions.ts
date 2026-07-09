"use server";

import { revalidatePath } from "next/cache";

import { ApiError } from "../api/client";
import {
  atualizarConfiguracao,
  conectarWhatsapp,
  obterStatusWhatsapp,
  type ConfiguracaoDTO,
  type WhatsappConectarDTO,
  type WhatsappStatusDTO,
} from "../api/configuracoes";
import { configuracaoSchema } from "./schema";

export interface ConfiguracaoFormState {
  error?: string;
  sucesso?: boolean;
  configuracao?: ConfiguracaoDTO;
}

export async function atualizarConfiguracaoAction(
  _state: ConfiguracaoFormState,
  formData: FormData,
): Promise<ConfiguracaoFormState> {
  const bruto = {
    asaasApiKey: formData.get("asaasApiKey")?.toString() ?? undefined,
    nomeRemetente: formData.get("nomeRemetente")?.toString() || null,
    confirmacaoPagamentoHabilitada: formData.get("confirmacaoPagamentoHabilitada") === "on",
  };

  const resultado = configuracaoSchema.safeParse(bruto);

  if (!resultado.success) {
    return { error: resultado.error.issues[0]?.message ?? "Dados de configuração inválidos." };
  }

  try {
    const configuracao = await atualizarConfiguracao(resultado.data);
    revalidatePath("/configuracoes");

    return { sucesso: true, configuracao };
  } catch (error) {
    return { error: mensagemDeErro(error) };
  }
}

export async function buscarStatusWhatsappAction(): Promise<WhatsappStatusDTO> {
  return obterStatusWhatsapp();
}

export async function conectarWhatsappAction(): Promise<WhatsappConectarDTO> {
  return conectarWhatsapp();
}

function mensagemDeErro(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Não foi possível salvar as configurações. Tente novamente em instantes.";
}
