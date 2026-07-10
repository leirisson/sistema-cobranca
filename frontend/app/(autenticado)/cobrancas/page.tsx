import type { Metadata } from "next";
import Link from "next/link";

import { CampoBusca } from "@/components/campo-busca";
import { FiltroStatusCobranca } from "@/components/filtro-status-cobranca";
import { PaginacaoControles } from "@/components/paginacao-controles";
import { SeletorMes } from "@/components/seletor-mes";
import { TabelaCobrancas } from "@/components/tabela-cobrancas";
import { listarCobrancasDashboard, type StatusCobranca } from "@/lib/api/cobrancas";

export const metadata: Metadata = {
  title: "Cobranças — CobraCerta",
};

interface CobrancasPageProps {
  searchParams: Promise<{ status?: string; mes?: string; ano?: string; busca?: string; pagina?: string }>;
}

const STATUS_VALIDOS: StatusCobranca[] = ["PENDENTE", "PAGO", "ATRASADO", "CANCELADO"];

const NOMES_MES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export default async function CobrancasPage({ searchParams }: CobrancasPageProps) {
  const params = await searchParams;
  const agora = new Date();
  const mes = params.mes ? Number(params.mes) : agora.getUTCMonth() + 1;
  const ano = params.ano ? Number(params.ano) : agora.getUTCFullYear();
  const statusFiltro = STATUS_VALIDOS.includes(params.status as StatusCobranca)
    ? (params.status as StatusCobranca)
    : undefined;
  const busca = params.busca?.trim() || undefined;
  const pagina = params.pagina ? Number(params.pagina) : 1;

  const {
    itens,
    paginaAtual,
    totalPaginas,
  } = await listarCobrancasDashboard({ status: statusFiltro, mes, ano, busca, pagina });

  const mensagemVazio = busca
    ? `Nenhuma cobrança encontrada para "${busca}" em ${NOMES_MES[mes - 1]} de ${ano}.`
    : statusFiltro
      ? `Nenhuma cobrança ${LABEL_STATUS_VAZIO[statusFiltro]} encontrada em ${NOMES_MES[mes - 1]} de ${ano}.`
      : `Nenhuma cobrança encontrada em ${NOMES_MES[mes - 1]} de ${ano}.`;

  return (
    <main className="papel-textura relative flex w-full min-w-0 flex-1 flex-col gap-8 px-4 py-8 sm:px-10 sm:py-10 lg:px-16">
      <div className="relative z-[1] entrada-escalonada flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="font-display text-3xl font-semibold text-grafite">Cobranças</h1>
          <span className="font-numeric text-sm text-grafite-suave">
            {NOMES_MES[mes - 1]} · {ano}
          </span>
        </div>
        <Link
          href="/cobrancas/nova"
          className="inline-flex items-center gap-2 rounded-md bg-tinta px-5 py-2.5 text-sm font-medium text-papel transition-colors hover:bg-[var(--tinta-hover)]"
        >
          Nova cobrança
        </Link>
      </div>

      <div
        className="relative z-[1] entrada-escalonada"
        style={{ animationDelay: "60ms" }}
      >
        <CampoBusca
          valorInicial={busca ?? ""}
          baseHref="/cobrancas"
          placeholder="Buscar cobrança por cliente..."
        />
      </div>

      <div
        className="relative z-[1] entrada-escalonada flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
        style={{ animationDelay: "80ms" }}
      >
        <FiltroStatusCobranca statusAtual={statusFiltro} mes={mes} ano={ano} busca={busca} baseHref="/cobrancas" />
        <SeletorMes mes={mes} ano={ano} status={statusFiltro} busca={busca} baseHref="/cobrancas" />
      </div>

      <div
        className="entrada-escalonada relative z-[1] min-w-0 overflow-x-auto rounded-md border border-linha bg-white shadow-[0_4px_20px_-6px_rgba(28,35,33,0.14)]"
        style={{ animationDelay: "140ms" }}
      >
        <TabelaCobrancas
          key={`${statusFiltro ?? "todos"}-${mes}-${ano}-${busca ?? ""}-${paginaAtual}`}
          cobrancasIniciais={itens}
          mensagemVazio={mensagemVazio}
          filtro={{ status: statusFiltro, mes, ano, busca, pagina: paginaAtual }}
        />
        <PaginacaoControles
          paginaAtual={paginaAtual}
          totalPaginas={totalPaginas}
          baseHref="/cobrancas"
          searchParams={{ status: statusFiltro, mes: String(mes), ano: String(ano), busca }}
        />
      </div>
    </main>
  );
}

const LABEL_STATUS_VAZIO: Record<StatusCobranca, string> = {
  PENDENTE: "pendente",
  PAGO: "paga",
  ATRASADO: "atrasada",
  CANCELADO: "cancelada",
};
