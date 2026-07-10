import type { Metadata } from "next";
import Link from "next/link";

import { FormularioCliente } from "@/components/formulario-cliente";
import { criarClienteAction } from "@/lib/cliente/actions";

export const metadata: Metadata = {
  title: "Novo cliente — Cobranças",
};

export default function NovoClientePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <Link href="/clientes" className="text-sm text-grafite-suave hover:text-tinta">
          ← Voltar para clientes
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-grafite">Cadastrar cliente</h1>
      </div>

      <FormularioCliente action={criarClienteAction} />
    </main>
  );
}
