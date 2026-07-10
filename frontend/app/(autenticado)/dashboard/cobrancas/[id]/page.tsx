import Link from "next/link";
import type { Metadata } from "next";

import { DetalheCobranca } from "@/components/detalhe-cobranca";
import { buscarCobrancaDetalhe } from "@/lib/api/cobrancas";

export const metadata: Metadata = {
  title: "Detalhe da cobrança — Cobranças",
};

interface DetalheCobrancaPageProps {
  params: Promise<{ id: string }>;
}

export default async function DetalheCobrancaPage({ params }: DetalheCobrancaPageProps) {
  const { id } = await params;
  const cobranca = await buscarCobrancaDetalhe(id);

  if (!cobranca) {
    return (
      <main className="papel-textura relative flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <span aria-hidden="true" className="relative z-[1] font-display text-4xl text-linha">
          ⁘
        </span>
        <h1 className="relative z-[1] font-display text-xl font-semibold text-grafite">Cobrança não encontrada</h1>
        <Link href="/cobrancas" className="relative z-[1] text-sm font-medium text-tinta hover:underline">
          ← Voltar para cobranças
        </Link>
      </main>
    );
  }

  return (
    <main className="papel-textura relative flex w-full min-w-0 flex-1 flex-col gap-8 px-4 py-8 sm:px-10 sm:py-10 lg:px-16">
      <div className="relative z-[1] entrada-escalonada">
        <Link
          href="/cobrancas"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-grafite-suave transition-colors hover:text-tinta"
        >
          <span aria-hidden="true">←</span> Voltar para cobranças
        </Link>
      </div>

      <div className="relative z-[1]">
        <DetalheCobranca detalheInicial={cobranca} />
      </div>
    </main>
  );
}
