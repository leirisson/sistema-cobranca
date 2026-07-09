"use client";

import { useRouter } from "next/navigation";

const NOMES_MES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function SeletorMes({ mes, ano, status }: { mes: number; ano: number; status?: string }) {
  const router = useRouter();

  function navegarPara(novoMes: number, novoAno: number) {
    const params = new URLSearchParams();
    params.set("mes", String(novoMes));
    params.set("ano", String(novoAno));
    if (status) params.set("status", status);
    router.push(`/dashboard?${params.toString()}`);
  }

  function irParaMesAnterior() {
    if (mes === 1) {
      navegarPara(12, ano - 1);
    } else {
      navegarPara(mes - 1, ano);
    }
  }

  function irParaProximoMes() {
    if (mes === 12) {
      navegarPara(1, ano + 1);
    } else {
      navegarPara(mes + 1, ano);
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-linha bg-white px-1 py-1">
      <button
        type="button"
        onClick={irParaMesAnterior}
        aria-label="Mês anterior"
        className="flex h-8 w-8 items-center justify-center rounded-sm text-grafite-suave transition-colors hover:bg-papel hover:text-grafite"
      >
        ‹
      </button>
      <span className="min-w-32 text-center text-sm font-medium text-grafite">
        {NOMES_MES[mes - 1]} {ano}
      </span>
      <button
        type="button"
        onClick={irParaProximoMes}
        aria-label="Próximo mês"
        className="flex h-8 w-8 items-center justify-center rounded-sm text-grafite-suave transition-colors hover:bg-papel hover:text-grafite"
      >
        ›
      </button>
    </div>
  );
}
