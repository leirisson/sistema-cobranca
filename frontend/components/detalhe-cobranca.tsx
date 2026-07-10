"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { buscarDetalheCobrancaAction, cancelarCobrancaAction, reenviarMensagemAction } from "@/lib/cobranca/actions";
import type { CanalNotificacao, CobrancaDashboardDetalhe, TipoMensagem } from "@/lib/api/cobrancas";

import { ModalConfirmarCancelamento } from "./modal-confirmar-cancelamento";
import { StatusBadgeCobranca } from "./status-badge-cobranca";

const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatadorData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

const INTERVALO_POLLING_MS = 5000;
const STATUS_FINAIS = new Set(["PAGO", "CANCELADO"]);

const LABEL_TIPO: Record<TipoMensagem, string> = {
  LEMBRETE: "Lembrete",
  VENCIMENTO: "Vencimento",
  ATRASO: "Atraso",
  CONFIRMACAO: "Confirmação de pagamento",
};

const LABEL_CANAL: Record<CanalNotificacao, string> = {
  whatsapp: "WhatsApp",
  email: "E-mail",
};

export function DetalheCobranca({ detalheInicial }: { detalheInicial: CobrancaDashboardDetalhe }) {
  const [detalhe, setDetalhe] = useState(detalheInicial);
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);
  const [erroCancelamento, setErroCancelamento] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [reenviandoId, setReenviandoId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const podeCancelar = detalhe.status === "PENDENTE" || detalhe.status === "ATRASADO";
  const podeReenviar = detalhe.status !== "PAGO" && detalhe.status !== "CANCELADO";

  useEffect(() => {
    if (STATUS_FINAIS.has(detalhe.status)) {
      return;
    }

    intervalRef.current = setInterval(() => {
      startTransition(async () => {
        try {
          const atualizado = await buscarDetalheCobrancaAction(detalhe.id);
          if (atualizado) {
            setDetalhe(atualizado);
          }
        } catch {
          // Falha silenciosa: mantém o último estado conhecido e tenta de novo no próximo intervalo.
        }
      });
    }, INTERVALO_POLLING_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [detalhe.id, detalhe.status]);

  function handleCancelar() {
    setErroCancelamento(false);
    setCancelando(true);
    startTransition(async () => {
      try {
        const atualizado = await cancelarCobrancaAction(detalhe.id);
        setDetalhe(atualizado);
        setConfirmandoCancelamento(false);
      } catch {
        setErroCancelamento(true);
      } finally {
        setCancelando(false);
      }
    });
  }

  function handleReenviar(mensagemId: string) {
    setErro(null);
    setReenviandoId(mensagemId);
    startTransition(async () => {
      try {
        const atualizado = await reenviarMensagemAction(detalhe.id, mensagemId);
        setDetalhe(atualizado);
      } catch {
        setErro("Não foi possível reenviar a mensagem. Tente novamente.");
      } finally {
        setReenviandoId(null);
      }
    });
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_23rem] xl:gap-8">
      <div
        className="entrada-escalonada relative overflow-hidden rounded-md border border-linha bg-white shadow-[0_8px_28px_-8px_rgba(28,35,33,0.2)]"
        style={{ animationDelay: "60ms" }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 -right-10 font-display text-[11rem] leading-none font-medium text-tinta/[0.035] select-none"
        >
          §
        </span>

        <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.2em] text-grafite-suave uppercase">Cobrança de</p>
              <h1 className="mt-1.5 font-display text-3xl font-semibold break-words text-grafite sm:text-4xl">
                {detalhe.nomeCliente}
              </h1>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <p className="font-numeric text-sm text-grafite-suave">
                  Vencimento em {formatadorData.format(new Date(detalhe.vencimento))}
                </p>
                {detalhe.origem === "AVULSA" && (
                  <span className="inline-flex rounded-sm bg-carimbo-cancelado/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-grafite-suave uppercase">
                    Cobrança avulsa
                  </span>
                )}
              </div>
            </div>
            <div className="efeito-carimbo shrink-0" style={{ animationDelay: "220ms" }}>
              <StatusBadgeCobranca status={detalhe.status} tamanho="lg" />
            </div>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-t border-dashed border-linha pt-6">
            <p className="font-display text-4xl font-medium tabular-nums text-grafite sm:text-5xl">
              {formatadorMoeda.format(detalhe.valor)}
            </p>
            {detalhe.descricao && (
              <p className="max-w-sm text-sm text-grafite-suave sm:text-right">{detalhe.descricao}</p>
            )}
          </div>

          {(detalhe.linkPagamento || detalhe.pixCopiaECola) && (
            <div className="grid grid-cols-1 gap-4 border-t border-dashed border-linha pt-6 sm:grid-cols-[auto_1fr] sm:items-start">
              {detalhe.linkPagamento && (
                <a
                  href={detalhe.linkPagamento}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-fit items-center gap-2 rounded-md bg-tinta px-5 py-3 text-sm font-medium text-papel transition-colors hover:bg-[var(--tinta-hover)]"
                >
                  Abrir link de pagamento
                  <span aria-hidden="true">↗</span>
                </a>
              )}

              {detalhe.pixCopiaECola && (
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-grafite-suave uppercase">
                    Pix copia-e-cola
                  </p>
                  <p className="mt-1.5 rounded-md border border-linha bg-papel px-3.5 py-3 font-numeric text-xs break-all text-grafite">
                    {detalhe.pixCopiaECola}
                  </p>
                </div>
              )}
            </div>
          )}

          {podeCancelar && (
            <div className="border-t border-dashed border-linha pt-6">
              <button
                type="button"
                onClick={() => setConfirmandoCancelamento(true)}
                className="group inline-flex w-fit items-center gap-2 rounded-md border-2 border-carimbo-atrasado px-5 py-3 text-sm font-semibold text-carimbo-atrasado transition-colors hover:bg-carimbo-atrasado hover:text-papel"
              >
                <span aria-hidden="true" className="text-base leading-none">✕</span>
                Cancelar cobrança
              </button>
            </div>
          )}

          {erro && (
            <p role="alert" className="rounded-md border border-carimbo-atrasado/30 bg-[color-mix(in_srgb,var(--carimbo-atrasado)_8%,transparent)] px-4 py-3 text-sm font-medium text-carimbo-atrasado">
              {erro}
            </p>
          )}
        </div>
      </div>

      <div
        className="entrada-escalonada rounded-md border border-linha bg-white shadow-[0_8px_28px_-8px_rgba(28,35,33,0.2)] xl:sticky xl:top-8"
        style={{ animationDelay: "140ms" }}
      >
        <div className="border-b border-dashed border-linha p-6 sm:p-7">
          <h2 className="font-display text-lg font-semibold text-grafite">Histórico de mensagens</h2>
          <p className="mt-1 text-xs text-grafite-suave">Lembretes, vencimento, atraso e confirmação.</p>
        </div>

        <div className="p-6 sm:p-7">
          {detalhe.mensagens.length === 0 ? (
            <p className="text-sm text-grafite-suave">Nenhuma mensagem enviada para esta cobrança ainda.</p>
          ) : (
            <ul className="flex flex-col">
              {detalhe.mensagens.map((mensagem, indice) => (
                <li key={mensagem.id} className="relative flex items-start gap-4 pb-5 pl-1 last:pb-0">
                  {indice !== detalhe.mensagens.length - 1 && (
                    <span aria-hidden="true" className="absolute top-3 left-[7px] h-full w-px bg-linha" />
                  )}
                  <span
                    aria-hidden="true"
                    className={`relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 bg-papel ${
                      mensagem.statusEnvio === "ENVIADO" ? "border-carimbo-pago" : "border-carimbo-atrasado"
                    }`}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-grafite">
                          {LABEL_TIPO[mensagem.tipo]}
                          <span className="font-normal text-grafite-suave"> · {LABEL_CANAL[mensagem.canal]}</span>
                        </p>
                        <p className="mt-0.5 font-numeric text-xs text-grafite-suave">
                          {formatadorDataHora.format(new Date(mensagem.enviadoEm))}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-xs font-medium tracking-wide uppercase ${
                          mensagem.statusEnvio === "ENVIADO" ? "text-carimbo-pago" : "text-carimbo-atrasado"
                        }`}
                      >
                        {mensagem.statusEnvio === "ENVIADO" ? "Enviado" : "Falha"}
                      </span>
                    </div>
                    {mensagem.statusEnvio === "FALHA" && podeReenviar && (
                      <button
                        type="button"
                        onClick={() => handleReenviar(mensagem.id)}
                        disabled={pending}
                        className="w-fit text-xs font-medium text-tinta hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {reenviandoId === mensagem.id && pending ? "Reenviando…" : "Reenviar"}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ModalConfirmarCancelamento
        aberto={confirmandoCancelamento}
        pendente={cancelando}
        erro={erroCancelamento}
        nomeCliente={detalhe.nomeCliente}
        onFechar={() => {
          setConfirmandoCancelamento(false);
          setErroCancelamento(false);
        }}
        onConfirmar={handleCancelar}
      />
    </div>
  );
}
