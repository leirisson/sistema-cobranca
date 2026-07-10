"use client";

import { useOptimistic, useState, useTransition } from "react";

import { alternarStatusClienteAction } from "@/lib/cliente/actions";
import type { StatusCliente } from "@/lib/api/clientes";

import { StatusBadge } from "./status-badge";

export function ToggleStatusCliente({ id, status }: { id: string; status: StatusCliente }) {
  const [statusOtimista, setStatusOtimista] = useOptimistic(status);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setErro(null);
    startTransition(async () => {
      const statusAnterior = statusOtimista;
      setStatusOtimista(statusAnterior === "ATIVO" ? "INATIVO" : "ATIVO");

      try {
        await alternarStatusClienteAction(id, statusAnterior);
      } catch {
        setStatusOtimista(statusAnterior);
        setErro("Não foi possível alterar o status. Tente novamente.");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        key={statusOtimista}
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="efeito-carimbo transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
        title={statusOtimista === "ATIVO" ? "Clique para inativar" : "Clique para reativar"}
      >
        <StatusBadge status={statusOtimista} />
      </button>
      {erro && (
        <span role="alert" className="text-xs text-carimbo-atrasado">
          {erro}
        </span>
      )}
    </div>
  );
}
