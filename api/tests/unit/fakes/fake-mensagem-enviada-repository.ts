import type { MensagemEnviada, TipoMensagem } from "../../../src/domain/mensagem/mensagem-enviada.js";
import type { MensagemEnviadaRepository } from "../../../src/domain/mensagem/mensagem-enviada-repository.js";

export class FakeMensagemEnviadaRepository implements MensagemEnviadaRepository {
  readonly mensagens: MensagemEnviada[] = [];

  async salvar(mensagem: MensagemEnviada): Promise<void> {
    this.mensagens.push(mensagem);
  }

  async existeParaCobrancaETipo(cobrancaId: string, tipo: TipoMensagem): Promise<boolean> {
    return this.mensagens.some((mensagem) => mensagem.cobrancaId === cobrancaId && mensagem.tipo === tipo);
  }

  async buscarPorId(id: string): Promise<MensagemEnviada | null> {
    return this.mensagens.find((mensagem) => mensagem.id === id) ?? null;
  }
}
