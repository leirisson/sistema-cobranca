import type { Metadata } from "next";

import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Entrar — Cobranças",
};

export default function LoginPage() {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-center bg-papel px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex items-center justify-center gap-3">
          <span
            className="flex h-9 w-9 -rotate-4 items-center justify-center rounded-md bg-tinta font-display text-base font-semibold text-papel"
            aria-hidden="true"
          >
            C
          </span>
          <span className="font-display text-xl font-semibold text-grafite">Cobranças</span>
        </div>

        <div className="rounded-md border border-linha bg-white px-6 py-10 sm:px-8">
          <h1 className="mb-1 font-display text-xl font-semibold text-grafite">Entrar</h1>
          <p className="mb-8 text-sm text-grafite-suave">Acesse o painel de cobranças.</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
