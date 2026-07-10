const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatadorPercentual = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

export function KpiFicha({
  label,
  valor,
  detalhe,
  tom = "neutro",
  atraso = 0,
}: {
  label: string;
  valor: string;
  detalhe?: string;
  tom?: "neutro" | "atencao" | "risco" | "positivo";
  atraso?: number;
}) {
  const corTom: Record<typeof tom, string> = {
    neutro: "text-grafite",
    atencao: "text-carimbo-pendente-solido",
    risco: "text-carimbo-atrasado",
    positivo: "text-carimbo-pago",
  };

  return (
    <div
      className="entrada-escalonada group relative flex min-w-0 flex-col gap-1 rounded-sm border border-linha bg-white/70 px-4 py-3.5 transition-colors hover:border-tinta/25 hover:bg-white"
      style={{ animationDelay: `${atraso}ms` }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-3 h-2 w-6 -translate-y-1/2 rounded-[1px] bg-[color-mix(in_srgb,var(--carimbo-pendente)_35%,var(--papel))] opacity-70"
        style={{ boxShadow: "0 1px 2px rgba(28,35,33,0.15)" }}
      />
      <p className="truncate text-[10px] font-semibold tracking-[0.16em] text-grafite-suave uppercase">{label}</p>
      <p className={`truncate font-numeric text-lg font-semibold tabular-nums sm:text-xl ${corTom[tom]}`}>{valor}</p>
      {detalhe && <p className="truncate text-xs text-grafite-suave">{detalhe}</p>}
    </div>
  );
}

export function formatarMoedaKpi(valor: number): string {
  return formatadorMoeda.format(valor);
}

export function formatarPercentualKpi(valor: number): string {
  return `${formatadorPercentual.format(valor)}%`;
}
