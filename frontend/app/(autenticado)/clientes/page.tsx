import Link from "next/link";
import type { Metadata } from "next";

import { CampoBusca } from "@/components/campo-busca";
import { TabelaClientes } from "@/components/tabela-clientes";
import { listarClientes, type StatusCliente } from "@/lib/api/clientes";

export const metadata: Metadata = {
  title: "Clientes — CobraCerta",
};

interface ClientesPageProps {
  searchParams: Promise<{ busca?: string; status?: string; sucesso?: string }>;
}

const STATUS_VALIDOS: StatusCliente[] = ["ATIVO", "INATIVO"];

export default async function ClientesPage({ searchParams }: ClientesPageProps) {
  const { busca, status, sucesso } = await searchParams;
  const statusFiltro = STATUS_VALIDOS.includes(status as StatusCliente) ? (status as StatusCliente) : undefined;

  const clientes = await listarClientes({ busca, status: statusFiltro });

  return (
    <main className="flex w-full flex-1 flex-col gap-6 px-6 py-10 sm:px-10 lg:px-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-grafite">Clientes</h1>
        <Link
          href="/clientes/novo"
          className="rounded-md bg-tinta px-4 py-2.5 text-sm font-medium text-papel transition-colors hover:bg-[var(--tinta-hover)]"
        >
          Cadastrar cliente
        </Link>
      </div>

      {sucesso && (
        <p
          role="status"
          className="rounded-md border border-carimbo-pago/30 bg-carimbo-pago/5 px-4 py-3 text-sm text-carimbo-pago"
        >
          {sucesso === "criado"
            ? "Cliente cadastrado com sucesso."
            : sucesso === "cobranca-criada"
              ? "Cobrança criada com sucesso."
              : sucesso === "excluido"
                ? "Cliente excluído definitivamente."
                : "Cliente atualizado com sucesso."}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <CampoBusca valorInicial={busca ?? ""} />
        <FiltroStatus statusAtual={statusFiltro} busca={busca} />
      </div>

      <div className="overflow-x-auto rounded-md border border-linha bg-white shadow-[0_4px_16px_-4px_rgba(28,35,33,0.12)]">
        <TabelaClientes clientes={clientes} busca={busca} />
      </div>
    </main>
  );
}

function FiltroStatus({ statusAtual, busca }: { statusAtual?: StatusCliente; busca?: string }) {
  const opcoes: { label: string; value?: StatusCliente }[] = [
    { label: "Todos", value: undefined },
    { label: "Ativos", value: "ATIVO" },
    { label: "Inativos", value: "INATIVO" },
  ];

  return (
    <div className="flex items-center gap-1 rounded-md border border-linha bg-white p-1">
      {opcoes.map((opcao) => {
        const params = new URLSearchParams();
        if (busca) params.set("busca", busca);
        if (opcao.value) params.set("status", opcao.value);
        const href = `/clientes${params.toString() ? `?${params.toString()}` : ""}`;
        const ativo = statusAtual === opcao.value;

        return (
          <Link
            key={opcao.label}
            href={href}
            className={`rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
              ativo ? "bg-tinta text-papel" : "text-grafite-suave hover:text-grafite"
            }`}
          >
            {opcao.label}
          </Link>
        );
      })}
    </div>
  );
}
