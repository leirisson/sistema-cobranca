"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiError } from "../api/client";
import { criarCobrancaManual } from "../api/cobrancas";
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
    return { error: mensagemDeErro(error) };
  }

  revalidatePath("/clientes");
  redirect("/clientes?sucesso=cobranca-criada");
}

function mensagemDeErro(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Não foi possível criar a cobrança. Tente novamente em instantes.";
}
