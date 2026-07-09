import type { Cifrador } from "../../domain/configuracao/cifrador.js";
import type { ConfiguracaoRepository } from "../../domain/configuracao/configuracao-repository.js";

export interface CredenciaisAsaas {
  apiKey: string;
}

export class ResolverCredenciaisAsaasUseCase {
  constructor(
    private readonly configuracaoRepository: ConfiguracaoRepository,
    private readonly cifrador: Cifrador,
    private readonly apiKeyEnv: string,
  ) {}

  async executar(): Promise<CredenciaisAsaas> {
    const configuracao = await this.configuracaoRepository.buscar();

    if (configuracao.asaasApiKeyCifrada) {
      return { apiKey: this.cifrador.decifrar(configuracao.asaasApiKeyCifrada) };
    }

    return { apiKey: this.apiKeyEnv };
  }
}
