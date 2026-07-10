import type { Metadata } from "next";
import Link from "next/link";

import { BotaoExcluirCliente } from "@/components/botao-excluir-cliente";
import { FormularioCliente } from "@/components/formulario-cliente";
import { buscarCliente } from "@/lib/api/clientes";
import { editarClienteAction, type ClienteFormState } from "@/lib/cliente/actions";

export const metadata: Metadata = {
  title: "Editar cliente — Cobranças",
};

interface EditarClientePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarClientePage({ params }: EditarClientePageProps) {
  const { id } = await params;
  const cliente = await buscarCliente(id);

  if (!cliente) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-xl font-semibold text-grafite">Cliente não encontrado</h1>
        <Link href="/clientes" className="text-sm font-medium text-tinta hover:underline">
          Voltar para clientes
        </Link>
      </main>
    );
  }

  async function editarComId(_state: ClienteFormState, formData: FormData): Promise<ClienteFormState> {
    "use server";
    return editarClienteAction(id, _state, formData);
  }

  return (
    <main className="flex w-full flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <Link href="/clientes" className="text-sm text-grafite-suave hover:text-tinta">
          ← Voltar para clientes
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-grafite">Editar cliente</h1>
      </div>

      <FormularioCliente clienteInicial={cliente} action={editarComId} />

      <BotaoExcluirCliente id={id} />
    </main>
  );
}
