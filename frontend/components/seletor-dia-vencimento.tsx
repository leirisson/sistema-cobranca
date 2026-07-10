"use client";

import { useEffect, useRef, useState } from "react";

const DIAS = Array.from({ length: 28 }, (_, i) => i + 1);

interface SeletorDiaVencimentoProps {
  id: string;
  name: string;
  defaultValue?: number;
  comErro: boolean;
}

export function SeletorDiaVencimento({ id, name, defaultValue, comErro }: SeletorDiaVencimentoProps) {
  const [dia, setDia] = useState<number | undefined>(defaultValue);
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;

    function aoClicarFora(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setAberto(false);
      }
    }

    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [aberto]);

  const borda = comErro ? "border-carimbo-atrasado" : "border-linha focus:border-tinta";

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={dia ?? ""} />
      <button
        id={id}
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        className={`w-full min-w-0 rounded-md border ${borda} bg-white px-4 py-2.5 text-left text-base text-grafite outline-none transition-colors focus:border-2 focus:px-[15px] focus:py-[9px]`}
      >
        {dia ? `Todo dia ${dia}` : "Selecione o dia"}
      </button>

      {aberto && (
        <div
          role="dialog"
          className="absolute z-10 mt-2 w-64 rounded-md border border-linha bg-white p-3 shadow-lg"
        >
          <div className="grid grid-cols-7 gap-1">
            {DIAS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setDia(d);
                  setAberto(false);
                }}
                className={`flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors ${
                  dia === d ? "bg-tinta text-papel" : "text-grafite hover:bg-linha/60"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
