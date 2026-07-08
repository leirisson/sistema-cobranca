import type { CanalMensagem } from "../../domain/mensagem/canal-mensagem.js";
import type { CanalNotificacao } from "../../domain/mensagem/canal-notificacao.js";
import type { CanalNotificacaoTipo, StatusEnvioMensagem } from "../../domain/mensagem/mensagem-enviada.js";

export interface EnviarMensagemComFallbackInput {
  telefone: string;
  texto: string;
  email: string | null;
  assuntoEmail: string;
  corpoHtmlEmail: string;
}

export interface ResultadoEnvioComFallback {
  statusEnvio: StatusEnvioMensagem;
  canal: CanalNotificacaoTipo;
}

export async function enviarMensagemComFallback(
  canalMensagem: CanalMensagem,
  canalNotificacao: CanalNotificacao,
  input: EnviarMensagemComFallbackInput,
): Promise<ResultadoEnvioComFallback> {
  try {
    await canalMensagem.enviarMensagem({ telefone: input.telefone, texto: input.texto });
    return { statusEnvio: "ENVIADO", canal: "whatsapp" };
  } catch {
    if (!input.email) {
      return { statusEnvio: "FALHA", canal: "whatsapp" };
    }

    try {
      await canalNotificacao.enviarEmail({
        destinatario: input.email,
        assunto: input.assuntoEmail,
        corpoHtml: input.corpoHtmlEmail,
      });
      return { statusEnvio: "ENVIADO", canal: "email" };
    } catch {
      return { statusEnvio: "FALHA", canal: "email" };
    }
  }
}
