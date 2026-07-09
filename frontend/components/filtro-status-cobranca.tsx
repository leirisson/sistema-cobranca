import Link from "next/link";

import type { StatusCobranca } from "@/lib/api/cobrancas";

const OPCOES: { label: string; value?: StatusCobranca }[] = [
  { label: "Todas", value: undefined },
  { label: "Pendentes", value: "PENDENTE" },
  { label: "Pagas", value: "PAGO" },
  { label: "Atrasadas", value: "ATRASADO" },
  { label: "Canceladas", value: "CANCELADO" },
];

export function FiltroStatusCobranca({
  statusAtual,
  mes,
  ano,
}: {
  statusAtual?: StatusCobranca;
  mes: number;
  ano: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-md border border-linha bg-white p-1">
      {OPCOES.map((opcao) => {
        const params = new URLSearchParams();
        params.set("mes", String(mes));
        params.set("ano", String(ano));
        if (opcao.value) params.set("status", opcao.value);
        const href = `/dashboard?${params.toString()}`;
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
