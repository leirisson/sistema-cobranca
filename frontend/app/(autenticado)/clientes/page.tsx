import Link from "next/link";
import type { Metadata } from "next";

import { CampoBusca } from "@/components/campo-busca";
import { PaginacaoControles } from "@/components/paginacao-controles";
import { TabelaClientes } from "@/components/tabela-clientes";
import { listarClientes, type StatusCliente } from "@/lib/api/clientes";

export const metadata: Metadata = {
  title: "Clientes — Cobranças",
};

interface ClientesPageProps {
  searchParams: Promise<{ busca?: string; status?: string; sucesso?: string; pagina?: string }>;
}

const STATUS_VALIDOS: StatusCliente[] = ["ATIVO", "INATIVO"];

export default async function ClientesPage({ searchParams }: ClientesPageProps) {
  const { busca, status, sucesso, pagina } = await searchParams;
  const statusFiltro = STATUS_VALIDOS.includes(status as StatusCliente) ? (status as StatusCliente) : undefined;
  const paginaAtual = pagina ? Number(pagina) : 1;

  const {
    itens: clientes,
    paginaAtual: paginaResolvida,
    totalPaginas,
    totalItens,
  } = await listarClientes({
    busca,
    status: statusFiltro,
    pagina: paginaAtual,
  });

  return (
    <main className="papel-textura relative flex w-full min-w-0 flex-1 flex-col gap-8 px-4 py-8 sm:px-10 sm:py-10 lg:px-16">
      <div className="relative z-[1] entrada-escalonada flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="font-display text-3xl font-semibold text-grafite">Clientes</h1>
          <span className="font-numeric text-sm text-grafite-suave">
            {totalItens} {totalItens === 1 ? "cadastrado" : "cadastrados"}
          </span>
        </div>
        <Link
          href="/clientes/novo"
          className="inline-flex items-center gap-2 rounded-md bg-tinta px-5 py-2.5 text-sm font-medium text-papel transition-colors hover:bg-[var(--tinta-hover)]"
        >
          Cadastrar cliente
        </Link>
      </div>

      {sucesso && (
        <p
          role="status"
          className="relative z-[1] entrada-escalonada rounded-md border border-carimbo-pago/30 bg-carimbo-pago/5 px-4 py-3 text-sm text-carimbo-pago"
          style={{ animationDelay: "40ms" }}
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

      <div
        className="relative z-[1] entrada-escalonada flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
        style={{ animationDelay: "60ms" }}
      >
        <CampoBusca valorInicial={busca ?? ""} baseHref="/clientes" placeholder="Buscar cliente por nome..." />
        <FiltroStatus statusAtual={statusFiltro} busca={busca} />
      </div>

      <div
        className="entrada-escalonada relative z-[1] min-w-0 overflow-x-auto rounded-md border border-linha bg-white shadow-[0_4px_20px_-6px_rgba(28,35,33,0.14)]"
        style={{ animationDelay: "140ms" }}
      >
        <TabelaClientes clientes={clientes} busca={busca} />
        <PaginacaoControles
          paginaAtual={paginaResolvida}
          totalPaginas={totalPaginas}
          baseHref="/clientes"
          searchParams={{ busca, status: statusFiltro }}
        />
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
    <div className="flex flex-wrap items-center gap-1 rounded-md border border-linha bg-white p-1">
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
