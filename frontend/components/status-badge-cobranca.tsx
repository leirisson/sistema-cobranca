import type { StatusCobranca } from "@/lib/api/cobrancas";

const ESTILO_POR_STATUS: Record<StatusCobranca, string> = {
  PAGO: "border-carimbo-pago text-carimbo-pago",
  PENDENTE: "border-carimbo-pendente text-carimbo-pendente",
  ATRASADO: "border-carimbo-atrasado text-carimbo-atrasado",
  CANCELADO: "border-carimbo-cancelado text-carimbo-cancelado",
};

const ROTACAO_POR_STATUS: Record<StatusCobranca, string> = {
  PAGO: "-4deg",
  PENDENTE: "1.5deg",
  ATRASADO: "-2deg",
  CANCELADO: "3deg",
};

const LABEL_POR_STATUS: Record<StatusCobranca, string> = {
  PAGO: "Pago",
  PENDENTE: "Pendente",
  ATRASADO: "Atrasado",
  CANCELADO: "Cancelado",
};

export function StatusBadgeCobranca({ status, tamanho = "sm" }: { status: StatusCobranca; tamanho?: "sm" | "lg" }) {
  const padding = tamanho === "lg" ? "px-3.5 py-1.5 text-sm" : "px-2 py-0.5 text-xs";

  return (
    <span
      style={{ "--rot": ROTACAO_POR_STATUS[status] } as React.CSSProperties}
      className={`carimbo-rotacionado relative inline-flex items-center rounded-sm border-2 font-numeric font-semibold tracking-[0.14em] uppercase ${padding} ${ESTILO_POR_STATUS[status]}`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-[3px] rounded-[1px] border border-current opacity-35"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-sm opacity-[0.12] mix-blend-multiply"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, transparent 40%, currentColor 41%, transparent 55%), radial-gradient(ellipse at 75% 80%, transparent 45%, currentColor 46%, transparent 60%)",
        }}
      />
      <span className="relative">{LABEL_POR_STATUS[status]}</span>
    </span>
  );
}
