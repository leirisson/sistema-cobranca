"use client";

import { useEffect } from "react";

export function ModalConfirmarCancelamento({
  aberto,
  pendente,
  erro = false,
  onConfirmar,
  onFechar,
  nomeCliente,
}: {
  aberto: boolean;
  pendente: boolean;
  erro?: boolean;
  onConfirmar: () => void;
  onFechar: () => void;
  nomeCliente?: string;
}) {
  useEffect(() => {
    if (!aberto) return;

    function handleKeyDown(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        onFechar();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [aberto, onFechar]);

  if (!aberto) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-cancelar-cobranca"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={onFechar}
        className="absolute inset-0 bg-grafite/45 backdrop-blur-[2px]"
        style={{ animation: "modal-overlay-in 0.2s ease-out both" }}
      />

      <div
        className="relative w-full max-w-sm overflow-hidden rounded-md border border-linha bg-white shadow-[0_24px_60px_-12px_rgba(28,35,33,0.45)]"
        style={{ animation: "modal-conteudo-in 0.22s cubic-bezier(0.16,1,0.3,1) both" }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-8 -right-8 font-display text-8xl leading-none font-medium text-carimbo-atrasado/[0.07] select-none"
        >
          ✕
        </span>

        <div className="relative flex flex-col gap-4 p-6 sm:p-7">
          <div className="flex items-start gap-3.5">
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-carimbo-atrasado text-base font-semibold text-carimbo-atrasado"
            >
              ✕
            </span>
            <div className="min-w-0">
              <h2 id="titulo-cancelar-cobranca" className="font-display text-lg font-semibold text-grafite">
                Cancelar cobrança
              </h2>
              <p className="mt-1 text-sm text-grafite-suave">
                {nomeCliente ? (
                  <>
                    A cobrança de <span className="font-medium text-grafite">{nomeCliente}</span> será cancelada e
                    não poderá mais ser paga.
                  </>
                ) : (
                  "Esta cobrança será cancelada e não poderá mais ser paga."
                )}{" "}
                Essa ação não pode ser desfeita.
              </p>
            </div>
          </div>

          {erro && (
            <p role="alert" className="rounded-md border border-carimbo-atrasado/30 bg-[color-mix(in_srgb,var(--carimbo-atrasado)_8%,transparent)] px-3.5 py-2.5 text-sm font-medium text-carimbo-atrasado">
              Não foi possível cancelar a cobrança. Tente novamente.
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-dashed border-linha pt-5">
            <button
              type="button"
              onClick={onFechar}
              disabled={pendente}
              className="rounded-md border border-linha bg-white px-4 py-2 text-sm font-medium text-grafite transition-colors hover:bg-papel disabled:cursor-not-allowed disabled:opacity-50"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={onConfirmar}
              disabled={pendente}
              autoFocus
              className="rounded-md bg-carimbo-atrasado px-4 py-2 text-sm font-medium text-papel shadow-[0_2px_10px_-2px_rgba(178,58,46,0.55)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pendente ? "Cancelando…" : "Confirmar cancelamento"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modal-overlay-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modal-conteudo-in {
          from { opacity: 0; transform: scale(0.96) translateY(6px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
