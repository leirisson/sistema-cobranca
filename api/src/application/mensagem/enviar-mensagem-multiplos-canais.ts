import type { CanalMensagem } from "../../domain/mensagem/canal-mensagem.js";
import type { CanalNotificacao } from "../../domain/mensagem/canal-notificacao.js";
import type { CanalNotificacaoTipo, StatusEnvioMensagem } from "../../domain/mensagem/mensagem-enviada.js";

export interface EnviarMensagemMultiplosCanaisInput {
  telefone: string;
  texto: string;
  email: string | null;
  assuntoEmail: string;
  corpoHtmlEmail: string;
}

export interface ResultadoEnvioPorCanal {
  statusEnvio: StatusEnvioMensagem;
  canal: CanalNotificacaoTipo;
}

export async function enviarMensagemMultiplosCanais(
  canalMensagem: CanalMensagem,
  canalNotificacao: CanalNotificacao,
  input: EnviarMensagemMultiplosCanaisInput,
): Promise<ResultadoEnvioPorCanal[]> {
  const resultados: ResultadoEnvioPorCanal[] = [];

  resultados.push(await enviarPorWhatsapp(canalMensagem, input));

  if (input.email) {
    resultados.push(await enviarPorEmail(canalNotificacao, input, input.email));
  }

  return resultados;
}

async function enviarPorWhatsapp(
  canalMensagem: CanalMensagem,
  input: EnviarMensagemMultiplosCanaisInput,
): Promise<ResultadoEnvioPorCanal> {
  try {
    await canalMensagem.enviarMensagem({ telefone: input.telefone, texto: input.texto });
    return { statusEnvio: "ENVIADO", canal: "whatsapp" };
  } catch {
    return { statusEnvio: "FALHA", canal: "whatsapp" };
  }
}

async function enviarPorEmail(
  canalNotificacao: CanalNotificacao,
  input: EnviarMensagemMultiplosCanaisInput,
  email: string,
): Promise<ResultadoEnvioPorCanal> {
  try {
    await canalNotificacao.enviarEmail({
      destinatario: email,
      assunto: input.assuntoEmail,
      corpoHtml: input.corpoHtmlEmail,
    });
    return { statusEnvio: "ENVIADO", canal: "email" };
  } catch {
    return { statusEnvio: "FALHA", canal: "email" };
  }
}
