import type { StatusCliente } from "@/lib/api/clientes";

const ESTILO_POR_STATUS: Record<StatusCliente, string> = {
  ATIVO: "border-carimbo-pago text-carimbo-pago",
  INATIVO: "border-carimbo-atrasado text-carimbo-atrasado",
};

const ROTACAO_POR_STATUS: Record<StatusCliente, string> = {
  ATIVO: "-2deg",
  INATIVO: "2deg",
};

const LABEL_POR_STATUS: Record<StatusCliente, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
};

export function StatusBadge({ status }: { status: StatusCliente }) {
  return (
    <span
      style={{ "--rot": ROTACAO_POR_STATUS[status] } as React.CSSProperties}
      className={`carimbo-rotacionado relative inline-flex items-center rounded-sm border-2 px-2 py-0.5 font-numeric text-xs font-semibold tracking-[0.14em] uppercase ${ESTILO_POR_STATUS[status]}`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-[2px] rounded-[1px] border border-current opacity-35"
      />
      <span className="relative">{LABEL_POR_STATUS[status]}</span>
    </span>
  );
}
