"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { FormularioCobrancaManual } from "@/components/formulario-cobranca-manual";
import type { ClienteDTO } from "@/lib/api/clientes";
import { criarCobrancaManualAction } from "@/lib/cobranca/actions";

const LOTE = 20;

interface FormularioNovaCobrancaProps {
  clientes: ClienteDTO[];
}

export function FormularioNovaCobranca({ clientes }: FormularioNovaCobrancaProps) {
  const [clienteId, setClienteId] = useState("");
  const [busca, setBusca] = useState("");
  const [sugestoesAbertas, setSugestoesAbertas] = useState(false);
  const [visiveis, setVisiveis] = useState(LOTE);
  const [indiceAtivo, setIndiceAtivo] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);

  const clienteSelecionado = clientes.find((cliente) => cliente.id === clienteId);

  const termo = busca.trim().toLowerCase();
  const sugestoesFiltradas = useMemo(
    () => clientes.filter((cliente) => cliente.nome.toLowerCase().includes(termo)),
    [clientes, termo],
  );
  const sugestoes = sugestoesFiltradas.slice(0, visiveis);
  const restantes = sugestoesFiltradas.length - sugestoes.length;

  useEffect(() => {
    function handleClickFora(evento: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(evento.target as Node)) {
        setSugestoesAbertas(false);
      }
    }

    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  function selecionarCliente(cliente: ClienteDTO) {
    setClienteId(cliente.id);
    setBusca(cliente.nome);
    setSugestoesAbertas(false);
  }

  function limparSelecao() {
    setClienteId("");
    setBusca("");
    setSugestoesAbertas(true);
    requestAnimationFrame(() => {
      containerRef.current?.querySelector("input")?.focus();
    });
  }

  function handleChangeBusca(novoValor: string) {
    setBusca(novoValor);
    setSugestoesAbertas(true);
    setVisiveis(LOTE);
    setIndiceAtivo(0);
    if (clienteId) {
      setClienteId("");
    }
  }

  function handleKeyDown(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (!sugestoesAbertas || sugestoes.length === 0) return;

    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setIndiceAtivo((indice) => Math.min(indice + 1, sugestoes.length - 1));
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setIndiceAtivo((indice) => Math.max(indice - 1, 0));
    } else if (evento.key === "Enter") {
      evento.preventDefault();
      const alvo = sugestoes[indiceAtivo];
      if (alvo) selecionarCliente(alvo);
    } else if (evento.key === "Escape") {
      setSugestoesAbertas(false);
    }
  }

  useEffect(() => {
    const item = listaRef.current?.children[indiceAtivo] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [indiceAtivo]);

  return (
    <div className="flex flex-col gap-8">
      <div ref={containerRef} className="relative flex flex-col gap-2">
        <label htmlFor="cliente" className="text-sm font-medium text-grafite">
          Cliente
        </label>

        {clienteSelecionado ? (
          <ClienteSelecionadoCard cliente={clienteSelecionado} onTrocar={limparSelecao} />
        ) : (
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-grafite-suave"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" strokeLinecap="round" />
              </svg>
            </span>
            <input
              id="cliente"
              type="text"
              autoComplete="off"
              role="combobox"
              aria-expanded={sugestoesAbertas}
              aria-controls="lista-sugestoes-cliente"
              value={busca}
              onChange={(evento) => handleChangeBusca(evento.target.value)}
              onFocus={() => setSugestoesAbertas(true)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar cliente por nome..."
              className="w-full min-w-0 rounded-md border border-linha bg-white py-2.5 pr-4 pl-11 text-base text-grafite outline-none transition-colors focus:border-2 focus:border-tinta focus:pl-[43px]"
            />
          </div>
        )}

        {sugestoesAbertas && !clienteSelecionado && (
          <ul
            id="lista-sugestoes-cliente"
            ref={listaRef}
            role="listbox"
            className="entrada-escalonada absolute top-full z-10 mt-1.5 max-h-80 w-full overflow-y-auto rounded-md border border-linha bg-white shadow-[0_12px_32px_-8px_rgba(28,35,33,0.22)]"
            style={{ animationDuration: "0.18s" }}
          >
            {sugestoesFiltradas.length === 0 ? (
              <li className="flex flex-col items-center gap-1.5 px-4 py-8 text-center">
                <span aria-hidden="true" className="font-display text-2xl text-linha">
                  ⁘
                </span>
                <p className="text-sm text-grafite-suave">
                  {termo ? `Nenhum cliente encontrado para "${busca.trim()}".` : "Nenhum cliente ativo cadastrado ainda."}
                </p>
              </li>
            ) : (
              <>
                {sugestoes.map((cliente, indice) => (
                  <li key={cliente.id} role="option" aria-selected={indice === indiceAtivo}>
                    <button
                      type="button"
                      onClick={() => selecionarCliente(cliente)}
                      onMouseEnter={() => setIndiceAtivo(indice)}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                        indice === indiceAtivo ? "bg-papel" : "bg-white"
                      }`}
                    >
                      <Iniciais nome={cliente.nome} />
                      <span className="min-w-0 flex-1 truncate text-sm text-grafite">
                        {realcarTrecho(cliente.nome, termo)}
                      </span>
                    </button>
                  </li>
                ))}
                {restantes > 0 && (
                  <li className="border-t border-dashed border-linha">
                    <button
                      type="button"
                      onClick={() => setVisiveis((atual) => atual + LOTE)}
                      className="w-full px-4 py-2.5 text-center text-xs font-semibold tracking-[0.1em] text-tinta uppercase transition-colors hover:bg-papel"
                    >
                      Mostrar mais {Math.min(LOTE, restantes)} de {restantes}
                    </button>
                  </li>
                )}
              </>
            )}
          </ul>
        )}

        {clientes.length === 0 && (
          <p className="text-sm text-grafite-suave">Nenhum cliente ativo cadastrado ainda.</p>
        )}
      </div>

      {clienteSelecionado && (
        <FormularioCobrancaManual
          key={clienteSelecionado.id}
          clienteId={clienteSelecionado.id}
          action={criarCobrancaManualAction}
          origem="cobrancas"
        />
      )}
    </div>
  );
}

function ClienteSelecionadoCard({ cliente, onTrocar }: { cliente: ClienteDTO; onTrocar: () => void }) {
  return (
    <div className="efeito-carimbo flex items-center gap-3 rounded-md border border-tinta/25 bg-tinta/[0.04] py-2 pr-2 pl-3">
      <Iniciais nome={cliente.nome} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-grafite">{cliente.nome}</p>
        <p className="truncate text-xs text-grafite-suave">{cliente.email ?? "Sem e-mail cadastrado"}</p>
      </div>
      <button
        type="button"
        onClick={onTrocar}
        className="shrink-0 rounded-md border border-linha bg-white px-3 py-1.5 text-xs font-medium text-grafite transition-colors hover:border-tinta hover:text-tinta"
      >
        Trocar
      </button>
    </div>
  );
}

function Iniciais({ nome }: { nome: string }) {
  const iniciais = nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tinta font-display text-xs font-semibold text-papel">
      {iniciais || "?"}
    </span>
  );
}

function realcarTrecho(nome: string, termo: string) {
  if (!termo) return nome;

  const indice = nome.toLowerCase().indexOf(termo);
  if (indice === -1) return nome;

  const antes = nome.slice(0, indice);
  const meio = nome.slice(indice, indice + termo.length);
  const depois = nome.slice(indice + termo.length);

  return (
    <>
      {antes}
      <mark className="rounded-sm bg-carimbo-pendente/25 text-grafite">{meio}</mark>
      {depois}
    </>
  );
}
