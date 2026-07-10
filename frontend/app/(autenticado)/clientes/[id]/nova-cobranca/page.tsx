import type { Metadata } from "next";
import Link from "next/link";

import { FormularioCobrancaManual } from "@/components/formulario-cobranca-manual";
import { buscarCliente } from "@/lib/api/clientes";
import { criarCobrancaManualAction } from "@/lib/cobranca/actions";

export const metadata: Metadata = {
  title: "Nova cobrança — CobraCerta",
};

interface NovaCobrancaPageProps {
  params: Promise<{ id: string }>;
}

export default async function NovaCobrancaPage({ params }: NovaCobrancaPageProps) {
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

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <Link href="/clientes" className="text-sm text-grafite-suave hover:text-tinta">
          ← Voltar para clientes
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-grafite">Nova cobrança avulsa</h1>
        <p className="mt-1 text-sm text-grafite-suave">Para {cliente.nome}</p>
      </div>

      <FormularioCobrancaManual clienteId={cliente.id} action={criarCobrancaManualAction} />
    </main>
  );
}
