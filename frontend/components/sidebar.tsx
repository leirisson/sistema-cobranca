"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { LogoutButton } from "./logout-button";

const LINKS = [
  { label: "Painel", href: "/dashboard" },
  { label: "Cobranças", href: "/cobrancas" },
  { label: "Clientes", href: "/clientes" },
  { label: "Erros", href: "/erros" },
  { label: "Configurações", href: "/configuracoes" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [aberta, setAberta] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between border-b border-linha bg-papel px-4 py-3 md:hidden">
        <span className="-rotate-4 inline-block font-display text-lg font-semibold text-tinta">Cobranças</span>
        <button
          type="button"
          onClick={() => setAberta(true)}
          aria-label="Abrir menu"
          className="flex h-9 w-9 items-center justify-center rounded-md text-grafite transition-colors hover:bg-linha/60"
        >
          <span className="text-xl leading-none">☰</span>
        </button>
      </header>

      {aberta && (
        <div
          className="fixed inset-0 z-40 bg-grafite/40 md:hidden"
          onClick={() => setAberta(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 shrink-0 -translate-x-full flex-col bg-tinta px-4 py-6 transition-transform duration-200 md:static md:z-auto md:translate-x-0 ${
          aberta ? "translate-x-0" : ""
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <span className="-rotate-4 inline-block font-display text-lg font-semibold text-papel">Cobranças</span>
          <button
            type="button"
            onClick={() => setAberta(false)}
            aria-label="Fechar menu"
            className="flex h-8 w-8 items-center justify-center rounded-md text-papel/70 transition-colors hover:bg-white/10 hover:text-papel md:hidden"
          >
            <span className="text-lg leading-none">✕</span>
          </button>
        </div>

        <nav className="mt-10 flex flex-1 flex-col gap-1">
          {LINKS.map((link) => {
            const ativo = link.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setAberta(false)}
                className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  ativo ? "bg-papel text-tinta" : "text-papel/70 hover:bg-white/10 hover:text-papel"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-1 pt-4">
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
