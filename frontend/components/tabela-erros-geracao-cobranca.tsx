import type { ErroGeracaoCobrancaItem } from "@/lib/api/cobrancas";

const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function TabelaErrosGeracaoCobranca({ erros }: { erros: ErroGeracaoCobrancaItem[] }) {
  if (erros.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <p className="text-grafite">Nenhuma falha de geração de cobrança registrada.</p>
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-col lg:hidden">
        {erros.map((erro) => (
          <li key={erro.id} className="flex flex-col gap-1.5 border-b border-linha px-4 py-3.5 last:border-0">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-medium text-grafite">{erro.nomeCliente}</p>
              <p className="shrink-0 font-numeric text-xs text-grafite-suave">
                {formatadorDataHora.format(new Date(erro.ocorridoEm))}
              </p>
            </div>
            <p className="text-sm text-grafite-suave">{erro.mensagemErro}</p>
          </li>
        ))}
      </ul>

      <table className="hidden w-full min-w-[560px] border-collapse text-left text-sm lg:table">
        <thead>
          <tr className="border-b border-linha text-xs uppercase tracking-wide text-grafite-suave">
            <th className="px-4 py-3 font-medium">Cliente</th>
            <th className="px-4 py-3 font-medium">Erro</th>
            <th className="px-4 py-3 font-medium">Ocorrido em</th>
          </tr>
        </thead>
        <tbody>
          {erros.map((erro) => (
            <tr key={erro.id} className="border-b border-linha last:border-0">
              <td className="px-4 py-3 whitespace-nowrap text-grafite">{erro.nomeCliente}</td>
              <td className="px-4 py-3 text-grafite">{erro.mensagemErro}</td>
              <td className="px-4 py-3 font-numeric whitespace-nowrap text-grafite">
                {formatadorDataHora.format(new Date(erro.ocorridoEm))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
