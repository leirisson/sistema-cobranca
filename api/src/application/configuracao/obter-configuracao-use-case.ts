import type { Cifrador } from "../../domain/configuracao/cifrador.js";
import type { ConfiguracaoRepository } from "../../domain/configuracao/configuracao-repository.js";

export interface ConfiguracaoDTO {
  asaasApiKeyConfigurada: boolean;
  asaasApiKeyUltimosDigitos: string | null;
  nomeRemetente: string | null;
  confirmacaoPagamentoHabilitada: boolean;
}

export class ObterConfiguracaoUseCase {
  constructor(
    private readonly configuracaoRepository: ConfiguracaoRepository,
    private readonly cifrador: Cifrador,
  ) {}

  async executar(): Promise<ConfiguracaoDTO> {
    const configuracao = await this.configuracaoRepository.buscar();

    return {
      asaasApiKeyConfigurada: configuracao.possuiAsaasApiKeyConfigurada(),
      asaasApiKeyUltimosDigitos: this.obterUltimosDigitos(configuracao.asaasApiKeyCifrada),
      nomeRemetente: configuracao.nomeRemetente,
      confirmacaoPagamentoHabilitada: configuracao.confirmacaoPagamentoHabilitada,
    };
  }

  private obterUltimosDigitos(asaasApiKeyCifrada: string | null): string | null {
    if (!asaasApiKeyCifrada) {
      return null;
    }

    const chaveDecifrada = this.cifrador.decifrar(asaasApiKeyCifrada);

    return chaveDecifrada.slice(-4);
  }
}
