import Link from "next/link";

export function PaginacaoControles({
  paginaAtual,
  totalPaginas,
  baseHref,
  searchParams = {},
  paramPagina = "pagina",
}: {
  paginaAtual: number;
  totalPaginas: number;
  baseHref: string;
  searchParams?: Record<string, string | undefined>;
  paramPagina?: string;
}) {
  if (totalPaginas <= 1) {
    return null;
  }

  function hrefParaPagina(pagina: number): string {
    const params = new URLSearchParams();
    for (const [chave, valor] of Object.entries(searchParams)) {
      if (valor) params.set(chave, valor);
    }
    params.set(paramPagina, String(pagina));
    return `${baseHref}?${params.toString()}`;
  }

  const paginaAnterior = Math.max(1, paginaAtual - 1);
  const proximaPagina = Math.min(totalPaginas, paginaAtual + 1);

  return (
    <nav
      aria-label="Paginação"
      className="flex items-center justify-center gap-1 border-t border-linha px-4 py-3"
    >
      <Link
        href={hrefParaPagina(paginaAnterior)}
        aria-label="Página anterior"
        aria-disabled={paginaAtual === 1}
        tabIndex={paginaAtual === 1 ? -1 : undefined}
        className={`flex h-8 w-8 items-center justify-center rounded-sm text-sm text-grafite-suave transition-colors ${
          paginaAtual === 1 ? "pointer-events-none opacity-40" : "hover:bg-papel hover:text-grafite"
        }`}
      >
        ‹
      </Link>

      {numerosDePagina(paginaAtual, totalPaginas).map((item, indice) =>
        item === "…" ? (
          <span key={`reticencias-${indice}`} className="flex h-8 w-8 items-center justify-center text-sm text-grafite-suave">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={hrefParaPagina(item)}
            aria-current={item === paginaAtual ? "page" : undefined}
            className={`flex h-8 w-8 items-center justify-center rounded-sm text-sm font-medium transition-colors ${
              item === paginaAtual ? "bg-tinta text-papel" : "text-grafite-suave hover:bg-papel hover:text-grafite"
            }`}
          >
            {item}
          </Link>
        ),
      )}

      <Link
        href={hrefParaPagina(proximaPagina)}
        aria-label="Próxima página"
        aria-disabled={paginaAtual === totalPaginas}
        tabIndex={paginaAtual === totalPaginas ? -1 : undefined}
        className={`flex h-8 w-8 items-center justify-center rounded-sm text-sm text-grafite-suave transition-colors ${
          paginaAtual === totalPaginas ? "pointer-events-none opacity-40" : "hover:bg-papel hover:text-grafite"
        }`}
      >
        ›
      </Link>
    </nav>
  );
}

function numerosDePagina(paginaAtual: number, totalPaginas: number): (number | "…")[] {
  const JANELA = 1;
  const paginas = new Set<number>([1, totalPaginas]);

  for (let i = paginaAtual - JANELA; i <= paginaAtual + JANELA; i++) {
    if (i >= 1 && i <= totalPaginas) paginas.add(i);
  }

  const ordenadas = [...paginas].sort((a, b) => a - b);
  const resultado: (number | "…")[] = [];

  for (let i = 0; i < ordenadas.length; i++) {
    if (i > 0 && ordenadas[i]! - ordenadas[i - 1]! > 1) {
      resultado.push("…");
    }
    resultado.push(ordenadas[i]!);
  }

  return resultado;
}
