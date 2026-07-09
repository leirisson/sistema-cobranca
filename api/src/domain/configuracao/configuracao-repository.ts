import type { Configuracao } from "./configuracao.js";

export interface ConfiguracaoRepository {
  buscar(): Promise<Configuracao>;
  salvar(configuracao: Configuracao): Promise<void>;
}
