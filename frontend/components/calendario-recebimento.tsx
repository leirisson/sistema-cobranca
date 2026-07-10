"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

import { listarCobrancasDashboardAction } from "@/lib/cobranca/actions";
import type { CobrancaDashboardItem } from "@/lib/api/cobrancas";

const NOMES_MES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatadorDataExtenso = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});
const formatadorDiaSemanaExtenso = new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "UTC" });

interface DiaCalendario {
  data: Date;
  chave: string;
  noMesAtual: boolean;
}

function capitalizarPrimeiraLetra(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function chaveDia(data: Date): string {
  return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, "0")}-${String(data.getUTCDate()).padStart(2, "0")}`;
}

function montarGradeMes(mes: number, ano: number): DiaCalendario[] {
  const primeiroDia = new Date(Date.UTC(ano, mes - 1, 1));
  const inicioGrade = new Date(primeiroDia);
  inicioGrade.setUTCDate(primeiroDia.getUTCDate() - primeiroDia.getUTCDay());

  return Array.from({ length: 42 }, (_, indice) => {
    const data = new Date(inicioGrade);
    data.setUTCDate(inicioGrade.getUTCDate() + indice);
    return { data, chave: chaveDia(data), noMesAtual: data.getUTCMonth() === mes - 1 };
  });
}

export function CalendarioRecebimento({
  mesInicial,
  anoInicial,
  cobrancasIniciais,
}: {
  mesInicial: number;
  anoInicial: number;
  cobrancasIniciais: CobrancaDashboardItem[];
}) {
  const hoje = useMemo(() => new Date(), []);
  const chaveHoje = useMemo(() => chaveDia(hoje), [hoje]);

  const [mes, setMes] = useState(mesInicial);
  const [ano, setAno] = useState(anoInicial);
  const [cobrancas, setCobrancas] = useState(cobrancasIniciais);
  const [carregando, startTransition] = useTransition();
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(
    mesInicial === hoje.getUTCMonth() + 1 && anoInicial === hoje.getUTCFullYear() ? chaveHoje : null,
  );

  useEffect(() => {
    startTransition(async () => {
      try {
        const resposta = await listarCobrancasDashboardAction({ mes, ano, itensPorPagina: 500 });
        setCobrancas(resposta.itens);
      } catch {
        setCobrancas([]);
      }
    });
  }, [mes, ano]);

  const porDia = useMemo(() => {
    const mapa = new Map<string, { recebidas: CobrancaDashboardItem[]; aguardando: CobrancaDashboardItem[] }>();

    for (const cobranca of cobrancas) {
      const chave = chaveDia(new Date(cobranca.vencimento));
      const entrada = mapa.get(chave) ?? { recebidas: [], aguardando: [] };

      if (cobranca.status === "PAGO") {
        entrada.recebidas.push(cobranca);
      } else if (cobranca.status === "PENDENTE" || cobranca.status === "ATRASADO") {
        entrada.aguardando.push(cobranca);
      }

      mapa.set(chave, entrada);
    }

    return mapa;
  }, [cobrancas]);

  const grade = useMemo(() => montarGradeMes(mes, ano), [mes, ano]);

  function irParaMesAnterior() {
    setDiaSelecionado(null);
    if (mes === 1) {
      setMes(12);
      setAno((a) => a - 1);
    } else {
      setMes((m) => m - 1);
    }
  }

  function irParaProximoMes() {
    setDiaSelecionado(null);
    if (mes === 12) {
      setMes(1);
      setAno((a) => a + 1);
    } else {
      setMes((m) => m + 1);
    }
  }

  const itensDoDia = diaSelecionado ? (porDia.get(diaSelecionado) ?? { recebidas: [], aguardando: [] }) : null;
  const totalRecebidoNoDia = itensDoDia?.recebidas.reduce((soma, item) => soma + item.valor, 0) ?? 0;
  const totalAguardandoNoDia = itensDoDia?.aguardando.reduce((soma, item) => soma + item.valor, 0) ?? 0;
  const dataSelecionadaFormatada = diaSelecionado
    ? formatadorDataExtenso.format(new Date(`${diaSelecionado}T00:00:00Z`))
    : null;
  const diaSelecionadoSemanaExtenso = diaSelecionado
    ? capitalizarPrimeiraLetra(formatadorDiaSemanaExtenso.format(new Date(`${diaSelecionado}T00:00:00Z`)))
    : null;

  return (
    <div className="entrada-escalonada papel-textura relative overflow-hidden rounded-md border border-linha bg-white">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-8 -right-6 font-display text-[9rem] leading-none font-medium text-tinta/[0.03] select-none"
      >
        31
      </span>

      <div className="relative z-[1] flex flex-col gap-3 border-b border-linha px-5 py-5 sm:px-6">
        <div className="flex items-baseline gap-2.5">
          <span aria-hidden="true" className="text-lg text-tinta">
            ▤
          </span>
          <h2 className="font-display text-lg font-medium text-grafite">Calendário de recebimento</h2>
        </div>
        <p className="max-w-2xl text-sm text-grafite-suave">
          Acompanhe as cobranças recebidas e as que ainda aguardam o vencimento, dia a dia.
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
          <span className="flex items-center gap-1.5 text-xs font-medium tracking-[0.02em] text-grafite">
            <span className="h-2.5 w-2.5 rounded-[2px] bg-carimbo-pago shadow-[0_0_0_2px_rgba(47,111,78,0.18)]" aria-hidden="true" />
            Recebidas
          </span>
          <span className="flex items-center gap-1.5 text-xs font-medium tracking-[0.02em] text-grafite">
            <span
              className="h-2.5 w-2.5 rounded-[2px] bg-carimbo-pendente-solido shadow-[0_0_0_2px_rgba(141,97,28,0.18)]"
              aria-hidden="true"
            />
            Aguardando pagamento
          </span>
        </div>
      </div>

      <div className="relative z-[1] px-5 py-5 sm:px-6">
        <div className="mb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={irParaMesAnterior}
            aria-label="Mês anterior"
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-transparent text-grafite-suave transition-all hover:border-linha hover:bg-papel hover:text-tinta active:scale-95"
          >
            <span aria-hidden="true" className="text-lg">
              ‹
            </span>
          </button>
          <span className="font-display text-xl font-medium tracking-[0.01em] text-grafite">
            {NOMES_MES[mes - 1]} <span className="text-grafite-suave">{ano}</span>
          </span>
          <button
            type="button"
            onClick={irParaProximoMes}
            aria-label="Próximo mês"
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-transparent text-grafite-suave transition-all hover:border-linha hover:bg-papel hover:text-tinta active:scale-95"
          >
            <span aria-hidden="true" className="text-lg">
              ›
            </span>
          </button>
        </div>

        <div className={`grid grid-cols-7 transition-opacity duration-200 ${carregando ? "opacity-50" : "opacity-100"}`}>
          {DIAS_SEMANA.map((dia) => (
            <div
              key={dia}
              className="pb-3 text-center text-[10px] font-semibold tracking-[0.16em] text-tinta/60 uppercase"
            >
              {dia}
            </div>
          ))}

          {grade.map((diaCalendario, indice) => {
            const marcadores = porDia.get(diaCalendario.chave);
            const temRecebida = (marcadores?.recebidas.length ?? 0) > 0;
            const temAguardando = (marcadores?.aguardando.length ?? 0) > 0;
            const ehHoje = diaCalendario.chave === chaveHoje;
            const ehSelecionado = diaCalendario.chave === diaSelecionado;
            const somenteRecebida = temRecebida && !temAguardando;
            const somenteAguardando = temAguardando && !temRecebida;
            const ambos = temRecebida && temAguardando;

            return (
              <div key={diaCalendario.chave} className="flex items-center justify-center py-[3px]">
                <button
                  type="button"
                  onClick={() => setDiaSelecionado(diaCalendario.chave)}
                  style={{ animationDelay: `${Math.min(indice, 20) * 8}ms` }}
                  className={`entrada-escalonada group relative flex h-11 w-11 flex-col items-center justify-center gap-[3px] rounded-[3px] text-sm transition-all duration-150 sm:h-12 sm:w-12 ${
                    ehSelecionado
                      ? "efeito-carimbo scale-105 bg-tinta font-semibold text-papel shadow-[0_6px_16px_-4px_rgba(18,67,61,0.45)]"
                      : diaCalendario.noMesAtual
                        ? "text-grafite hover:-translate-y-[1px] hover:bg-papel"
                        : "text-grafite-suave/35 hover:bg-papel/60"
                  } ${
                    somenteRecebida && !ehSelecionado
                      ? "bg-[color-mix(in_srgb,var(--carimbo-pago)_10%,transparent)]"
                      : ""
                  } ${
                    somenteAguardando && !ehSelecionado
                      ? "bg-[color-mix(in_srgb,var(--carimbo-pendente-solido)_9%,transparent)]"
                      : ""
                  } ${ehHoje && !ehSelecionado ? "outline outline-1 outline-dashed outline-offset-2 outline-tinta/50" : ""}`}
                >
                  <span
                    className={`font-numeric ${ehHoje && !ehSelecionado ? "font-semibold text-tinta" : ""} ${ambos && !ehSelecionado ? "font-semibold" : ""}`}
                  >
                    {diaCalendario.data.getUTCDate()}
                  </span>
                  {(temRecebida || temAguardando) && (
                    <span className="flex items-center gap-[3px]" aria-hidden="true">
                      {temRecebida && (
                        <span
                          className={`h-[4px] w-[4px] rounded-full ${ehSelecionado ? "bg-papel" : "bg-carimbo-pago"}`}
                        />
                      )}
                      {temAguardando && (
                        <span
                          className={`h-[4px] w-[4px] rounded-full ${ehSelecionado ? "bg-papel" : "bg-carimbo-pendente-solido"}`}
                        />
                      )}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative z-[1] border-t border-linha bg-papel/60 px-5 py-5 sm:px-6">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.18em] text-grafite-suave uppercase">
              {diaSelecionadoSemanaExtenso ?? "Ficha do dia"}
            </p>
            <p className="font-display text-lg font-medium text-grafite">{dataSelecionadaFormatada ?? "Selecione um dia"}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {itensDoDia && itensDoDia.recebidas.length > 0 && (
              <p className="font-numeric text-sm font-semibold tabular-nums text-carimbo-pago">
                + {formatadorMoeda.format(totalRecebidoNoDia)}
              </p>
            )}
            {itensDoDia && itensDoDia.aguardando.length > 0 && (
              <p className="font-numeric text-xs font-medium tabular-nums text-carimbo-pendente-solido">
                {formatadorMoeda.format(totalAguardandoNoDia)} aguardando
              </p>
            )}
          </div>
        </div>

        {itensDoDia && itensDoDia.recebidas.length === 0 && itensDoDia.aguardando.length === 0 && (
          <p className="rounded-sm border border-dashed border-linha px-3 py-3 text-sm text-grafite-suave">
            Nenhuma cobrança neste dia.
          </p>
        )}

        {itensDoDia && (itensDoDia.recebidas.length > 0 || itensDoDia.aguardando.length > 0) && (
          <ul className="flex flex-col divide-y divide-linha/70 rounded-sm border border-linha bg-white/70">
            {[...itensDoDia.recebidas, ...itensDoDia.aguardando].map((cobranca) => (
              <li key={cobranca.id} className="flex items-center gap-3 px-3 py-2.5">
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    cobranca.status === "PAGO" ? "bg-carimbo-pago" : "bg-carimbo-pendente-solido"
                  }`}
                />
                <Link
                  href={`/dashboard/cobrancas/${cobranca.id}`}
                  className="min-w-0 flex-1 truncate text-sm text-grafite underline decoration-linha decoration-1 underline-offset-4 transition-colors hover:text-tinta hover:decoration-tinta"
                >
                  {cobranca.nomeCliente}
                </Link>
                <span
                  className={`shrink-0 font-numeric text-sm font-medium tabular-nums ${
                    cobranca.status === "PAGO" ? "text-carimbo-pago" : "text-carimbo-pendente-solido"
                  }`}
                >
                  {formatadorMoeda.format(cobranca.valor)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/cobrancas"
          className="mt-3 inline-flex items-center gap-1 self-end text-sm font-medium text-tinta underline decoration-tinta/40 decoration-1 underline-offset-4 transition-colors hover:decoration-tinta"
        >
          Ver todas as cobranças ›
        </Link>
      </div>
    </div>
  );
}
