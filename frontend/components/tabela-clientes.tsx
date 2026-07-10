import Link from "next/link";

import type { ClienteDTO } from "@/lib/api/clientes";

import { ToggleStatusCliente } from "./toggle-status-cliente";

const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function TabelaClientes({ clientes, busca }: { clientes: ClienteDTO[]; busca?: string }) {
  if (clientes.length === 0) {
    return <EstadoVazio busca={busca} />;
  }

  return (
    <>
      <ul className="flex flex-col lg:hidden">
        {clientes.map((cliente) => {
          const telefonePrincipal = cliente.telefones.find((telefone) => telefone.principal);

          return (
            <li key={cliente.id} className="flex flex-col gap-3 border-b border-linha px-4 py-4 last:border-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-medium text-grafite">{cliente.nome}</p>
                  <p className="mt-0.5 font-numeric text-xs text-grafite-suave">{telefonePrincipal?.numero ?? "—"}</p>
                </div>
                <ToggleStatusCliente id={cliente.id} status={cliente.status} />
              </div>
              <div className="flex items-baseline justify-between gap-3 font-numeric text-sm">
                <span className="text-grafite-suave">Vencimento dia {cliente.diaVencimento}</span>
                <span className="font-medium tabular-nums text-grafite">
                  {formatadorMoeda.format(cliente.valorCobranca)}
                </span>
              </div>
              <div className="flex gap-2 border-t border-linha/70 pt-3">
                <Link
                  href={`/clientes/${cliente.id}/nova-cobranca`}
                  className="inline-flex items-center rounded-md bg-tinta px-3 py-1.5 text-xs font-medium text-papel transition-colors active:opacity-80"
                >
                  Nova cobrança
                </Link>
                <Link
                  href={`/clientes/${cliente.id}/editar`}
                  className="inline-flex items-center rounded-md border border-linha bg-papel px-3 py-1.5 text-xs font-medium text-grafite transition-colors active:opacity-80"
                >
                  Editar
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      <table className="hidden w-full min-w-[760px] border-collapse text-left text-sm lg:table">
        <thead>
          <tr className="border-b border-linha text-[11px] font-semibold tracking-[0.14em] text-grafite-suave uppercase">
            <th className="px-4 py-3.5 font-semibold">Nome</th>
            <th className="px-4 py-3.5 font-semibold">Telefone principal</th>
            <th className="px-4 py-3.5 text-right font-semibold">Valor</th>
            <th className="px-4 py-3.5 font-semibold">Vencimento</th>
            <th className="px-4 py-3.5 font-semibold">Status</th>
            <th className="px-4 py-3.5 font-semibold">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((cliente) => {
            const telefonePrincipal = cliente.telefones.find((telefone) => telefone.principal);

            return (
              <tr
                key={cliente.id}
                className="border-b border-linha/70 transition-colors last:border-0 hover:bg-papel/70"
              >
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <span className="font-display text-[15px] font-medium text-grafite">{cliente.nome}</span>
                </td>
                <td className="px-4 py-3.5 font-numeric whitespace-nowrap text-grafite-suave">
                  {telefonePrincipal?.numero ?? "—"}
                </td>
                <td className="px-4 py-3.5 text-right font-numeric font-medium whitespace-nowrap tabular-nums text-grafite">
                  {formatadorMoeda.format(cliente.valorCobranca)}
                </td>
                <td className="px-4 py-3.5 font-numeric whitespace-nowrap text-grafite-suave">{`dia ${cliente.diaVencimento}`}</td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <ToggleStatusCliente id={cliente.id} status={cliente.status} />
                </td>
                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/clientes/${cliente.id}/nova-cobranca`}
                      className="inline-flex items-center rounded-md bg-tinta px-3 py-1.5 text-xs font-medium text-papel transition-colors hover:bg-[var(--tinta-hover)]"
                    >
                      Nova cobrança
                    </Link>
                    <Link
                      href={`/clientes/${cliente.id}/editar`}
                      className="inline-flex items-center rounded-md border border-linha bg-papel px-3 py-1.5 text-xs font-medium text-grafite transition-colors hover:bg-linha/40"
                    >
                      Editar
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

function EstadoVazio({ busca }: { busca?: string }) {
  if (busca) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <span aria-hidden="true" className="font-display text-4xl text-linha">
          ⁘
        </span>
        <p className="mt-2 text-grafite">Nenhum cliente encontrado para &ldquo;{busca}&rdquo;.</p>
        <p className="text-sm text-grafite-suave">Tente buscar por outro nome.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <span aria-hidden="true" className="font-display text-4xl text-linha">
        ⁘
      </span>
      <p className="text-grafite">Nenhum cliente cadastrado ainda.</p>
      <Link
        href="/clientes/novo"
        className="rounded-md bg-tinta px-4 py-2.5 text-sm font-medium text-papel transition-colors hover:bg-[var(--tinta-hover)]"
      >
        Cadastrar primeiro cliente
      </Link>
    </div>
  );
}
