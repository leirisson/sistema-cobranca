import Link from "next/link";

import type { ClienteDTO } from "@/lib/api/clientes";

import { ToggleStatusCliente } from "./toggle-status-cliente";

const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function TabelaClientes({ clientes, busca }: { clientes: ClienteDTO[]; busca?: string }) {
  if (clientes.length === 0) {
    return <EstadoVazio busca={busca} />;
  }

  return (
    <table className="w-full border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-linha text-xs uppercase tracking-wide text-grafite-suave">
          <th className="px-4 py-3 font-medium">Nome</th>
          <th className="px-4 py-3 font-medium">Telefone principal</th>
          <th className="px-4 py-3 text-right font-medium">Valor</th>
          <th className="px-4 py-3 font-medium">Vencimento</th>
          <th className="px-4 py-3 font-medium">Status</th>
          <th className="px-4 py-3 font-medium">
            <span className="sr-only">Ações</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {clientes.map((cliente) => {
          const telefonePrincipal = cliente.telefones.find((telefone) => telefone.principal);

          return (
            <tr key={cliente.id} className="border-b border-linha last:border-0">
              <td className="px-4 py-3 text-grafite">{cliente.nome}</td>
              <td className="px-4 py-3 font-numeric text-grafite">{telefonePrincipal?.numero ?? "—"}</td>
              <td className="px-4 py-3 text-right font-numeric text-grafite">
                {formatadorMoeda.format(cliente.valorCobranca)}
              </td>
              <td className="px-4 py-3 font-numeric text-grafite">{`dia ${cliente.diaVencimento}`}</td>
              <td className="px-4 py-3">
                <ToggleStatusCliente id={cliente.id} status={cliente.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-4">
                  <Link
                    href={`/clientes/${cliente.id}/nova-cobranca`}
                    className="text-sm font-medium text-tinta transition-colors hover:underline"
                  >
                    Nova cobrança
                  </Link>
                  <Link
                    href={`/clientes/${cliente.id}/editar`}
                    className="text-sm font-medium text-tinta transition-colors hover:underline"
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
  );
}

function EstadoVazio({ busca }: { busca?: string }) {
  if (busca) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <p className="text-grafite">Nenhum cliente encontrado para &ldquo;{busca}&rdquo;.</p>
        <p className="text-sm text-grafite-suave">Tente buscar por outro nome.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
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
