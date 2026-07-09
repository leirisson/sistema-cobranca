import Link from "next/link";
import type { Metadata } from "next";

import { DetalheCobranca } from "@/components/detalhe-cobranca";
import { buscarCobrancaDetalhe } from "@/lib/api/cobrancas";

export const metadata: Metadata = {
  title: "Detalhe da cobrança — CobraCerta",
};

interface DetalheCobrancaPageProps {
  params: Promise<{ id: string }>;
}

export default async function DetalheCobrancaPage({ params }: DetalheCobrancaPageProps) {
  const { id } = await params;
  const cobranca = await buscarCobrancaDetalhe(id);

  if (!cobranca) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-xl font-semibold text-grafite">Cobrança não encontrada</h1>
        <Link href="/dashboard" className="text-sm font-medium text-tinta hover:underline">
          Voltar para o painel
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/dashboard" className="text-sm text-grafite-suave hover:text-tinta">
          ← Voltar para o painel
        </Link>
      </div>

      <DetalheCobranca detalheInicial={cobranca} />
    </main>
  );
}
