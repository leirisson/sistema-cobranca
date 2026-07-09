"use client";

import { useActionState, useEffect, useRef } from "react";

import { login, type LoginState } from "@/lib/auth/actions";

const estadoInicial: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, estadoInicial);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.error) {
      emailRef.current?.focus();
    }
  }, [state.error]);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium text-grafite">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com"
          required
          ref={emailRef}
          className="rounded-md border border-linha bg-white px-4 py-3 text-base text-grafite placeholder:text-grafite-suave outline-none transition-colors focus:border-tinta focus:border-2 focus:px-[15px] focus:py-[11px]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="senha" className="text-sm font-medium text-grafite">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          placeholder="Sua senha"
          required
          className="rounded-md border border-linha bg-white px-4 py-3 text-base text-grafite placeholder:text-grafite-suave outline-none transition-colors focus:border-tinta focus:border-2 focus:px-[15px] focus:py-[11px]"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-grafite">
        <input
          type="checkbox"
          className="h-4 w-4 rounded-sm border-linha text-tinta accent-tinta"
        />
        Lembrar de mim
      </label>

      {state.error && (
        <p
          className="rounded-md border border-carimbo-atrasado/30 bg-carimbo-atrasado/5 px-4 py-3 text-sm text-carimbo-atrasado"
          role="alert"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-tinta px-4 py-3 text-base font-medium text-papel transition-colors hover:bg-[var(--tinta-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
