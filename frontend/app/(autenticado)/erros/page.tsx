import type { Metadata } from "next";

import { TabelaErrosGeracaoCobranca } from "@/components/tabela-erros-geracao-cobranca";
import { TabelaMensagensComFalha } from "@/components/tabela-mensagens-com-falha";
import { buscarErrosOperacionais } from "@/lib/api/cobrancas";

export const metadata: Metadata = {
  title: "Erros operacionais — CobraCerta",
};

export default async function ErrosPage() {
  const { errosGeracaoCobranca, mensagensComFalha } = await buscarErrosOperacionais();

  return (
    <main className="flex w-full flex-1 flex-col gap-6 px-6 py-10 sm:px-10 lg:px-16">
      <div>
        <h1 className="font-display text-2xl font-semibold text-grafite">Erros operacionais</h1>
        <p className="mt-1 text-sm text-grafite-suave">
          Cobranças que não puderam ser geradas e mensagens que falharam ao enviar — os últimos 20 registros de cada.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-medium text-grafite">Falhas ao gerar cobrança</h2>
        <div className="overflow-x-auto rounded-md border border-linha bg-white shadow-[0_4px_16px_-4px_rgba(28,35,33,0.12)]">
          <TabelaErrosGeracaoCobranca erros={errosGeracaoCobranca} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-medium text-grafite">Mensagens com falha de envio</h2>
        <div className="overflow-x-auto rounded-md border border-linha bg-white shadow-[0_4px_16px_-4px_rgba(28,35,33,0.12)]">
          <TabelaMensagensComFalha mensagens={mensagensComFalha} />
        </div>
      </section>
    </main>
  );
}
