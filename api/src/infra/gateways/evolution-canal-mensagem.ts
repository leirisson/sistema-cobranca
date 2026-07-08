import type { CanalMensagem, EnviarMensagemInput } from "../../domain/mensagem/canal-mensagem.js";

export interface EvolutionCanalMensagemConfig {
  baseUrl: string;
  apiKey: string;
  instance: string;
}

export class EvolutionCanalMensagem implements CanalMensagem {
  constructor(private readonly config: EvolutionCanalMensagemConfig) {}

  async enviarMensagem(input: EnviarMensagemInput): Promise<void> {
    const url = `${this.config.baseUrl}/message/sendText/${this.config.instance}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: this.config.apiKey,
      },
      body: JSON.stringify({
        number: input.telefone,
        text: input.texto,
      }),
    });

    if (!response.ok) {
      throw new Error(`Evolution API retornou status ${response.status} ao enviar mensagem`);
    }
  }
}
