"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiError } from "../api/client";
import {
  buscarCobrancaDetalhe,
  cancelarCobranca,
  criarCobrancaManual,
  listarCobrancasDashboard,
  reenviarMensagem,
  type CobrancaDashboardDetalhe,
  type ListarCobrancasDashboardFiltro,
  type ListarCobrancasDashboardResposta,
} from "../api/cobrancas";
import { cobrancaManualSchema } from "./schema";

export interface CobrancaManualFormState {
  error?: string;
  camposComErro?: Record<string, string>;
}

export async function criarCobrancaManualAction(
  _state: CobrancaManualFormState,
  formData: FormData,
): Promise<CobrancaManualFormState> {
  const bruto = {
    clienteId: formData.get("clienteId")?.toString() ?? "",
    valor: Number(formData.get("valor")),
    vencimento: formData.get("vencimento")?.toString() ?? "",
    descricao: formData.get("descricao")?.toString() || null,
  };
  const origem = formData.get("origem")?.toString();

  const resultado = cobrancaManualSchema.safeParse(bruto);

  if (!resultado.success) {
    const primeiroErro = resultado.error.issues[0];
    const camposComErro: Record<string, string> = {};
    for (const issue of resultado.error.issues) {
      const campo = issue.path[0]?.toString();
      if (campo && !camposComErro[campo]) {
        camposComErro[campo] = issue.message;
      }
    }

    return { error: primeiroErro?.message ?? "Dados da cobrança inválidos.", camposComErro };
  }

  try {
    await criarCobrancaManual(resultado.data);
  } catch (error) {
    return { error: mensagemDeErro(error, "Não foi possível criar a cobrança. Tente novamente em instantes.") };
  }

  revalidatePath("/clientes");
  revalidatePath("/cobrancas");

  if (origem === "cobrancas") {
    redirect("/cobrancas?sucesso=cobranca-criada");
  }

  redirect("/clientes?sucesso=cobranca-criada");
}

export async function buscarDetalheCobrancaAction(id: string): Promise<CobrancaDashboardDetalhe | null> {
  return buscarCobrancaDetalhe(id);
}

export async function listarCobrancasDashboardAction(
  filtro: ListarCobrancasDashboardFiltro,
): Promise<ListarCobrancasDashboardResposta> {
  return listarCobrancasDashboard(filtro);
}

export async function cancelarCobrancaAction(id: string): Promise<CobrancaDashboardDetalhe> {
  try {
    const detalhe = await cancelarCobranca(id);
    revalidatePath(`/dashboard/cobrancas/${id}`);
    revalidatePath("/dashboard");
    revalidatePath("/cobrancas");

    return detalhe;
  } catch (error) {
    throw new Error(mensagemDeErro(error, "Não foi possível cancelar a cobrança. Tente novamente em instantes."));
  }
}

export async function reenviarMensagemAction(
  cobrancaId: string,
  mensagemId: string,
): Promise<CobrancaDashboardDetalhe> {
  try {
    const detalhe = await reenviarMensagem(cobrancaId, mensagemId);
    revalidatePath(`/dashboard/cobrancas/${cobrancaId}`);

    return detalhe;
  } catch (error) {
    throw new Error(mensagemDeErro(error, "Não foi possível reenviar a mensagem. Tente novamente em instantes."));
  }
}

function mensagemDeErro(error: unknown, padrao: string): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return padrao;
}
