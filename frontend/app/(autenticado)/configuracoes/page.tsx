import type { Metadata } from "next";

import { FormularioConfiguracao } from "@/components/formulario-configuracao";
import { StatusWhatsapp } from "@/components/status-whatsapp";
import { obterConfiguracao } from "@/lib/api/configuracoes";

export const metadata: Metadata = {
  title: "Configurações — Cobranças",
};

export default async function ConfiguracoesPage() {
  const configuracao = await obterConfiguracao();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-2xl font-semibold text-grafite">Configurações</h1>

      <FormularioConfiguracao configuracaoInicial={configuracao} />
      <StatusWhatsapp />
    </main>
  );
}
