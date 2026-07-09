import { Configuracao } from "../../../src/domain/configuracao/configuracao.js";
import type { ConfiguracaoRepository } from "../../../src/domain/configuracao/configuracao-repository.js";

export class FakeConfiguracaoRepository implements ConfiguracaoRepository {
  private configuracao: Configuracao | null = null;

  async buscar(): Promise<Configuracao> {
    if (!this.configuracao) {
      this.configuracao = Configuracao.criar({});
    }

    return this.configuracao;
  }

  async salvar(configuracao: Configuracao): Promise<void> {
    this.configuracao = configuracao;
  }
}
