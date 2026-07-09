"use client";

import { useState, useTransition } from "react";

import { excluirClienteDefinitivamenteAction } from "@/lib/cliente/actions";

export function BotaoExcluirCliente({ id }: { id: string }) {
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleExcluir() {
    setErro(null);
    startTransition(async () => {
      try {
        await excluirClienteDefinitivamenteAction(id);
      } catch {
        setErro("Não foi possível excluir o cliente. Tente novamente.");
        setConfirmando(false);
      }
    });
  }

  return (
    <div className="rounded-md border border-carimbo-atrasado/30 bg-carimbo-atrasado/5 p-6">
      <h2 className="font-display text-lg font-semibold text-grafite">Zona de risco</h2>
      <p className="mt-1 text-sm text-grafite-suave">
        Excluir definitivamente remove os dados pessoais deste cliente (nome, documento,
        telefone, e-mail, endereço). Se houver cobrança associada, os dados são anonimizados em
        vez de removidos, para preservar o histórico financeiro. Essa ação não pode ser
        desfeita — diferente de inativar, que mantém tudo intacto.
      </p>

      {confirmando ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="text-sm text-grafite">Tem certeza que deseja excluir definitivamente este cliente?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExcluir}
              disabled={pending}
              className="rounded-md bg-carimbo-atrasado px-4 py-2 text-sm font-medium text-papel transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Excluindo…" : "Confirmar exclusão definitiva"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
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
          onClick={() => setConfirmando(true)}
          className="mt-4 text-sm font-medium text-carimbo-atrasado hover:underline"
        >
          Excluir definitivamente
        </button>
      )}

      {erro && (
        <p role="alert" className="mt-3 text-sm text-carimbo-atrasado">
          {erro}
        </p>
      )}
    </div>
  );
}
