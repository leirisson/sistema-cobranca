import type { Metadata } from "next";

import { PaginacaoControles } from "@/components/paginacao-controles";
import { TabelaErrosGeracaoCobranca } from "@/components/tabela-erros-geracao-cobranca";
import { TabelaMensagensComFalha } from "@/components/tabela-mensagens-com-falha";
import { buscarErrosOperacionais } from "@/lib/api/cobrancas";

export const metadata: Metadata = {
  title: "Erros operacionais — CobraCerta",
};

interface ErrosPageProps {
  searchParams: Promise<{ paginaErros?: string; paginaMensagens?: string }>;
}

export default async function ErrosPage({ searchParams }: ErrosPageProps) {
  const { paginaErros, paginaMensagens } = await searchParams;

  const { errosGeracaoCobranca, mensagensComFalha } = await buscarErrosOperacionais({
    paginaErros: paginaErros ? Number(paginaErros) : undefined,
    paginaMensagens: paginaMensagens ? Number(paginaMensagens) : undefined,
  });

  return (
    <main className="flex w-full min-w-0 flex-1 flex-col gap-6 px-4 py-8 sm:px-10 sm:py-10 lg:px-16">
      <div>
        <h1 className="font-display text-2xl font-semibold text-grafite">Erros operacionais</h1>
        <p className="mt-1 text-sm text-grafite-suave">
          Cobranças que não puderam ser geradas e mensagens que falharam ao enviar.
        </p>
      </div>

      <section className="flex min-w-0 flex-col gap-3">
        <h2 className="font-display text-lg font-medium text-grafite">Falhas ao gerar cobrança</h2>
        <div className="min-w-0 overflow-x-auto rounded-md border border-linha bg-white shadow-[0_4px_16px_-4px_rgba(28,35,33,0.12)]">
          <TabelaErrosGeracaoCobranca erros={errosGeracaoCobranca.itens} />
          <PaginacaoControles
            paginaAtual={errosGeracaoCobranca.paginaAtual}
            totalPaginas={errosGeracaoCobranca.totalPaginas}
            baseHref="/erros"
            searchParams={{ paginaMensagens }}
            paramPagina="paginaErros"
          />
        </div>
      </section>

      <section className="flex min-w-0 flex-col gap-3">
        <h2 className="font-display text-lg font-medium text-grafite">Mensagens com falha de envio</h2>
        <div className="min-w-0 overflow-x-auto rounded-md border border-linha bg-white shadow-[0_4px_16px_-4px_rgba(28,35,33,0.12)]">
          <TabelaMensagensComFalha mensagens={mensagensComFalha.itens} />
          <PaginacaoControles
            paginaAtual={mensagensComFalha.paginaAtual}
            totalPaginas={mensagensComFalha.totalPaginas}
            baseHref="/erros"
            searchParams={{ paginaErros }}
            paramPagina="paginaMensagens"
          />
        </div>
      </section>
    </main>
  );
}
