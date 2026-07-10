import type { ErroGeracaoCobranca } from "./erro-geracao-cobranca.js";

export interface ErroGeracaoCobrancaRepository {
  salvar(erro: ErroGeracaoCobranca): Promise<void>;
  listarRecentes(limite: number): Promise<ErroGeracaoCobranca[]>;
}
