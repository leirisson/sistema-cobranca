export interface EnviarMensagemInput {
  telefone: string;
  texto: string;
}

export interface CanalMensagem {
  enviarMensagem(input: EnviarMensagemInput): Promise<void>;
}
