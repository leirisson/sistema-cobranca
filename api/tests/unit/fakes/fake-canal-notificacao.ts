import type { CanalNotificacao, EnviarEmailInput } from "../../../src/domain/mensagem/canal-notificacao.js";

export class FakeCanalNotificacao implements CanalNotificacao {
  chamadas: EnviarEmailInput[] = [];
  deveFalharPara: Set<string> = new Set();

  async enviarEmail(input: EnviarEmailInput): Promise<void> {
    this.chamadas.push(input);

    if (this.deveFalharPara.has(input.destinatario)) {
      throw new Error(`Falha simulada ao enviar e-mail para ${input.destinatario}`);
    }
  }
}
