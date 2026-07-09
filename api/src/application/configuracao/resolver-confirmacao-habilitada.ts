import type { Configuracao } from "../../domain/configuracao/configuracao.js";

export function resolverConfirmacaoHabilitada(configuracao: Configuracao, valorEnv: boolean): boolean {
  if (configuracao.confirmacaoPagamentoConfiguradaPeloUsuario) {
    return configuracao.confirmacaoPagamentoHabilitada;
  }

  return valorEnv;
}
