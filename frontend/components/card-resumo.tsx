const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const CORES = {
  pendente: "bg-carimbo-pendente-solido",
  pago: "bg-carimbo-pago",
  atrasado: "bg-carimbo-atrasado",
} as const;

export function CardResumo({
  label,
  valor,
  cor,
}: {
  label: string;
  valor: number;
  cor: keyof typeof CORES;
}) {
  return (
    <div className={`rounded-md px-6 py-5 shadow-[0_8px_20px_-6px_rgba(28,35,33,0.28)] ${CORES[cor]}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-papel">{label}</p>
      <p className="mt-2 font-display text-3xl font-medium tabular-nums text-papel">{formatadorMoeda.format(valor)}</p>
    </div>
  );
}
