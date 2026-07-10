"use client";

import { useActionState } from "react";

import type { CobrancaManualFormState } from "@/lib/cobranca/actions";

interface FormularioCobrancaManualProps {
  clienteId: string;
  action: (state: CobrancaManualFormState, formData: FormData) => Promise<CobrancaManualFormState>;
  origem?: string;
}

const estadoInicial: CobrancaManualFormState = {};

export function FormularioCobrancaManual({ clienteId, action, origem }: FormularioCobrancaManualProps) {
  const [state, formAction, pending] = useActionState(action, estadoInicial);
  const camposComErro = state.camposComErro ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <input type="hidden" name="clienteId" value={clienteId} />
      {origem && <input type="hidden" name="origem" value={origem} />}

      {state.error && !Object.keys(camposComErro).length && (
        <p
          role="alert"
          className="rounded-md border border-carimbo-atrasado/30 bg-carimbo-atrasado/5 px-4 py-3 text-sm text-carimbo-atrasado"
        >
          {state.error}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo id="valor" label="Valor" erro={camposComErro.valor}>
          <input
            id="valor"
            name="valor"
            type="number"
            step="0.01"
            min="0.01"
            required
            className={inputClassName(Boolean(camposComErro.valor))}
          />
        </Campo>

        <Campo id="vencimento" label="Vencimento" erro={camposComErro.vencimento}>
          <input
            id="vencimento"
            name="vencimento"
            type="date"
            required
            className={inputClassName(Boolean(camposComErro.vencimento))}
          />
        </Campo>
      </div>

      <Campo id="descricao" label="Descrição (opcional)" erro={camposComErro.descricao}>
        <input
          id="descricao"
          name="descricao"
          type="text"
          placeholder="Ex: Serviço extra - troca de peça"
          className={inputClassName(Boolean(camposComErro.descricao))}
        />
      </Campo>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-tinta px-6 py-3 text-base font-medium text-papel transition-colors hover:bg-[var(--tinta-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Criando..." : "Criar cobrança"}
      </button>
    </form>
  );
}

function Campo({
  id,
  label,
  erro,
  children,
}: {
  id: string;
  label: string;
  erro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-grafite">
        {label}
      </label>
      {children}
      {erro && (
        <p role="alert" className="text-sm text-carimbo-atrasado">
          {erro}
        </p>
      )}
    </div>
  );
}

function inputClassName(comErro: boolean): string {
  const borda = comErro ? "border-carimbo-atrasado" : "border-linha focus:border-tinta";
  return `w-full min-w-0 rounded-md border ${borda} bg-white px-4 py-2.5 text-base text-grafite outline-none transition-colors focus:border-2 focus:px-[15px] focus:py-[9px]`;
}
