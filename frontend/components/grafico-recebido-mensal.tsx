const formatadorMoedaCompacta = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});
const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const NOMES_MES_ABREV = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export interface PontoRecebidoMensal {
  mes: number;
  ano: number;
  totalRecebido: number;
}

const ALTURA = 160;
const LARGURA_BARRA = 40;
const GAP = 26;
const TOPO_RESERVADO = 26;

export function GraficoRecebidoMensal({ pontos, atraso = 0 }: { pontos: PontoRecebidoMensal[]; atraso?: number }) {
  const maiorValor = Math.max(...pontos.map((p) => p.totalRecebido), 1);
  const largura = pontos.length * LARGURA_BARRA + (pontos.length - 1) * GAP;
  const somaTotal = pontos.reduce((soma, p) => soma + p.totalRecebido, 0);
  const mediaMensal = pontos.length > 0 ? somaTotal / pontos.length : 0;

  return (
    <div
      className="entrada-escalonada relative min-w-0 overflow-hidden rounded-sm border border-linha bg-white/70 px-4 py-5 sm:px-6"
      style={{ animationDelay: `${atraso}ms` }}
    >
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-base font-semibold text-grafite">Recebido por mês</h2>
        <span className="font-numeric text-xs text-grafite-suave">
          média {formatadorMoedaCompacta.format(mediaMensal)} · últimos {pontos.length} meses
        </span>
      </div>

      <svg
        role="img"
        aria-label={`Gráfico de barras do valor recebido nos últimos ${pontos.length} meses: ${pontos
          .map((p) => `${NOMES_MES_ABREV[p.mes - 1]} ${formatadorMoeda.format(p.totalRecebido)}`)
          .join(", ")}`}
        viewBox={`0 0 ${largura} ${ALTURA + TOPO_RESERVADO + 34}`}
        preserveAspectRatio="xMinYMid meet"
        className="block w-full max-w-full"
        style={{ maxWidth: `min(${largura}px, 100%)` }}
      >
        <line
          x1={0}
          y1={TOPO_RESERVADO + ALTURA}
          x2={largura}
          y2={TOPO_RESERVADO + ALTURA}
          stroke="var(--linha)"
          strokeWidth={1}
        />

        {pontos.map((ponto, indice) => {
          const temValor = ponto.totalRecebido > 0;
          const alturaBarra = maiorValor > 0 ? Math.max((ponto.totalRecebido / maiorValor) * (ALTURA - TOPO_RESERVADO), temValor ? 3 : 0) : 0;
          const x = indice * (LARGURA_BARRA + GAP);
          const y = TOPO_RESERVADO + ALTURA - alturaBarra;
          const ehMesAtual = indice === pontos.length - 1;

          return (
            <g key={`${ponto.ano}-${ponto.mes}`} className="group/barra">
              <rect x={x} y={0} width={LARGURA_BARRA} height={TOPO_RESERVADO + ALTURA} fill="transparent" />
              <text
                x={x + LARGURA_BARRA / 2}
                y={temValor ? y - 8 : TOPO_RESERVADO + ALTURA - 8}
                textAnchor="middle"
                className={`font-numeric text-[10.5px] font-medium tabular-nums transition-opacity ${
                  temValor ? "fill-grafite" : "fill-grafite-suave/50"
                } group-hover/barra:opacity-70`}
              >
                {temValor ? formatadorMoedaCompacta.format(ponto.totalRecebido) : "—"}
              </text>
              <rect
                x={x}
                y={y}
                width={LARGURA_BARRA}
                height={alturaBarra}
                rx={4}
                ry={4}
                fill={ehMesAtual ? "var(--tinta)" : "var(--carimbo-pago)"}
                className="transition-opacity group-hover/barra:opacity-80"
              />
              <text
                x={x + LARGURA_BARRA / 2}
                y={TOPO_RESERVADO + ALTURA + 18}
                textAnchor="middle"
                className="fill-grafite-suave font-numeric text-[11px] tracking-wide uppercase"
              >
                {NOMES_MES_ABREV[ponto.mes - 1]}
              </text>
              <title>
                {NOMES_MES_ABREV[ponto.mes - 1]}/{ponto.ano}: {formatadorMoeda.format(ponto.totalRecebido)}
              </title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
