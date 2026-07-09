"use client";

import { useState, useTransition } from "react";

import { cancelarCobrancaAction, reenviarMensagemAction } from "@/lib/cobranca/actions";
import type { CanalNotificacao, CobrancaDashboardDetalhe, TipoMensagem } from "@/lib/api/cobrancas";

import { StatusBadgeCobranca } from "./status-badge-cobranca";

const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatadorData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

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
  const [erro, setErro] = useState<string | null>(null);
  const [reenviandoId, setReenviandoId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const podeCancelar = detalhe.status === "PENDENTE" || detalhe.status === "ATRASADO";
  const podeReenviar = detalhe.status !== "PAGO" && detalhe.status !== "CANCELADO";

  function handleCancelar() {
    setErro(null);
    startTransition(async () => {
      try {
        const atualizado = await cancelarCobrancaAction(detalhe.id);
        setDetalhe(atualizado);
        setConfirmandoCancelamento(false);
      } catch {
        setErro("Não foi possível cancelar a cobrança. Tente novamente.");
        setConfirmandoCancelamento(false);
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
    <>
      <div className="rounded-md border border-linha bg-white p-6 shadow-[0_4px_16px_-4px_rgba(28,35,33,0.12)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-grafite">{detalhe.nomeCliente}</h1>
            <p className="mt-1 font-numeric text-sm text-grafite-suave">
              Vencimento em {formatadorData.format(new Date(detalhe.vencimento))}
            </p>
            {detalhe.origem === "AVULSA" && (
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-grafite-suave">
                Cobrança avulsa
              </p>
            )}
          </div>
          <StatusBadgeCobranca status={detalhe.status} />
        </div>

        <p className="mt-6 font-display text-3xl font-medium tabular-nums text-grafite">
          {formatadorMoeda.format(detalhe.valor)}
        </p>

        {detalhe.descricao && <p className="mt-2 text-sm text-grafite-suave">{detalhe.descricao}</p>}

        {(detalhe.linkPagamento || detalhe.pixCopiaECola) && (
          <div className="mt-6 flex flex-col gap-3 border-t border-linha pt-6">
            {detalhe.linkPagamento && (
              <a
                href={detalhe.linkPagamento}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center rounded-md bg-tinta px-4 py-2.5 text-sm font-medium text-papel transition-colors hover:bg-[var(--tinta-hover)]"
              >
                Abrir link de pagamento
              </a>
            )}

            {detalhe.pixCopiaECola && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-grafite-suave">Pix copia-e-cola</p>
                <p className="mt-1 break-all rounded-md border border-linha bg-papel px-3 py-2 font-numeric text-xs text-grafite">
                  {detalhe.pixCopiaECola}
                </p>
              </div>
            )}
          </div>
        )}

        {podeCancelar && (
          <div className="mt-6 border-t border-linha pt-6">
            {confirmandoCancelamento ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <p className="text-sm text-grafite">Cancelar esta cobrança? Essa ação não pode ser desfeita.</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCancelar}
                    disabled={pending}
                    className="rounded-md bg-carimbo-atrasado px-4 py-2 text-sm font-medium text-papel transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Confirmar cancelamento
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmandoCancelamento(false)}
                    disabled={pending}
                    className="rounded-md border border-linha px-4 py-2 text-sm font-medium text-grafite transition-colors hover:bg-papel"
                  >
                    Voltar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmandoCancelamento(true)}
                className="text-sm font-medium text-carimbo-atrasado hover:underline"
              >
                Cancelar cobrança
              </button>
            )}
          </div>
        )}

        {erro && (
          <p role="alert" className="mt-4 text-sm text-carimbo-atrasado">
            {erro}
          </p>
        )}
      </div>

      <div className="rounded-md border border-linha bg-white p-6 shadow-[0_4px_16px_-4px_rgba(28,35,33,0.12)]">
        <h2 className="font-display text-lg font-semibold text-grafite">Histórico de mensagens</h2>

        {detalhe.mensagens.length === 0 ? (
          <p className="mt-4 text-sm text-grafite-suave">Nenhuma mensagem enviada para esta cobrança ainda.</p>
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-linha">
            {detalhe.mensagens.map((mensagem) => (
              <li key={mensagem.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm text-grafite">
                    {LABEL_TIPO[mensagem.tipo]} · {LABEL_CANAL[mensagem.canal]}
                  </p>
                  <p className="mt-0.5 font-numeric text-xs text-grafite-suave">
                    {formatadorDataHora.format(new Date(mensagem.enviadoEm))}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {mensagem.statusEnvio === "FALHA" && podeReenviar && (
                    <button
                      type="button"
                      onClick={() => handleReenviar(mensagem.id)}
                      disabled={pending}
                      className="text-xs font-medium text-tinta hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {reenviandoId === mensagem.id && pending ? "Reenviando…" : "Reenviar"}
                    </button>
                  )}
                  <span
                    className={`text-xs font-medium uppercase tracking-wide ${
                      mensagem.statusEnvio === "ENVIADO" ? "text-carimbo-pago" : "text-carimbo-atrasado"
                    }`}
                  >
                    {mensagem.statusEnvio === "ENVIADO" ? "Enviado" : "Falha"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
