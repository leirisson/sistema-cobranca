"use client";

import { useActionState, useId, useState } from "react";

import type { ConfiguracaoDTO } from "@/lib/api/configuracoes";
import { atualizarConfiguracaoAction, type ConfiguracaoFormState } from "@/lib/configuracao/actions";
import { templatesMensagemCobranca } from "@/lib/configuracao/templates-mensagem";

interface FormularioConfiguracaoProps {
  configuracaoInicial: ConfiguracaoDTO;
}

const estadoInicial: ConfiguracaoFormState = {};

export function FormularioConfiguracao({ configuracaoInicial }: FormularioConfiguracaoProps) {
  const [state, formAction, pending] = useActionState(atualizarConfiguracaoAction, estadoInicial);
  const idBase = useId();
  const configuracaoAtual = state.configuracao ?? configuracaoInicial;
  const [mensagem, setMensagem] = useState(configuracaoAtual.mensagemCobrancaPersonalizada ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-6 rounded-lg border border-linha bg-white p-6">
      <h2 className="font-display text-lg font-semibold text-grafite">Cobrança e mensagens</h2>

      {state.error && (
        <p
          role="alert"
          className="rounded-md border border-carimbo-atrasado/30 bg-carimbo-atrasado/5 px-4 py-3 text-sm text-carimbo-atrasado"
        >
          {state.error}
        </p>
      )}

      {state.sucesso && (
        <p className="rounded-md border border-carimbo-pago/30 bg-carimbo-pago/5 px-4 py-3 text-sm text-carimbo-pago">
          Configurações salvas com sucesso.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor={`${idBase}-asaasApiKey`} className="text-sm font-medium text-grafite">
          Chave da API do Asaas
        </label>
        <input
          id={`${idBase}-asaasApiKey`}
          name="asaasApiKey"
          type="password"
          placeholder={
            configuracaoAtual.asaasApiKeyConfigurada
              ? `Configurada, terminada em ****${configuracaoAtual.asaasApiKeyUltimosDigitos}`
              : "Nunca configurada — usando a chave padrão do ambiente"
          }
          autoComplete="off"
          className={inputClassName()}
        />
        <p className="text-sm text-grafite-suave">
          Deixe em branco para manter a chave atual. Envie um valor vazio para remover a chave salva.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${idBase}-nomeRemetente`} className="text-sm font-medium text-grafite">
          Nome do remetente nas mensagens
        </label>
        <input
          id={`${idBase}-nomeRemetente`}
          name="nomeRemetente"
          type="text"
          defaultValue={configuracaoAtual.nomeRemetente ?? ""}
          placeholder="Ex: Minha Empresa"
          className={inputClassName()}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${idBase}-mensagemCobrancaPersonalizada`} className="text-sm font-medium text-grafite">
          Mensagem personalizada de cobrança (opcional)
        </label>

        <div className="flex flex-wrap gap-2">
          {templatesMensagemCobranca.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => setMensagem(template.texto)}
              title={template.descricao}
              className="rounded-md border border-linha px-3 py-1.5 text-sm font-medium text-grafite transition-colors hover:border-tinta hover:text-tinta"
            >
              {template.nome}
            </button>
          ))}
        </div>

        <textarea
          id={`${idBase}-mensagemCobrancaPersonalizada`}
          name="mensagemCobrancaPersonalizada"
          rows={10}
          value={mensagem}
          onChange={(evento) => setMensagem(evento.target.value)}
          placeholder="Ex: Olá {nome}! Sua cobrança de {valor} vence em {vencimento}. Pague aqui: {link}"
          className={inputClassName()}
        />
        <p className="text-sm text-grafite-suave">
          Escolha um modelo acima para preencher e edite como quiser. Placeholders disponíveis: {"{nome}"},{" "}
          {"{valor}"}, {"{vencimento}"}, {"{link}"}. Deixe em branco para usar a mensagem padrão do sistema.
        </p>
      </div>

      <label className="flex items-center gap-3 text-sm font-medium text-grafite">
        <input
          type="checkbox"
          name="confirmacaoPagamentoHabilitada"
          defaultChecked={configuracaoAtual.confirmacaoPagamentoHabilitada}
          className="h-4 w-4 rounded border-linha"
        />
        Enviar mensagem de confirmação quando um pagamento for recebido
      </label>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-tinta px-6 py-3 text-base font-medium text-papel transition-colors hover:bg-[var(--tinta-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Salvar configurações"}
      </button>
    </form>
  );
}

function inputClassName(): string {
  return "w-full min-w-0 rounded-md border border-linha bg-white px-4 py-2.5 text-base text-grafite outline-none transition-colors focus:border-2 focus:border-tinta focus:px-[15px] focus:py-[9px]";
}
