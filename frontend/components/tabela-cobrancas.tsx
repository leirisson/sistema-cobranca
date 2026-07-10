"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import { cancelarCobrancaAction, listarCobrancasDashboardAction } from "@/lib/cobranca/actions";
import type { CobrancaDashboardItem, ListarCobrancasDashboardFiltro, StatusCobranca } from "@/lib/api/cobrancas";

import { ModalConfirmarCancelamento } from "./modal-confirmar-cancelamento";
import { StatusBadgeCobranca } from "./status-badge-cobranca";

const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatadorData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });

const INTERVALO_POLLING_MS = 8000;

function podeCancelar(status: StatusCobranca) {
  return status === "PENDENTE" || status === "ATRASADO";
}

export function TabelaCobrancas({
  cobrancasIniciais,
  mensagemVazio,
  filtro,
}: {
  cobrancasIniciais: CobrancaDashboardItem[];
  mensagemVazio: string;
  filtro: ListarCobrancasDashboardFiltro;
}) {
  const [cobrancas, setCobrancas] = useState(cobrancasIniciais);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [cancelandoId, setCancelandoId] = useState<string | null>(null);
  const [erroId, setErroId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const intervalId = setInterval(() => {
      startTransition(async () => {
        try {
          const resposta = await listarCobrancasDashboardAction(filtro);
          setCobrancas(resposta.itens);
        } catch {
          // Falha silenciosa: mantém a última lista conhecida e tenta de novo no próximo intervalo.
        }
      });
    }, INTERVALO_POLLING_MS);

    return () => clearInterval(intervalId);
  }, [filtro]);

  function handleCancelar(id: string) {
    setErroId(null);
    setCancelandoId(id);
    startTransition(async () => {
      try {
        await cancelarCobrancaAction(id);
        setCobrancas((atual) =>
          atual.map((cobranca) => (cobranca.id === id ? { ...cobranca, status: "CANCELADO" } : cobranca)),
        );
        setConfirmandoId(null);
      } catch {
        setErroId(id);
      } finally {
        setCancelandoId(null);
      }
    });
  }

  if (cobrancas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <span aria-hidden="true" className="font-display text-4xl text-linha">
          ⁘
        </span>
        <p className="max-w-xs text-sm text-grafite-suave">{mensagemVazio}</p>
      </div>
    );
  }

  const cobrancaEmConfirmacao = cobrancas.find((cobranca) => cobranca.id === confirmandoId) ?? null;

  return (
    <>
      <ul className="flex flex-col lg:hidden">
        {cobrancas.map((cobranca, indice) => (
          <li
            key={cobranca.id}
            className="entrada-escalonada border-b border-linha/70 last:border-0"
            style={{ animationDelay: `${Math.min(indice, 10) * 35}ms` }}
          >
            <Link
              href={`/dashboard/cobrancas/${cobranca.id}`}
              className="flex flex-col gap-2.5 px-4 py-4 transition-colors active:bg-[color-mix(in_srgb,var(--tinta)_4%,transparent)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-grafite">{cobranca.nomeCliente}</p>
                  {cobranca.origem === "AVULSA" && (
                    <span className="mt-1 inline-flex rounded-sm bg-carimbo-cancelado/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-grafite-suave uppercase">
                      Avulsa
                    </span>
                  )}
                </div>
                <StatusBadgeCobranca status={cobranca.status} />
              </div>
              <div className="flex items-baseline justify-between gap-3 font-numeric text-sm">
                <span className="text-grafite-suave">
                  Vence em {formatadorData.format(new Date(cobranca.vencimento))}
                </span>
                <span className="font-medium tabular-nums text-grafite">{formatadorMoeda.format(cobranca.valor)}</span>
              </div>
            </Link>

            {podeCancelar(cobranca.status) && (
              <div className="px-4 pb-4">
                <button
                  type="button"
                  onClick={() => setConfirmandoId(cobranca.id)}
                  className="inline-flex items-center gap-1.5 rounded-md border-2 border-carimbo-atrasado px-3 py-1.5 text-xs font-semibold text-carimbo-atrasado"
                >
                  <span aria-hidden="true">✕</span> Cancelar cobrança
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <table className="hidden w-full min-w-[720px] border-collapse text-left text-sm lg:table">
        <thead>
          <tr className="border-b-2 border-tinta/15 text-xs font-semibold tracking-[0.14em] text-grafite-suave uppercase">
            <th className="px-5 py-3.5 font-semibold">Cliente</th>
            <th className="px-5 py-3.5 text-right font-semibold">Valor</th>
            <th className="px-5 py-3.5 font-semibold">Vencimento</th>
            <th className="px-5 py-3.5 font-semibold">Status</th>
            <th className="px-5 py-3.5 font-semibold">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {cobrancas.map((cobranca, indice) => (
            <tr
              key={cobranca.id}
              className="entrada-escalonada group border-b border-linha/70 transition-colors last:border-0 hover:bg-[color-mix(in_srgb,var(--tinta)_4%,transparent)]"
              style={{ animationDelay: `${Math.min(indice, 10) * 35}ms` }}
            >
              <td className="px-5 py-3.5 whitespace-nowrap text-grafite">
                <Link
                  href={`/dashboard/cobrancas/${cobranca.id}`}
                  className="font-medium underline decoration-linha decoration-1 underline-offset-4 transition-colors group-hover:text-tinta group-hover:decoration-tinta"
                >
                  {cobranca.nomeCliente}
                </Link>
                {cobranca.origem === "AVULSA" && (
                  <span className="ml-2 rounded-sm bg-carimbo-cancelado/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-grafite-suave uppercase">
                    Avulsa
                  </span>
                )}
              </td>
              <td className="px-5 py-3.5 text-right font-numeric font-medium tabular-nums text-grafite">
                {formatadorMoeda.format(cobranca.valor)}
              </td>
              <td className="px-5 py-3.5 font-numeric whitespace-nowrap text-grafite-suave">
                {formatadorData.format(new Date(cobranca.vencimento))}
              </td>
              <td className="px-5 py-3.5">
                <StatusBadgeCobranca status={cobranca.status} />
              </td>
              <td className="px-5 py-3.5 text-right">
                {podeCancelar(cobranca.status) && (
                  <button
                    type="button"
                    onClick={() => setConfirmandoId(cobranca.id)}
                    className="inline-flex items-center gap-1.5 rounded-md border-2 border-carimbo-atrasado px-3 py-1.5 text-xs font-semibold text-carimbo-atrasado transition-colors hover:bg-carimbo-atrasado hover:text-papel"
                  >
                    <span aria-hidden="true">✕</span> Cancelar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ModalConfirmarCancelamento
        aberto={cobrancaEmConfirmacao !== null}
        pendente={cancelandoId === cobrancaEmConfirmacao?.id}
        erro={erroId === cobrancaEmConfirmacao?.id}
        nomeCliente={cobrancaEmConfirmacao?.nomeCliente}
        onFechar={() => {
          setConfirmandoId(null);
          setErroId(null);
        }}
        onConfirmar={() => {
          if (cobrancaEmConfirmacao) {
            handleCancelar(cobrancaEmConfirmacao.id);
          }
        }}
      />
    </>
  );
}
