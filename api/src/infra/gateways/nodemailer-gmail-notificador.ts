import nodemailer from "nodemailer";

import type { CanalNotificacao, EnviarEmailInput } from "../../domain/mensagem/canal-notificacao.js";

export interface NodemailerGmailNotificadorConfig {
  usuario: string;
  senhaApp: string;
  remetente: string;
}

export class NodemailerGmailNotificador implements CanalNotificacao {
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly config: NodemailerGmailNotificadorConfig) {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: config.usuario, pass: config.senhaApp },
    });
  }

  async enviarEmail(input: EnviarEmailInput): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.remetente,
      to: input.destinatario,
      subject: input.assunto,
      html: input.corpoHtml,
    });
  }
}
