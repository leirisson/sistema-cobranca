import { google } from "googleapis";

import type { CanalNotificacao, EnviarEmailInput } from "../../domain/mensagem/canal-notificacao.js";

export interface GmailNotificadorConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  remetente: string;
}

function montarMensagemRfc2822(input: EnviarEmailInput, remetente: string): string {
  const linhas = [
    `From: ${remetente}`,
    `To: ${input.destinatario}`,
    `Subject: ${input.assunto}`,
    "Content-Type: text/html; charset=utf-8",
    "",
    input.corpoHtml,
  ];

  return linhas.join("\r\n");
}

function codificarBase64Url(mensagem: string): string {
  return Buffer.from(mensagem).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export class GmailNotificador implements CanalNotificacao {
  constructor(private readonly config: GmailNotificadorConfig) {}

  async enviarEmail(input: EnviarEmailInput): Promise<void> {
    const oauth2Client = new google.auth.OAuth2(this.config.clientId, this.config.clientSecret);
    oauth2Client.setCredentials({ refresh_token: this.config.refreshToken });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const raw = codificarBase64Url(montarMensagemRfc2822(input, this.config.remetente));

    await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
  }
}
