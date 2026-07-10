import type { ErroGeracaoCobranca } from "../../../src/domain/cobranca/erro-geracao-cobranca.js";
import type { ErroGeracaoCobrancaRepository } from "../../../src/domain/cobranca/erro-geracao-cobranca-repository.js";

export class FakeErroGeracaoCobrancaRepository implements ErroGeracaoCobrancaRepository {
  readonly erros: ErroGeracaoCobranca[] = [];

  async salvar(erro: ErroGeracaoCobranca): Promise<void> {
    this.erros.push(erro);
  }

  async listarRecentes(limite: number): Promise<ErroGeracaoCobranca[]> {
    return [...this.erros]
      .sort((a, b) => b.ocorridoEm.getTime() - a.ocorridoEm.getTime())
      .slice(0, limite);
  }
}
