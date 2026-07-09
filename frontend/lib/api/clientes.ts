import "server-only";

import { apiFetch } from "./client";

export type StatusCliente = "ATIVO" | "INATIVO";
export type TipoDocumento = "CPF" | "CNPJ";

export interface TelefoneClienteDTO {
  id?: string;
  numero: string;
  principal: boolean;
}

export interface EnderecoClienteDTO {
  rua: string;
  numero?: string | null;
  bairro?: string | null;
  cidade: string;
  uf: string;
  cep: string;
}

export interface ClienteDTO {
  id: string;
  nome: string;
  documento: string;
  tipoDocumento: TipoDocumento;
  telefones: TelefoneClienteDTO[];
  email: string | null;
  valorCobranca: number;
  diaVencimento: number;
  status: StatusCliente;
  inscricaoEstadual: string | null;
  endereco: EnderecoClienteDTO | null;
  nomeContato: string | null;
  referenciaServico: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClienteInput {
  nome: string;
  documento: string;
  telefones: TelefoneClienteDTO[];
  email?: string | null;
  valorCobranca: number;
  diaVencimento: number;
  inscricaoEstadual?: string | null;
  endereco?: EnderecoClienteDTO | null;
  nomeContato?: string | null;
  referenciaServico?: string | null;
}

export interface ListarClientesFiltro {
  busca?: string;
  status?: StatusCliente;
}

export async function listarClientes(filtro: ListarClientesFiltro = {}): Promise<ClienteDTO[]> {
  const params = new URLSearchParams();
  if (filtro.busca) params.set("busca", filtro.busca);
  if (filtro.status) params.set("status", filtro.status);

  const query = params.toString();
  return apiFetch<ClienteDTO[]>(`/clientes${query ? `?${query}` : ""}`);
}

export async function buscarCliente(id: string): Promise<ClienteDTO | null> {
  try {
    return await apiFetch<ClienteDTO>(`/clientes/${id}`);
  } catch (error) {
    if (isApiErrorComStatus(error, 404)) {
      return null;
    }

    throw error;
  }
}

export async function criarCliente(input: ClienteInput): Promise<ClienteDTO> {
  return apiFetch<ClienteDTO>("/clientes", { method: "POST", body: input });
}

export async function editarCliente(id: string, input: ClienteInput): Promise<ClienteDTO> {
  return apiFetch<ClienteDTO>(`/clientes/${id}`, { method: "PUT", body: input });
}

export async function alternarStatusCliente(id: string, status: StatusCliente): Promise<ClienteDTO> {
  return apiFetch<ClienteDTO>(`/clientes/${id}/status`, { method: "PATCH", body: { status } });
}

export type ResultadoExclusaoCliente = "REMOVIDO" | "ANONIMIZADO";

export async function excluirClienteDefinitivamente(id: string): Promise<ResultadoExclusaoCliente> {
  const resposta = await apiFetch<{ resultado: ResultadoExclusaoCliente }>(`/clientes/${id}`, {
    method: "DELETE",
    body: {},
  });
  return resposta.resultado;
}

function isApiErrorComStatus(error: unknown, status: number): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status: unknown }).status === status
  );
}
