import Link from "next/link";

import type { CobrancaDashboardItem } from "@/lib/api/cobrancas";

import { StatusBadgeCobranca } from "./status-badge-cobranca";

const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatadorData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });

export function TabelaCobrancas({
  cobrancas,
  mensagemVazio,
}: {
  cobrancas: CobrancaDashboardItem[];
  mensagemVazio: string;
}) {
  if (cobrancas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <p className="text-grafite">{mensagemVazio}</p>
      </div>
    );
  }

  return (
    <table className="w-full min-w-[560px] border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-linha text-xs uppercase tracking-wide text-grafite-suave">
          <th className="px-4 py-3 font-medium">Cliente</th>
          <th className="px-4 py-3 text-right font-medium">Valor</th>
          <th className="px-4 py-3 font-medium">Vencimento</th>
          <th className="px-4 py-3 font-medium">Status</th>
        </tr>
      </thead>
      <tbody>
        {cobrancas.map((cobranca) => (
          <tr key={cobranca.id} className="border-b border-linha last:border-0">
            <td className="px-4 py-3 whitespace-nowrap text-grafite">
              <Link href={`/dashboard/cobrancas/${cobranca.id}`} className="transition-colors hover:text-tinta hover:underline">
                {cobranca.nomeCliente}
              </Link>
              {cobranca.origem === "AVULSA" && (
                <span className="ml-2 text-xs font-medium uppercase tracking-wide text-grafite-suave">Avulsa</span>
              )}
            </td>
            <td className="px-4 py-3 text-right font-numeric text-grafite">{formatadorMoeda.format(cobranca.valor)}</td>
            <td className="px-4 py-3 font-numeric whitespace-nowrap text-grafite">
              {formatadorData.format(new Date(cobranca.vencimento))}
            </td>
            <td className="px-4 py-3">
              <StatusBadgeCobranca status={cobranca.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
