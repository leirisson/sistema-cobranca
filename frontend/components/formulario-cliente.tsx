"use client";

import { useActionState, useId, useState } from "react";

import type { ClienteDTO, EnderecoClienteDTO, TelefoneClienteDTO } from "@/lib/api/clientes";
import type { ClienteFormState } from "@/lib/cliente/actions";
import { SeletorDiaVencimento } from "@/components/seletor-dia-vencimento";

interface FormularioClienteProps {
  clienteInicial?: ClienteDTO;
  action: (state: ClienteFormState, formData: FormData) => Promise<ClienteFormState>;
}

const estadoInicial: ClienteFormState = {};

function telefoneVazio(): TelefoneClienteDTO {
  return { numero: "", principal: false };
}

export function FormularioCliente({ clienteInicial, action }: FormularioClienteProps) {
  const [state, formAction, pending] = useActionState(action, estadoInicial);
  const [telefones, setTelefones] = useState<TelefoneClienteDTO[]>(
    clienteInicial?.telefones.length ? clienteInicial.telefones : [{ numero: "", principal: true }],
  );
  const temDadosAdicionaisIniciais = Boolean(
    clienteInicial?.inscricaoEstadual || clienteInicial?.nomeContato || clienteInicial?.referenciaServico,
  );
  const [endereco, setEndereco] = useState<Partial<EnderecoClienteDTO>>(clienteInicial?.endereco ?? {});
  const [temEndereco, setTemEndereco] = useState(Boolean(clienteInicial?.endereco));
  const idBase = useId();

  const camposComErro = state.camposComErro ?? {};

  function adicionarTelefone() {
    setTelefones((atual) => [...atual, telefoneVazio()]);
  }

  function removerTelefone(index: number) {
    setTelefones((atual) => {
      const proximo = atual.filter((_, i) => i !== index);
      if (proximo.length > 0 && !proximo.some((telefone) => telefone.principal)) {
        proximo[0] = { ...proximo[0], principal: true };
      }
      return proximo;
    });
  }

  function atualizarTelefone(index: number, campo: keyof TelefoneClienteDTO, valor: string | boolean) {
    setTelefones((atual) => atual.map((telefone, i) => (i === index ? { ...telefone, [campo]: valor } : telefone)));
  }

  function marcarPrincipal(index: number) {
    setTelefones((atual) => atual.map((telefone, i) => ({ ...telefone, principal: i === index })));
  }

  function enderecoParaEnvio(): EnderecoClienteDTO | null {
    if (!temEndereco || !endereco.rua || !endereco.cidade || !endereco.uf || !endereco.cep) {
      return null;
    }

    return {
      rua: endereco.rua,
      numero: endereco.numero ?? null,
      bairro: endereco.bairro ?? null,
      cidade: endereco.cidade,
      uf: endereco.uf,
      cep: endereco.cep,
    };
  }

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <input type="hidden" name="telefones" value={JSON.stringify(telefones)} />
      <input type="hidden" name="endereco" value={JSON.stringify(enderecoParaEnvio())} />

      {state.error && (
        <p
          role="alert"
          className="rounded-md border border-carimbo-atrasado/30 bg-carimbo-atrasado/5 px-4 py-3 text-sm text-carimbo-atrasado"
        >
          {state.error}
        </p>
      )}

      <section className="flex flex-col gap-5">
        <h2 className="font-display text-lg font-semibold text-grafite">Dados do cliente</h2>

        <Campo id={`${idBase}-nome`} label="Nome" erro={camposComErro.nome}>
          <input
            id={`${idBase}-nome`}
            name="nome"
            type="text"
            required
            defaultValue={clienteInicial?.nome}
            className={inputClassName(Boolean(camposComErro.nome))}
          />
        </Campo>

        <Campo id={`${idBase}-documento`} label="Documento (CPF ou CNPJ)" erro={camposComErro.documento}>
          <input
            id={`${idBase}-documento`}
            name="documento"
            type="text"
            required
            placeholder="Somente números"
            defaultValue={clienteInicial?.documento}
            className={inputClassName(Boolean(camposComErro.documento))}
          />
        </Campo>

        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-grafite">Telefones</span>
          {telefones.map((telefone, index) => (
            <div key={index} className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={telefone.numero}
                onChange={(event) => atualizarTelefone(index, "numero", event.target.value)}
                placeholder="+5592999999999"
                required
                className={inputClassName(false) + " sm:w-auto sm:flex-1"}
              />
              <label className="flex items-center gap-1.5 text-sm whitespace-nowrap text-grafite">
                <input
                  type="radio"
                  name="telefone-principal"
                  checked={telefone.principal}
                  onChange={() => marcarPrincipal(index)}
                  className="h-4 w-4 accent-tinta"
                />
                Principal
              </label>
              {telefones.length > 1 && (
                <button
                  type="button"
                  onClick={() => removerTelefone(index)}
                  className="text-sm whitespace-nowrap text-carimbo-atrasado hover:underline"
                >
                  Remover
                </button>
              )}
            </div>
          ))}
          {camposComErro.telefones && (
            <p role="alert" className="text-sm text-carimbo-atrasado">
              {camposComErro.telefones}
            </p>
          )}
          <button
            type="button"
            onClick={adicionarTelefone}
            className="self-start text-sm font-medium text-tinta hover:underline"
          >
            + Adicionar telefone
          </button>
        </div>

        <Campo id={`${idBase}-email`} label="E-mail" erro={camposComErro.email}>
          <input
            id={`${idBase}-email`}
            name="email"
            type="email"
            required
            defaultValue={clienteInicial?.email ?? undefined}
            className={inputClassName(Boolean(camposComErro.email))}
          />
        </Campo>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo id={`${idBase}-valor`} label="Valor de cobrança" erro={camposComErro.valorCobranca}>
            <input
              id={`${idBase}-valor`}
              name="valorCobranca"
              type="number"
              step="0.01"
              min="0.01"
              required
              defaultValue={clienteInicial?.valorCobranca}
              className={inputClassName(Boolean(camposComErro.valorCobranca))}
            />
          </Campo>

          <Campo id={`${idBase}-vencimento`} label="Dia de vencimento (1–28)" erro={camposComErro.diaVencimento}>
            <SeletorDiaVencimento
              id={`${idBase}-vencimento`}
              name="diaVencimento"
              defaultValue={clienteInicial?.diaVencimento}
              comErro={Boolean(camposComErro.diaVencimento)}
            />
          </Campo>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-grafite">
            <input
              type="checkbox"
              checked={temEndereco}
              onChange={(event) => setTemEndereco(event.target.checked)}
              className="h-4 w-4 accent-tinta"
            />
            Endereço (opcional)
          </label>

          {temEndereco && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo id={`${idBase}-rua`} label="Rua">
                <input
                  id={`${idBase}-rua`}
                  type="text"
                  value={endereco.rua ?? ""}
                  onChange={(event) => setEndereco((atual) => ({ ...atual, rua: event.target.value }))}
                  className={inputClassName(false)}
                />
              </Campo>
              <Campo id={`${idBase}-numero`} label="Número">
                <input
                  id={`${idBase}-numero`}
                  type="text"
                  value={endereco.numero ?? ""}
                  onChange={(event) => setEndereco((atual) => ({ ...atual, numero: event.target.value }))}
                  className={inputClassName(false)}
                />
              </Campo>
              <Campo id={`${idBase}-bairro`} label="Bairro">
                <input
                  id={`${idBase}-bairro`}
                  type="text"
                  value={endereco.bairro ?? ""}
                  onChange={(event) => setEndereco((atual) => ({ ...atual, bairro: event.target.value }))}
                  className={inputClassName(false)}
                />
              </Campo>
              <Campo id={`${idBase}-cidade`} label="Cidade">
                <input
                  id={`${idBase}-cidade`}
                  type="text"
                  value={endereco.cidade ?? ""}
                  onChange={(event) => setEndereco((atual) => ({ ...atual, cidade: event.target.value }))}
                  className={inputClassName(false)}
                />
              </Campo>
              <Campo id={`${idBase}-uf`} label="UF">
                <input
                  id={`${idBase}-uf`}
                  type="text"
                  maxLength={2}
                  value={endereco.uf ?? ""}
                  onChange={(event) => setEndereco((atual) => ({ ...atual, uf: event.target.value.toUpperCase() }))}
                  className={inputClassName(false)}
                />
              </Campo>
              <Campo id={`${idBase}-cep`} label="CEP">
                <input
                  id={`${idBase}-cep`}
                  type="text"
                  value={endereco.cep ?? ""}
                  onChange={(event) => setEndereco((atual) => ({ ...atual, cep: event.target.value }))}
                  className={inputClassName(false)}
                />
              </Campo>
            </div>
          )}
        </div>
      </section>

      <details open={temDadosAdicionaisIniciais} className="rounded-md border border-linha p-4">
        <summary className="cursor-pointer font-display text-base font-semibold text-grafite">
          Dados adicionais
        </summary>

        <div className="mt-5 flex flex-col gap-5">
          <Campo id={`${idBase}-nomeContato`} label="Nome de contato (opcional)">
            <input
              id={`${idBase}-nomeContato`}
              name="nomeContato"
              type="text"
              defaultValue={clienteInicial?.nomeContato ?? undefined}
              className={inputClassName(false)}
            />
          </Campo>

          <Campo id={`${idBase}-inscricaoEstadual`} label="Inscrição estadual (opcional)">
            <input
              id={`${idBase}-inscricaoEstadual`}
              name="inscricaoEstadual"
              type="text"
              defaultValue={clienteInicial?.inscricaoEstadual ?? undefined}
              className={inputClassName(false)}
            />
          </Campo>

          <Campo id={`${idBase}-referenciaServico`} label="Referência de serviço (opcional)">
            <input
              id={`${idBase}-referenciaServico`}
              name="referenciaServico"
              type="text"
              defaultValue={clienteInicial?.referenciaServico ?? undefined}
              className={inputClassName(false)}
            />
          </Campo>
        </div>
      </details>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-tinta px-6 py-3 text-base font-medium text-papel transition-colors hover:bg-[var(--tinta-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Salvar cliente"}
      </button>
    </form>
  );
}

function Campo({
  id,
  label,
  erro,
  children,
}: {
  id: string;
  label: string;
  erro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-grafite">
        {label}
      </label>
      {children}
      {erro && (
        <p role="alert" className="text-sm text-carimbo-atrasado">
          {erro}
        </p>
      )}
    </div>
  );
}

function inputClassName(comErro: boolean): string {
  const borda = comErro ? "border-carimbo-atrasado" : "border-linha focus:border-tinta";
  return `w-full min-w-0 rounded-md border ${borda} bg-white px-4 py-2.5 text-base text-grafite outline-none transition-colors focus:border-2 focus:px-[15px] focus:py-[9px]`;
}
