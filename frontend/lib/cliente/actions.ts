"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiError } from "../api/client";
import {
  alternarStatusCliente,
  criarCliente,
  editarCliente,
  excluirClienteDefinitivamente,
  type ClienteInput,
  type StatusCliente,
  type TelefoneClienteDTO,
} from "../api/clientes";
import { clienteSchema } from "./schema";

export interface ClienteFormState {
  error?: string;
  camposComErro?: Record<string, string>;
}

function extrairInputDoFormData(formData: FormData): { input?: ClienteInput; erro?: ClienteFormState } {
  const telefonesRaw = formData.get("telefones");
  const enderecoRaw = formData.get("endereco");

  let telefones: TelefoneClienteDTO[] = [];
  try {
    telefones = telefonesRaw ? JSON.parse(telefonesRaw.toString()) : [];
  } catch {
    return { erro: { error: "Telefones em formato inválido." } };
  }

  let endereco = null;
  const enderecoTexto = enderecoRaw?.toString().trim();
  if (enderecoTexto) {
    try {
      endereco = JSON.parse(enderecoTexto);
    } catch {
      return { erro: { error: "Endereço em formato inválido." } };
    }
  }

  const bruto = {
    nome: formData.get("nome")?.toString() ?? "",
    documento: (formData.get("documento")?.toString() ?? "").replace(/\D/g, ""),
    telefones,
    email: formData.get("email")?.toString() ?? "",
    valorCobranca: Number(formData.get("valorCobranca")),
    diaVencimento: Number(formData.get("diaVencimento")),
    inscricaoEstadual: formData.get("inscricaoEstadual")?.toString() || null,
    endereco,
    nomeContato: formData.get("nomeContato")?.toString() || null,
    referenciaServico: formData.get("referenciaServico")?.toString() || null,
  };

  const resultado = clienteSchema.safeParse(bruto);

  if (!resultado.success) {
    const primeiroErro = resultado.error.issues[0];
    const camposComErro: Record<string, string> = {};
    for (const issue of resultado.error.issues) {
      const campo = issue.path[0]?.toString();
      if (campo && !camposComErro[campo]) {
        camposComErro[campo] = issue.message;
      }
    }

    return {
      erro: {
        error: primeiroErro?.message ?? "Dados do cliente inválidos.",
        camposComErro,
      },
    };
  }

  return { input: resultado.data as ClienteInput };
}

export async function criarClienteAction(
  _state: ClienteFormState,
  formData: FormData,
): Promise<ClienteFormState> {
  const { input, erro } = extrairInputDoFormData(formData);
  if (erro) return erro;

  try {
    await criarCliente(input!);
  } catch (error) {
    return { error: mensagemDeErro(error) };
  }

  revalidatePath("/clientes");
  redirect("/clientes?sucesso=criado");
}

export async function editarClienteAction(
  id: string,
  _state: ClienteFormState,
  formData: FormData,
): Promise<ClienteFormState> {
  const { input, erro } = extrairInputDoFormData(formData);
  if (erro) return erro;

  try {
    await editarCliente(id, input!);
  } catch (error) {
    return { error: mensagemDeErro(error) };
  }

  revalidatePath("/clientes");
  redirect("/clientes?sucesso=editado");
}

export async function alternarStatusClienteAction(id: string, statusAtual: StatusCliente): Promise<void> {
  const novoStatus: StatusCliente = statusAtual === "ATIVO" ? "INATIVO" : "ATIVO";
  await alternarStatusCliente(id, novoStatus);
  revalidatePath("/clientes");
}

export async function excluirClienteDefinitivamenteAction(id: string): Promise<void> {
  try {
    await excluirClienteDefinitivamente(id);
  } catch (error) {
    throw new Error(mensagemDeErro(error));
  }

  revalidatePath("/clientes");
  redirect("/clientes?sucesso=excluido");
}

function mensagemDeErro(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Não foi possível salvar o cliente. Tente novamente em instantes.";
}
