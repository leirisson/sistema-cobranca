import type { Metadata } from "next";
import Link from "next/link";

import { CalendarioRecebimento } from "@/components/calendario-recebimento";
import { CardResumo } from "@/components/card-resumo";
import { GraficoRecebidoMensal, type PontoRecebidoMensal } from "@/components/grafico-recebido-mensal";
import { formatarMoedaKpi, formatarPercentualKpi, KpiFicha } from "@/components/kpi-ficha";
import { listarClientes } from "@/lib/api/clientes";
import { buscarIndicadoresDashboard, listarCobrancasDashboard } from "@/lib/api/cobrancas";

export const metadata: Metadata = {
  title: "Painel — CobraCerta",
};

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

export default async function DashboardPage() {
  const agora = new Date();
  const mes = agora.getUTCMonth() + 1;
  const ano = agora.getUTCFullYear();

  const ultimosSeisMeses: { mes: number; ano: number }[] = Array.from({ length: 6 }, (_, indice) => {
    const offset = 5 - indice;
    const data = new Date(Date.UTC(ano, mes - 1 - offset, 1));
    return { mes: data.getUTCMonth() + 1, ano: data.getUTCFullYear() };
  });

  const [{ totais }, indicadores, clientesAtivos, historicoMensal, { itens: cobrancasDoMes }] = await Promise.all([
    listarCobrancasDashboard({ mes, ano, itensPorPagina: 1 }),
    buscarIndicadoresDashboard({ mes, ano }),
    listarClientes({ status: "ATIVO", itensPorPagina: 1 }),
    Promise.all(
      ultimosSeisMeses.map(async (referencia): Promise<PontoRecebidoMensal> => {
        const resposta = await listarCobrancasDashboard({ ...referencia, itensPorPagina: 1 });
        return { ...referencia, totalRecebido: resposta.totais.totalRecebido };
      }),
    ),
    listarCobrancasDashboard({ mes, ano, itensPorPagina: 500 }),
  ]);

  const { totalGeradas, totalPagas, totalAtrasadas, ticketMedio, totalAvulsas } = indicadores;

  const taxaInadimplencia = totalGeradas > 0 ? (totalAtrasadas / totalGeradas) * 100 : 0;
  const taxaRecebimento = totalGeradas > 0 ? (totalPagas / totalGeradas) * 100 : 0;

  const totalProximosVencimentos = indicadores.proximosVencimentos.valorTotal;
  const quantidadeProximosVencimentos = indicadores.proximosVencimentos.quantidade;

  return (
    <main className="papel-textura relative flex w-full min-w-0 flex-1 flex-col gap-8 px-4 py-8 sm:px-10 sm:py-10 lg:px-16">
      <div className="relative z-[1] entrada-escalonada flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="font-display text-3xl font-semibold text-grafite">Painel</h1>
        <span className="font-numeric text-sm text-grafite-suave">
          {NOMES_MES[mes - 1]} · {ano}
        </span>
      </div>

      <div className="relative z-[1] grid grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
        <CardResumo label="A receber" valor={totais.totalAReceber} cor="pendente" atraso={60} />
        <CardResumo label="Recebido" valor={totais.totalRecebido} cor="pago" atraso={110} />
        <CardResumo label="Em atraso" valor={totais.totalEmAtraso} cor="atrasado" atraso={160} />
      </div>

      <div className="relative z-[1] flex flex-col gap-3">
        <p
          className="entrada-escalonada text-[11px] font-semibold tracking-[0.2em] text-grafite-suave/70 uppercase"
          style={{ animationDelay: "190ms" }}
        >
          Indicadores do mês
        </p>
        <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiFicha
            label="Taxa de recebimento"
            valor={formatarPercentualKpi(taxaRecebimento)}
            detalhe={`${totalPagas} de ${totalGeradas} cobranças`}
            tom={taxaRecebimento >= 70 ? "positivo" : "neutro"}
            atraso={210}
          />
          <KpiFicha
            label="Inadimplência"
            valor={formatarPercentualKpi(taxaInadimplencia)}
            detalhe={`${totalAtrasadas} em atraso`}
            tom={taxaInadimplencia > 20 ? "risco" : "neutro"}
            atraso={240}
          />
          <KpiFicha
            label="Ticket médio"
            valor={formatarMoedaKpi(ticketMedio)}
            detalhe="por cobrança"
            atraso={270}
          />
          <KpiFicha
            label="Vencem em 7 dias"
            valor={formatarMoedaKpi(totalProximosVencimentos)}
            detalhe={`${quantidadeProximosVencimentos} cobrança${quantidadeProximosVencimentos === 1 ? "" : "s"}`}
            tom={quantidadeProximosVencimentos > 0 ? "atencao" : "neutro"}
            atraso={300}
          />
          <KpiFicha
            label="Clientes ativos"
            valor={String(clientesAtivos.totalItens)}
            detalhe="carteira atual"
            atraso={330}
          />
          <KpiFicha
            label="Cobranças avulsas"
            valor={String(totalAvulsas)}
            detalhe="no mês"
            atraso={360}
          />
        </div>
      </div>

      <div className="relative z-[1] entrada-escalonada" style={{ animationDelay: "390ms" }}>
        <Link
          href="/cobrancas"
          className="inline-flex items-center gap-2 rounded-md bg-tinta px-5 py-2.5 text-sm font-medium text-papel transition-colors hover:bg-[var(--tinta-hover)]"
        >
          Ver cobranças
        </Link>
      </div>

      <div className="relative z-[1] grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_1fr]">
        <div style={{ animationDelay: "420ms" }}>
          <CalendarioRecebimento mesInicial={mes} anoInicial={ano} cobrancasIniciais={cobrancasDoMes} />
        </div>
        <div style={{ animationDelay: "450ms" }}>
          <GraficoRecebidoMensal pontos={historicoMensal} atraso={450} />
        </div>
      </div>
    </main>
  );
}
