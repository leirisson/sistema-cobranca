"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const DEBOUNCE_MS = 300;

export function CampoBusca({
  valorInicial,
  baseHref = "/clientes",
  placeholder = "Buscar cliente por nome...",
}: {
  valorInicial: string;
  baseHref?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [valor, setValor] = useState(valorInicial);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  function handleChange(novoValor: string) {
    setValor(novoValor);
    clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (novoValor.trim()) {
        params.set("busca", novoValor.trim());
      } else {
        params.delete("busca");
      }

      router.push(`${baseHref}?${params.toString()}`);
    }, DEBOUNCE_MS);
  }

  return (
    <input
      type="search"
      value={valor}
      onChange={(event) => handleChange(event.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="w-full max-w-sm rounded-md border border-linha bg-white px-4 py-2.5 text-sm text-grafite placeholder:text-grafite-suave outline-none transition-colors focus:border-2 focus:border-tinta focus:px-[15px] focus:py-[9px]"
    />
  );
}
