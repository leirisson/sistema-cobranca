const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const CORES = {
  pendente: "bg-carimbo-pendente-solido",
  pago: "bg-carimbo-pago",
  atrasado: "bg-carimbo-atrasado",
} as const;

const SIMBOLOS = {
  pendente: "◷",
  pago: "✓",
  atrasado: "!",
} as const;

export function CardResumo({
  label,
  valor,
  cor,
  atraso = 0,
}: {
  label: string;
  valor: number;
  cor: keyof typeof CORES;
  atraso?: number;
}) {
  return (
    <div
      className={`entrada-escalonada relative min-w-0 overflow-hidden rounded-md px-5 py-5 shadow-[0_10px_24px_-8px_rgba(28,35,33,0.32)] sm:px-6 ${CORES[cor]}`}
      style={{ animationDelay: `${atraso}ms` }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-3 -top-3 font-display text-7xl font-medium text-papel/10 select-none"
      >
        {SIMBOLOS[cor]}
      </span>
      <p className="relative truncate text-xs font-semibold tracking-[0.16em] text-papel/75 uppercase">{label}</p>
      <p className="relative mt-2 truncate font-display text-2xl font-medium tabular-nums text-papel sm:text-3xl">
        {formatadorMoeda.format(valor)}
      </p>
    </div>
  );
}
