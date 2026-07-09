import type { Metadata } from "next";

import { CardResumo } from "@/components/card-resumo";
import { FiltroStatusCobranca } from "@/components/filtro-status-cobranca";
import { SeletorMes } from "@/components/seletor-mes";
import { TabelaCobrancas } from "@/components/tabela-cobrancas";
import { listarCobrancasDashboard, type StatusCobranca } from "@/lib/api/cobrancas";

export const metadata: Metadata = {
  title: "Painel — CobraCerta",
};

interface DashboardPageProps {
  searchParams: Promise<{ status?: string; mes?: string; ano?: string }>;
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

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const agora = new Date();
  const mes = params.mes ? Number(params.mes) : agora.getUTCMonth() + 1;
  const ano = params.ano ? Number(params.ano) : agora.getUTCFullYear();
  const statusFiltro = STATUS_VALIDOS.includes(params.status as StatusCobranca)
    ? (params.status as StatusCobranca)
    : undefined;

  const { itens, totais } = await listarCobrancasDashboard({ status: statusFiltro, mes, ano });

  const mensagemVazio = statusFiltro
    ? `Nenhuma cobrança ${LABEL_STATUS_VAZIO[statusFiltro]} encontrada em ${NOMES_MES[mes - 1]} de ${ano}.`
    : `Nenhuma cobrança encontrada em ${NOMES_MES[mes - 1]} de ${ano}.`;

  return (
    <main className="flex w-full flex-1 flex-col gap-6 px-6 py-10 sm:px-10 lg:px-16">
      <h1 className="font-display text-2xl font-semibold text-grafite">Painel de cobranças</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CardResumo label="A receber" valor={totais.totalAReceber} cor="pendente" />
        <CardResumo label="Recebido" valor={totais.totalRecebido} cor="pago" />
        <CardResumo label="Em atraso" valor={totais.totalEmAtraso} cor="atrasado" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FiltroStatusCobranca statusAtual={statusFiltro} mes={mes} ano={ano} />
        <SeletorMes mes={mes} ano={ano} status={statusFiltro} />
      </div>

      <div className="overflow-x-auto rounded-md border border-linha bg-white shadow-[0_4px_16px_-4px_rgba(28,35,33,0.12)]">
        <TabelaCobrancas cobrancas={itens} mensagemVazio={mensagemVazio} />
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
