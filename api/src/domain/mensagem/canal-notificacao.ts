export interface EnviarEmailInput {
  destinatario: string;
  assunto: string;
  corpoHtml: string;
}

export interface CanalNotificacao {
  enviarEmail(input: EnviarEmailInput): Promise<void>;
}
