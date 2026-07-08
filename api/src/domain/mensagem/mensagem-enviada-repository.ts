import type { MensagemEnviada, TipoMensagem } from "./mensagem-enviada.js";

export interface MensagemEnviadaRepository {
  salvar(mensagem: MensagemEnviada): Promise<void>;
  existeParaCobrancaETipo(cobrancaId: string, tipo: TipoMensagem): Promise<boolean>;
}
