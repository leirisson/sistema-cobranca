import type { StatusCobranca } from "@/lib/api/cobrancas";

const ESTILO_POR_STATUS: Record<StatusCobranca, string> = {
  PAGO: "border-carimbo-pago text-carimbo-pago -rotate-4",
  PENDENTE: "border-carimbo-pendente text-carimbo-pendente",
  ATRASADO: "border-carimbo-atrasado text-carimbo-atrasado",
  CANCELADO: "border-carimbo-cancelado text-carimbo-cancelado",
};

export function StatusBadgeCobranca({ status }: { status: StatusCobranca }) {
  return (
    <span
      className={`relative inline-flex items-center rounded-sm border-2 px-2 py-0.5 font-numeric text-xs font-medium tracking-wider before:pointer-events-none before:absolute before:inset-0.5 before:rounded-[1px] before:border before:border-current before:opacity-40 ${ESTILO_POR_STATUS[status]}`}
    >
      {status}
    </span>
  );
}
