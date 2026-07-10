import type { Cifrador } from "../../domain/configuracao/cifrador.js";
import type { ConfiguracaoRepository } from "../../domain/configuracao/configuracao-repository.js";
import type { ConfiguracaoDTO } from "./obter-configuracao-use-case.js";

export interface AtualizarConfiguracaoInput {
  asaasApiKey?: string;
  nomeRemetente?: string | null;
  mensagemCobrancaPersonalizada?: string | null;
  confirmacaoPagamentoHabilitada?: boolean;
}

export class AtualizarConfiguracaoUseCase {
  constructor(
    private readonly configuracaoRepository: ConfiguracaoRepository,
    private readonly cifrador: Cifrador,
  ) {}

  async executar(input: AtualizarConfiguracaoInput): Promise<ConfiguracaoDTO> {
    const configuracao = await this.configuracaoRepository.buscar();

    if (input.asaasApiKey !== undefined) {
      if (input.asaasApiKey === "") {
        configuracao.atualizarAsaasApiKeyCifrada(null);
      } else {
        configuracao.atualizarAsaasApiKeyCifrada(this.cifrador.cifrar(input.asaasApiKey));
      }
    }

    if (input.nomeRemetente !== undefined) {
      configuracao.atualizarNomeRemetente(input.nomeRemetente);
    }

    if (input.mensagemCobrancaPersonalizada !== undefined) {
      configuracao.atualizarMensagemCobrancaPersonalizada(input.mensagemCobrancaPersonalizada);
    }

    if (input.confirmacaoPagamentoHabilitada !== undefined) {
      configuracao.atualizarConfirmacaoPagamentoHabilitada(input.confirmacaoPagamentoHabilitada);
    }

    await this.configuracaoRepository.salvar(configuracao);

    return {
      asaasApiKeyConfigurada: configuracao.possuiAsaasApiKeyConfigurada(),
      asaasApiKeyUltimosDigitos: input.asaasApiKey
        ? input.asaasApiKey.slice(-4)
        : configuracao.possuiAsaasApiKeyConfigurada()
          ? this.cifrador.decifrar(configuracao.asaasApiKeyCifrada!).slice(-4)
          : null,
      nomeRemetente: configuracao.nomeRemetente,
      mensagemCobrancaPersonalizada: configuracao.mensagemCobrancaPersonalizada,
      confirmacaoPagamentoHabilitada: configuracao.confirmacaoPagamentoHabilitada,
    };
  }
}
