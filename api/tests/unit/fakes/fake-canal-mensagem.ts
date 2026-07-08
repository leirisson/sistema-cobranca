import type { CanalMensagem, EnviarMensagemInput } from "../../../src/domain/mensagem/canal-mensagem.js";

export class FakeCanalMensagem implements CanalMensagem {
  chamadas: EnviarMensagemInput[] = [];
  deveFalharPara: Set<string> = new Set();

  async enviarMensagem(input: EnviarMensagemInput): Promise<void> {
    this.chamadas.push(input);

    if (this.deveFalharPara.has(input.telefone)) {
      throw new Error(`Falha simulada ao enviar mensagem para ${input.telefone}`);
    }
  }
}
