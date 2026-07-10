import type { Metadata } from "next";
import Link from "next/link";

import { FormularioNovaCobranca } from "@/components/formulario-nova-cobranca";
import { listarClientes } from "@/lib/api/clientes";

export const metadata: Metadata = {
  title: "Nova cobrança — CobraCerta",
};

export default async function NovaCobrancaDeCobrancasPage() {
  const { itens: clientes } = await listarClientes({ status: "ATIVO", itensPorPagina: 500 });

  return (
    <main className="papel-textura relative flex w-full min-w-0 flex-1 flex-col gap-8 px-4 py-8 sm:px-10 sm:py-10 lg:px-16">
      <div className="relative z-[1] entrada-escalonada">
        <Link
          href="/cobrancas"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-grafite-suave transition-colors hover:text-tinta"
        >
          <span aria-hidden="true">←</span> Voltar para cobranças
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold text-grafite">Nova cobrança avulsa</h1>
        <p className="mt-1.5 text-sm text-grafite-suave">Escolha o cliente para lançar a cobrança.</p>
      </div>

      <div
        className="entrada-escalonada relative z-[1] w-full rounded-md border border-linha bg-white p-6 shadow-[0_4px_20px_-6px_rgba(28,35,33,0.14)] sm:p-8"
        style={{ animationDelay: "60ms" }}
      >
        <FormularioNovaCobranca clientes={clientes} />
      </div>
    </main>
  );
}
