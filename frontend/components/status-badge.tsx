import type { StatusCliente } from "@/lib/api/clientes";

const ESTILO_POR_STATUS: Record<StatusCliente, string> = {
  ATIVO: "border-carimbo-pago text-carimbo-pago",
  INATIVO: "border-carimbo-cancelado text-carimbo-cancelado",
};

export function StatusBadge({ status }: { status: StatusCliente }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border-2 px-2 py-0.5 font-numeric text-xs font-medium tracking-wider ${ESTILO_POR_STATUS[status]}`}
    >
      {status}
    </span>
  );
}
